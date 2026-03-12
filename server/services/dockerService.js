const { execSync, execFileSync, exec } = require('child_process');

// Track multi-container lab environments for cleanup
// Maps terminal containerId -> { containerIds, networkName }
const labEnvironments = new Map();

/**
 * Validate that a value is safe to use as a Docker argument.
 * Prevents command injection by allowing only safe characters.
 */
function assertSafeDockerArg(value, name) {
  if (!value || !/^[a-zA-Z0-9._:\/\-]+$/.test(value)) {
    throw new Error(`Unsafe value for ${name}: ${value}`);
  }
}

/**
 * Start a single isolated container (existing labs: linux, etc.)
 */
async function startContainer(userId, labId, image) {
  assertSafeDockerArg(image, 'image');

  const containerName = `session_${userId}_${labId}_${Date.now()}`.replace(/[^a-zA-Z0-9_.-]/g, '_');

  const args = [
    'run', '-d', '--rm',
    '--cap-add=NET_RAW',
    '--memory=256m',
    '--cpus=0.5',
    '--network=none',
    `--name=${containerName}`,
    image,
  ];

  try {
    const containerId = execFileSync('docker', args, { encoding: 'utf-8' }).trim();
    console.log(`Container started: ${containerId.substring(0, 12)} (${containerName})`);
    return containerId.substring(0, 12);
  } catch (err) {
    throw new Error(`Failed to start container: ${err.message}`);
  }
}

/**
 * Start a multi-container networked lab environment.
 * Creates an isolated Docker network, starts target containers,
 * then starts the attacker (terminal) container on the same network.
 * Returns the terminal container ID for pty attachment.
 */
async function startLabEnvironment(userId, labId, environment) {
  const timestamp = Date.now();
  const safeName = `${userId}_${labId}_${timestamp}`.replace(/[^a-zA-Z0-9_]/g, '_');
  const networkName = `lab_${safeName}`;

  // Clean up any stale lab networks using the same subnet
  try {
    const staleNets = execSync(
      'docker network ls --filter name=lab_ --format "{{.Name}}"',
      { encoding: 'utf-8' }
    ).trim().split('\n').filter(Boolean);

    for (const net of staleNets) {
      try {
        const inspect = execSync(
          `docker network inspect ${net} --format "{{range .IPAM.Config}}{{.Subnet}}{{end}}"`,
          { encoding: 'utf-8' }
        ).trim();
        if (inspect === environment.network.subnet) {
          const containers = execSync(
            `docker network inspect ${net} --format "{{range .Containers}}{{.Name}} {{end}}"`,
            { encoding: 'utf-8' }
          ).trim();
          for (const c of containers.split(' ').filter(Boolean)) {
            try { execSync(`docker rm -f ${c}`, { timeout: 10000 }); } catch (e) {}
          }
          execSync(`docker network rm ${net}`, { timeout: 10000 });
          console.log(`Cleaned stale network: ${net}`);
        }
      } catch (e) { /* network may already be gone */ }
    }
  } catch (e) { /* no stale networks */ }

  // Validate network config before using in commands
  assertSafeDockerArg(environment.network.subnet, 'subnet');
  assertSafeDockerArg(environment.network.gateway, 'gateway');

  // Create isolated Docker network with specified subnet
  try {
    execFileSync('docker', [
      'network', 'create',
      `--subnet=${environment.network.subnet}`,
      `--gateway=${environment.network.gateway}`,
      networkName,
    ], { encoding: 'utf-8' });
    console.log(`Network created: ${networkName} (${environment.network.subnet})`);
  } catch (err) {
    throw new Error(`Failed to create lab network: ${err.message}`);
  }

  const containerIds = [];
  let terminalContainerId = null;

  try {
    for (const container of environment.containers) {
      // Validate all container values before using in commands
      assertSafeDockerArg(container.ip, 'ip');
      assertSafeDockerArg(container.image, 'image');
      assertSafeDockerArg(container.name, 'container name');

      const containerName = `${networkName}_${container.name}`;

      const args = [
        'run', '-d', '--rm',
        '--memory=256m', '--cpus=0.5',
        `--network=${networkName}`,
        `--ip=${container.ip}`,
        `--name=${containerName}`,
        `--hostname=${container.name}`,
      ];

      // Use cap_add instead of --privileged for least-privilege
      if (container.cap_add) {
        for (const cap of container.cap_add) {
          assertSafeDockerArg(cap, 'capability');
          args.push(`--cap-add=${cap}`);
        }
      } else if (container.privileged) {
        // Fallback: grant only NET_RAW and NET_ADMIN instead of full privileged
        args.push('--cap-add=NET_RAW', '--cap-add=NET_ADMIN');
      }

      args.push(container.image);

      const containerId = execFileSync('docker', args, { encoding: 'utf-8' }).trim();
      const shortId = containerId.substring(0, 12);
      containerIds.push(shortId);
      console.log(`  Container started: ${shortId} (${container.name} @ ${container.ip})`);

      if (container.role === 'terminal') {
        terminalContainerId = shortId;
      }
    }
  } catch (err) {
    // Cleanup on failure
    console.error('Lab environment startup failed, cleaning up...');
    for (const id of containerIds) {
      try { execSync(`docker stop ${id}`, { timeout: 10000 }); } catch (e) {}
    }
    try { execSync(`docker network rm ${networkName}`, { timeout: 10000 }); } catch (e) {}
    throw new Error(`Failed to start lab environment: ${err.message}`);
  }

  if (!terminalContainerId) {
    for (const id of containerIds) {
      try { execSync(`docker stop ${id}`, { timeout: 10000 }); } catch (e) {}
    }
    try { execSync(`docker network rm ${networkName}`, { timeout: 10000 }); } catch (e) {}
    throw new Error('No terminal container (role: "terminal") defined in lab environment');
  }

  // Store environment info for cleanup when session ends
  labEnvironments.set(terminalContainerId, { containerIds, networkName });
  console.log(`Lab environment ready: ${containerIds.length} containers on ${networkName}`);

  return terminalContainerId;
}

/**
 * Stop a container or full lab environment.
 * Automatically detects multi-container environments and tears down everything.
 */
async function stopContainer(containerId) {
  const env = labEnvironments.get(containerId);

  if (env) {
    const { containerIds, networkName } = env;

    for (const id of containerIds) {
      try {
        execSync(`docker stop ${id}`, { timeout: 15000 });
        console.log(`Container stopped: ${id}`);
      } catch (e) {
        console.warn(`Warning stopping container ${id}:`, e.message);
      }
    }

    // Brief delay for containers to fully detach from network
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      execSync(`docker network rm ${networkName}`, { timeout: 10000 });
      console.log(`Network removed: ${networkName}`);
    } catch (e) {
      console.warn(`Warning removing network ${networkName}:`, e.message);
    }

    labEnvironments.delete(containerId);
    return;
  }

  // Single container — simple stop
  return new Promise((resolve) => {
    exec(`docker stop ${containerId}`, (err) => {
      if (err) {
        console.warn(`Warning stopping container ${containerId}:`, err.message);
      }
      console.log(`Container stopped: ${containerId}`);
      resolve();
    });
  });
}

module.exports = { startContainer, startLabEnvironment, stopContainer, assertSafeDockerArg };

const pty = require('node-pty');
const { v4: uuidv4 } = require('uuid');

// Map of sessionId -> { pty, containerId }
const sessions = new Map();

function createPty(containerId) {
  const sessionId = uuidv4();

  const shell = process.platform === 'win32' ? 'docker.exe' : 'docker';
  const ptyProcess = pty.spawn(shell, ['exec', '-it', containerId, '/bin/bash', '--login'], {
    name: 'xterm-color',
    cols: 120,
    rows: 30,
    env: {
      HOME: process.env.HOME || process.env.USERPROFILE || '/root',
      PATH: process.env.PATH,
      TERM: 'xterm-color',
    },
  });

  sessions.set(sessionId, { pty: ptyProcess, containerId });

  console.log(`PTY created for session ${sessionId}, container ${containerId}`);

  return { pty: ptyProcess, sessionId };
}

function getPty(sessionId) {
  return sessions.get(sessionId);
}

function destroyPty(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    try {
      session.pty.kill();
    } catch (e) {
      // Already dead
    }
    sessions.delete(sessionId);
    console.log(`PTY destroyed for session ${sessionId}`);
  }
}

module.exports = { createPty, getPty, destroyPty, sessions };

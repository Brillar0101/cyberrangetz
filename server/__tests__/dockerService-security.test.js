const { assertSafeDockerArg } = require('../services/dockerService');

describe('Docker Service Security', () => {
  // ── CRIT-3: Command injection prevention ──

  describe('assertSafeDockerArg', () => {
    test('accepts valid IP address', () => {
      expect(() => assertSafeDockerArg('10.0.0.1', 'ip')).not.toThrow();
    });

    test('accepts valid Docker image name', () => {
      expect(() => assertSafeDockerArg('cyberrange-recon-attacker', 'image')).not.toThrow();
    });

    test('accepts valid subnet CIDR', () => {
      expect(() => assertSafeDockerArg('10.0.0.0/24', 'subnet')).not.toThrow();
    });

    test('accepts image with registry prefix', () => {
      expect(() => assertSafeDockerArg('registry.example.com/my-image', 'image')).not.toThrow();
    });

    test('accepts image with tag', () => {
      expect(() => assertSafeDockerArg('my-image:latest', 'image')).not.toThrow();
    });

    test('rejects shell injection via semicolon', () => {
      expect(() => assertSafeDockerArg('10.0.0.1; rm -rf /', 'ip')).toThrow(/unsafe/i);
    });

    test('rejects shell injection via backtick', () => {
      expect(() => assertSafeDockerArg('`whoami`', 'image')).toThrow(/unsafe/i);
    });

    test('rejects shell injection via $() subshell', () => {
      expect(() => assertSafeDockerArg('$(cat /etc/passwd)', 'image')).toThrow(/unsafe/i);
    });

    test('rejects pipe operator', () => {
      expect(() => assertSafeDockerArg('image | rm', 'image')).toThrow(/unsafe/i);
    });

    test('rejects ampersand', () => {
      expect(() => assertSafeDockerArg('image && rm', 'image')).toThrow(/unsafe/i);
    });

    test('rejects newline injection', () => {
      expect(() => assertSafeDockerArg('image\nrm -rf /', 'image')).toThrow(/unsafe/i);
    });

    test('rejects empty value', () => {
      expect(() => assertSafeDockerArg('', 'image')).toThrow(/unsafe/i);
    });
  });
});

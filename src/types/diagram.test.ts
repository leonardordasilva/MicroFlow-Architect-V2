import { describe, it, expect } from 'vitest';
import { PROTOCOL_CONFIGS, type EdgeProtocol } from './diagram';

describe('PROTOCOL_CONFIGS', () => {
  const protocols = Object.keys(PROTOCOL_CONFIGS) as EdgeProtocol[];

  it('should have exactly 10 protocols', () => {
    expect(protocols).toHaveLength(10);
  });

  it('every protocol should have label, color, and async boolean', () => {
    for (const proto of protocols) {
      const config = PROTOCOL_CONFIGS[proto];
      expect(config.label).toBeTruthy();
      expect(config.color).toMatch(/^hsl\(/);
      expect(typeof config.async).toBe('boolean');
    }
  });

  it('async protocols should have dashArray', () => {
    for (const proto of protocols) {
      const config = PROTOCOL_CONFIGS[proto];
      if (config.async) {
        expect(config.dashArray).toBeTruthy();
      }
    }
  });

  it('sync protocols should NOT have dashArray', () => {
    for (const proto of protocols) {
      const config = PROTOCOL_CONFIGS[proto];
      if (!config.async) {
        expect(config.dashArray).toBeUndefined();
      }
    }
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getConfig, updateConfig, resetConfig } from './index.js';

describe('Config Service Extra', () => {
  beforeEach(() => {
    resetConfig();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    const configPath = path.resolve(process.cwd(), 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        fs.unlinkSync(configPath);
      } catch (err) {}
    }
  });

  it('should return default config initially', () => {
    const config = getConfig();
    expect(config.port).toBe(3000);
  });

  it('should handle fs.writeFileSync error in updateConfig gracefully', () => {
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw new Error('Disk error');
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const updated = updateConfig({ videoDir: '/error/dir' });
    expect(updated.videoDir).toBe('/error/dir');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to write config.json', expect.any(Error));
  });

  it('should handle fs.unlinkSync error in resetConfig gracefully', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {
      throw new Error('Lock error');
    });

    // Should not throw
    expect(() => resetConfig()).not.toThrow();
  });
});

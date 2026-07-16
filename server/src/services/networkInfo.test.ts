import { describe, it, expect } from 'vitest';
import { getLocalIp, generateQrCodeDataUrl } from './networkInfo.ts';

describe('Network Info Service', () => {
  it('getLocalIp should return a valid IP address string', () => {
    const ip = getLocalIp();
    expect(typeof ip).toBe('string');
    expect(ip).toMatch(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/);
  });

  it('generateQrCodeDataUrl should return a PNG base64 data URL', async () => {
    const url = 'http://192.168.1.100:3000';
    const qrDataUrl = await generateQrCodeDataUrl(url);
    expect(typeof qrDataUrl).toBe('string');
    expect(qrDataUrl).toContain('data:image/png;base64,');
  });
});

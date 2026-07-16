import os from 'os';
import qrcode from 'qrcode';

export function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  let fallbackIp: string | null = null;

  for (const interfaceName of Object.keys(interfaces)) {
    const addresses = interfaces[interfaceName];
    if (!addresses) continue;

    for (const addr of addresses) {
      if (addr.family === 'IPv4' && !addr.internal) {
        if (
          addr.address.startsWith('192.168.') ||
          addr.address.startsWith('10.') ||
          addr.address.startsWith('172.')
        ) {
          return addr.address;
        }
        if (!fallbackIp) {
          fallbackIp = addr.address;
        }
      }
    }
  }

  return fallbackIp || '127.0.0.1';
}

export async function generateQrCodeDataUrl(url: string): Promise<string> {
  return qrcode.toDataURL(url);
}

export async function printTerminalQr(url: string): Promise<void> {
  try {
    const qrString = await qrcode.toString(url, { type: 'terminal', small: true });
    console.log('\n==================================================');
    console.log('ANIME PLAYER LOCAL - LAN ACCESS POINT');
    console.log(`Scan this QR code from your phone to connect:`);
    console.log(`URL: ${url}`);
    console.log('==================================================\n');
    console.log(qrString);
    console.log('==================================================\n');
  } catch (err) {
    console.error('Failed to print QR code in terminal:', err);
  }
}

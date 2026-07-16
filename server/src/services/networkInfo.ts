import os from 'os';
import qrcode from 'qrcode';

export function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  
  const physicalAddresses: string[] = [];
  const otherAddresses: string[] = [];

  for (const interfaceName of Object.keys(interfaces)) {
    const addresses = interfaces[interfaceName];
    if (!addresses) continue;

    const lowerName = interfaceName.toLowerCase();
    const isVirtual = 
      lowerName.includes('virtual') || 
      lowerName.includes('vethernet') || 
      lowerName.includes('docker') || 
      lowerName.includes('wsl') || 
      lowerName.includes('vpn') || 
      lowerName.includes('host-only') ||
      lowerName.includes('hyper-v');

    for (const addr of addresses) {
      if (addr.family === 'IPv4' && !addr.internal) {
        if (isVirtual) {
          otherAddresses.push(addr.address);
        } else {
          physicalAddresses.push(addr.address);
        }
      }
    }
  }

  // First search in physical addresses for standard LAN classes
  for (const ip of physicalAddresses) {
    if (
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.')
    ) {
      return ip;
    }
  }

  // Fallback to any physical address
  if (physicalAddresses.length > 0) {
    return physicalAddresses[0];
  }

  // Fallback to virtual/VPN addresses that match standard LAN classes
  for (const ip of otherAddresses) {
    if (
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.')
    ) {
      return ip;
    }
  }

  // Last resort fallbacks
  return otherAddresses[0] || '127.0.0.1';
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

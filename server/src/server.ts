import app from './app.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { getLocalIp, printTerminalQr } from './services/networkInfo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const rootEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath, override: true });
}

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(Number(PORT), HOST, () => {
  const localIp = getLocalIp();
  const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test' && !import.meta.url.includes('/dist/');
  const frontendPort = isDev ? 5173 : Number(PORT);
  const url = `http://${localIp}:${frontendPort}`;
  
  console.log(`Server is running locally on http://localhost:${PORT}`);
  if (isDev) {
    console.log(`Vite Frontend is running locally on http://localhost:${frontendPort}`);
    console.log(`Vite Frontend is accessible on LAN at ${url}`);
  } else {
    console.log(`Server is accessible on LAN at ${url}`);
  }
  printTerminalQr(url);
});

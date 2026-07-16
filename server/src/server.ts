import app from './app.js';
import dotenv from 'dotenv';
import { getLocalIp, printTerminalQr } from './services/networkInfo.js';

dotenv.config();

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

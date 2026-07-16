import app from './app.js';
import dotenv from 'dotenv';
import { getLocalIp, printTerminalQr } from './services/networkInfo.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(Number(PORT), HOST, () => {
  const localIp = getLocalIp();
  const url = `http://${localIp}:${PORT}`;
  console.log(`Server is running locally on http://localhost:${PORT}`);
  console.log(`Server is accessible on LAN at ${url}`);
  printTerminalQr(url);
});

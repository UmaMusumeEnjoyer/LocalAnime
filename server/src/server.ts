import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(Number(PORT), HOST, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

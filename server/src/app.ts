import express from 'express';
import cors from 'cors';
import videoRoutes from './routes/videoRoutes.js';
import { subtitleRouter } from './routes/subtitleRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', videoRoutes);
app.use('/api/videos', subtitleRouter);

export default app;

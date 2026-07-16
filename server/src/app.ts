import express from 'express';
import cors from 'cors';
import videoRoutes from './routes/videoRoutes.js';
import { subtitleRouter } from './routes/subtitleRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', videoRoutes);
app.use('/api/videos', subtitleRouter);

export default app;

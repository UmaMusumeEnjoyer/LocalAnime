import { Router } from 'express';
import path from 'path';
import { getConfig } from '../config/index.js';
import { scanDirectory } from '../services/fileScanner.js';
import { streamVideo } from '../services/videoStreamer.js';

const router = Router();

router.get('/videos', async (req, res) => {
  try {
    const config = getConfig();
    if (!config.videoDir) {
      res.json([]);
      return;
    }
    const videos = await scanDirectory(config.videoDir);
    res.json(videos);
  } catch (err) {
    console.error('Error in GET /videos', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/videos/:id/stream', (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).send('Missing video ID');
      return;
    }

    const config = getConfig();
    if (!config.videoDir) {
      res.status(400).send('Video directory not configured');
      return;
    }

    const relativePath = Buffer.from(id, 'base64url').toString('utf8');
    const absolutePath = path.resolve(config.videoDir, relativePath);

    const resolvedVideoDir = path.resolve(config.videoDir);
    if (!absolutePath.startsWith(resolvedVideoDir)) {
      res.status(403).send('Forbidden: Directory traversal detected');
      return;
    }

    streamVideo(absolutePath, req.headers.range, res);
  } catch (err) {
    console.error('Error in GET /videos/:id/stream', err);
    res.status(500).send('Internal Server Error');
  }
});

export default router;

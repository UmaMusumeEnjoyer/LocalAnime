import { Router } from 'express';
import path from 'path';
import { getConfig } from '../config/index.js';
import { scanDirectory } from '../services/fileScanner.js';
import { streamVideo } from '../services/videoStreamer.js';
import ffmpeg from 'fluent-ffmpeg';

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

    if (req.query.audioTrack) {
      const audioTrackIndex = parseInt(req.query.audioTrack as string, 10);
      
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Connection': 'keep-alive',
      });

      const command = ffmpeg(absolutePath)
        .outputOptions([
          '-map 0:v:0',
          `-map 0:${audioTrackIndex}`,
          '-c:v copy',
          '-c:a aac',
          '-movflags empty_moov+default_base_moof+frag_keyframe',
          '-f mp4'
        ]);

      command.on('error', (err) => {
        if (err.message && err.message.includes('Output stream closed')) {
          return;
        }
        console.error('FFmpeg remuxing error:', err);
      });

      command.pipe(res, { end: true });
      return;
    }

    streamVideo(absolutePath, req.headers.range, res);
  } catch (err) {
    console.error('Error in GET /videos/:id/stream', err);
    res.status(500).send('Internal Server Error');
  }
});

export default router;

import { Router } from 'express';
import path from 'path';
import { getConfig, updateConfig } from '../config/index.js';
import { scanDirectory } from '../services/fileScanner.js';
import { streamVideo } from '../services/videoStreamer.js';
import { getLocalIp, generateQrCodeDataUrl } from '../services/networkInfo.js';
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

function probeVideo(filePath: string): Promise<ffmpeg.FfprobeData> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

router.get('/videos/:id/info', async (req, res) => {
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

    const probeData = await probeVideo(absolutePath);
    res.json({
      duration: probeData.format.duration,
      format: probeData.format.format_name,
      streams: probeData.streams.map(s => ({
        index: s.index,
        codec_type: s.codec_type,
        codec_name: s.codec_name,
      })),
    });
  } catch (err) {
    console.error('Error in GET /videos/:id/info', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/videos/:id/stream', async (req, res) => {
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

    const start = req.query.start ? parseFloat(req.query.start as string) : 0;
    const ext = path.extname(absolutePath).toLowerCase();
    
    let needsFfmpeg = false;
    let vCodec = 'copy';
    let aCodec = 'aac';
    
    if (ext === '.mkv' || start > 0 || req.query.audioTrack) {
       needsFfmpeg = true;
    }

    let probeData: ffmpeg.FfprobeData | null = null;
    
    try {
       probeData = await probeVideo(absolutePath);
       const videoStream = probeData.streams.find(s => s.codec_type === 'video');
       const audioStream = probeData.streams.find(s => s.codec_type === 'audio');
       
       if (videoStream) {
          const compatibleCodecs = ['h264', 'vp8', 'vp9', 'av1'];
          if (!compatibleCodecs.includes(videoStream.codec_name || '') || start > 0) {
             vCodec = 'libx264';
             needsFfmpeg = true;
          }
       }
       
       if (audioStream) {
          const compatibleAudio = ['aac', 'mp3', 'opus', 'vorbis'];
          if (compatibleAudio.includes(audioStream.codec_name || '')) {
             aCodec = 'copy';
          } else {
             aCodec = 'aac';
             needsFfmpeg = true;
          }
       }
    } catch (e) {
       console.error("Failed to probe video:", e);
    }

    if (needsFfmpeg) {
      const audioTrackIndex = req.query.audioTrack ? parseInt(req.query.audioTrack as string, 10) : undefined;
      
      let mapAudio = '';
      if (audioTrackIndex !== undefined) {
         mapAudio = `-map 0:${audioTrackIndex}`;
      } else {
         const aStream = probeData?.streams.find(s => s.codec_type === 'audio');
         if (aStream) {
            mapAudio = `-map 0:${aStream.index}`;
         } else {
            mapAudio = `-map 0:a:0?`;
         }
      }
      
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Connection': 'keep-alive',
      });

      const outputOptions = [
        '-map 0:v:0',
        mapAudio,
        `-c:v ${vCodec}`,
        `-c:a ${aCodec}`,
        '-movflags empty_moov+default_base_moof+frag_keyframe',
        '-f mp4'
      ];

      if (vCodec === 'libx264') {
         outputOptions.push('-preset ultrafast', '-crf 23');
      }

      const command = ffmpeg(absolutePath);
      
      if (start > 0) {
         command.inputOptions([`-ss ${start}`]);
      }
      
      command.outputOptions(outputOptions);

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

router.get('/config', (req, res) => {
  try {
    const config = getConfig();
    res.json(config);
  } catch (err) {
    console.error('Error in GET /config', err);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/config', (req, res) => {
  try {
    const { videoDir, subtitleDir } = req.body;
    const updated = updateConfig({ videoDir, subtitleDir });
    res.json(updated);
  } catch (err) {
    console.error('Error in POST /config', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/network', async (req, res) => {
  try {
    const config = getConfig();
    const localIp = getLocalIp();
    
    // Check if running in development mode
    const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test' && !import.meta.url.includes('/dist/');
    const port = isDev ? 5173 : (config.port || 3000);
    const url = `http://${localIp}:${port}`;
    const qrCodeDataUrl = await generateQrCodeDataUrl(url);
    
    res.json({
      localIp,
      port,
      qrCodeDataUrl,
    });
  } catch (err) {
    console.error('Error in GET /network', err);
    res.status(500).send('Internal Server Error');
  }
});

export default router;

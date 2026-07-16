import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { getConfig } from '../config/index.js';
import { scanDirectory } from '../services/fileScanner.js';
import { getMediaStreams, extractEmbeddedSubtitle } from '../services/subtitleExtractor.js';
import { scanExternalSubtitles, readSubtitleFile } from '../services/subtitleScanner.js';

export const subtitleRouter = Router();

async function resolveVideo(req: Request, res: Response, next: NextFunction) {
  try {
    const { videoDir } = getConfig();
    if (!videoDir) {
      return res.status(500).json({ error: 'Video directory is not configured' });
    }

    const { id } = req.params;
    const videos = await scanDirectory(videoDir);
    const video = videos.find((v) => v.id === id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const resolvedVideoDir = path.resolve(videoDir);
    const absolutePath = path.resolve(videoDir, video.relativePath);

    if (!absolutePath.startsWith(resolvedVideoDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.locals.video = video;
    res.locals.absolutePath = absolutePath;
    next();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

subtitleRouter.get('/:id/subtitles', resolveVideo, async (req: Request, res: Response) => {
  try {
    const { absolutePath, video } = res.locals;
    const { subtitleStreams } = await getMediaStreams(absolutePath);
    const externalSubs = await scanExternalSubtitles(video.relativePath);

    const embeddedSubs = subtitleStreams.map((stream) => ({
      id: stream.index.toString(),
      name: `Embedded #${stream.index} (${stream.language} - ${stream.codec})`,
      language: stream.language,
      type: 'embedded',
      codec: stream.codec,
    }));

    res.json([...embeddedSubs, ...externalSubs]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

subtitleRouter.get('/:id/subtitles/:index', resolveVideo, async (req: Request, res: Response) => {
  try {
    const { absolutePath, video } = res.locals;
    const streamIndex = parseInt(req.params.index, 10);

    const { subtitleStreams } = await getMediaStreams(absolutePath);
    const stream = subtitleStreams.find((s) => s.index === streamIndex);

    if (!stream) {
      return res.status(404).json({ error: 'Subtitle stream not found' });
    }

    const cachePath = await extractEmbeddedSubtitle(absolutePath, streamIndex, stream.codec, video.id);
    const content = await fs.promises.readFile(cachePath, 'utf8');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

subtitleRouter.get('/:id/audio-tracks', resolveVideo, async (req: Request, res: Response) => {
  try {
    const { absolutePath } = res.locals;
    const { audioStreams } = await getMediaStreams(absolutePath);
    res.json(audioStreams);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

subtitleRouter.get('/:id/external-subs/:subId', async (req: Request, res: Response) => {
  try {
    const { subtitleDir } = getConfig();
    if (!subtitleDir) {
      return res.status(500).json({ error: 'Subtitle directory is not configured' });
    }

    const subRelativePath = Buffer.from(req.params.subId, 'base64url').toString('utf8');
    const absoluteSubPath = path.resolve(subtitleDir, subRelativePath);

    const resolvedSubDir = path.resolve(subtitleDir);
    if (!absoluteSubPath.startsWith(resolvedSubDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(absoluteSubPath)) {
      return res.status(404).json({ error: 'Subtitle file not found' });
    }

    const content = await readSubtitleFile(absoluteSubPath);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

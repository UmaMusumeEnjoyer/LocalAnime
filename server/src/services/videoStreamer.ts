import fs from 'fs';
import path from 'path';
import { Response } from 'express';

export function streamVideo(
  filePath: string,
  rangeHeader: string | undefined,
  res: Response
): void {
  if (!fs.existsSync(filePath)) {
    res.status(404).send('Video file not found');
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(filePath).toLowerCase();

  let contentType = 'video/mp4';
  if (ext === '.mkv') {
    contentType = 'video/x-matroska';
  }

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (isNaN(start) || isNaN(end) || start >= fileSize || end >= fileSize || start > end) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      res.status(416).send('Requested Range Not Satisfiable');
      return;
    }

    const chunkSize = end - start + 1;
    
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', chunkSize);
    res.setHeader('Content-Type', contentType);

    const stream = fs.createReadStream(filePath, { start, end });
    stream.on('error', (err) => {
      console.error(`Error reading stream at bytes ${start}-${end}`, err);
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error');
      }
    });
    stream.pipe(res);
  } else {
    res.status(200);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Type', contentType);

    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => {
      console.error('Error reading full stream', err);
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error');
      }
    });
    stream.pipe(res);
  }
}

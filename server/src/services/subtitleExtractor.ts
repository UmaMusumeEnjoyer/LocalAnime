import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

export interface MediaStreamInfo {
  index: number;
  language: string;
  codec: string;
}

export function getMediaStreams(videoPath: string): Promise<{
  audioStreams: MediaStreamInfo[];
  subtitleStreams: MediaStreamInfo[];
}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, data) => {
      if (err) {
        return reject(err);
      }

      const audioStreams: MediaStreamInfo[] = [];
      const subtitleStreams: MediaStreamInfo[] = [];

      if (data && data.streams) {
        for (const stream of data.streams) {
          const tags = stream.tags || {};
          const language = tags.language || tags.LANGUAGE || 'unknown';

          if (stream.codec_type === 'audio') {
            audioStreams.push({
              index: stream.index,
              language,
              codec: stream.codec_name || 'unknown',
            });
          } else if (stream.codec_type === 'subtitle') {
            subtitleStreams.push({
              index: stream.index,
              language,
              codec: stream.codec_name || 'unknown',
            });
          }
        }
      }

      resolve({ audioStreams, subtitleStreams });
    });
  });
}

export async function extractEmbeddedSubtitle(
  videoPath: string,
  streamIndex: number,
  codec: string,
  videoId: string
): Promise<string> {
  const tempDir = path.join(process.cwd(), 'temp');
  // Luôn luôn xuất ra file .vtt để Frontend hiển thị mượt mà trên mọi thiết bị
  const ext = 'vtt';
  const outputFilename = `${videoId}_${streamIndex}.${ext}`;
  const outputPath = path.join(tempDir, outputFilename);

  if (fs.existsSync(outputPath)) {
    return outputPath;
  }

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([`-map 0:${streamIndex}`])
      .output(outputPath)
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(err);
      })
      .run();
  });
}

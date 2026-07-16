import fs from 'fs';
import path from 'path';
import jschardet from 'jschardet';
import iconv from 'iconv-lite';
import { getConfig } from '../config/index.js';

export interface ExternalSubtitleInfo {
  id: string;
  name: string;
  relativePath: string;
  language: string;
  type: 'external';
}

export async function scanExternalSubtitles(videoRelativePath: string): Promise<ExternalSubtitleInfo[]> {
  const { subtitleDir } = getConfig();
  if (!subtitleDir) {
    return [];
  }

  const parts = videoRelativePath.split('/');
  const subFolder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
  const videoBaseName = parts[parts.length - 1].replace(/\.[^/.]+$/, '');

  const targetDir = path.join(subtitleDir, subFolder);
  if (!fs.existsSync(targetDir)) {
    return [];
  }

  const files = await fs.promises.readdir(targetDir);
  const matchedSubtitles: ExternalSubtitleInfo[] = [];

  const validExtensions = ['.ass', '.srt', '.vtt'];

  for (const filename of files) {
    const filenameLower = filename.toLowerCase();
    const ext = path.extname(filenameLower);
    
    if (!validExtensions.includes(ext)) {
      continue;
    }

    const prefix = videoBaseName.toLowerCase() + '.';
    if (filenameLower === videoBaseName.toLowerCase() + ext || filenameLower.startsWith(prefix)) {
      const relPath = subFolder ? `${subFolder}/${filename}` : filename;
      const id = Buffer.from(relPath).toString('base64url');

      let language = 'unknown';
      if (filenameLower.includes('vie') || filenameLower.includes('viet')) {
        language = 'vie';
      } else if (filenameLower.includes('eng') || filenameLower.includes('english')) {
        language = 'eng';
      }

      matchedSubtitles.push({
        id,
        name: filename,
        relativePath: relPath,
        language,
        type: 'external',
      });
    }
  }

  return matchedSubtitles;
}

export async function readSubtitleFile(subFilePath: string): Promise<string> {
  const buffer = await fs.promises.readFile(subFilePath);
  const detection = jschardet.detect(buffer);
  
  let encoding = 'utf-8';
  if (detection && detection.confidence > 0.5) {
    encoding = detection.encoding;
  }
  
  return iconv.decode(buffer, encoding);
}

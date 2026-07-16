import fs from 'fs';
import path from 'path';

export interface VideoFile {
  id: string;
  name: string;
  relativePath: string;
  size: number;
}

const SUPPORTED_EXTENSIONS = new Set(['.mp4', '.mkv']);

export async function scanDirectory(
  baseDir: string,
  currentDir: string = baseDir
): Promise<VideoFile[]> {
  let results: VideoFile[] = [];

  if (!fs.existsSync(baseDir) || !fs.existsSync(currentDir)) {
    return [];
  }

  try {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        const subResults = await scanDirectory(baseDir, fullPath);
        results = results.concat(subResults);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          const stats = await fs.promises.stat(fullPath);
          const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
          const id = Buffer.from(relativePath, 'utf8').toString('base64url');
          
          results.push({
            id,
            name: entry.name,
            relativePath,
            size: stats.size,
          });
        }
      }
    }
  } catch (err) {
    console.error(`Error scanning directory: ${currentDir}`, err);
  }

  return results;
}

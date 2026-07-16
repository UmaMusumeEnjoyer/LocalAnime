import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { scanDirectory } from './fileScanner.js';

describe('File Scanner Service', () => {
  const testDir = path.resolve(process.cwd(), 'temp_scanner_test');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });

    fs.writeFileSync(path.join(testDir, 'video1.mp4'), 'fake mp4 content');
    fs.writeFileSync(path.join(testDir, 'video2.mkv'), 'fake mkv content');
    fs.writeFileSync(path.join(testDir, 'notes.txt'), 'text content to ignore');

    const subDir = path.join(testDir, 'Season 1');
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(subDir, 'episode1.mp4'), 'fake episode content');
    fs.writeFileSync(path.join(subDir, 'cover.jpg'), 'image content to ignore');
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch (err) {
        // ignore
      }
    }
  });

  it('should scan directory recursively and return only mp4/mkv files', async () => {
    const files = await scanDirectory(testDir);
    expect(files.length).toBe(3);

    const fileNames = files.map(f => f.name);
    expect(fileNames).toContain('video1.mp4');
    expect(fileNames).toContain('video2.mkv');
    expect(fileNames).toContain('episode1.mp4');
    expect(fileNames).not.toContain('notes.txt');
    expect(fileNames).not.toContain('cover.jpg');

    const video1 = files.find(f => f.name === 'video1.mp4')!;
    expect(video1.id).toBeDefined();
    expect(video1.relativePath).toBe('video1.mp4');
    expect(video1.size).toBe(16);

    const ep1 = files.find(f => f.name === 'episode1.mp4')!;
    expect(ep1.relativePath).toBe(path.join('Season 1', 'episode1.mp4').replace(/\\/g, '/'));
  });

  it('should return empty array if directory does not exist', async () => {
    const nonExistent = path.join(testDir, 'non_existent');
    const files = await scanDirectory(nonExistent);
    expect(files).toEqual([]);
  });
});

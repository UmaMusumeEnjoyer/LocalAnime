import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanExternalSubtitles, readSubtitleFile } from './subtitleScanner';
import * as configModule from '../config';
import fs from 'fs';
import path from 'path';

describe('SubtitleScanner Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(configModule, 'getConfig').mockReturnValue({
      videoDir: 'C:/videos',
      subtitleDir: 'C:/subtitles',
    });
  });

  describe('scanExternalSubtitles', () => {
    it('should return empty list if subtitleDir is not configured', async () => {
      vi.spyOn(configModule, 'getConfig').mockReturnValue({
        videoDir: 'C:/videos',
        subtitleDir: '',
      });

      const result = await scanExternalSubtitles('Season 1/ep01.mkv');
      expect(result).toEqual([]);
    });

    it('should find matching subtitle files in mirrored folder and detect language', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs.promises, 'readdir').mockResolvedValue([
        'ep01.vie.srt',
        'ep01.eng.ass',
        'ep02.ass',
        'some_other_file.txt',
      ]);

      const result = await scanExternalSubtitles('Season 1/ep01.mkv');

      expect(fs.promises.readdir).toHaveBeenCalledWith(path.normalize('C:/subtitles/Season 1'));
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: expect.any(String),
        name: 'ep01.vie.srt',
        relativePath: 'Season 1/ep01.vie.srt',
        language: 'vie',
        type: 'external',
      });
      expect(result[1]).toEqual({
        id: expect.any(String),
        name: 'ep01.eng.ass',
        relativePath: 'Season 1/ep01.eng.ass',
        language: 'eng',
        type: 'external',
      });
    });
  });

  describe('readSubtitleFile', () => {
    it('should read file, detect encoding, decode using iconv-lite, and return UTF-8 string', async () => {
      const mockBuffer = Buffer.from('Phụ đề tiếng Việt', 'utf-8');
      vi.spyOn(fs.promises, 'readFile').mockResolvedValue(mockBuffer);

      const result = await readSubtitleFile('C:/subtitles/sub.srt');
      expect(result).toBe('Phụ đề tiếng Việt');
    });
  });
});

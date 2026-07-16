import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { subtitleRouter } from './subtitleRoutes';
import * as configModule from '../config';
import * as fileScannerModule from '../services/fileScanner';
import * as subtitleExtractorModule from '../services/subtitleExtractor';
import * as subtitleScannerModule from '../services/subtitleScanner';
import fs from 'fs';

vi.mock('../config');
vi.mock('../services/fileScanner');
vi.mock('../services/subtitleExtractor');
vi.mock('../services/subtitleScanner');

const app = express();
app.use(express.json());
app.use('/api/videos', subtitleRouter);

describe('Subtitle Router', () => {
  const mockVideo = {
    id: 'mock-video-id',
    name: 'ep1.mkv',
    relativePath: 'ep1.mkv',
    size: 5000,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(configModule, 'getConfig').mockReturnValue({
      videoDir: 'C:/videos',
      subtitleDir: 'C:/subtitles',
      port: 3000,
    });
    vi.spyOn(fileScannerModule, 'scanDirectory').mockResolvedValue([mockVideo]);
  });

  describe('GET /api/videos/:id/subtitles', () => {
    it('should return list of embedded and external subtitles', async () => {
      vi.spyOn(subtitleExtractorModule, 'getMediaStreams').mockResolvedValue({
        audioStreams: [],
        subtitleStreams: [
          { index: 2, language: 'eng', codec: 'ass' }
        ]
      });

      vi.spyOn(subtitleScannerModule, 'scanExternalSubtitles').mockResolvedValue([
        {
          id: 'external-sub-id',
          name: 'ep1.vie.srt',
          relativePath: 'ep1.vie.srt',
          language: 'vie',
          type: 'external'
        }
      ]);

      const response = await request(app).get('/api/videos/mock-video-id/subtitles');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { id: '2', name: 'Embedded #2 (eng - ass)', language: 'eng', type: 'embedded', codec: 'ass' },
        { id: 'external-sub-id', name: 'ep1.vie.srt', relativePath: 'ep1.vie.srt', language: 'vie', type: 'external' }
      ]);
    });
  });

  describe('GET /api/videos/:id/subtitles/:index', () => {
    it('should extract and return content of embedded subtitle', async () => {
      vi.spyOn(subtitleExtractorModule, 'getMediaStreams').mockResolvedValue({
        audioStreams: [],
        subtitleStreams: [{ index: 2, language: 'eng', codec: 'ass' }]
      });

      vi.spyOn(subtitleExtractorModule, 'extractEmbeddedSubtitle').mockResolvedValue('temp/mock-file.ass');
      vi.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('Dialog: hello'));

      const response = await request(app).get('/api/videos/mock-video-id/subtitles/2');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Dialog: hello');
    });
  });

  describe('GET /api/videos/:id/audio-tracks', () => {
    it('should return list of audio tracks', async () => {
      vi.spyOn(subtitleExtractorModule, 'getMediaStreams').mockResolvedValue({
        audioStreams: [{ index: 1, language: 'eng', codec: 'aac' }],
        subtitleStreams: []
      });

      const response = await request(app).get('/api/videos/mock-video-id/audio-tracks');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { index: 1, language: 'eng', codec: 'aac' }
      ]);
    });
  });

  describe('GET /api/videos/:id/external-subs/:subId', () => {
    it('should return content of external subtitle', async () => {
      const subId = Buffer.from('ep1.vie.srt').toString('base64url');
      
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(subtitleScannerModule, 'readSubtitleFile').mockResolvedValue('Vietnamese Subs');

      const response = await request(app).get(`/api/videos/mock-video-id/external-subs/${subId}`);

      expect(response.status).toBe(200);
      expect(response.text).toBe('Vietnamese Subs');
    });
  });
});

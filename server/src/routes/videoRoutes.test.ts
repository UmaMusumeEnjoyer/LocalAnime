import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import path from 'path';
import videoRoutes from './videoRoutes.js';
import * as fileScanner from '../services/fileScanner.js';
import * as videoStreamer from '../services/videoStreamer.js';
import * as config from '../config/index.js';
import ffmpeg from 'fluent-ffmpeg';

vi.mock('fluent-ffmpeg');
vi.mock('../services/networkInfo.js', () => ({
  getLocalIp: vi.fn().mockReturnValue('192.168.1.100'),
  generateQrCodeDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,mockqr'),
}));

describe('Video Routes Integration', () => {
  let testApp: express.Application;

  beforeEach(() => {
    vi.restoreAllMocks();
    testApp = express();
    testApp.use(express.json());
    testApp.use('/api', videoRoutes);
  });

  it('GET /api/videos should return list of scanned videos', async () => {
    const mockVideos = [
      { id: 'abc', name: 'v1.mp4', relativePath: 'v1.mp4', size: 100 }
    ];
    vi.spyOn(config, 'getConfig').mockReturnValue({ videoDir: '/videos', subtitleDir: '', port: 3000 });
    vi.spyOn(fileScanner, 'scanDirectory').mockResolvedValue(mockVideos);

    const response = await request(testApp).get('/api/videos');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockVideos);
    expect(fileScanner.scanDirectory).toHaveBeenCalledWith('/videos');
  });

  it('GET /api/videos should return empty array if videoDir is empty', async () => {
    vi.spyOn(config, 'getConfig').mockReturnValue({ videoDir: '', subtitleDir: '', port: 3000 });

    const response = await request(testApp).get('/api/videos');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('GET /api/videos should return 500 when scanner throws error', async () => {
    vi.spyOn(config, 'getConfig').mockReturnValue({ videoDir: '/videos', subtitleDir: '', port: 3000 });
    vi.spyOn(fileScanner, 'scanDirectory').mockRejectedValue(new Error('Scan failed'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(testApp).get('/api/videos');
    expect(response.status).toBe(500);
  });

  it('GET /api/videos/:id/stream should decode id and stream video', async () => {
    vi.spyOn(config, 'getConfig').mockReturnValue({ videoDir: '/videos', subtitleDir: '', port: 3000 });
    
    const relativePath = 'v1.mp4';
    const id = Buffer.from(relativePath, 'utf8').toString('base64url');

    const streamVideoSpy = vi.spyOn(videoStreamer, 'streamVideo').mockImplementation((filePath, rangeHeader, res) => {
      res.status(200).send('mock stream');
    });

    const response = await request(testApp)
      .get(`/api/videos/${id}/stream`)
      .set('Range', 'bytes=0-10');

    expect(response.status).toBe(200);
    expect(response.text).toBe('mock stream');
    
    expect(streamVideoSpy).toHaveBeenCalled();
    const resolvedExpected = path.resolve('/videos', relativePath).replace(/\\/g, '/');
    const actualResolved = streamVideoSpy.mock.calls[0][0].replace(/\\/g, '/');
    expect(actualResolved).toBe(resolvedExpected);
  });

  it('GET /api/videos/:id/stream with ?audioTrack should remux and stream', async () => {
    vi.spyOn(config, 'getConfig').mockReturnValue({ videoDir: '/videos', subtitleDir: '', port: 3000 });

    const mockPipe = vi.fn().mockImplementation((res) => {
      res.write('mock remuxed stream');
      res.end();
    });

    const mockFfmpegInstance = {
      outputOptions: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      pipe: mockPipe,
    };

    vi.mocked(ffmpeg).mockReturnValue(mockFfmpegInstance as any);

    const relativePath = 'v1.mp4';
    const id = Buffer.from(relativePath, 'utf8').toString('base64url');

    const response = await request(testApp)
      .get(`/api/videos/${id}/stream?audioTrack=1`);

    expect(response.status).toBe(200);
    expect(response.body.toString()).toBe('mock remuxed stream');
    expect(ffmpeg).toHaveBeenCalledWith(expect.stringContaining('v1.mp4'));
    expect(mockFfmpegInstance.outputOptions).toHaveBeenCalledWith(expect.arrayContaining([
      '-map 0:v:0',
      '-map 0:1',
      '-c:v copy',
      '-c:a aac',
      '-movflags empty_moov+default_base_moof+frag_keyframe',
      '-f mp4'
    ]));
  });

  it('GET /api/videos/:id/stream should return 400 if videoDir is empty', async () => {
    vi.spyOn(config, 'getConfig').mockReturnValue({ videoDir: '', subtitleDir: '', port: 3000 });

    const response = await request(testApp).get('/api/videos/someid/stream');
    expect(response.status).toBe(400);
    expect(response.text).toBe('Video directory not configured');
  });

  it('GET /api/videos/:id/stream should return 403 if directory traversal is detected', async () => {
    const baseDir = path.resolve('/videos');
    vi.spyOn(config, 'getConfig').mockReturnValue({ videoDir: baseDir, subtitleDir: '', port: 3000 });

    const relativePath = '../forbidden/file.mp4';
    const id = Buffer.from(relativePath, 'utf8').toString('base64url');

    const response = await request(testApp).get(`/api/videos/${id}/stream`);
    expect(response.status).toBe(403);
    expect(response.text).toBe('Forbidden: Directory traversal detected');
  });

  it('GET /api/videos/:id/stream should return 500 when handler throws error', async () => {
    vi.spyOn(config, 'getConfig').mockImplementation(() => {
      throw new Error('Database down');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(testApp).get('/api/videos/someid/stream');
    expect(response.status).toBe(500);
  });

  it('GET /api/config should return active configuration', async () => {
    const mockConf = { videoDir: '/videos', subtitleDir: '/subs', port: 3000 };
    vi.spyOn(config, 'getConfig').mockReturnValue(mockConf);

    const response = await request(testApp).get('/api/config');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockConf);
  });

  it('POST /api/config should update configuration and write to file', async () => {
    const mockUpdated = { videoDir: '/new-videos', subtitleDir: '/new-subs', port: 3000 };
    const updateSpy = vi.spyOn(config, 'updateConfig').mockReturnValue(mockUpdated);

    const response = await request(testApp)
      .post('/api/config')
      .send({ videoDir: '/new-videos', subtitleDir: '/new-subs' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUpdated);
    expect(updateSpy).toHaveBeenCalledWith({ videoDir: '/new-videos', subtitleDir: '/new-subs' });
  });

  it('GET /api/network should return IP, port, and QR data URL', async () => {
    vi.spyOn(config, 'getConfig').mockReturnValue({ videoDir: '/videos', subtitleDir: '', port: 3000 });

    const response = await request(testApp).get('/api/network');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      localIp: '192.168.1.100',
      port: 3000,
      qrCodeDataUrl: 'data:image/png;base64,mockqr',
    });
  });
});

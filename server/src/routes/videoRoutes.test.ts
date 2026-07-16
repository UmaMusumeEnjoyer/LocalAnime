import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import path from 'path';
import videoRoutes from './videoRoutes.js';
import * as fileScanner from '../services/fileScanner.js';
import * as videoStreamer from '../services/videoStreamer.js';
import * as config from '../config/index.js';

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

  it('GET /api/videos/:id/stream should return 400 if videoDir is empty', async () => {
    vi.spyOn(config, 'getConfig').mockReturnValue({ videoDir: '', subtitleDir: '', port: 3000 });

    const response = await request(testApp).get('/api/videos/someid/stream');
    expect(response.status).toBe(400);
    expect(response.text).toBe('Video directory not configured');
  });

  it('GET /api/videos/:id/stream should return 403 if directory traversal is detected', async () => {
    // Set a base dir
    const baseDir = path.resolve('/videos');
    vi.spyOn(config, 'getConfig').mockReturnValue({ videoDir: baseDir, subtitleDir: '', port: 3000 });

    // Relative path that goes outside /videos
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
});

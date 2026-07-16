import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchVideos } from './api';

describe('API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchVideos should perform GET /api/videos and return JSON data', async () => {
    const mockData = [
      { id: '123', name: 'anime1.mp4', relativePath: 'anime1.mp4', size: 100 }
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchVideos();

    expect(fetchMock).toHaveBeenCalledWith('/api/videos');
    expect(result).toEqual(mockData);
  });

  it('fetchVideos should throw error if response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchVideos()).rejects.toThrow('Failed to fetch videos: Internal Server Error');
  });
});

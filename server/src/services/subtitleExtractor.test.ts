import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMediaStreams, extractEmbeddedSubtitle } from './subtitleExtractor';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';

vi.mock('fluent-ffmpeg');

describe('SubtitleExtractor Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getMediaStreams', () => {
    it('should query ffprobe and parse audio and subtitle streams', async () => {
      const mockFfprobeData = {
        streams: [
          { index: 0, codec_type: 'video', codec_name: 'h264' },
          { index: 1, codec_type: 'audio', codec_name: 'aac', tags: { language: 'eng' } },
          { index: 2, codec_type: 'subtitle', codec_name: 'subrip', tags: { language: 'vie' } },
          { index: 3, codec_type: 'subtitle', codec_name: 'ass' },
        ],
      };

      vi.spyOn(ffmpeg, 'ffprobe').mockImplementation((_path, callback) => {
        (callback as any)(null, mockFfprobeData);
      });

      const { audioStreams, subtitleStreams } = await getMediaStreams('video.mkv');

      expect(audioStreams).toEqual([
        { index: 1, language: 'eng', codec: 'aac' },
      ]);
      expect(subtitleStreams).toEqual([
        { index: 2, language: 'vie', codec: 'subrip' },
        { index: 3, language: 'unknown', codec: 'ass' },
      ]);
    });

    it('should throw error if ffprobe fails', async () => {
      vi.spyOn(ffmpeg, 'ffprobe').mockImplementation((_path, callback) => {
        (callback as any)(new Error('Probe failed'));
      });

      await expect(getMediaStreams('video.mkv')).rejects.toThrow('Probe failed');
    });
  });

  describe('extractEmbeddedSubtitle', () => {
    beforeEach(() => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      vi.spyOn(fs, 'mkdirSync').mockReturnValue(undefined as any);
    });

    it('should read from cache if the sub file already exists', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);

      const result = await extractEmbeddedSubtitle('video.mkv', 2, 'subrip', 'video-id-123');

      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('video-id-123_2.srt'));
      expect(result).toContain('video-id-123_2.srt');
    });

    it('should call ffmpeg to extract subtitle if not cached', async () => {
      vi.spyOn(fs, 'existsSync').mockImplementation((p) => {
        if (typeof p === 'string' && p.endsWith('temp')) return true;
        return false;
      });

      const mockRun = vi.fn().mockImplementation(function (this: any) {
        if (this._onEnd) this._onEnd();
      });

      const mockFfmpegInstance = {
        outputOptions: vi.fn().mockReturnThis(),
        output: vi.fn().mockReturnThis(),
        on: vi.fn().mockImplementation(function (this: any, event: string, cb: any) {
          if (event === 'end') this._onEnd = cb;
          return this;
        }),
        run: mockRun,
      };

      vi.mocked(ffmpeg).mockReturnValue(mockFfmpegInstance as any);

      const result = await extractEmbeddedSubtitle('video.mkv', 2, 'subrip', 'video-id-123');

      expect(mockFfmpegInstance.outputOptions).toHaveBeenCalledWith(['-map 0:2']);
      expect(mockFfmpegInstance.output).toHaveBeenCalledWith(expect.stringContaining('video-id-123_2.srt'));
      expect(mockRun).toHaveBeenCalled();
      expect(result).toContain('video-id-123_2.srt');
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import { streamVideo } from './videoStreamer.js';
import { Readable } from 'stream';

describe('Video Streamer Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should stream full file when no range is provided', () => {
    const headers: Record<string, string | number> = {};
    let status = 200;
    const mockPipe = vi.fn();

    const res: any = {
      status(s: number) {
        status = s;
        return this;
      },
      setHeader(name: string, value: string | number) {
        headers[name.toLowerCase()] = value;
        return this;
      },
      send() {
        return this;
      }
    };

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'statSync').mockReturnValue({ size: 36 } as any);
    
    const mockStream = new Readable();
    mockStream._read = () => {};
    mockStream.pipe = mockPipe;

    vi.spyOn(fs, 'createReadStream').mockReturnValue(mockStream as any);

    streamVideo('video.mp4', undefined, res);

    expect(status).toBe(200);
    expect(headers['content-length']).toBe(36);
    expect(headers['content-type']).toBe('video/mp4');
    expect(mockPipe).toHaveBeenCalled();
  });

  it('should stream partial file when range is provided', () => {
    const headers: Record<string, string | number> = {};
    let status = 200;
    const mockPipe = vi.fn();

    const res: any = {
      status(s: number) {
        status = s;
        return this;
      },
      setHeader(name: string, value: string | number) {
        headers[name.toLowerCase()] = value;
        return this;
      },
      send() {
        return this;
      }
    };

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'statSync').mockReturnValue({ size: 36 } as any);

    const mockStream = new Readable();
    mockStream._read = () => {};
    mockStream.pipe = mockPipe;

    const createStreamSpy = vi.spyOn(fs, 'createReadStream').mockReturnValue(mockStream as any);

    streamVideo('video.mp4', 'bytes=0-10', res);

    expect(status).toBe(206);
    expect(headers['content-range']).toBe('bytes 0-10/36');
    expect(headers['content-length']).toBe(11);
    expect(headers['accept-ranges']).toBe('bytes');
    expect(createStreamSpy).toHaveBeenCalledWith('video.mp4', { start: 0, end: 10 });
    expect(mockPipe).toHaveBeenCalled();
  });

  it('should return 416 when range is not satisfiable', () => {
    const headers: Record<string, string | number> = {};
    let status = 200;
    let sentMessage = '';

    const res: any = {
      status(s: number) {
        status = s;
        return this;
      },
      setHeader(name: string, value: string | number) {
        headers[name.toLowerCase()] = value;
        return this;
      },
      send(msg: string) {
        sentMessage = msg;
        return this;
      }
    };

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'statSync').mockReturnValue({ size: 36 } as any);

    streamVideo('video.mp4', 'bytes=50-100', res);

    expect(status).toBe(416);
    expect(headers['content-range']).toBe('bytes */36');
    expect(sentMessage).toBe('Requested Range Not Satisfiable');
  });

  it('should handle read stream error events during full streaming gracefully', () => {
    let status = 200;
    let sentMessage = '';
    const res: any = {
      status(s: number) {
        status = s;
        return this;
      },
      setHeader() {
        return this;
      },
      send(msg: string) {
        sentMessage = msg;
        return this;
      },
      headersSent: false
    };

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'statSync').mockReturnValue({ size: 36 } as any);

    const mockStream = new Readable();
    mockStream._read = () => {};
    // Mock pipe to avoid errors and let us trigger error manually
    mockStream.pipe = () => mockStream;

    vi.spyOn(fs, 'createReadStream').mockReturnValue(mockStream as any);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    streamVideo('video.mp4', undefined, res);

    // Trigger error event
    mockStream.emit('error', new Error('Disk failure'));

    expect(status).toBe(500);
    expect(sentMessage).toBe('Internal Server Error');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle read stream error events during partial streaming gracefully', () => {
    let status = 200;
    let sentMessage = '';
    const res: any = {
      status(s: number) {
        status = s;
        return this;
      },
      setHeader() {
        return this;
      },
      send(msg: string) {
        sentMessage = msg;
        return this;
      },
      headersSent: false
    };

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'statSync').mockReturnValue({ size: 36 } as any);

    const mockStream = new Readable();
    mockStream._read = () => {};
    mockStream.pipe = () => mockStream;

    vi.spyOn(fs, 'createReadStream').mockReturnValue(mockStream as any);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    streamVideo('video.mp4', 'bytes=0-10', res);

    // Trigger error event
    mockStream.emit('error', new Error('Disk failure'));

    expect(status).toBe(500);
    expect(sentMessage).toBe('Internal Server Error');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should return 404 when file does not exist', () => {
    let status = 200;
    const res: any = {
      status(s: number) {
        status = s;
        return this;
      },
      send() {
        return this;
      }
    };

    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    streamVideo('non_existent.mp4', undefined, res);

    expect(status).toBe(404);
  });
});

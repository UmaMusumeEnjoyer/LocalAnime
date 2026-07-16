import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSubtitleTiming } from './useSubtitleTiming.ts';

describe('useSubtitleTiming Hook', () => {
  const videoId = 'video-123';
  const subtitleId = 'sub-456';

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should initialize with offset 0 if not in localStorage', () => {
    const { result } = renderHook(() => useSubtitleTiming(videoId, subtitleId));
    expect(result.current.offset).toBe(0);
  });

  it('should adjust offset correctly', () => {
    const { result } = renderHook(() => useSubtitleTiming(videoId, subtitleId));

    act(() => {
      result.current.adjustOffset(0.5);
    });
    expect(result.current.offset).toBe(0.5);

    act(() => {
      result.current.adjustOffset(-0.1);
    });
    expect(result.current.offset).toBeCloseTo(0.4);
  });

  it('should reset offset correctly', () => {
    const { result } = renderHook(() => useSubtitleTiming(videoId, subtitleId));

    act(() => {
      result.current.adjustOffset(1.0);
    });
    expect(result.current.offset).toBe(1.0);

    act(() => {
      result.current.resetOffset();
    });
    expect(result.current.offset).toBe(0);
  });

  it('should load initial offset from localStorage and save changes', () => {
    const key = `subtitle-offset-${videoId}-${subtitleId}`;
    localStorage.setItem(key, '-1.5');

    const { result } = renderHook(() => useSubtitleTiming(videoId, subtitleId));
    expect(result.current.offset).toBe(-1.5);

    act(() => {
      result.current.adjustOffset(0.5);
    });
    expect(result.current.offset).toBe(-1.0);
    expect(localStorage.getItem(key)).toBe('-1');
  });
});

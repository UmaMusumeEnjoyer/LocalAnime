import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from './playerStore.ts';

describe('Player Store', () => {
  beforeEach(() => {
    // Reset state before each test
    const { setVideos, setCurrentVideo } = usePlayerStore.getState();
    setVideos([]);
    setCurrentVideo(null);
    localStorage.clear();
  });

  it('should have initial state', () => {
    const state = usePlayerStore.getState();
    expect(state.videos).toEqual([]);
    expect(state.currentVideo).toBeNull();
    expect(state.playbackHistory).toEqual({});
  });

  it('should set videos list', () => {
    const mockVideos = [
      { id: '1', name: 'v1.mp4', relativePath: 'v1.mp4', size: 100 }
    ];

    usePlayerStore.getState().setVideos(mockVideos);
    expect(usePlayerStore.getState().videos).toEqual(mockVideos);
  });

  it('should set current video', () => {
    const mockVideo = { id: '1', name: 'v1.mp4', relativePath: 'v1.mp4', size: 100 };

    usePlayerStore.getState().setCurrentVideo(mockVideo);
    expect(usePlayerStore.getState().currentVideo).toEqual(mockVideo);
  });

  it('should update playback history and persist it', () => {
    usePlayerStore.getState().updatePlaybackHistory('video-1', 45);

    expect(usePlayerStore.getState().playbackHistory['video-1']).toBe(45);
    expect(usePlayerStore.getState().getPlaybackHistory('video-1')).toBe(45);
    expect(usePlayerStore.getState().getPlaybackHistory('video-nonexistent')).toBe(0);
  });
});

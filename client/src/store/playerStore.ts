import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VideoFile } from '../types/video.ts';

interface PlayerState {
  videos: VideoFile[];
  currentVideo: VideoFile | null;
  playbackHistory: Record<string, number>;
  setVideos: (videos: VideoFile[]) => void;
  setCurrentVideo: (video: VideoFile | null) => void;
  updatePlaybackHistory: (videoId: string, position: number) => void;
  getPlaybackHistory: (videoId: string) => number;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      videos: [],
      currentVideo: null,
      playbackHistory: {},

      setVideos: (videos) => set({ videos }),

      setCurrentVideo: (currentVideo) => set({ currentVideo }),

      updatePlaybackHistory: (videoId, position) =>
        set((state) => ({
          playbackHistory: {
            ...state.playbackHistory,
            [videoId]: position,
          },
        })),

      getPlaybackHistory: (videoId) => {
        return get().playbackHistory[videoId] || 0;
      },
    }),
    {
      name: 'anime-player-local-storage',
      partialize: (state) => ({
        playbackHistory: state.playbackHistory,
      }),
    }
  )
);

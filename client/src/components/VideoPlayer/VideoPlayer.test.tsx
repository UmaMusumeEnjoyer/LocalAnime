import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import VideoPlayer from './VideoPlayer.tsx';
import { usePlayerStore } from '../../store/playerStore.ts';

vi.mock('jassub', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      destroy: vi.fn(),
    })),
  };
});

describe('VideoPlayer Component', () => {
  const mockVideo = { id: 'abc', name: 'v1.mp4', relativePath: 'v1.mp4', size: 100 };

  beforeEach(() => {
    vi.restoreAllMocks();
    usePlayerStore.getState().setCurrentVideo(mockVideo);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }));
  });

  it('renders video element and custom controls', async () => {
    await act(async () => {
      render(<VideoPlayer />);
    });

    const video = screen.getByTestId('video-element') as HTMLVideoElement;
    expect(video).toBeInTheDocument();
    expect(video.src).toContain('/api/videos/abc/stream');

    expect(screen.getByRole('button', { name: /play-pause/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('resets current video when back button is clicked', async () => {
    await act(async () => {
      render(<VideoPlayer />);
    });

    const backButton = screen.getByRole('button', { name: /back/i });
    await act(async () => {
      fireEvent.click(backButton);
    });

    expect(usePlayerStore.getState().currentVideo).toBeNull();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import VideoPlayer from './VideoPlayer';
import { usePlayerStore } from '../../store/playerStore';

describe('VideoPlayer Component', () => {
  const mockVideo = { id: 'abc', name: 'v1.mp4', relativePath: 'v1.mp4', size: 100 };

  beforeEach(() => {
    vi.restoreAllMocks();
    usePlayerStore.getState().setCurrentVideo(mockVideo);
  });

  it('renders video element and custom controls', () => {
    render(<VideoPlayer />);

    const video = screen.getByTestId('video-element') as HTMLVideoElement;
    expect(video).toBeInTheDocument();
    expect(video.src).toContain('/api/videos/abc/stream');

    expect(screen.getByRole('button', { name: /play-pause/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('resets current video when back button is clicked', () => {
    render(<VideoPlayer />);

    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);

    expect(usePlayerStore.getState().currentVideo).toBeNull();
  });
});

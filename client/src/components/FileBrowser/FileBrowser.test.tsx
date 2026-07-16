import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import FileBrowser from './FileBrowser';
import { usePlayerStore } from '../../store/playerStore';

describe('FileBrowser Component', () => {
  const mockVideos = [
    { id: '1', name: 'v1.mp4', relativePath: 'v1.mp4', size: 1000000 },
    { id: '2', name: 'episode1.mp4', relativePath: 'Season 1/episode1.mp4', size: 2000000 },
    { id: '3', name: 'episode2.mp4', relativePath: 'Season 1/episode2.mp4', size: 3000000 },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    usePlayerStore.getState().setVideos(mockVideos);
    usePlayerStore.getState().setCurrentVideo(null);
  });

  it('renders video directories and video list', () => {
    render(<FileBrowser />);

    expect(screen.getByText('Root')).toBeInTheDocument();
    expect(screen.getByText('Season 1')).toBeInTheDocument();

    expect(screen.getByText('v1.mp4')).toBeInTheDocument();
    expect(screen.getByText('episode1.mp4')).toBeInTheDocument();
    expect(screen.getByText('episode2.mp4')).toBeInTheDocument();
  });

  it('filters video list based on search query', () => {
    render(<FileBrowser />);

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm video.../i);
    
    fireEvent.change(searchInput, { target: { value: 'episode' } });

    expect(screen.queryByText('v1.mp4')).not.toBeInTheDocument();
    expect(screen.getByText('episode1.mp4')).toBeInTheDocument();
    expect(screen.getByText('episode2.mp4')).toBeInTheDocument();
  });

  it('selects video when card is clicked', () => {
    render(<FileBrowser />);

    const firstCard = screen.getByText('v1.mp4');
    fireEvent.click(firstCard);

    expect(usePlayerStore.getState().currentVideo).toEqual(mockVideos[0]);
  });
});

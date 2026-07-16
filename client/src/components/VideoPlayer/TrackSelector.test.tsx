import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrackSelector from './TrackSelector.tsx';

describe('TrackSelector Component', () => {
  const mockSubtitles = [
    { id: 'none', name: 'Tắt phụ đề', language: '', type: 'none' },
    { id: '2', name: 'Embedded #2 (eng - ass)', language: 'eng', type: 'embedded', codec: 'ass' },
    { id: 'ext-1', name: 'ep1.vie.srt', relativePath: 'ep1.vie.srt', language: 'vie', type: 'external' }
  ];

  const mockAudioTracks = [
    { index: 1, language: 'eng', codec: 'aac' },
    { index: 2, language: 'vie', codec: 'ac3' }
  ];

  it('renders subtitle and audio track lists', () => {
    const onSelectSubtitle = vi.fn();
    const onSelectAudio = vi.fn();
    const onClose = vi.fn();

    render(
      <TrackSelector
        subtitles={mockSubtitles}
        selectedSubtitleId="2"
        audioTracks={mockAudioTracks}
        selectedAudioIndex={1}
        onSelectSubtitle={onSelectSubtitle}
        onSelectAudio={onSelectAudio}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Chọn Phụ Đề')).toBeInTheDocument();
    expect(screen.getByText('Chọn Âm Thanh')).toBeInTheDocument();

    expect(screen.getByText('Tắt phụ đề')).toBeInTheDocument();
    expect(screen.getByText('Embedded #2 (eng - ass)')).toBeInTheDocument();
    expect(screen.getByText('ep1.vie.srt')).toBeInTheDocument();
    expect(screen.getByText('Kênh 1: eng (aac)')).toBeInTheDocument();
    expect(screen.getByText('Kênh 2: vie (ac3)')).toBeInTheDocument();
  });

  it('calls callback when track is clicked', () => {
    const onSelectSubtitle = vi.fn();
    const onSelectAudio = vi.fn();
    const onClose = vi.fn();

    render(
      <TrackSelector
        subtitles={mockSubtitles}
        selectedSubtitleId="2"
        audioTracks={mockAudioTracks}
        selectedAudioIndex={1}
        onSelectSubtitle={onSelectSubtitle}
        onSelectAudio={onSelectAudio}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText('ep1.vie.srt'));
    expect(onSelectSubtitle).toHaveBeenCalledWith(mockSubtitles[2]);

    fireEvent.click(screen.getByText('Kênh 2: vie (ac3)'));
    expect(onSelectAudio).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByRole('button', { name: /Đóng/i }));
    expect(onClose).toHaveBeenCalled();
  });
});

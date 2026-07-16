import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import * as api from './services/api';

describe('App Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'fetchVideos').mockResolvedValue([]);
  });

  it('renders without crashing', async () => {
    await act(async () => {
      render(<App />);
    });
    const heading = screen.getByRole('heading', { name: /AnimePlayerLocal/i });
    expect(heading).toBeInTheDocument();
  });
});

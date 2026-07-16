import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { name: /AnimePlayerLocal/i });
    expect(heading).toBeInTheDocument();
  });
});

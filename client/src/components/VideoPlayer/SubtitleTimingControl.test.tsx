import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SubtitleTimingControl from './SubtitleTimingControl.tsx';

describe('SubtitleTimingControl Component', () => {
  it('renders timing offset and buttons', () => {
    const onAdjust = vi.fn();
    const onReset = vi.fn();

    render(
      <SubtitleTimingControl
        offset={0.5}
        onAdjust={onAdjust}
        onReset={onReset}
      />
    );

    expect(screen.getByText('Lệch: +0.5s')).toBeInTheDocument();

    expect(screen.getByText('-0.1s')).toBeInTheDocument();
    expect(screen.getByText('+0.1s')).toBeInTheDocument();
    expect(screen.getByText('-0.5s')).toBeInTheDocument();
    expect(screen.getByText('+0.5s')).toBeInTheDocument();
    expect(screen.getByText('-1.0s')).toBeInTheDocument();
    expect(screen.getByText('+1.0s')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('triggers callbacks when buttons are clicked', () => {
    const onAdjust = vi.fn();
    const onReset = vi.fn();

    render(
      <SubtitleTimingControl
        offset={-1.2}
        onAdjust={onAdjust}
        onReset={onReset}
      />
    );

    expect(screen.getByText('Lệch: -1.2s')).toBeInTheDocument();

    fireEvent.click(screen.getByText('+0.5s'));
    expect(onAdjust).toHaveBeenCalledWith(0.5);

    fireEvent.click(screen.getByText('-0.1s'));
    expect(onAdjust).toHaveBeenCalledWith(-0.1);

    fireEvent.click(screen.getByText('Reset'));
    expect(onReset).toHaveBeenCalled();
  });
});

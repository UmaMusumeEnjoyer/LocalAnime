import { useState, useEffect } from 'react';

export function useSubtitleTiming(videoId: string, subtitleId: string) {
  const key = `subtitle-offset-${videoId}-${subtitleId}`;

  const [offset, setOffset] = useState<number>(() => {
    const saved = localStorage.getItem(key);
    return saved ? parseFloat(saved) : 0;
  });

  useEffect(() => {
    const saved = localStorage.getItem(key);
    setOffset(saved ? parseFloat(saved) : 0);
  }, [key]);

  const adjustOffset = (amount: number) => {
    setOffset((prev) => {
      const next = parseFloat((prev + amount).toFixed(2));
      localStorage.setItem(key, next.toString());
      return next;
    });
  };

  const resetOffset = () => {
    setOffset(0);
    localStorage.setItem(key, '0');
  };

  return {
    offset,
    adjustOffset,
    resetOffset,
  };
}

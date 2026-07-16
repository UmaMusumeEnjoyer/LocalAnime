import { describe, it, expect } from 'vitest';
import { parseSubtitle } from './subtitleParser.ts';

describe('Subtitle Parser', () => {
  it('should parse SRT subtitles correctly', () => {
    const srtContent = `1
00:00:01,500 --> 00:00:04,200
Hello World!

2
00:01:20,000 --> 00:01:22,500
Line 1
Line 2
`;

    const cues = parseSubtitle(srtContent, 'srt');

    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({
      startTime: 1.5,
      endTime: 4.2,
      text: 'Hello World!',
    });
    expect(cues[1]).toEqual({
      startTime: 80.0,
      endTime: 82.5,
      text: 'Line 1\nLine 2',
    });
  });

  it('should parse VTT subtitles correctly', () => {
    const vttContent = `WEBVTT

1
00:01:10.500 --> 00:01:12.000
WebVTT text

2
12:30.100 --> 12:32.400
Short timestamp
`;

    const cues = parseSubtitle(vttContent, 'vtt');

    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({
      startTime: 70.5,
      endTime: 72.0,
      text: 'WebVTT text',
    });
    expect(cues[1]).toEqual({
      startTime: 750.1,
      endTime: 752.4,
      text: 'Short timestamp',
    });
  });

  it('should strip HTML formatting tags from text', () => {
    const srtContent = `1
00:00:01,000 --> 00:00:03,000
<i>Italicized</i> and <b>bolded</b> text with {\an8} position tags.
`;
    const cues = parseSubtitle(srtContent, 'srt');
    expect(cues[0].text).toBe('Italicized and bolded text with  position tags.');
  });
});

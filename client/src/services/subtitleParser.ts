export interface SubtitleCue {
  startTime: number;
  endTime: number;
  text: string;
}

function parseTimestampToSeconds(ts: string): number {
  const cleanTs = ts.trim().replace(',', '.');
  const parts = cleanTs.split(':');
  
  let hours = 0;
  let minutes = 0;
  let secondsWithMs = 0;

  if (parts.length === 3) {
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
    secondsWithMs = parseFloat(parts[2]);
  } else if (parts.length === 2) {
    minutes = parseInt(parts[0], 10);
    secondsWithMs = parseFloat(parts[1]);
  } else {
    secondsWithMs = parseFloat(cleanTs);
  }

  return hours * 3600 + minutes * 60 + secondsWithMs;
}

export function parseSubtitle(content: string, _format: 'srt' | 'vtt'): SubtitleCue[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawBlocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (const block of rawBlocks) {
    const lines = block.trim().split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    
    if (lines.length === 0) continue;

    if (lines[0].toUpperCase() === 'WEBVTT' || lines[0].toUpperCase().startsWith('WEBVTT ')) continue;

    let timeIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        timeIndex = i;
        break;
      }
    }

    if (timeIndex === -1) {
      continue;
    }

    const timeLine = lines[timeIndex];
    const [startPart, endPart] = timeLine.split('-->').map((p) => p.trim());

    if (!startPart || !endPart) continue;

    const startTime = parseTimestampToSeconds(startPart);
    const endTime = parseTimestampToSeconds(endPart);

    const textLines = lines.slice(timeIndex + 1);
    const rawText = textLines.join('\n');

    const cleanText = rawText
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/\{[^}]+\}/g, '');

    cues.push({
      startTime,
      endTime,
      text: cleanText,
    });
  }

  return cues;
}

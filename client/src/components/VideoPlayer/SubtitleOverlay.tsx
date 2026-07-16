import styles from './SubtitleOverlay.module.css';
import type { SubtitleCue } from '../../services/subtitleParser.ts';

interface SubtitleOverlayProps {
  currentTime: number;
  cues: SubtitleCue[];
  offset?: number;
}

export default function SubtitleOverlay({ currentTime, cues, offset = 0 }: SubtitleOverlayProps) {
  const adjustedTime = currentTime + offset;
  const activeCue = cues.find(
    (cue) => adjustedTime >= cue.startTime && adjustedTime <= cue.endTime
  );

  if (!activeCue) return null;

  return (
    <div className={styles.container}>
      <div className={styles.textWrapper}>
        {activeCue.text.split('\n').map((line, index) => (
          <p key={index} className={styles.line}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

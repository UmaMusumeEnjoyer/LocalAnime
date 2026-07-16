import styles from './SubtitleOverlay.module.css';
import type { SubtitleCue } from '../../services/subtitleParser.ts';

interface SubtitleOverlayProps {
  currentTime: number;
  cues: SubtitleCue[];
}

export default function SubtitleOverlay({ currentTime, cues }: SubtitleOverlayProps) {
  const activeCue = cues.find(
    (cue) => currentTime >= cue.startTime && currentTime <= cue.endTime
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

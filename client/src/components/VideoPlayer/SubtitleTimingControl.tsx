import styles from './SubtitleTimingControl.module.css';

interface SubtitleTimingControlProps {
  offset: number;
  onAdjust: (amount: number) => void;
  onReset: () => void;
}

export default function SubtitleTimingControl({
  offset,
  onAdjust,
  onReset,
}: SubtitleTimingControlProps) {
  const formattedOffset = offset > 0 ? `+${offset.toFixed(1)}s` : `${offset.toFixed(1)}s`;

  return (
    <div className={styles.container}>
      <div className={styles.offsetRow}>
        <span className={styles.offsetLabel}>Lệch: {formattedOffset}</span>
        <button 
          className={styles.resetButton} 
          onClick={onReset}
          disabled={offset === 0}
        >
          Reset
        </button>
      </div>
      <div className={styles.buttonGrid}>
        <button className={styles.btn} onClick={() => onAdjust(-1.0)}>
          -1.0s
        </button>
        <button className={styles.btn} onClick={() => onAdjust(-0.5)}>
          -0.5s
        </button>
        <button className={styles.btn} onClick={() => onAdjust(-0.1)}>
          -0.1s
        </button>
        <button className={styles.btn} onClick={() => onAdjust(0.1)}>
          +0.1s
        </button>
        <button className={styles.btn} onClick={() => onAdjust(0.5)}>
          +0.5s
        </button>
        <button className={styles.btn} onClick={() => onAdjust(1.0)}>
          +1.0s
        </button>
      </div>
    </div>
  );
}

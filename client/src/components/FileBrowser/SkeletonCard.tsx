import styles from './SkeletonCard.module.css';

export default function SkeletonCard() {
  return (
    <div className={styles.card} data-testid="skeleton-card">
      <div className={`${styles.image} ${styles.shimmer}`}></div>
      <div className={styles.info}>
        <div className={`${styles.title} ${styles.shimmer}`}></div>
        <div className={`${styles.meta} ${styles.shimmer}`}></div>
      </div>
    </div>
  );
}

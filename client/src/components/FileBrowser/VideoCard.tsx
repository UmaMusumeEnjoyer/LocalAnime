import React from 'react';
import { VideoFile } from '../../types/video';
import styles from './VideoCard.module.css';
import { Play } from 'lucide-react';

interface VideoCardProps {
  video: VideoFile;
  onClick: () => void;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.iconContainer}>
        <Play className={styles.playIcon} size={24} />
      </div>
      <div className={styles.info}>
        <div className={styles.title} title={video.name}>
          {video.name}
        </div>
        <div className={styles.size}>{formatBytes(video.size)}</div>
      </div>
    </div>
  );
}

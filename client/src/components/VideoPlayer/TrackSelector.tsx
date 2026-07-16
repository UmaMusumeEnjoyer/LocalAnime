import styles from './TrackSelector.module.css';
import { X, Check } from 'lucide-react';

export interface SubtitleOption {
  id: string;
  name: string;
  language: string;
  type: string;
  codec?: string;
  relativePath?: string;
}

export interface AudioTrackOption {
  index: number;
  language: string;
  codec: string;
}

interface TrackSelectorProps {
  subtitles: SubtitleOption[];
  selectedSubtitleId: string;
  audioTracks: AudioTrackOption[];
  selectedAudioIndex: number;
  onSelectSubtitle: (sub: SubtitleOption) => void;
  onSelectAudio: (index: number) => void;
  onClose: () => void;
}

export default function TrackSelector({
  subtitles,
  selectedSubtitleId,
  audioTracks,
  selectedAudioIndex,
  onSelectSubtitle,
  onSelectAudio,
  onClose,
}: TrackSelectorProps) {
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h3 className={styles.title}>Cấu Hình Phát Phim</h3>
          <button className={styles.closeButton} aria-label="Đóng" onClick={onClose}>
            <X size={24} />
          </button>
        </header>

        <div className={styles.content}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Chọn Phụ Đề</h4>
            <div className={styles.list}>
              {subtitles.map((sub) => {
                const isSelected = sub.id === selectedSubtitleId;
                return (
                  <button
                    key={sub.id}
                    className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
                    onClick={() => {
                      onSelectSubtitle(sub);
                    }}
                  >
                    <span className={styles.itemName}>{sub.name}</span>
                    {isSelected && <Check className={styles.checkIcon} size={20} />}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Chọn Âm Thanh</h4>
            <div className={styles.list}>
              {audioTracks.map((track) => {
                const isSelected = track.index === selectedAudioIndex;
                return (
                  <button
                    key={track.index}
                    className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
                    onClick={() => {
                      onSelectAudio(track.index);
                    }}
                  >
                    <span className={styles.itemName}>
                      Kênh {track.index}: {track.language} ({track.codec})
                    </span>
                    {isSelected && <Check className={styles.checkIcon} size={20} />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

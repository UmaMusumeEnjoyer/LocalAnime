import { useState } from 'react';
import styles from './TrackSelector.module.css';
import { X, Check, ChevronRight } from 'lucide-react';
import SubtitleTimingControl from './SubtitleTimingControl.tsx';
import SubtitleSettingsMenu from './SubtitleSettingsMenu.tsx';
import SubtitleOptionPicker from './SubtitleOptionPicker.tsx';

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
  offset?: number;
  onAdjustOffset?: (amount: number) => void;
  onResetOffset?: () => void;
}

export default function TrackSelector({
  subtitles,
  selectedSubtitleId,
  audioTracks,
  selectedAudioIndex,
  onSelectSubtitle,
  onSelectAudio,
  onClose,
  offset,
  onAdjustOffset,
  onResetOffset,
}: TrackSelectorProps) {
  const [activeView, setActiveView] = useState<'main' | 'subtitle_settings' | 'option_picker'>('main');
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');

  if (activeView === 'subtitle_settings') {
    return (
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
          <SubtitleSettingsMenu
            onBack={() => setActiveView('main')}
            onClose={onClose}
            onSelectOption={(optionId) => {
              setSelectedOptionId(optionId);
              setActiveView('option_picker');
            }}
          />
        </div>
      </div>
    );
  }

  if (activeView === 'option_picker') {
    return (
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
          <SubtitleOptionPicker
            optionId={selectedOptionId}
            onBack={() => setActiveView('subtitle_settings')}
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

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
            <h4 className={styles.sectionTitle}>Hiển Thị</h4>
            <div className={styles.list}>
              <button
                className={styles.item}
                onClick={() => setActiveView('subtitle_settings')}
              >
                <span className={styles.itemName}>Cài đặt hiển thị phụ đề</span>
                <ChevronRight size={18} className={styles.chevronIcon} />
              </button>
            </div>
          </section>

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

          {selectedSubtitleId !== 'none' && offset !== undefined && onAdjustOffset && onResetOffset && (
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Đồng Bộ Phụ Đề</h4>
              <SubtitleTimingControl
                offset={offset}
                onAdjust={onAdjustOffset}
                onReset={onResetOffset}
              />
            </section>
          )}

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

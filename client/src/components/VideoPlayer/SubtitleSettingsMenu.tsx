import styles from './TrackSelector.module.css';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useSubtitleStyleStore } from '../../store/subtitleStyleStore.ts';

interface SubtitleSettingsMenuProps {
  onBack: () => void;
  onClose: () => void;
  onSelectOption: (optionId: string) => void;
}

export default function SubtitleSettingsMenu({ onBack, onClose, onSelectOption }: SubtitleSettingsMenuProps) {
  const {
    fontColor,
    fontOpacity,
    fontSize,
    characterEdge,
    backgroundColor,
    backgroundOpacity,
    windowColor,
    windowOpacity
  } = useSubtitleStyleStore();

  const menuItems = [
    { id: 'fontColor', label: 'Font Color', value: fontColor },
    { id: 'fontOpacity', label: 'Font Opacity', value: `${fontOpacity}%` },
    { id: 'fontSize', label: 'Font Size', value: `${fontSize}%` },
    { id: 'characterEdge', label: 'Character Edge', value: characterEdge },
    { id: 'backgroundColor', label: 'Background Color', value: backgroundColor },
    { id: 'backgroundOpacity', label: 'Background Opacity', value: `${backgroundOpacity}%` },
    { id: 'windowColor', label: 'Window Color', value: windowColor },
    { id: 'windowOpacity', label: 'Window Opacity', value: `${windowOpacity}%` },
  ];

  return (
    <>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className={styles.backButton} aria-label="Quay lại" onClick={onBack}>
            <ChevronLeft size={24} />
          </button>
          <h3 className={styles.title}>Cài Đặt Phụ Đề</h3>
        </div>
        <button className={styles.closeButton} aria-label="Đóng" onClick={onClose}>
          <X size={24} />
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.list}>
          {menuItems.map(item => (
            <button
              key={item.id}
              className={styles.item}
              onClick={() => onSelectOption(item.id)}
            >
              <span className={styles.itemName}>{item.label}</span>
              <span className={styles.valueLabel}>{item.value}</span>
              <ChevronRight size={18} className={styles.chevronIcon} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

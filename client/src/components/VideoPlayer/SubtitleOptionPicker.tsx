import styles from './TrackSelector.module.css';
import { ChevronLeft, X, Check } from 'lucide-react';
import { useSubtitleStyleStore } from '../../store/subtitleStyleStore.ts';
import type { CharacterEdgeType } from '../../store/subtitleStyleStore.ts';

interface SubtitleOptionPickerProps {
  optionId: string;
  onBack: () => void;
  onClose: () => void;
}

const colors = ['White', 'Black', 'Red', 'Green', 'Blue', 'Yellow', 'Magenta', 'Cyan'];
const opacities = [0, 25, 50, 75, 100];
const sizes = [50, 75, 100, 150, 200, 300, 400];
const edges: CharacterEdgeType[] = ['None', 'Uniform', 'Drop shadow', 'Raised', 'Depressed'];

export default function SubtitleOptionPicker({ optionId, onBack, onClose }: SubtitleOptionPickerProps) {
  const store = useSubtitleStyleStore();

  let title = '';
  let options: { label: string; value: any }[] = [];
  let currentValue: any;
  let onSelect: (val: any) => void = () => {};

  switch (optionId) {
    case 'fontColor':
      title = 'Font Color';
      options = colors.map(c => ({ label: c, value: c }));
      currentValue = store.fontColor;
      onSelect = store.setFontColor;
      break;
    case 'fontOpacity':
      title = 'Font Opacity';
      options = opacities.map(o => ({ label: `${o}%`, value: o }));
      currentValue = store.fontOpacity;
      onSelect = store.setFontOpacity;
      break;
    case 'fontSize':
      title = 'Font Size';
      options = sizes.map(s => ({ label: `${s}%`, value: s }));
      currentValue = store.fontSize;
      onSelect = store.setFontSize;
      break;
    case 'characterEdge':
      title = 'Character Edge';
      options = edges.map(e => ({ label: e, value: e }));
      currentValue = store.characterEdge;
      onSelect = store.setCharacterEdge;
      break;
    case 'backgroundColor':
      title = 'Background Color';
      options = colors.map(c => ({ label: c, value: c }));
      currentValue = store.backgroundColor;
      onSelect = store.setBackgroundColor;
      break;
    case 'backgroundOpacity':
      title = 'Background Opacity';
      options = opacities.map(o => ({ label: `${o}%`, value: o }));
      currentValue = store.backgroundOpacity;
      onSelect = store.setBackgroundOpacity;
      break;
    case 'windowColor':
      title = 'Window Color';
      options = colors.map(c => ({ label: c, value: c }));
      currentValue = store.windowColor;
      onSelect = store.setWindowColor;
      break;
    case 'windowOpacity':
      title = 'Window Opacity';
      options = opacities.map(o => ({ label: `${o}%`, value: o }));
      currentValue = store.windowOpacity;
      onSelect = store.setWindowOpacity;
      break;
    default:
      return null;
  }

  return (
    <>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className={styles.backButton} aria-label="Quay lại" onClick={onBack}>
            <ChevronLeft size={24} />
          </button>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <button className={styles.closeButton} aria-label="Đóng" onClick={onClose}>
          <X size={24} />
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.list}>
          {options.map(opt => {
            const isSelected = opt.value === currentValue;
            return (
              <button
                key={opt.label}
                className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
                onClick={() => {
                  onSelect(opt.value);
                  onBack();
                }}
              >
                <span className={styles.itemName}>{opt.label}</span>
                {isSelected && <Check className={styles.checkIcon} size={20} />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

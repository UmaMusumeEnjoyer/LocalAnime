import React from 'react';
import styles from './SubtitleOverlay.module.css';
import type { SubtitleCue } from '../../services/subtitleParser.ts';
import { useSubtitleStyleStore } from '../../store/subtitleStyleStore.ts';
import type { CharacterEdgeType } from '../../store/subtitleStyleStore.ts';

interface SubtitleOverlayProps {
  currentTime: number;
  cues: SubtitleCue[];
  offset?: number;
}

const colorToHex: Record<string, string> = {
  White: '#ffffff',
  Black: '#000000',
  Red: '#ff0000',
  Green: '#00ff00',
  Blue: '#0000ff',
  Yellow: '#ffff00',
  Magenta: '#ff00ff',
  Cyan: '#00ffff'
};

function getRgba(colorName: string, opacityPercent: number) {
  const hex = colorToHex[colorName] || '#ffffff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacityPercent / 100})`;
}

function getTextShadow(edgeType: CharacterEdgeType) {
  switch (edgeType) {
    case 'None': 
      return 'none';
    case 'Uniform': 
      return `1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000`;
    case 'Drop shadow': 
      return `0 2px 4px rgba(0, 0, 0, 0.8)`;
    case 'Raised': 
      return `1px 1px 0 #222, 2px 2px 0 #111`;
    case 'Depressed': 
      return `-1px -1px 0 #222, -2px -2px 0 #111`;
    default: 
      return 'none';
  }
}

export default function SubtitleOverlay({ currentTime, cues, offset = 0 }: SubtitleOverlayProps) {
  const store = useSubtitleStyleStore();
  const adjustedTime = currentTime + offset;
  
  const activeCue = cues.find(
    (cue) => adjustedTime >= cue.startTime && adjustedTime <= cue.endTime
  );

  if (!activeCue) return null;

  const fontColor = getRgba(store.fontColor, store.fontOpacity);
  const backgroundColor = getRgba(store.backgroundColor, store.backgroundOpacity);
  const windowColor = getRgba(store.windowColor, store.windowOpacity);
  const textShadow = getTextShadow(store.characterEdge);
  
  const containerStyle = {
    backgroundColor: windowColor,
    '--font-scale': store.fontSize / 100,
  } as React.CSSProperties;

  const wrapperStyle = {
    backgroundColor: backgroundColor,
  };

  const lineStyle = {
    color: fontColor,
    textShadow: textShadow,
  };

  return (
    <div className={styles.container} style={containerStyle}>
      <div className={styles.textWrapper} style={wrapperStyle}>
        {activeCue.text.split('\n').map((line, index) => (
          <p key={index} className={styles.line} style={lineStyle}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

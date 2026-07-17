import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CharacterEdgeType = 'None' | 'Raised' | 'Depressed' | 'Uniform' | 'Drop shadow';

interface SubtitleStyleState {
  fontColor: string;
  fontOpacity: number;
  fontSize: number;
  characterEdge: CharacterEdgeType;
  backgroundColor: string;
  backgroundOpacity: number;
  windowColor: string;
  windowOpacity: number;

  setFontColor: (color: string) => void;
  setFontOpacity: (opacity: number) => void;
  setFontSize: (size: number) => void;
  setCharacterEdge: (edge: CharacterEdgeType) => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setWindowColor: (color: string) => void;
  setWindowOpacity: (opacity: number) => void;
  resetToDefaults: () => void;
}

const defaultState = {
  fontColor: 'White',
  fontOpacity: 100,
  fontSize: 100,
  characterEdge: 'Drop shadow' as CharacterEdgeType,
  backgroundColor: 'Black',
  backgroundOpacity: 40,
  windowColor: 'Black',
  windowOpacity: 0,
};

export const useSubtitleStyleStore = create<SubtitleStyleState>()(
  persist(
    (set) => ({
      ...defaultState,

      setFontColor: (fontColor) => set({ fontColor }),
      setFontOpacity: (fontOpacity) => set({ fontOpacity }),
      setFontSize: (fontSize) => set({ fontSize }),
      setCharacterEdge: (characterEdge) => set({ characterEdge }),
      setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
      setBackgroundOpacity: (backgroundOpacity) => set({ backgroundOpacity }),
      setWindowColor: (windowColor) => set({ windowColor }),
      setWindowOpacity: (windowOpacity) => set({ windowOpacity }),
      resetToDefaults: () => set(defaultState),
    }),
    {
      name: 'anime-player-subtitle-style',
    }
  )
);

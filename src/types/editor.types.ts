/**
 * EmpireCut — Editor Types
 * Types pour l'état de l'éditeur vidéo
 */
import type { Clip, ExportSettings } from './video.types';

// === Overlays Texte ===
export type TextAlignment = 'left' | 'center' | 'right';
export type TextAnimation = 'none' | 'fadeIn' | 'slideUp' | 'typewriter';

export interface TextStyle {
  fontSize: number;
  color: string;
  backgroundColor?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign: TextAlignment;
}

export interface TextOverlay {
  id: string;
  text: string;
  style: TextStyle;
  animation: TextAnimation;
  startTime: number;         // secondes — quand apparaît le texte
  endTime: number;           // secondes — quand disparaît le texte
  positionX: number;         // 0.0 → 1.0 (% de la largeur)
  positionY: number;         // 0.0 → 1.0 (% de la hauteur)
}

// === Musique ===
export interface MusicTrack {
  id: string;
  uri: string;
  title: string;
  artist?: string;
  durationSec: number;
  startTime: number;         // à quelle seconde commence la musique dans la vidéo
  volume: number;            // 0.0 → 1.0
  fadeIn: boolean;
  fadeOut: boolean;
}

// === Filtres ===
export type FilterType = 
  | 'none' 
  | 'chrome' 
  | 'noir' 
  | 'sepia' 
  | 'vintage' 
  | 'vivid';

// === Transitions ===
export type TransitionType = 
  | 'none' 
  | 'fade' 
  | 'wipeleft' 
  | 'wiperight' 
  | 'slideup';

// === État de l'éditeur ===
export type EditorTool =
  | 'none'
  | 'trim'
  | 'text'
  | 'music'
  | 'volume'
  | 'filter'
  | 'transition'
  | 'export';

export interface EditorState {
  projectId: string | null;
  clips: Clip[];
  textOverlays: TextOverlay[];
  musicTrack: MusicTrack | null;
  activeTool: EditorTool;
  selectedClipId: string | null;
  selectedOverlayId: string | null;
  currentTimeMs: number;        // position du curseur en ms
  isPlaying: boolean;
  isMuted: boolean;
  exportSettings: ExportSettings;
  isDirty: boolean;             // changements non sauvegardés
}

// === Opérations éditeur ===
export interface TrimOperation {
  clipId: string;
  newStart: number;
  newEnd: number;
}

export interface MergeOperation {
  clipIds: string[];           // dans l'ordre
  outputPath: string;
}

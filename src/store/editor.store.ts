/**
 * EmpireCut — Editor Store (Zustand)
 *
 * Cœur de l'éditeur vidéo :
 * - clips dans la timeline
 * - overlays texte
 * - musique
 * - outil actif
 * - position du curseur
 * - état lecture
 */
import { create } from 'zustand';
import type { Clip, ExportSettings } from '../types/video.types';
import type {
  EditorState,
  EditorTool,
  TextOverlay,
  MusicTrack,
  TrimOperation,
} from '../types/editor.types';
import { EXPORT_CONFIG } from '../constants/app.constants';

const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  quality: 'medium',
  resolution: '720p',
  frameRate: EXPORT_CONFIG.FRAME_RATE,
  includeAudio: true,
};

interface EditorActions {
  // Init
  initEditor: (projectId: string, clips: Clip[]) => void;
  resetEditor: () => void;

  // Clips
  setClips: (clips: Clip[]) => void;
  addClip: (clip: Clip) => void;
  removeClip: (clipId: string) => void;
  reorderClips: (clips: Clip[]) => void;
  applyTrim: (op: TrimOperation) => void;
  setSelectedClip: (clipId: string | null) => void;

  // Overlays texte
  addTextOverlay: (overlay: TextOverlay) => void;
  updateTextOverlay: (id: string, updates: Partial<TextOverlay>) => void;
  removeTextOverlay: (id: string) => void;
  setSelectedOverlay: (id: string | null) => void;

  // Musique
  setMusicTrack: (track: MusicTrack | null) => void;

  // Lecture
  setCurrentTime: (ms: number) => void;
  setPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setMuted: (muted: boolean) => void;

  // Outil actif
  setActiveTool: (tool: EditorTool) => void;

  // Export
  setExportSettings: (settings: Partial<ExportSettings>) => void;

  // Dirty flag
  markDirty: () => void;
  markClean: () => void;
}

type EditorStore = EditorState & EditorActions;

const INITIAL_STATE: EditorState = {
  projectId: null,
  clips: [],
  textOverlays: [],
  musicTrack: null,
  activeTool: 'none',
  selectedClipId: null,
  selectedOverlayId: null,
  currentTimeMs: 0,
  isPlaying: false,
  isMuted: false,
  exportSettings: DEFAULT_EXPORT_SETTINGS,
  isDirty: false,
};

export const useEditorStore = create<EditorStore>((set) => ({
  ...INITIAL_STATE,

  initEditor: (projectId, clips) =>
    set({ ...INITIAL_STATE, projectId, clips, isDirty: false }),

  resetEditor: () => set(INITIAL_STATE),

  setClips: (clips) => set({ clips, isDirty: true }),

  addClip: (clip) =>
    set((state) => ({
      clips: [...state.clips, { ...clip, position: state.clips.length }],
      isDirty: true,
    })),

  removeClip: (clipId) =>
    set((state) => ({
      clips: state.clips
        .filter((c) => c.id !== clipId)
        .map((c, i) => ({ ...c, position: i })),
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
      isDirty: true,
    })),

  reorderClips: (clips) =>
    set({ clips: clips.map((c, i) => ({ ...c, position: i })), isDirty: true }),

  applyTrim: ({ clipId, newStart, newEnd }) =>
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === clipId ? { ...c, trimStart: newStart, trimEnd: newEnd } : c,
      ),
      isDirty: true,
    })),

  setSelectedClip: (clipId) => set({ selectedClipId: clipId }),

  addTextOverlay: (overlay) =>
    set((state) => ({
      textOverlays: [...state.textOverlays, overlay],
      isDirty: true,
    })),

  updateTextOverlay: (id, updates) =>
    set((state) => ({
      textOverlays: state.textOverlays.map((o) =>
        o.id === id ? { ...o, ...updates } : o,
      ),
      isDirty: true,
    })),

  removeTextOverlay: (id) =>
    set((state) => ({
      textOverlays: state.textOverlays.filter((o) => o.id !== id),
      selectedOverlayId:
        state.selectedOverlayId === id ? null : state.selectedOverlayId,
      isDirty: true,
    })),

  setSelectedOverlay: (id) => set({ selectedOverlayId: id }),

  setMusicTrack: (track) => set({ musicTrack: track, isDirty: true }),

  setCurrentTime: (ms) => set({ currentTimeMs: ms }),

  setPlaying: (playing) => set({ isPlaying: playing }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setMuted: (muted) => set({ isMuted: muted }),

  setActiveTool: (tool) =>
    set((state) => ({
      activeTool: state.activeTool === tool ? 'none' : tool,
    })),

  setExportSettings: (settings) =>
    set((state) => ({
      exportSettings: { ...state.exportSettings, ...settings },
    })),

  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
}));

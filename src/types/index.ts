/**
 * EmpireCut — Types Barrel Export
 * Point d'entrée unique pour tous les types du projet
 */
export type { VideoMetadata, Clip, TrimRange, Thumbnail, ExportSettings, ExportResult, VideoFormat, ExportQuality, ExportResolution } from './video.types';
export type { Project, ProjectSummary, CreateProjectPayload, UpdateProjectPayload, ProjectStatus } from './project.types';
export type { TextOverlay, MusicTrack, EditorState, EditorTool, TextStyle, TextAlignment, TextAnimation, TrimOperation, MergeOperation } from './editor.types';
export type { Database, ProfileRow, ProjectRow, ClipRow } from './supabase.types';

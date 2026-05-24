/**
 * EmpireCut — Video Types
 */

export type VideoFormat = 'mp4' | 'mov' | 'mkv' | 'avi';
export type ExportQuality = 'low' | 'medium' | 'high';
export type ExportResolution = '480p' | '720p' | '1080p';

export interface VideoMetadata {
  uri: string;
  filename: string;
  format: VideoFormat;
  durationMs: number;         // durée en millisecondes
  durationSec: number;        // durée en secondes
  width: number;
  height: number;
  fileSizeMB: number;
  frameRate?: number;
  bitrate?: number;
  hasAudio: boolean;
}

export interface Clip {
  id: string;
  uri: string;                 // chemin local
  storageKey?: string;         // clé Supabase Storage (après upload)
  metadata: VideoMetadata;
  trimStart: number;           // secondes depuis le début
  trimEnd: number;             // secondes depuis le début
  position: number;            // ordre dans la timeline
  volume: number;              // 0.0 → 1.0
}

export interface TrimRange {
  start: number;               // secondes
  end: number;                 // secondes
}

export interface Thumbnail {
  uri: string;
  timeSeconds: number;
  width: number;
  height: number;
}

export interface ExportSettings {
  quality: ExportQuality;
  resolution: ExportResolution;
  frameRate: number;
  includeAudio: boolean;
  outputFilename?: string;
}

export interface ExportResult {
  success: boolean;
  outputPath?: string;
  durationMs?: number;
  fileSizeMB?: number;
  error?: string;
}

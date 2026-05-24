/**
 * EmpireCut — FFmpeg Types
 */

export type FFmpegJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface FFmpegJob {
  id: string;
  command: string;
  status: FFmpegJobStatus;
  progress: number;          // 0 → 100
  outputPath: string;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface FFmpegResult {
  success: boolean;
  outputPath: string;
  durationMs: number;        // temps d'exécution
  returnCode: number;
  error?: string;
  logs?: string;
}

export interface FFmpegProgress {
  sessionId: number;
  time: number;              // temps traité en ms
  percentage: number;        // 0 → 100
}

export interface TrimParams {
  inputPath: string;
  outputPath: string;
  startSec: number;
  endSec: number;
  reEncode?: boolean;        // false = copy (rapide), true = réencode (précis)
}

export interface MergeParams {
  inputPaths: string[];
  outputPath: string;
}

export interface AddAudioParams {
  videoPath: string;
  audioPath: string;
  outputPath: string;
  videoVolume?: number;      // 0.0 → 1.0
  audioVolume?: number;      // 0.0 → 1.0
}

export interface CompressParams {
  inputPath: string;
  outputPath: string;
  quality: 'low' | 'medium' | 'high';
  resolution?: '480p' | '720p' | '1080p';
}

export interface ThumbnailParams {
  inputPath: string;
  outputDir: string;
  count: number;
  width?: number;
  height?: number;
}

export interface ExportParams {
  inputPath: string;
  outputPath: string;
  trimStart?: number;
  trimEnd?: number;
  audioPath?: string;
  audioVolume?: number;
  quality: 'low' | 'medium' | 'high';
  resolution: '480p' | '720p' | '1080p';
  frameRate: number;
}

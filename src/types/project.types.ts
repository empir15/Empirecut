/**
 * EmpireCut — Project Types
 */
import type { Clip } from './video.types';
import type { TextOverlay, MusicTrack } from './editor.types';

export type ProjectStatus = 'draft' | 'exported' | 'archived';

export interface Project {
  id: string;
  userId: string;
  title: string;
  thumbnailUrl?: string;
  duration: number;             // secondes
  status: ProjectStatus;
  clips: Clip[];
  textOverlays: TextOverlay[];
  musicTrack?: MusicTrack;
  createdAt: string;            // ISO date
  updatedAt: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  thumbnailUrl?: string;
  duration: number;
  status: ProjectStatus;
  clipsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  title: string;
  clips: Clip[];
}

export interface UpdateProjectPayload {
  title?: string;
  clips?: Clip[];
  textOverlays?: TextOverlay[];
  musicTrack?: MusicTrack | null;
  status?: ProjectStatus;
  thumbnailUrl?: string;
  duration?: number;
}

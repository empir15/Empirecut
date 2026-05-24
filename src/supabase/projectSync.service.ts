/**
 * EmpireCut — Project Sync Service
 *
 * Orchestre la sauvegarde et le chargement complets d'un projet dans Supabase :
 *  - Métadonnées projet (titre, durée, status, thumbnail)
 *  - Clips (table `clips`) avec positions, trimStart / trimEnd
 *  - Overlays texte + piste musicale → stockés dans le champ JSONB `metadata`
 *
 * Architecture de `metadata` :
 *  {
 *    textOverlays: TextOverlay[];
 *    musicTrack: MusicTrack | null;
 *    aspectRatio: string;          // ex: "16:9"
 *    exportCount: number;
 *  }
 */
import * as db from './database';
import { uploadVideo } from './storage';
import type { Clip } from '../types/video.types';
import type { TextOverlay, MusicTrack } from '../types/editor.types';
import type { ProjectSummary, ProjectStatus } from '../types/project.types';
import type { ProjectRow, ClipRow } from '../types/supabase.types';

// =========================================================
// Types internes du JSONB metadata
// =========================================================

interface ProjectMetadata {
  textOverlays: TextOverlay[];
  musicTrack: MusicTrack | null;
  aspectRatio: string;
  exportCount: number;
}

// =========================================================
// Helpers de mapping
// =========================================================

/** Convertit une ClipRow (DB) en Clip (store local). */
const mapClipRowToClip = (row: ClipRow): Clip => {
  const duration = row.duration ?? 0;
  return {
    id: row.id,
    uri: row.storage_path,
    metadata: {
      uri: row.storage_path,
      filename: row.storage_path.split('/').pop() ?? 'video.mp4',
      format: (row.storage_path.split('.').pop() ?? 'mp4') as any,
      durationMs: duration * 1000,
      durationSec: duration,
      width: 1280,
      height: 720,
      fileSizeMB: 0,
      hasAudio: true,
    },
    trimStart: row.start_trim,
    trimEnd: row.end_trim ?? duration,
    position: row.position,
    volume: 1.0,
  };
};

/** Convertit une ProjectRow en ProjectSummary (pour le store UI). */
export const mapRowToSummary = (row: ProjectRow, clipsCount = 0): ProjectSummary => ({
  id: row.id,
  title: row.title,
  thumbnailUrl: row.thumbnail_url ?? undefined,
  duration: row.duration ?? 0,
  status: row.status as ProjectStatus,
  clipsCount,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// =========================================================
// Sauvegarde Cloud
// =========================================================

/**
 * Sauvegarde l'état complet de l'éditeur dans Supabase :
 * - Met à jour les métadonnées du projet (durée, metadata JSON)
 * - Upsert chaque clip dans la table `clips`
 */
export const syncProjectToCloud = async (params: {
  projectId: string;
  userId: string;
  clips: Clip[];
  textOverlays: TextOverlay[];
  musicTrack: MusicTrack | null;
  title?: string;
  thumbnailUrl?: string;
}): Promise<boolean> => {
  const { projectId, userId, clips, textOverlays, musicTrack, title, thumbnailUrl } = params;

  // 1. Calculer la durée totale de la timeline
  const totalDuration = clips.reduce(
    (acc, c) => acc + (c.trimEnd - c.trimStart),
    0,
  );

  // 2. Construire le JSONB metadata
  const metadata: ProjectMetadata = {
    textOverlays,
    musicTrack,
    aspectRatio: '16:9',
    exportCount: 0,
  };

  // 3. Mettre à jour le projet en DB
  const projectUpdates: Parameters<typeof db.updateProject>[1] = {
    duration: totalDuration,
    metadata: metadata as unknown as Record<string, unknown>,
  };
  if (title) projectUpdates.title = title;
  if (thumbnailUrl !== undefined) projectUpdates.thumbnail_url = thumbnailUrl;

  const projectOk = await db.updateProject(projectId, projectUpdates);
  if (!projectOk) {
    console.error('[Sync] updateProject failed');
    return false;
  }

  // 4. Uploader les clips locaux si nécessaire et les insérer dans la table `clips`
  const clipPromises = clips.map(async (clip, index) => {
    let storagePath = clip.uri;

    // Si le clip est local, on l'uploade vers Supabase Storage
    const isLocal =
      clip.uri.startsWith('file://') ||
      clip.uri.startsWith('content://') ||
      clip.uri.startsWith('/');

    if (isLocal) {
      console.log(`[Sync] Uploading local clip ${clip.id}...`);
      const uploadedPath = await uploadVideo(clip.uri, userId, projectId);
      if (uploadedPath) {
        storagePath = uploadedPath;
      } else {
        console.warn(`[Sync] Failed to upload clip ${clip.id}, keeping local URI`);
      }
    }

    return db.upsertClip({
      id: clip.id,
      project_id: projectId,
      storage_path: storagePath,
      duration: clip.metadata.durationSec,
      start_trim: clip.trimStart,
      end_trim: clip.trimEnd,
      position: index,
    });
  });

  const clipResults = await Promise.all(clipPromises);
  const allClipsOk = clipResults.every((r) => r !== null);

  if (!allClipsOk) {
    console.warn('[Sync] Some clips failed to upsert');
  }

  console.log(`[Sync] Project ${projectId} synced — ${clips.length} clips, ${textOverlays.length} overlays`);
  return projectOk;
};

// =========================================================
// Chargement Cloud
// =========================================================

/**
 * Charge l'état complet d'un projet depuis Supabase.
 * Retourne les clips, overlays et piste musicale.
 */
export const loadProjectFromCloud = async (
  projectId: string,
): Promise<{
  clips: Clip[];
  textOverlays: TextOverlay[];
  musicTrack: MusicTrack | null;
  title: string;
  thumbnailUrl?: string;
} | null> => {
  // 1. Récupérer la ligne projet
  const projectRow = await db.getProjectById(projectId);
  if (!projectRow) {
    console.error('[Sync] Project not found:', projectId);
    return null;
  }

  // 2. Extraire le metadata JSONB
  const raw = projectRow.metadata as unknown as Partial<ProjectMetadata>;
  const textOverlays: TextOverlay[] = Array.isArray(raw?.textOverlays)
    ? raw.textOverlays
    : [];
  const musicTrack: MusicTrack | null = raw?.musicTrack ?? null;

  // 3. Récupérer les clips depuis la table `clips`
  const clipRows = await db.getClipsByProject(projectId);
  const clips: Clip[] = clipRows.map(mapClipRowToClip);

  return {
    clips,
    textOverlays,
    musicTrack,
    title: projectRow.title,
    thumbnailUrl: projectRow.thumbnail_url ?? undefined,
  };
};

// =========================================================
// Chargement liste de projets
// =========================================================

/**
 * Charge tous les projets d'un utilisateur avec leur nombre de clips.
 */
export const loadUserProjects = async (
  userId: string,
): Promise<ProjectSummary[]> => {
  const rows = await db.getProjects(userId);

  // Pour chaque projet, on récupère le nombre de clips
  // (on fait les requêtes en parallèle pour la perf)
  const withCounts = await Promise.all(
    rows.map(async (row) => {
      const clipRows = await db.getClipsByProject(row.id);
      return mapRowToSummary(row, clipRows.length);
    }),
  );

  return withCounts;
};

// =========================================================
// Suppression complète
// =========================================================

/**
 * Supprime un projet et tous ses clips en cascade (géré par la FK DB).
 */
export const deleteProjectCompletely = async (
  projectId: string,
): Promise<boolean> => {
  const ok = await db.deleteProject(projectId);
  if (!ok) {
    console.error('[Sync] deleteProject failed:', projectId);
  }
  return ok;
};

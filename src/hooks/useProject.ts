import { useCallback } from 'react';
import { useProjectStore } from '../store/project.store';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/ui.store';
import * as db from '../supabase/database';
import { uploadThumbnail } from '../supabase/storage';
import { thumbnailService } from '../timeline/thumbnail.service';
import type { ProjectStatus } from '../types/project.types';
import type { VideoMetadata } from '../types/video.types';

export const useProject = () => {
  const { user } = useAuthStore();
  const store = useProjectStore();
  const { showToast } = useUIStore();

  const loadProjects = useCallback(async () => {
    if (!user) return;
    store.setLoading(true);
    const rows = await db.getProjects(user.id);
    store.setProjects(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        thumbnailUrl: r.thumbnail_url ?? undefined,
        duration: r.duration ?? 0,
        status: r.status as ProjectStatus,
        clipsCount: 0,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    );
    store.setLoading(false);
    store.markSynced();
  }, [user, store]);

  const createProject = useCallback(
    async (title: string) => {
      if (!user) return null;
      const row = await db.createProject({ user_id: user.id, title });
      if (!row) {
        showToast('Erreur création projet', 'error');
        return null;
      }
      store.addProject({
        id: row.id,
        title: row.title,
        duration: 0,
        status: 'draft',
        clipsCount: 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
      showToast('Projet créé ! 🎬', 'success');
      return row;
    },
    [user, store, showToast],
  );

  const createProjectWithVideo = useCallback(
    async (title: string, video: VideoMetadata) => {
      if (!user) return null;
      
      // 1. Créer le projet en DB
      const row = await db.createProject({ 
        user_id: user.id, 
        title, 
        duration: video.durationSec 
      });
      if (!row) {
        showToast('Erreur création projet', 'error');
        return null;
      }

      // 2. Générer et uploader une miniature de projet
      let thumbnailUrl: string | undefined;
      try {
        const thumbs = await thumbnailService.generateThumbnails(video.uri, video.durationSec, 1);
        if (thumbs && thumbs.length > 0) {
          const uploadedUrl = await uploadThumbnail(thumbs[0].uri, user.id, row.id);
          if (uploadedUrl) {
            thumbnailUrl = uploadedUrl;
            await db.updateProject(row.id, { thumbnail_url: thumbnailUrl });
          }
        }
      } catch (err) {
        console.warn('[useProject] Thumbnail generation failed:', err);
      }

      // 3. Créer le premier clip associé au projet en DB
      const clipRow = await db.upsertClip({
        project_id: row.id,
        storage_path: video.uri,
        duration: video.durationSec,
        start_trim: 0,
        end_trim: video.durationSec,
        position: 0,
      });

      if (!clipRow) {
        showToast('Erreur création clip', 'error');
      }

      // 4. Ajouter au store de projets
      store.addProject({
        id: row.id,
        title: row.title,
        thumbnailUrl,
        duration: video.durationSec,
        status: 'draft',
        clipsCount: 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });

      showToast('Projet créé ! 🎬', 'success');
      return row.id;
    },
    [user, store, showToast]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      const success = await db.deleteProject(projectId);
      if (success) {
        store.removeProject(projectId);
        showToast('Projet supprimé', 'info');
      } else {
        showToast('Erreur suppression', 'error');
      }
    },
    [store, showToast],
  );

  return {
    projects: store.projects,
    activeProjectId: store.activeProjectId,
    isLoading: store.isLoading,
    isSyncing: store.isSyncing,
    loadProjects,
    createProject,
    createProjectWithVideo,
    deleteProject,
    setActiveProject: store.setActiveProject,
  };
};

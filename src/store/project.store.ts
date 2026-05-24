/**
 * EmpireCut — Project Store (Zustand)
 *
 * Gère la liste des projets de l'utilisateur :
 * - chargement depuis Supabase
 * - projet actif
 * - état de sync
 */
import { create } from 'zustand';
import type { ProjectSummary } from '../types/project.types';

interface ProjectState {
  projects: ProjectSummary[];
  activeProjectId: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;

  // Actions
  setProjects: (projects: ProjectSummary[]) => void;
  addProject: (project: ProjectSummary) => void;
  updateProject: (id: string, updates: Partial<ProjectSummary>) => void;
  removeProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  markSynced: () => void;
  clearProjects: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProjectId: null,
  isLoading: false,
  isSyncing: false,
  lastSyncAt: null,

  setProjects: (projects) => set({ projects }),

  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects],
    })),

  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    })),

  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
    })),

  setActiveProject: (id) => set({ activeProjectId: id }),

  setLoading: (loading) => set({ isLoading: loading }),

  setSyncing: (syncing) => set({ isSyncing: syncing }),

  markSynced: () => set({ lastSyncAt: new Date().toISOString(), isSyncing: false }),

  clearProjects: () =>
    set({ projects: [], activeProjectId: null, lastSyncAt: null }),
}));

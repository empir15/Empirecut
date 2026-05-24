/**
 * EmpireCut — Supabase Database Service
 * Queries typées pour projects et clips
 */
import { supabase } from './client';
import type { ProjectRow, ClipRow, ProfileRow } from '../types/supabase.types';

// ========== PROFILES ==========

export const getProfile = async (
  userId: string,
): Promise<ProfileRow | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) { console.error('[DB] getProfile:', error.message); return null; }
  return data;
};

export const updateProfile = async (
  userId: string,
  updates: { username?: string; avatar_url?: string },
): Promise<boolean> => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) { console.error('[DB] updateProfile:', error.message); return false; }
  return true;
};

// ========== PROJECTS ==========

export const getProjects = async (
  userId: string,
): Promise<ProjectRow[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) { console.error('[DB] getProjects:', error.message); return []; }
  return data ?? [];
};

export const getProjectById = async (
  projectId: string,
): Promise<ProjectRow | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  if (error) { console.error('[DB] getProjectById:', error.message); return null; }
  return data;
};

export const createProject = async (
  payload: { user_id: string; title: string; duration?: number },
): Promise<ProjectRow | null> => {
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) { console.error('[DB] createProject:', error.message); return null; }
  return data;
};

export const updateProject = async (
  projectId: string,
  updates: {
    title?: string;
    thumbnail_url?: string;
    duration?: number;
    status?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<boolean> => {
  const { error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', projectId);
  if (error) { console.error('[DB] updateProject:', error.message); return false; }
  return true;
};

export const deleteProject = async (projectId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);
  if (error) { console.error('[DB] deleteProject:', error.message); return false; }
  return true;
};

// ========== CLIPS ==========

export const getClipsByProject = async (
  projectId: string,
): Promise<ClipRow[]> => {
  const { data, error } = await supabase
    .from('clips')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true });
  if (error) { console.error('[DB] getClipsByProject:', error.message); return []; }
  return data ?? [];
};

export const upsertClip = async (
  clip: {
    id?: string;
    project_id: string;
    storage_path: string;
    duration?: number;
    start_trim?: number;
    end_trim?: number;
    position?: number;
  },
): Promise<ClipRow | null> => {
  const { data, error } = await supabase
    .from('clips')
    .upsert(clip)
    .select()
    .single();
  if (error) { console.error('[DB] upsertClip:', error.message); return null; }
  return data;
};

export const deleteClip = async (clipId: string): Promise<boolean> => {
  const { error } = await supabase.from('clips').delete().eq('id', clipId);
  if (error) { console.error('[DB] deleteClip:', error.message); return false; }
  return true;
};

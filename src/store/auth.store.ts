/**
 * EmpireCut — Auth Store (Zustand)
 *
 * Gère l'état d'authentification global :
 * - session utilisateur
 * - profil
 * - état de chargement initial
 */
import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import type { ProfileRow } from '../types/supabase.types';

interface AuthState {
  // État
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  isAuthenticated: boolean;
  isInitializing: boolean;      // true pendant la vérification de session au démarrage

  // Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: ProfileRow | null) => void;
  setInitializing: (value: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  isAuthenticated: false,
  isInitializing: true,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: session !== null,
    }),

  setProfile: (profile) => set({ profile }),

  setInitializing: (value) => set({ isInitializing: value }),

  clearAuth: () =>
    set({
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
      isInitializing: false,
    }),
}));

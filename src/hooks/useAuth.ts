/**
 * EmpireCut — useAuth Hook
 *
 * Encapsule toute la logique d'authentification.
 * Utilisé dans les écrans Login/Register et partout où
 * on a besoin de l'état auth.
 */
import { useCallback, useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/ui.store';
import * as authService from '../supabase/auth';
import { getProfile } from '../supabase/database';

export const useAuth = () => {
  const store = useAuthStore();
  const { showToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      const result = await authService.signIn(email, password);
      setIsLoading(false);

      if (!result.success) {
        showToast(result.error ?? 'Connexion échouée', 'error');
        return result;
      }

      // Charger le profil
      if (result.user) {
        const profile = await getProfile(result.user.id);
        store.setProfile(profile);
      }

      showToast('Bienvenue ! 🎬', 'success');
      return result;
    },
    [store, showToast],
  );

  const register = useCallback(
    async (email: string, password: string, username: string) => {
      setIsLoading(true);
      const result = await authService.signUp(email, password, username);
      setIsLoading(false);

      if (!result.success) {
        showToast(result.error ?? 'Inscription échouée', 'error');
        return result;
      }

      showToast('Compte créé ! Bienvenue sur EmpireCut 🎬', 'success', 4000);
      return result;
    },
    [showToast],
  );

  const logout = useCallback(async () => {
    await authService.signOut();
    store.clearAuth();
    showToast('Déconnexion réussie', 'info');
  }, [store, showToast]);

  return {
    // State
    user: store.user,
    session: store.session,
    profile: store.profile,
    isAuthenticated: store.isAuthenticated,
    isInitializing: store.isInitializing,
    isLoading,

    // Actions
    login,
    register,
    logout,
  };
};

/**
 * EmpireCut — Supabase Auth Service
 * Encapsule toutes les opérations d'authentification
 */
import { supabase } from './client';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
}

/**
 * Inscription avec email / mot de passe
 * Crée aussi le profil utilisateur via trigger SQL (ou manuellement)
 */
export const signUp = async (
  email: string,
  password: string,
  username: string,
): Promise<AuthResult> => {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { username: username.trim() },
    },
  });

  if (error) return { success: false, error: error.message };

  // Crée le profil manuellement si pas de trigger DB
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      username: username.trim(),
    });
  }

  return { success: true, user: data.user ?? undefined, session: data.session ?? undefined };
};

/**
 * Connexion avec email / mot de passe
 */
export const signIn = async (
  email: string,
  password: string,
): Promise<AuthResult> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, user: data.user, session: data.session };
};

/**
 * Déconnexion
 */
export const signOut = async (): Promise<{ error?: string }> => {
  const { error } = await supabase.auth.signOut();
  return error ? { error: error.message } : {};
};

/**
 * Récupère la session courante (depuis AsyncStorage)
 */
export const getSession = async (): Promise<Session | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

/**
 * Récupère l'utilisateur courant
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

/**
 * Écoute les changements d'état d'auth (login / logout / refresh)
 */
export const onAuthStateChange = (
  callback: (session: Session | null) => void,
) => {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  // Retourne la fonction de cleanup pour useEffect
  return () => data.subscription.unsubscribe();
};

/**
 * Réinitialisation du mot de passe par email
 */
export const resetPassword = async (email: string): Promise<AuthResult> => {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
  );
  if (error) return { success: false, error: error.message };
  return { success: true };
};

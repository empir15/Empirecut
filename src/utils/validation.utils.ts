/**
 * EmpireCut — Validation Utilities
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Email
export const validateEmail = (email: string): ValidationResult => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim()) return { valid: false, error: 'Email requis' };
  if (!re.test(email)) return { valid: false, error: 'Email invalide' };
  return { valid: true };
};

// Mot de passe
export const validatePassword = (password: string): ValidationResult => {
  if (!password) return { valid: false, error: 'Mot de passe requis' };
  if (password.length < 8)
    return { valid: false, error: 'Minimum 8 caractères' };
  return { valid: true };
};

// Nom d'utilisateur
export const validateUsername = (username: string): ValidationResult => {
  const trimmed = username.trim();
  if (!trimmed) return { valid: false, error: 'Nom d\'utilisateur requis' };
  if (trimmed.length < 3)
    return { valid: false, error: 'Minimum 3 caractères' };
  if (trimmed.length > 30)
    return { valid: false, error: 'Maximum 30 caractères' };
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed))
    return { valid: false, error: 'Lettres, chiffres et _ uniquement' };
  return { valid: true };
};

// Titre de projet
export const validateProjectTitle = (title: string): ValidationResult => {
  const trimmed = title.trim();
  if (!trimmed) return { valid: false, error: 'Titre requis' };
  if (trimmed.length > 60)
    return { valid: false, error: 'Maximum 60 caractères' };
  return { valid: true };
};

// Overlay texte
export const validateTextOverlay = (text: string): ValidationResult => {
  if (!text.trim()) return { valid: false, error: 'Texte requis' };
  if (text.length > 100)
    return { valid: false, error: 'Maximum 100 caractères' };
  return { valid: true };
};

// Durée de trim
export const validateTrimRange = (
  start: number,
  end: number,
  totalDuration: number,
): ValidationResult => {
  if (start < 0) return { valid: false, error: 'Début invalide' };
  if (end > totalDuration) return { valid: false, error: 'Fin dépasse la durée' };
  if (end - start < 1) return { valid: false, error: 'Durée minimum : 1 seconde' };
  if (start >= end) return { valid: false, error: 'Début doit être avant la fin' };
  return { valid: true };
};

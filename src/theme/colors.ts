/**
 * EmpireCut — Color System
 * Palette sombre premium inspirée CapCut / TikTok Studio
 */
export const Colors = {
  // === Backgrounds ===
  background: {
    primary: '#0A0A0F',    // fond principal ultra-sombre
    secondary: '#12121A',  // fond cards / panels
    tertiary: '#1A1A26',   // fond inputs / surfaces
    elevated: '#1E1E2E',   // fond modals / sheets
    overlay: 'rgba(0,0,0,0.7)',
  },

  // === Accent — Violet / Bleu électrique ===
  accent: {
    primary: '#7C5CFC',    // violet principal
    secondary: '#5B8DEF',  // bleu secondaire
    gradient: ['#7C5CFC', '#5B8DEF'] as const,
    glow: 'rgba(124,92,252,0.3)',
    glowStrong: 'rgba(124,92,252,0.6)',
  },

  // === Texte ===
  text: {
    primary: '#FFFFFF',
    secondary: '#A8A8B8',
    muted: '#5A5A72',
    inverse: '#0A0A0F',
    accent: '#7C5CFC',
  },

  // === États ===
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // === Timeline ===
  timeline: {
    track: '#1E1E2E',
    clip: '#2D2D44',
    clipBorder: '#7C5CFC',
    handle: '#FFFFFF',
    cursor: '#7C5CFC',
    playhead: '#FF4D6A',
  },

  // === Bordures / Séparateurs ===
  border: {
    default: '#2A2A3E',
    subtle: '#1E1E2E',
    accent: '#7C5CFC',
    focus: '#5B8DEF',
  },

  // === Glassmorphism ===
  glass: {
    background: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.1)',
    strong: 'rgba(255,255,255,0.08)',
  },

  // === Tab Bar ===
  tabBar: {
    background: '#0E0E1A',
    active: '#7C5CFC',
    inactive: '#4A4A62',
    border: '#1E1E2E',
  },

  // === Transparents utilitaires ===
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorKey = keyof typeof Colors;

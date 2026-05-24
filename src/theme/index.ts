/**
 * EmpireCut — Theme Index
 * Point d'entrée unique pour le système de design
 */
export { Colors } from './colors';
export { Typography, FontFamily, FontSize, LineHeight, LetterSpacing } from './typography';
export { Spacing, BorderRadius, Shadow, IconSize } from './spacing';

import { Colors } from './colors';
import { Spacing, BorderRadius } from './spacing';

/**
 * Styles réutilisables communs (layout helpers)
 */
export const Layout = {
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  rowBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  center: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  flex1: { flex: 1 },
  absoluteFill: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
  },
};

/**
 * Styles de surface glass (glassmorphism)
 */
export const GlassStyle = {
  light: {
    backgroundColor: Colors.glass.background,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderRadius: BorderRadius.lg,
  },
  strong: {
    backgroundColor: Colors.glass.strong,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderRadius: BorderRadius.lg,
  },
};

/**
 * Styles communs de container
 */
export const Container = {
  screen: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  padded: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing[8],
  },
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[8],
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
};

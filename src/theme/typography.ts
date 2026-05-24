/**
 * EmpireCut — Typography System
 */
import { StyleSheet } from 'react-native';

export const FontFamily = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
  // Remplacer par une police custom une fois les assets installés
  // ex: 'Inter-Regular', 'Inter-Bold', etc.
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const;

export const Typography = StyleSheet.create({
  // Headings
  h1: {
    fontSize: FontSize['4xl'],
    fontWeight: '700',
    letterSpacing: LetterSpacing.tight,
  },
  h2: {
    fontSize: FontSize['3xl'],
    fontWeight: '700',
    letterSpacing: LetterSpacing.tight,
  },
  h3: {
    fontSize: FontSize['2xl'],
    fontWeight: '600',
  },
  h4: {
    fontSize: FontSize.xl,
    fontWeight: '600',
  },
  // Body
  bodyLg: {
    fontSize: FontSize.md,
    fontWeight: '400',
  },
  body: {
    fontSize: FontSize.base,
    fontWeight: '400',
  },
  bodySm: {
    fontSize: FontSize.sm,
    fontWeight: '400',
  },
  // Special
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: FontSize.xs,
    fontWeight: '400',
  },
  button: {
    fontSize: FontSize.base,
    fontWeight: '600',
    letterSpacing: LetterSpacing.wide,
  },
  buttonLg: {
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: LetterSpacing.wide,
  },
  // Timeline
  timeCode: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: LetterSpacing.wider,
  },
});

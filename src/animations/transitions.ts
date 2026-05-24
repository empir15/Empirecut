/**
 * EmpireCut — Animations — Transition Presets
 *
 * Configurations d'animation réutilisables pour Reanimated.
 * Utilisées dans les composants et les transitions de navigation.
 */
import { Easing } from 'react-native-reanimated';

// Durées standard
export const DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  xslow: 800,
} as const;

// Easing presets
export const EASE = {
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
  bouncy: Easing.bezier(0.34, 1.56, 0.64, 1),
  decelerate: Easing.out(Easing.cubic),
  accelerate: Easing.in(Easing.cubic),
  sharp: Easing.bezier(0.4, 0, 0.2, 1),
} as const;

// Spring presets pour Reanimated
export const SPRING = {
  gentle: {
    damping: 15,
    stiffness: 100,
    mass: 1,
  },
  bouncy: {
    damping: 8,
    stiffness: 180,
    mass: 0.8,
  },
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  },
  wobbly: {
    damping: 6,
    stiffness: 120,
    mass: 1,
  },
} as const;

/**
 * EmpireCut — Shared Animated Styles
 *
 * Helpers pour les animations fréquentes (fade, slide, scale).
 * Utilisables avec useAnimatedStyle de Reanimated.
 */
import {
  withTiming,
  withSpring,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { DURATION, EASE, SPRING } from './transitions';

/**
 * Crée une valeur animée de timing
 */
export const animateTiming = (
  toValue: number,
  duration: number = DURATION.normal,
) => {
  'worklet';
  return withTiming(toValue, { duration, easing: EASE.smooth });
};

/**
 * Crée une valeur animée spring
 */
export const animateSpring = (
  toValue: number,
  config = SPRING.gentle,
) => {
  'worklet';
  return withSpring(toValue, config);
};

/**
 * Interpole une opacité basée sur un progress 0→1
 */
export const fadeInterpolate = (
  progress: SharedValue<number>,
  outputRange: [number, number] = [0, 1],
) => {
  'worklet';
  return interpolate(progress.value, [0, 1], outputRange);
};

/**
 * Interpole un translateY basée sur un progress 0→1
 */
export const slideUpInterpolate = (
  progress: SharedValue<number>,
  distance: number = 30,
) => {
  'worklet';
  return interpolate(progress.value, [0, 1], [distance, 0]);
};

/**
 * Interpole un scale basée sur un progress 0→1
 */
export const scaleInterpolate = (
  progress: SharedValue<number>,
  from: number = 0.9,
  to: number = 1,
) => {
  'worklet';
  return interpolate(progress.value, [0, 1], [from, to]);
};

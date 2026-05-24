/**
 * EmpireCut — Time Utilities
 */

/**
 * Formate des secondes en MM:SS
 * ex: 65 → "01:05"
 */
export const formatSeconds = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Formate des secondes en MM:SS.ms (pour timecode précis)
 * ex: 65.4 → "01:05.4"
 */
export const formatTimecode = (seconds: number): string => {
  const s = Math.max(0, seconds);
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
};

/**
 * Formate des millisecondes en MM:SS
 */
export const formatMs = (ms: number): string => {
  return formatSeconds(ms / 1000);
};

/**
 * Convertit secondes en millisecondes
 */
export const secToMs = (sec: number): number => Math.round(sec * 1000);

/**
 * Convertit millisecondes en secondes
 */
export const msToSec = (ms: number): number => ms / 1000;

/**
 * Calcule la position X en pixels pour un temps donné dans la timeline
 */
export const timeToPixel = (
  seconds: number,
  pixelsPerSecond: number,
): number => seconds * pixelsPerSecond;

/**
 * Calcule le temps en secondes pour une position X donnée
 */
export const pixelToTime = (
  pixels: number,
  pixelsPerSecond: number,
): number => pixels / pixelsPerSecond;

/**
 * Clamp une valeur entre min et max
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Calcule la durée totale d'une liste de clips (somme des durées trimmées)
 */
export const calcTotalDuration = (
  clips: Array<{ trimStart: number; trimEnd: number }>,
): number =>
  clips.reduce((acc, clip) => acc + (clip.trimEnd - clip.trimStart), 0);

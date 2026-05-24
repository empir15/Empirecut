/**
 * EmpireCut — FFmpeg Command Constants
 * Répertorie tous les presets et flags FFmpeg utilisés dans l'app
 */

// Codec vidéo
export const VIDEO_CODEC = {
  H264: 'libopenh264',
  H265: 'libx265',
  COPY: 'copy',
} as const;

// Codec audio
export const AUDIO_CODEC = {
  AAC: 'aac',
  MP3: 'libmp3lame',
  COPY: 'copy',
} as const;

// Presets de vitesse d'encodage (rapport qualité/temps)
export const ENCODE_PRESET = {
  ULTRA_FAST: 'ultrafast',  // le plus rapide, moins bonne qualité
  SUPER_FAST: 'superfast',
  VERY_FAST: 'veryfast',
  FASTER: 'faster',
  FAST: 'fast',
  MEDIUM: 'medium',         // défaut — bon compromis
  SLOW: 'slow',             // meilleure qualité, plus lent
} as const;

// CRF (Constant Rate Factor) — qualité visuelle
// 0=lossless, 23=défaut H264, 51=pire qualité
export const CRF = {
  LOSSLESS: 0,
  HIGH: 18,
  MEDIUM: 23,
  LOW: 28,
  POOR: 35,
} as const;

// Résolutions
export const RESOLUTION = {
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
} as const;

// Commandes FFmpeg de base (builders dans ffmpeg.service.ts)
export const FFMPEG_FLAGS = {
  OVERWRITE: '-y',                           // overwrite sans confirmation
  NO_VIDEO: '-vn',                           // supprimer piste vidéo
  NO_AUDIO: '-an',                           // supprimer piste audio
  SHORTEST: '-shortest',                     // durée = track la plus courte
  COPY_ALL: '-c copy',                       // copy streams sans réencodage
  FAST_START: '-movflags +faststart',        // optimise MP4 pour streaming
  PIXEL_FORMAT: '-pix_fmt yuv420p',          // compatibilité max (iOS/Android)
  THREADS: '-threads 0',                     // utilise tous les cœurs CPU
} as const;

// Timeout FFmpeg (ms) avant d'annuler une session
export const FFMPEG_TIMEOUT = {
  TRIM: 60_000,         // 1 minute
  EXPORT: 300_000,      // 5 minutes
  THUMBNAIL: 10_000,    // 10 secondes
  MERGE: 180_000,       // 3 minutes
} as const;

// Dossiers de travail FFmpeg (paths relatifs à DocumentDirectory)
export const FFMPEG_DIRS = {
  TEMP: 'ffmpeg_temp',
  OUTPUT: 'ffmpeg_output',
  THUMBNAILS: 'thumbnails',
} as const;

/**
 * EmpireCut — App Constants
 */
export const APP_NAME = 'EmpireCut';
export const APP_VERSION = '1.0.0';

// Vidéo
export const VIDEO_CONFIG = {
  MAX_DURATION_SECONDS: 300,        // 5 minutes max
  MAX_FILE_SIZE_MB: 500,
  THUMBNAIL_WIDTH: 80,
  THUMBNAIL_HEIGHT: 60,
  THUMBNAIL_COUNT: 20,              // nb thumbnails dans la timeline
  DEFAULT_EXPORT_QUALITY: 'medium', // low | medium | high
  SUPPORTED_FORMATS: ['mp4', 'mov', 'mkv', 'avi'],
} as const;

// Export
export const EXPORT_CONFIG = {
  OUTPUT_FORMAT: 'mp4',
  DEFAULT_BITRATE: '2000k',         // 2 Mbps — bon compromis qualité/taille
  HIGH_BITRATE: '4000k',
  LOW_BITRATE: '800k',
  DEFAULT_RESOLUTION: '720p',       // '480p' | '720p' | '1080p'
  FRAME_RATE: 30,
  AUDIO_BITRATE: '128k',
  AUDIO_SAMPLE_RATE: 44100,
} as const;

// Timeline
export const TIMELINE_CONFIG = {
  TRACK_HEIGHT: 64,
  HANDLE_WIDTH: 16,
  MIN_CLIP_DURATION: 1,             // 1 seconde minimum
  PIXELS_PER_SECOND: 50,            // zoom par défaut
  MIN_PIXELS_PER_SECOND: 20,
  MAX_PIXELS_PER_SECOND: 150,
} as const;

// Supabase Storage
export const STORAGE_BUCKETS = {
  VIDEOS: 'videos',
  THUMBNAILS: 'thumbnails',
  EXPORTS: 'exports',
} as const;

// Routes
export const ROUTES = {
  SPLASH: 'Splash',
  LOGIN: 'Login',
  REGISTER: 'Register',
  HOME: 'Home',
  IMPORT: 'Import',
  EDITOR: 'Editor',
  EXPORT: 'Export',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
} as const;

// Timeouts & Delays (ms)
export const TIMING = {
  SPLASH_DURATION: 2000,
  DEBOUNCE_SHORT: 150,
  DEBOUNCE_NORMAL: 300,
  ANIMATION_FAST: 200,
  ANIMATION_NORMAL: 350,
  ANIMATION_SLOW: 500,
  TOAST_DURATION: 3000,
} as const;

// Taille des assets
export const ASSET_LIMITS = {
  AVATAR_MAX_MB: 5,
  MUSIC_MAX_MB: 20,
  TEXT_MAX_CHARS: 100,
} as const;

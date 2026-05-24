/**
 * EmpireCut — File Utilities
 */
import { Platform } from 'react-native';

/**
 * Extrait l'extension d'un nom de fichier
 * ex: "video.mp4" → "mp4"
 */
export const getExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() ?? '';
};

/**
 * Extrait le nom de fichier sans extension
 * ex: "/storage/emulated/0/DCIM/video.mp4" → "video"
 */
export const getBasename = (filepath: string): string => {
  const filename = filepath.split('/').pop() ?? filepath;
  return filename.replace(/\.[^.]+$/, '');
};

/**
 * Génère un nom de fichier unique basé sur un timestamp
 */
export const generateFilename = (prefix: string, ext: string): string => {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10000);
  return `${prefix}_${ts}_${rand}.${ext}`;
};

/**
 * Convertit octets en Mo
 */
export const bytesToMB = (bytes: number): number =>
  parseFloat((bytes / (1024 * 1024)).toFixed(2));

/**
 * Convertit Mo en octets
 */
export const mbToBytes = (mb: number): number => mb * 1024 * 1024;

/**
 * Normalise un URI fichier selon la plateforme
 * Android : ajoute "file://" si manquant
 * iOS : retire "file://" si présent (react-native-video le gère)
 */
export const normalizeUri = (uri: string): string => {
  if (Platform.OS === 'android') {
    if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
      return `file://${uri}`;
    }
    return uri;
  }
  return uri;
};

/**
 * Vérifie si un URI est un fichier local (pas une URL HTTP)
 */
export const isLocalFile = (uri: string): boolean => {
  return uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('/');
};

/**
 * Formats de vidéo supportés
 */
const SUPPORTED_VIDEO_EXTENSIONS = ['mp4', 'mov', 'mkv', 'avi', 'm4v'];

export const isVideoFile = (filename: string): boolean => {
  return SUPPORTED_VIDEO_EXTENSIONS.includes(getExtension(filename));
};

/**
 * Formate une taille de fichier lisiblement
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

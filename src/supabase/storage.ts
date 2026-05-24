/**
 * EmpireCut — Supabase Storage Service
 *
 * Gère l'upload et la récupération d'URLs pour :
 * - Clips vidéo originaux   → bucket "videos"      (privé)
 * - Vignettes extraites     → bucket "thumbnails"   (public)
 * - Fichiers exportés       → bucket "exports"      (privé)
 */
import RNFS from 'react-native-fs';
import { supabase } from './client';

// =========================================================
// Constantes de buckets
// =========================================================

const BUCKET_VIDEOS = 'videos';
const BUCKET_THUMBNAILS = 'thumbnails';
const BUCKET_EXPORTS = 'exports';

// =========================================================
// Helpers internes
// =========================================================

/**
 * Convertit une chaîne base64 en bytes uploadables par Supabase Storage.
 */
const base64ToBytes = (base64: string): Uint8Array => {
  const atobFn = (globalThis as unknown as { atob?: (value: string) => string }).atob;
  if (!atobFn) {
    throw new Error('Base64 decoder is not available in this runtime');
  }

  const binary = atobFn(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
};

/**
 * Lit un fichier local (file://, content:// ou chemin absolu) et retourne
 * un body stable pour Supabase Storage. fetch(file://) est fragile sur RN,
 * donc RNFS reste le chemin principal pour les médias locaux.
 */
const readFileForUpload = async (uri: string): Promise<Uint8Array | Blob> => {
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    const response = await fetch(uri);
    return response.blob();
  }

  const localPath = uri.startsWith('file://') ? uri.replace('file://', '') : uri;

  try {
    const base64 = await RNFS.readFile(localPath, 'base64');
    return base64ToBytes(base64);
  } catch {
    // Fallback utile pour certains content:// Android pris en charge par fetch.
    const normalizedUri = uri.startsWith('/') ? `file://${uri}` : uri;
    const response = await fetch(normalizedUri);
    return response.blob();
  }
};

/** Extrait le nom de fichier depuis une URI locale. */
const filenameFromUri = (uri: string): string => {
  const parts = uri.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] ?? 'file';
};

// =========================================================
// Upload
// =========================================================

/**
 * Uploade un clip vidéo local vers le bucket "videos".
 * @returns le storage_path enregistrable en DB, ou null en cas d'erreur.
 */
export const uploadVideo = async (
  localUri: string,
  userId: string,
  projectId: string,
): Promise<string | null> => {
  try {
    const filename = filenameFromUri(localUri);
    const storagePath = `${userId}/${projectId}/${filename}`;

    const fileBody = await readFileForUpload(localUri);

    const { error } = await supabase.storage
      .from(BUCKET_VIDEOS)
      .upload(storagePath, fileBody, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (error) {
      console.error('[Storage] uploadVideo error:', error.message);
      return null;
    }

    return storagePath;
  } catch (err) {
    console.error('[Storage] uploadVideo exception:', err);
    return null;
  }
};

/**
 * Uploade un fichier exporté vers le bucket "exports".
 * @returns le storage_path, ou null.
 */
export const uploadExport = async (
  localUri: string,
  userId: string,
  projectId: string,
): Promise<string | null> => {
  try {
    const timestamp = Date.now();
    const storagePath = `${userId}/${projectId}/export_${timestamp}.mp4`;

    const fileBody = await readFileForUpload(localUri);

    const { error } = await supabase.storage
      .from(BUCKET_EXPORTS)
      .upload(storagePath, fileBody, {
        contentType: 'video/mp4',
        upsert: false,
      });

    if (error) {
      console.error('[Storage] uploadExport error:', error.message);
      return null;
    }

    return storagePath;
  } catch (err) {
    console.error('[Storage] uploadExport exception:', err);
    return null;
  }
};

/**
 * Uploade une vignette JPEG vers le bucket "thumbnails" (public).
 * @returns l'URL publique directement accessible, ou null.
 */
export const uploadThumbnail = async (
  localUri: string,
  userId: string,
  projectId: string,
): Promise<string | null> => {
  try {
    const storagePath = `${userId}/${projectId}/thumb.jpg`;

    const fileBody = await readFileForUpload(localUri);

    const { error } = await supabase.storage
      .from(BUCKET_THUMBNAILS)
      .upload(storagePath, fileBody, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('[Storage] uploadThumbnail error:', error.message);
      return null;
    }

    return getPublicUrl(BUCKET_THUMBNAILS, storagePath);
  } catch (err) {
    console.error('[Storage] uploadThumbnail exception:', err);
    return null;
  }
};

// =========================================================
// URLs
// =========================================================

/**
 * Retourne l'URL publique d'un fichier dans un bucket public.
 */
export const getPublicUrl = (bucket: string, storagePath: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
};

/**
 * Retourne une URL signée temporaire (60 min) pour un fichier privé.
 */
export const getSignedUrl = async (
  bucket: string,
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    console.error('[Storage] getSignedUrl error:', error.message);
    return null;
  }

  return data.signedUrl;
};

/**
 * Supprime un fichier d'un bucket.
 */
export const deleteFile = async (
  bucket: string,
  storagePath: string,
): Promise<boolean> => {
  const { error } = await supabase.storage.from(bucket).remove([storagePath]);
  if (error) {
    console.error('[Storage] deleteFile error:', error.message);
    return false;
  }
  return true;
};

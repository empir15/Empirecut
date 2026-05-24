/**
 * EmpireCut — Cloud Cache Service
 *
 * Gère le téléchargement et la mise en cache locale des clips stockés sur Supabase Storage.
 * Cela évite de télécharger le même fichier à chaque ouverture de projet.
 */
import RNFS from 'react-native-fs';
import { getSignedUrl } from './storage';

const CACHE_DIR = `${RNFS.CachesDirectoryPath}/clips`;

/**
 * Assure qu'un clip stocké à distance est disponible localement dans le cache.
 * @param projectId ID du projet
 * @param clipId ID du clip
 * @param storagePath Chemin relatif dans le bucket 'videos'
 * @returns Le chemin d'accès local (file://...) du clip mis en cache, ou le storagePath original si erreur
 */
export const ensureClipCached = async (
  projectId: string,
  clipId: string,
  storagePath: string,
): Promise<string> => {
  // Si le fichier est déjà local (ex: commence par content:// ou file:// ou /data/...)
  if (
    storagePath.startsWith('content://') ||
    storagePath.startsWith('file://') ||
    storagePath.startsWith('/')
  ) {
    return storagePath;
  }

  const projectCacheDir = `${CACHE_DIR}/${projectId}`;
  const localFileName = storagePath.split('/').pop() ?? `${clipId}.mp4`;
  const localPath = `${projectCacheDir}/${localFileName}`;

  try {
    // 1. Vérifier si le répertoire de cache existe, sinon le créer
    const dirExists = await RNFS.exists(projectCacheDir);
    if (!dirExists) {
      await RNFS.mkdir(projectCacheDir);
    }

    // 2. Vérifier si le fichier est déjà présent dans le cache
    const fileExists = await RNFS.exists(localPath);
    if (fileExists) {
      console.log(`[Cache] Cache hit for clip ${clipId}: ${localPath}`);
      return `file://${localPath}`;
    }

    // 3. Sinon, récupérer une URL signée temporaire de Supabase
    console.log(`[Cache] Cache miss for clip ${clipId}. Fetching signed URL...`);
    const signedUrl = await getSignedUrl('videos', storagePath);
    if (!signedUrl) {
      throw new Error('Failed to generate signed URL');
    }

    // 4. Télécharger le fichier
    console.log(`[Cache] Downloading clip ${clipId} from ${signedUrl} to ${localPath}...`);
    const downloadResult = await RNFS.downloadFile({
      fromUrl: signedUrl,
      toFile: localPath,
      background: true,
      discretionary: true,
    }).promise;

    if (downloadResult.statusCode >= 400) {
      throw new Error(`Download failed with status code ${downloadResult.statusCode}`);
    }

    console.log(`[Cache] Successfully cached clip ${clipId} to ${localPath}`);
    return `file://${localPath}`;
  } catch (error) {
    console.error(`[Cache] Error caching clip ${clipId}:`, error);
    // En cas d'échec du cache, on retourne le chemin Supabase brut (il échouera au player, mais prévient le crash de chargement)
    return storagePath;
  }
};

/**
 * Nettoie le cache local associé à un projet spécifique.
 */
export const clearProjectCache = async (projectId: string): Promise<void> => {
  const projectCacheDir = `${CACHE_DIR}/${projectId}`;
  try {
    const exists = await RNFS.exists(projectCacheDir);
    if (exists) {
      await RNFS.unlink(projectCacheDir);
      console.log(`[Cache] Cleared cache for project ${projectId}`);
    }
  } catch (error) {
    console.error(`[Cache] Error clearing cache for project ${projectId}:`, error);
  }
};

/**
 * Nettoie l'intégralité du cache de clips.
 */
export const clearAllCache = async (): Promise<void> => {
  try {
    const exists = await RNFS.exists(CACHE_DIR);
    if (exists) {
      await RNFS.unlink(CACHE_DIR);
      console.log('[Cache] Cleared all clip caches');
    }
  } catch (error) {
    console.error('[Cache] Error clearing all caches:', error);
  }
};

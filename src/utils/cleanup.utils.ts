/**
 * EmpireCut — Cleanup Utilities
 * Gestion de la purge du cache et des fichiers temporaires FFmpeg
 */
import RNFS from 'react-native-fs';

/**
 * Dossiers connus pour contenir des fichiers temporaires
 */
const TEMP_FOLDERS = [
  'ffmpeg_inputs',     // Fichiers texte pour concat FFmpeg
  'thumbnails',        // Vignettes générées pour la timeline
  'previews',          // Rendu temporaires pour le player
  'exports_tmp',       // Exports intermédiaires
];

/**
 * Supprime les fichiers temporaires accumulés
 * @param force - Si true, supprime tout. Si false, garde les vignettes récentes.
 */
export const cleanupTempFiles = async (force = false): Promise<{ success: boolean; filesRemoved: number }> => {
  let count = 0;
  try {
    const cachePath = RNFS.CachesDirectoryPath;

    for (const folder of TEMP_FOLDERS) {
      const folderPath = `${cachePath}/${folder}`;
      const exists = await RNFS.exists(folderPath);

      if (exists) {
        if (force || folder !== 'thumbnails') {
          // Suppression complète du dossier
          await RNFS.unlink(folderPath);
          await RNFS.mkdir(folderPath);
          count++;
        } else {
          // Nettoyage intelligent des vignettes (plus de 2 jours)
          const files = await RNFS.readDir(folderPath);
          const now = Date.now();
          const MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000; // 2 jours

          for (const file of files) {
            const mtime = file.mtime?.getTime() || 0;
            if (file.isFile() && (mtime > 0) && (now - mtime > MAX_AGE_MS)) {
              await RNFS.unlink(file.path);
              count++;
            }
          }
        }
      } else {
        // S'assurer que le dossier existe pour le futur
        await RNFS.mkdir(folderPath);
      }
    }

    // Nettoyage des fichiers isolés dans le répertoire cache racine
    const rootFiles = await RNFS.readDir(cachePath);
    for (const file of rootFiles) {
      if (file.isFile() && (
        file.name.includes('ffmpeg') || 
        file.name.startsWith('trimmed_') || 
        file.name.endsWith('.tmp')
      )) {
        await RNFS.unlink(file.path);
        count++;
      }
    }

    if (__DEV__) {
      console.log(`[Cleanup] Nettoyage terminé. ${count} fichiers/dossiers traités.`);
    }

    return { success: true, filesRemoved: count };
  } catch (error) {
    console.error('[Cleanup] Erreur lors du nettoyage:', error);
    return { success: false, filesRemoved: count };
  }
};

/**
 * Supprime un fichier spécifique du cache
 */
export const removeCachedFile = async (filePath: string): Promise<boolean> => {
  try {
    const exists = await RNFS.exists(filePath);
    if (exists) {
      await RNFS.unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.warn(`[Cleanup] Impossible de supprimer ${filePath}:`, error);
    return false;
  }
};

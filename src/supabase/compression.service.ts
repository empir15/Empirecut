/**
 * EmpireCut — Compression Service
 *
 * Compresse les vidéos importées de la galerie avant l'upload pour économiser :
 * - Le stockage Supabase
 * - Le forfait data mobile de l'utilisateur
 * - Le temps d'upload
 */
import RNFS from 'react-native-fs';
import { ffmpegService } from '../ffmpeg/ffmpeg.service';
import { buildCompressCommand } from '../ffmpeg/commands';

/**
 * Compresse une vidéo locale avant son upload.
 * Si le fichier d'origine est déjà petit (par ex. < 15 Mo), on ne le compresse pas.
 * @param localUri URI locale du fichier vidéo (file://...)
 * @returns Le chemin d'accès local du fichier compressé (ou l'original si ignoré/erreur) et son statut
 */
export const compressVideoIfNeeded = async (
  localUri: string,
): Promise<{ uri: string; compressed: boolean; originalSizeMb: number; newSizeMb: number }> => {
  const cleanPath = localUri.replace('file://', '');

  try {
    // 1. Obtenir la taille d'origine du fichier
    const fileStat = await RNFS.stat(cleanPath);
    const sizeBytes = typeof fileStat.size === 'string' ? parseInt(fileStat.size, 10) : fileStat.size;
    const originalSizeMb = sizeBytes / (1024 * 1024);

    // Seuil de compression : si la vidéo fait moins de 15 Mo, on évite le traitement pour la rapidité
    if (originalSizeMb < 15) {
      console.log(`[Compression] File is small (${originalSizeMb.toFixed(2)} MB). Skipping compression.`);
      return { uri: localUri, compressed: false, originalSizeMb, newSizeMb: originalSizeMb };
    }

    console.log(`[Compression] Compressing large video (${originalSizeMb.toFixed(2)} MB)...`);

    // 2. Définir le chemin de sortie temporaire
    const tempDir = RNFS.TemporaryDirectoryPath;
    const filename = cleanPath.split('/').pop() ?? `import_${Date.now()}.mp4`;
    const outputPath = `${tempDir}/compressed_${Date.now()}_${filename}`;

    // 3. Construire et exécuter la commande de compression FFmpeg (720p, bitrate moyen)
    const command = buildCompressCommand({
      inputPath: cleanPath,
      outputPath: outputPath,
      quality: 'medium',
      resolution: '720p',
    });

    const result = await ffmpegService.execute(command);
    if (!result.success) {
      throw new Error(result.error ?? 'FFmpeg execution failed');
    }

    // 4. Calculer la taille du fichier compressé
    const newFileStat = await RNFS.stat(outputPath);
    const newSizeBytes = typeof newFileStat.size === 'string' ? parseInt(newFileStat.size, 10) : newFileStat.size;
    const newSizeMb = newSizeBytes / (1024 * 1024);

    console.log(
      `[Compression] Success! Size reduced from ${originalSizeMb.toFixed(2)} MB to ${newSizeMb.toFixed(2)} MB (${Math.round(
        (1 - newSizeMb / originalSizeMb) * 100,
      )}% reduction)`,
    );

    return {
      uri: `file://${outputPath}`,
      compressed: true,
      originalSizeMb,
      newSizeMb,
    };
  } catch (error) {
    console.warn('[Compression] Compression skipped after error:', error);
    // Retourner la vidéo d'origine en cas d'erreur
    return { uri: localUri, compressed: false, originalSizeMb: 0, newSizeMb: 0 };
  }
};

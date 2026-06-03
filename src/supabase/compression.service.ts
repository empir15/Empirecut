/**
 * EmpireCut — Compression Service (Optimisé)
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
 * Seuil de compression (Mo)
 */
const COMPRESSION_THRESHOLD_MB = 15;

/**
 * Compresse une vidéo locale avant son upload.
 * Si le fichier d'origine est déjà petit, on ne le compresse pas.
 * Si l'espace disque est critique, on augmente la compression.
 * 
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

    // 2. Vérifier l'espace disque disponible
    const diskInfo = await RNFS.getFSInfo();
    const freeSpaceMb = diskInfo.freeSpace / (1024 * 1024);

    // 3. Stratégie de compression adaptative
    let shouldCompress = originalSizeMb > COMPRESSION_THRESHOLD_MB;
    let targetQuality: 'low' | 'medium' | 'high' = 'medium';

    // Si l'espace disque est inférieur à 500 Mo, on compresse systématiquement et fortement
    if (freeSpaceMb < 500) {
      shouldCompress = true;
      targetQuality = 'low';
      console.log(`[Compression] Disk space is low (${freeSpaceMb.toFixed(0)} MB). Forcing high compression.`);
    }

    if (!shouldCompress) {
      console.log(`[Compression] Skipping. Size: ${originalSizeMb.toFixed(1)} MB, Free: ${freeSpaceMb.toFixed(0)} MB`);
      return { uri: localUri, compressed: false, originalSizeMb, newSizeMb: originalSizeMb };
    }

    console.log(`[Compression] Starting (${targetQuality})... Original: ${originalSizeMb.toFixed(1)} MB`);

    // 4. Définir le chemin de sortie temporaire
    const tempDir = RNFS.CachesDirectoryPath; // Utiliser le Cache pour les fichiers temporaires
    const filename = cleanPath.split('/').pop() ?? `import_${Date.now()}.mp4`;
    const outputPath = `${tempDir}/compressed_${Date.now()}_${filename}`;

    // 5. Construire et exécuter la commande
    const command = buildCompressCommand({
      inputPath: cleanPath,
      outputPath: outputPath,
      quality: targetQuality,
      resolution: '720p',
    });

    const result = await ffmpegService.execute(command);
    if (!result.success) {
      throw new Error(result.error ?? 'FFmpeg execution failed');
    }

    // 6. Calculer la taille finale
    const newFileStat = await RNFS.stat(outputPath);
    const newSizeBytes = typeof newFileStat.size === 'string' ? parseInt(newFileStat.size, 10) : newFileStat.size;
    const newSizeMb = newSizeBytes / (1024 * 1024);

    return {
      uri: `file://${outputPath}`,
      compressed: true,
      originalSizeMb,
      newSizeMb,
    };
  } catch (error) {
    console.warn('[Compression] Skipped after error:', error);
    return { uri: localUri, compressed: false, originalSizeMb: 0, newSizeMb: 0 };
  }
};

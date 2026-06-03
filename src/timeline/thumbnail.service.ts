/**
 * EmpireCut — Thumbnail Service
 *
 * Génère des thumbnails pour la timeline à partir de vidéos.
 * Utilise FFmpeg pour extraire des frames à intervalles réguliers.
 */
import { ffmpegService } from '../ffmpeg/ffmpeg.service';
import { buildThumbnailCommand } from '../ffmpeg/commands';
import { VIDEO_CONFIG } from '../constants/app.constants';
import { FFMPEG_DIRS } from '../constants/ffmpeg.constants';
import type { Thumbnail } from '../types/video.types';
import RNFS from 'react-native-fs';

class ThumbnailService {
  private cache = new Map<string, Thumbnail[]>();

  /**
   * Génère des thumbnails pour un clip
   * @param videoUri - chemin local de la vidéo
   * @param durationSec - durée totale de la vidéo en secondes
   * @param count - nombre de thumbnails à générer
   */
  async generateThumbnails(
    videoUri: string,
    durationSec: number,
    count: number = VIDEO_CONFIG.THUMBNAIL_COUNT,
  ): Promise<Thumbnail[]> {
    // 1. Vérification du cache en mémoire
    const cacheKey = `${videoUri}_${count}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.length > 0) {
      // Vérifier si au moins le premier fichier existe encore sur le disque
      const exists = await RNFS.exists(cached[0].uri);
      if (exists) return cached;
      // Sinon, on invalide le cache car les fichiers ont été purgés
      this.cache.delete(cacheKey);
    }

    // 2. Créer le dossier de sortie dans le CACHE
    const outputDir = `${RNFS.CachesDirectoryPath}/${FFMPEG_DIRS.THUMBNAILS}/${Date.now()}`;
    await RNFS.mkdir(outputDir);

    const command = buildThumbnailCommand({
      inputPath: videoUri,
      outputDir,
      count,
      durationSec,
      width: VIDEO_CONFIG.THUMBNAIL_WIDTH,
      height: VIDEO_CONFIG.THUMBNAIL_HEIGHT,
    });

    const result = await ffmpegService.execute(command);

    if (!result.success) {
      console.error('[ThumbnailService] Failed to generate thumbnails:', result.error);
      return [];
    }

    // 3. Construire la liste de thumbnails
    const interval = durationSec / count;
    const thumbnails: Thumbnail[] = Array.from({ length: count }, (_, i) => ({
      uri: `${outputDir}/thumb_${String(i + 1).padStart(3, '0')}.jpg`,
      timeSeconds: i * interval,
      width: VIDEO_CONFIG.THUMBNAIL_WIDTH,
      height: VIDEO_CONFIG.THUMBNAIL_HEIGHT,
    }));

    // 4. Mettre en cache
    this.cache.set(cacheKey, thumbnails);

    return thumbnails;
  }

  /**
   * Vide le cache de thumbnails
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Supprime les thumbnails d'un clip du cache
   */
  evict(videoUri: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(videoUri)) {
        this.cache.delete(key);
      }
    }
  }
}

export const thumbnailService = new ThumbnailService();
export default thumbnailService;

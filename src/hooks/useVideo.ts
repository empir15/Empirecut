/**
 * EmpireCut — useVideo Hook
 *
 * Gère l'import et les métadonnées vidéo.
 * Sera enrichi en Phase 3 avec react-native-image-picker.
 */
import { useCallback, useState } from 'react';
import { useUIStore } from '../store/ui.store';
import type { VideoMetadata } from '../types/video.types';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';

const sanitizeFilename = (filename: string): string =>
  filename.replace(/[^a-zA-Z0-9._-]/g, '_');

const ensureFFmpegReadableUri = async (
  uri: string,
  filename: string,
): Promise<string> => {
  if (!uri.startsWith('content://')) {
    return uri;
  }

  const importDir = `${RNFS.CachesDirectoryPath}/imports`;
  await RNFS.mkdir(importDir);

  const safeFilename = sanitizeFilename(filename || `import_${Date.now()}.mp4`);
  const outputPath = `${importDir}/${Date.now()}_${safeFilename}`;

  await RNFS.copyFile(uri, outputPath);
  return `file://${outputPath}`;
};

export const useVideo = () => {
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { showToast } = useUIStore();

  /**
   * Ouvre le picker vidéo natif
   */
  const importFromGallery = useCallback(async (): Promise<VideoMetadata | null> => {
    setIsImporting(true);

    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
        quality: 1,
        selectionLimit: 1,
        videoQuality: 'high',
      });

      if (result.didCancel || !result.assets?.[0]) {
        setIsImporting(false);
        return null;
      }

      const asset = result.assets[0];
      const filename = asset.fileName ?? 'video.mp4';
      const readableUri = await ensureFFmpegReadableUri(asset.uri ?? '', filename);
      const metadata: VideoMetadata = {
        uri: readableUri,
        filename,
        format: (filename.split('.').pop() ?? 'mp4') as any,
        durationMs: (asset.duration ?? 0) * 1000,
        durationSec: asset.duration ?? 0,
        width: asset.width ?? 0,
        height: asset.height ?? 0,
        fileSizeMB: (asset.fileSize ?? 0) / (1024 * 1024),
        hasAudio: true,
      };

      setSelectedVideo(metadata);
      setIsImporting(false);
      return metadata;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur import';
      showToast(msg, 'error');
      setIsImporting(false);
      return null;
    }
  }, [showToast]);

  const clearVideo = useCallback(() => {
    setSelectedVideo(null);
  }, []);

  return {
    selectedVideo,
    isImporting,
    importFromGallery,
    clearVideo,
  };
};

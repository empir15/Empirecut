/**
 * EmpireCut — Editor Engine
 *
 * Moteur principal de l'éditeur vidéo.
 * Orchestre les opérations de montage :
 * - trim, merge, addAudio via FFmpeg commands
 * - gestion des fichiers temporaires
 * - coordination avec le store editor
 *
 * Séparé du store Zustand pour garder la logique métier
 * découplée de l'état UI.
 */
import { ffmpegService } from '../ffmpeg/ffmpeg.service';
import {
  buildTrimCommand,
  buildMergeCommand,
  buildAddAudioCommand,
  buildExportCommand,
} from '../ffmpeg/commands';
import { generateFilename } from '../utils/file.utils';
import { FFMPEG_DIRS } from '../constants/ffmpeg.constants';
import type { FFmpegResult, FFmpegProgress, ExportParams } from '../ffmpeg/types';
import type { TrimRange, ExportSettings } from '../types/video.types';

// Platform-specific document directory (sera résolu avec react-native-fs)
const getOutputDir = (): string => {
  // Phase 3: RNFS.DocumentDirectoryPath + '/' + FFMPEG_DIRS.OUTPUT
  return FFMPEG_DIRS.OUTPUT;
};

const getTempDir = (): string => {
  // Phase 3: RNFS.DocumentDirectoryPath + '/' + FFMPEG_DIRS.TEMP
  return FFMPEG_DIRS.TEMP;
};

class EditorEngine {
  /**
   * Découpe une vidéo (trim)
   */
  async trimVideo(
    inputPath: string,
    range: TrimRange,
    reEncode: boolean = false,
    onProgress?: (p: FFmpegProgress) => void,
  ): Promise<FFmpegResult> {
    const outputPath = `${getOutputDir()}/${generateFilename('trim', 'mp4')}`;
    const command = buildTrimCommand({
      inputPath,
      outputPath,
      startSec: range.start,
      endSec: range.end,
      reEncode,
    });

    const durationMs = (range.end - range.start) * 1000;
    const result = await ffmpegService.execute(command, onProgress, durationMs);
    return { ...result, outputPath };
  }

  /**
   * Fusionne plusieurs vidéos
   * Nécessite de créer un fichier concat temporaire
   */
  async mergeVideos(
    inputPaths: string[],
    onProgress?: (p: FFmpegProgress) => void,
  ): Promise<FFmpegResult> {
    if (inputPaths.length === 0) {
      return {
        success: false,
        outputPath: '',
        durationMs: 0,
        returnCode: -1,
        error: 'No input files provided',
      };
    }

    if (inputPaths.length === 1) {
      // Pas besoin de merge, retourner le fichier tel quel
      return {
        success: true,
        outputPath: inputPaths[0],
        durationMs: 0,
        returnCode: 0,
      };
    }

    // Phase 3: Écrire le fichier concat avec RNFS
    // const concatContent = inputPaths.map(p => `file '${p}'`).join('\n');
    // const concatPath = `${getTempDir()}/concat.txt`;
    // await RNFS.writeFile(concatPath, concatContent, 'utf8');

    const concatPath = `${getTempDir()}/concat.txt`;
    const outputPath = `${getOutputDir()}/${generateFilename('merge', 'mp4')}`;
    const command = buildMergeCommand(concatPath, outputPath);

    const result = await ffmpegService.execute(command, onProgress);
    return { ...result, outputPath };
  }

  /**
   * Ajoute une piste audio de fond
   */
  async addBackgroundAudio(
    videoPath: string,
    audioPath: string,
    audioVolume: number = 0.3,
    onProgress?: (p: FFmpegProgress) => void,
  ): Promise<FFmpegResult> {
    const outputPath = `${getOutputDir()}/${generateFilename('audio', 'mp4')}`;
    const command = buildAddAudioCommand({
      videoPath,
      audioPath,
      outputPath,
      videoVolume: 1.0,
      audioVolume,
    });

    const result = await ffmpegService.execute(command, onProgress);
    return { ...result, outputPath };
  }

  /**
   * Export final — combinaison de toutes les opérations
   */
  async exportVideo(
    inputPath: string,
    settings: ExportSettings,
    trimRange?: TrimRange,
    audioPath?: string,
    audioVolume?: number,
    onProgress?: (p: FFmpegProgress) => void,
  ): Promise<FFmpegResult> {
    const outputPath = `${getOutputDir()}/${generateFilename('export', 'mp4')}`;

    const exportParams: ExportParams = {
      inputPath,
      outputPath,
      trimStart: trimRange?.start,
      trimEnd: trimRange?.end,
      audioPath,
      audioVolume,
      quality: settings.quality,
      resolution: settings.resolution,
      frameRate: settings.frameRate,
    };

    const command = buildExportCommand(exportParams);
    const result = await ffmpegService.execute(command, onProgress);
    return { ...result, outputPath };
  }

  /**
   * Annule l'opération en cours
   */
  async cancelOperation(): Promise<void> {
    await ffmpegService.cancel();
  }

  /**
   * Nettoyage des fichiers temporaires
   */
  async cleanTempFiles(): Promise<void> {
    // Phase 3: await RNFS.unlink(getTempDir()).catch(() => {});
    if (__DEV__) {
      console.log('[EditorEngine] Temp files cleaned');
    }
  }
}

export const editorEngine = new EditorEngine();
export default editorEngine;

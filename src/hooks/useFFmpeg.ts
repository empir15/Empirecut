/**
 * EmpireCut — useFFmpeg Hook
 *
 * Interface React pour les opérations FFmpeg.
 * Gère la progression et l'annulation.
 */
import { useState, useCallback, useRef } from 'react';
import { editorEngine } from '../editor/editor.engine';
import { useUIStore } from '../store/ui.store';
import type { FFmpegResult, FFmpegProgress } from '../ffmpeg/types';
import type { TrimRange, ExportSettings } from '../types/video.types';

export const useFFmpeg = () => {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const isCancelled = useRef(false);
  const { showToast, setGlobalLoading } = useUIStore();

  const handleProgress = useCallback((p: FFmpegProgress) => {
    setProgress(Math.round(p.percentage));
  }, []);

  const trim = useCallback(
    async (
      inputPath: string,
      range: TrimRange,
      reEncode: boolean = false,
    ): Promise<FFmpegResult> => {
      setIsProcessing(true);
      setProgress(0);
      isCancelled.current = false;

      const result = await editorEngine.trimVideo(
        inputPath,
        range,
        reEncode,
        handleProgress,
      );

      setIsProcessing(false);
      setProgress(result.success ? 100 : 0);

      if (result.success) {
        showToast('Vidéo découpée ✂️', 'success');
      } else {
        showToast(result.error ?? 'Erreur de découpe', 'error');
      }
      return result;
    },
    [handleProgress, showToast],
  );

  const exportVideo = useCallback(
    async (
      inputPath: string,
      settings: ExportSettings,
      trimRange?: TrimRange,
      audioPath?: string,
      audioVolume?: number,
    ): Promise<FFmpegResult> => {
      setIsProcessing(true);
      setProgress(0);
      setGlobalLoading(true, 'Export en cours...');
      isCancelled.current = false;

      const result = await editorEngine.exportVideo(
        inputPath,
        settings,
        trimRange,
        audioPath,
        audioVolume,
        handleProgress,
      );

      setIsProcessing(false);
      setGlobalLoading(false);
      setProgress(result.success ? 100 : 0);

      if (result.success) {
        showToast('Export terminé ! 🎉', 'success', 5000);
      } else {
        showToast(result.error ?? 'Erreur d\'export', 'error');
      }
      return result;
    },
    [handleProgress, showToast, setGlobalLoading],
  );

  const cancel = useCallback(async () => {
    isCancelled.current = true;
    await editorEngine.cancelOperation();
    setIsProcessing(false);
    setProgress(0);
    setGlobalLoading(false);
    showToast('Opération annulée', 'warning');
  }, [showToast, setGlobalLoading]);

  return {
    progress,
    isProcessing,
    trim,
    exportVideo,
    cancel,
  };
};

import type { FFmpegResult, FFmpegProgress } from './types';
import {
  FFmpegKit,
  ReturnCode,
  FFprobeKit,
  type FFmpegSession,
  type Statistics,
} from '@chadify/ffmpeg-kit-react-native';

type ProgressCallback = (progress: FFmpegProgress) => void;

// En cas d'échec, l'erreur utile est au DÉBUT des logs (après la config de build).
// On cherche la ligne commençant par "Error" ou "Invalid" dans les 3000 premiers chars.
const extractUsefulError = (logs: string, maxLength = 1200): string => {
  const clean = logs.trim();

  // Chercher la première ligne d'erreur significative
  const lines = clean.split('\n');
  const errorLine = lines.find(
    (l) =>
      l.includes('Error') ||
      l.includes('Invalid') ||
      l.includes('No such file') ||
      l.includes('Permission denied') ||
      l.includes('moov atom not found') ||
      l.includes('codec not found'),
  );

  if (errorLine) {
    return errorLine.trim();
  }

  // Fallback : retourner la fin des logs
  return clean.length <= maxLength
    ? clean
    : clean.slice(clean.length - maxLength);
};

class FFmpegService {
  private activeSessionId: number | null = null;

  /**
   * Exécute une commande FFmpeg
   * @param command - La commande FFmpeg complète (sans le binaire 'ffmpeg')
   * @param onProgress - Callback optionnel pour le suivi de progression
   * @param totalDurationMs - Durée totale attendue en ms (pour calculer le %)
   */
  async execute(
    command: string,
    onProgress?: ProgressCallback,
    totalDurationMs?: number,
  ): Promise<FFmpegResult> {
    const startTime = Date.now();

    if (__DEV__) {
      console.log('[FFmpeg] ▶ Executing:', command);
    }

    try {
      const statisticsCallback =
        onProgress && totalDurationMs
          ? (stats: Statistics) => {
              const sessionId = stats.getSessionId();
              this.activeSessionId = sessionId;
              const time = stats.getTime(); // temps traité en ms
              const percentage = Math.min(100, (time / totalDurationMs) * 100);

              onProgress({
                sessionId,
                time,
                percentage: Math.round(percentage),
              });
            }
          : undefined;

      // 2. Exécuter la commande
      const session = await new Promise<FFmpegSession>((resolve, reject) => {
        FFmpegKit.executeAsync(
          command,
          (completedSession) => resolve(completedSession),
          undefined,
          statisticsCallback,
        )
          .then((createdSession) => {
            this.activeSessionId = createdSession.getSessionId();
          })
          .catch(reject);
      });

      const returnCode = await session.getReturnCode();
      const logs = await session.getLogsAsString();

      const success = ReturnCode.isSuccess(returnCode);
      this.activeSessionId = null;
      const logTail = extractUsefulError(logs);
      const failureMessage = logTail
        ? `FFmpeg failed with return code ${returnCode.getValue()}: ${logTail}`
        : `FFmpeg failed with return code ${returnCode.getValue()}`;

      return {
        success,
        outputPath: '', // sera extrait ou géré par l'appelant
        durationMs: Date.now() - startTime,
        returnCode: returnCode.getValue(),
        error: success ? undefined : failureMessage,
        logs: __DEV__ ? logs : undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown FFmpeg error';

      if (__DEV__) {
        console.error('[FFmpeg] ❌ Error:', errorMessage);
      }

      this.activeSessionId = null;

      return {
        success: false,
        outputPath: '',
        durationMs: Date.now() - startTime,
        returnCode: -1,
        error: errorMessage,
      };
    }
  }

  /**
   * Annule la session FFmpeg active
   */
  async cancel(): Promise<void> {
    if (this.activeSessionId !== null) {
      await FFmpegKit.cancel(this.activeSessionId);
      if (__DEV__) {
        console.log('[FFmpeg] ⛔ Cancelled session:', this.activeSessionId);
      }
      this.activeSessionId = null;
    }
  }

  /**
   * Vérifie si une session est en cours
   */
  isRunning(): boolean {
    return this.activeSessionId !== null;
  }

  /**
   * Récupère les informations d'un fichier média
   */
  async getMediaInfo(filePath: string): Promise<Record<string, any> | null> {
    try {
      const session = await FFprobeKit.getMediaInformation(filePath);
      const mediaInfo = await session.getMediaInformation();
      if (mediaInfo) {
        return mediaInfo.getAllProperties();
      }
      return null;
    } catch (error) {
      console.error('[FFmpeg] getMediaInfo error:', error);
      return null;
    }
  }
}

// Singleton — une seule instance dans toute l'app
export const ffmpegService = new FFmpegService();
export default ffmpegService;

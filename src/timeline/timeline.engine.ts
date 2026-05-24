/**
 * EmpireCut — Timeline Engine
 *
 * Logique métier de la timeline vidéo :
 * - calcul des positions
 * - zoom / scroll
 * - conversion pixel ↔ temps
 * - gestion du curseur de lecture
 */
import { TIMELINE_CONFIG } from '../constants/app.constants';
import { clamp, timeToPixel, pixelToTime } from '../utils/time.utils';
import type { Clip } from '../types/video.types';

export interface TimelineLayout {
  totalWidth: number;           // largeur totale en pixels
  totalDuration: number;        // durée totale en secondes
  pixelsPerSecond: number;      // zoom actuel
  clips: ClipLayout[];
}

export interface ClipLayout {
  clipId: string;
  x: number;                    // position X du clip dans la timeline
  width: number;                // largeur en pixels
  startSec: number;
  endSec: number;
  durationSec: number;
}

class TimelineEngine {
  private pixelsPerSecond: number = TIMELINE_CONFIG.PIXELS_PER_SECOND;

  /**
   * Calcule le layout complet de la timeline à partir des clips
   */
  computeLayout(clips: Clip[]): TimelineLayout {
    let currentX = 0;
    const clipLayouts: ClipLayout[] = [];

    for (const clip of clips) {
      const durationSec = clip.trimEnd - clip.trimStart;
      const width = timeToPixel(durationSec, this.pixelsPerSecond);

      clipLayouts.push({
        clipId: clip.id,
        x: currentX,
        width,
        startSec: clip.trimStart,
        endSec: clip.trimEnd,
        durationSec,
      });

      currentX += width;
    }

    const totalDuration = clips.reduce(
      (acc, c) => acc + (c.trimEnd - c.trimStart),
      0,
    );

    return {
      totalWidth: currentX,
      totalDuration,
      pixelsPerSecond: this.pixelsPerSecond,
      clips: clipLayouts,
    };
  }

  /**
   * Convertit une position pixel en temps (secondes)
   */
  pixelToTime(px: number): number {
    return pixelToTime(px, this.pixelsPerSecond);
  }

  /**
   * Convertit un temps en position pixel
   */
  timeToPixel(seconds: number): number {
    return timeToPixel(seconds, this.pixelsPerSecond);
  }

  /**
   * Change le niveau de zoom
   * @param delta - changement relatif (ex: +10 pour zoomer, -10 pour dézoomer)
   */
  zoom(delta: number): number {
    this.pixelsPerSecond = clamp(
      this.pixelsPerSecond + delta,
      TIMELINE_CONFIG.MIN_PIXELS_PER_SECOND,
      TIMELINE_CONFIG.MAX_PIXELS_PER_SECOND,
    );
    return this.pixelsPerSecond;
  }

  /**
   * Définit le zoom absolu
   */
  setZoom(pps: number): void {
    this.pixelsPerSecond = clamp(
      pps,
      TIMELINE_CONFIG.MIN_PIXELS_PER_SECOND,
      TIMELINE_CONFIG.MAX_PIXELS_PER_SECOND,
    );
  }

  /**
   * Retourne le zoom actuel
   */
  getZoom(): number {
    return this.pixelsPerSecond;
  }

  /**
   * Trouve le clip à une position pixel donnée
   */
  findClipAtPixel(px: number, clips: Clip[]): string | null {
    const layout = this.computeLayout(clips);
    for (const cl of layout.clips) {
      if (px >= cl.x && px <= cl.x + cl.width) {
        return cl.clipId;
      }
    }
    return null;
  }

  /**
   * Calcule la position du curseur (playhead) en pixels
   * @param currentTimeSec - position actuelle de la lecture en secondes
   */
  getPlayheadPosition(currentTimeSec: number): number {
    return this.timeToPixel(currentTimeSec);
  }

  /**
   * Calcule le offset de scroll pour centrer le playhead
   * @param currentTimeSec - position actuelle en secondes
   * @param viewportWidth - largeur visible de la timeline
   */
  getScrollOffset(currentTimeSec: number, viewportWidth: number): number {
    const playheadX = this.getPlayheadPosition(currentTimeSec);
    return Math.max(0, playheadX - viewportWidth / 2);
  }

  /**
   * Reset le zoom par défaut
   */
  resetZoom(): void {
    this.pixelsPerSecond = TIMELINE_CONFIG.PIXELS_PER_SECOND;
  }
}

export const timelineEngine = new TimelineEngine();
export default timelineEngine;

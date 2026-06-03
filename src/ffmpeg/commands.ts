/**
 * EmpireCut — FFmpeg Command Builders
 *
 * Construit les chaînes de commandes FFmpeg.
 * Chaque fonction retourne une string[] (arguments).
 * Le service ffmpeg.service.ts exécute ces commandes via FFmpegKit.
 *
 * Pourquoi séparer builders et exécution :
 * - testabilité (on peut tester les commandes sans FFmpegKit)
 * - lisibilité (each command is documented)
 * - maintenabilité (ajouter une opération = ajouter un builder)
 */
import { Platform } from 'react-native';
import {
  VIDEO_CODEC,
  AUDIO_CODEC,
  RESOLUTION,
  FFMPEG_FLAGS,
} from '../constants/ffmpeg.constants';
import { EXPORT_CONFIG } from '../constants/app.constants';
import type {
  TrimParams,
  AddAudioParams,
  CompressParams,
  ThumbnailParams,
  ExportParams,
} from './types';
import type { TransitionType } from '../types/editor.types';

const toFFmpegPath = (path: string): string =>
  path.startsWith('file://') ? decodeURI(path.replace('file://', '')) : path;

const q = (path: string): string => `"${toFFmpegPath(path).replace(/"/g, '\\"')}"`;

// Bitrates pour h264_mediacodec (encodeur matériel Android)
const VIDEO_BITRATE = {
  low: '1.5M',     // fichier léger
  medium: '3.0M',  // bon compromis
  high: '6.0M',    // haute qualité
} as const;

const videoEncodeArgs = (quality: 'low' | 'medium' | 'high'): string[] => [
  `-c:v ${VIDEO_CODEC.H264}`,   // h264_mediacodec = encodeur matériel
  `-b:v ${VIDEO_BITRATE[quality]}`,
];

/**
 * Trim vidéo (découper une portion)
 */
export const buildTrimCommand = (params: TrimParams): string => {
  const { inputPath, outputPath, startSec, endSec, reEncode = false } = params;
  const duration = endSec - startSec;

  if (reEncode) {
    return [
      FFMPEG_FLAGS.OVERWRITE,
      `-ss ${startSec}`,
      `-i ${q(inputPath)}`,
      `-t ${duration}`,
      ...videoEncodeArgs('medium'),
      `-c:a ${AUDIO_CODEC.AAC}`,
      `-b:a ${EXPORT_CONFIG.AUDIO_BITRATE}`,
      FFMPEG_FLAGS.PIXEL_FORMAT,
      FFMPEG_FLAGS.FAST_START,
      FFMPEG_FLAGS.THREADS,
      q(outputPath),
    ].join(' ');
  }

  return [
    FFMPEG_FLAGS.OVERWRITE,
    `-ss ${startSec}`,
    `-i ${q(inputPath)}`,
    `-t ${duration}`,
    `-c copy`,
    FFMPEG_FLAGS.FAST_START,
    q(outputPath),
  ].join(' ');
};

/**
 * Merge plusieurs vidéos (concaténation)
 */
export const buildMergeCommand = (
  concatFilePath: string,
  outputPath: string,
): string => {
  return [
    FFMPEG_FLAGS.OVERWRITE,
    `-f concat`,
    `-safe 0`,
    `-i ${q(concatFilePath)}`,
    `-c copy`,
    FFMPEG_FLAGS.FAST_START,
    q(outputPath),
  ].join(' ');
};

/**
 * Ajouter une piste audio à une vidéo
 */
export const buildAddAudioCommand = (params: AddAudioParams): string => {
  const {
    videoPath,
    audioPath,
    outputPath,
    videoVolume = 1.0,
    audioVolume = 0.3,
  } = params;

  return [
    FFMPEG_FLAGS.OVERWRITE,
    `-i ${q(videoPath)}`,
    `-i ${q(audioPath)}`,
    `-filter_complex "[0:a]volume=${videoVolume}[a0];[1:a]volume=${audioVolume}[a1];[a0][a1]amix=inputs=2:duration=first[aout]"`,
    `-map 0:v`,
    `-map "[aout]"`,
    `-c:v copy`,
    `-c:a ${AUDIO_CODEC.AAC}`,
    `-b:a ${EXPORT_CONFIG.AUDIO_BITRATE}`,
    FFMPEG_FLAGS.SHORTEST,
    FFMPEG_FLAGS.FAST_START,
    q(outputPath),
  ].join(' ');
};

/**
 * Compression vidéo
 */
export const buildCompressCommand = (params: CompressParams): string => {
  const { inputPath, outputPath, quality, resolution } = params;
  const res = resolution ? RESOLUTION[resolution] : null;

  const cmd = [
    FFMPEG_FLAGS.OVERWRITE,
    `-i ${q(inputPath)}`,
    ...videoEncodeArgs(quality),
  ];

  if (res) {
    cmd.push(`-vf "scale=${res.width}:${res.height}:force_original_aspect_ratio=decrease,pad=${res.width}:${res.height}:(ow-iw)/2:(oh-ih)/2"`);
  }

  cmd.push(
    `-c:a ${AUDIO_CODEC.AAC}`,
    `-b:a ${EXPORT_CONFIG.AUDIO_BITRATE}`,
    FFMPEG_FLAGS.PIXEL_FORMAT,
    FFMPEG_FLAGS.FAST_START,
    FFMPEG_FLAGS.THREADS,
    q(outputPath),
  );

  return cmd.join(' ');
};

/**
 * Extraction de thumbnails
 */
export const buildThumbnailCommand = (params: ThumbnailParams): string => {
  const { inputPath, outputDir, count, durationSec, width = 80, height = 60 } = params;
  const fps = count / Math.max(durationSec, 1);

  return [
    FFMPEG_FLAGS.OVERWRITE,
    `-i ${q(inputPath)}`,
    `-vf "fps=${fps.toFixed(4)},scale=${width}:${height}:force_original_aspect_ratio=decrease"`,
    `-frames:v ${count}`,
    `-q:v 5`,
    q(`${outputDir}/thumb_%03d.jpg`),
  ].join(' ');
};

/**
 * Transition entre deux vidéos (xfade)
 */
export const buildXFadeCommand = (params: {
  input1: string;
  input2: string;
  outputPath: string;
  transition: TransitionType;
  duration1: number;
  transitionDuration: number;
  resolution: { width: number; height: number };
}): string => {
  const { input1, input2, outputPath, transition, duration1, transitionDuration, resolution } = params;
  const offset = Math.max(0, duration1 - transitionDuration);
  
  const xfadeMapping: Record<string, string> = {
    fade: 'fade',
    wipeleft: 'wipeleft',
    wiperight: 'wiperight',
    slideup: 'slideup',
  };

  const effect = xfadeMapping[transition as string] || 'fade';

  return [
    FFMPEG_FLAGS.OVERWRITE,
    `-i ${q(input1)}`,
    `-i ${q(input2)}`,
    `-filter_complex [0:v][1:v]xfade=transition=${effect}:duration=${transitionDuration}:offset=${offset},format=yuv420p[v];[0:a][1:a]acrossfade=d=${transitionDuration}[a]`,
    `-map [v]`,
    `-map [a]`,
    ...videoEncodeArgs('medium'),
    `-c:a ${AUDIO_CODEC.AAC}`,
    q(outputPath),
  ].join(' ');
};

/**
 * Export final complet (trim + audio + qualité + résolution + filtres + texte)
 */
export const buildExportCommand = (params: ExportParams): string => {
  const {
    inputPath,
    outputPath,
    trimStart,
    trimEnd,
    audioPath,
    audioVolume = 0.3,
    hasAudio = true,
    quality,
    resolution,
    frameRate,
    textOverlays,
    filter,
  } = params;

  const res = RESOLUTION[resolution];
  const cmd: string[] = [FFMPEG_FLAGS.OVERWRITE];

  if (trimStart !== undefined) {
    cmd.push(`-ss ${trimStart}`);
  }
  cmd.push(`-i ${q(inputPath)}`);
  if (trimEnd !== undefined && trimStart !== undefined) {
    cmd.push(`-t ${trimEnd - trimStart}`);
  }

  if (audioPath) {
    cmd.push(`-i ${q(audioPath)}`);
  }

  const filterParts: string[] = [];
  let currentVideoLabel = '[0:v]';

  // 1. Appliquer le filtre si présent
  if (filter && filter !== 'none') {
    let filterCmd = '';
    switch (filter) {
      case 'chrome': filterCmd = 'colorlevels=rimax=0.9:gimax=0.9:bimax=0.9'; break;
      case 'noir': filterCmd = 'format=gray,colorlevels=rimax=0.8:gimax=0.8:bimax=0.8'; break;
      case 'sepia': filterCmd = 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131'; break;
      case 'vintage': filterCmd = 'curves=preset=vintage,noise=alls=10:allf=t+u'; break;
      case 'vivid': filterCmd = 'curves=preset=vivid,eq=saturation=1.2'; break;
    }
    if (filterCmd) {
      filterParts.push(`${currentVideoLabel}${filterCmd}[v_filtered]`);
      currentVideoLabel = '[v_filtered]';
    }
  }

  // 2. Scale et Pad
  filterParts.push(`${currentVideoLabel}scale=${res.width}:${res.height}:force_original_aspect_ratio=decrease,pad=${res.width}:${res.height}:(ow-iw)/2:(oh-ih)/2[v_scaled]`);
  currentVideoLabel = '[v_scaled]';

  // 3. Overlays de texte
  if (textOverlays && textOverlays.length > 0) {
    textOverlays.forEach((ov, index) => {
      const nextLabel = `[v_txt${index}]`;
      const textEscaped = ov.text.replace(/'/g, "\\\\'").replace(/:/g, "\\:");
      const fontsize = ov.style?.fontSize ?? 24;
      const fontcolor = ov.style?.color ?? 'white';
      const x = `(w*${ov.positionX} - text_w/2)`;
      const y = `(h*${ov.positionY} - text_h/2)`;
      const enable = `between(t,${ov.start},${ov.end})`;

      const fontPath = Platform.OS === 'android' ? '/system/fonts/Roboto-Regular.ttf' : 'Arial';
      const fontParam = Platform.OS === 'android' ? `fontfile='${fontPath}'` : `font='${fontPath}'`;

      filterParts.push(
        `${currentVideoLabel}drawtext=text='${textEscaped}':fontcolor=${fontcolor}:fontsize=${fontsize}:x=${x}:y=${y}:enable='${enable}':${fontParam}${nextLabel}`
      );
      currentVideoLabel = nextLabel;
    });
  }

  const finalVideoLabel = currentVideoLabel;
  let hasAudioFilter = false;

  if (audioPath) {
    if (hasAudio) {
      filterParts.push(`[0:a]volume=1.0[a0];[1:a]volume=${audioVolume}[a1];[a0][a1]amix=inputs=2:duration=first[a_out]`);
    } else {
      filterParts.push(`[1:a]volume=${audioVolume}[a_out]`);
    }
    hasAudioFilter = true;
  }

  if (filterParts.length > 0) {
    // Si on a du texte (avec espaces possible), on met des guillemets, sinon on évite pour la compatibilité
    const needsQuotes = textOverlays && textOverlays.length > 0;
    const filterStr = filterParts.join(';');
    cmd.push(`-filter_complex ${needsQuotes ? `"${filterStr}"` : filterStr}`);
    cmd.push(`-map ${finalVideoLabel}`);
  } else {
    cmd.push(`-map 0:v`);
  }

  if (hasAudioFilter) {
    cmd.push(`-map [a_out]`);
  } else {
    cmd.push(`-map 0:a?`);
  }

  cmd.push(
    ...videoEncodeArgs(quality),
    `-r ${frameRate}`,
    `-c:a ${AUDIO_CODEC.AAC}`,
    `-b:a ${EXPORT_CONFIG.AUDIO_BITRATE}`,
    FFMPEG_FLAGS.PIXEL_FORMAT,
    FFMPEG_FLAGS.FAST_START,
    FFMPEG_FLAGS.THREADS,
    q(outputPath),
  );

  return cmd.join(' ');
};

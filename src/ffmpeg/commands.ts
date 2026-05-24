/**
 * EmpireCut — FFmpeg Command Builders
 *
 * Construit les chaînes de commandes FFmpeg.
 * Chaque fonction retourne une string[] (arguments).
 * Le service ffmpeg.service.ts exécute ces commandes via FFmpegKit.
 *
 * Pourquoi séparer builders et exécution :
 * - testabilité (on peut tester les commandes sans FFmpegKit)
 * - lisibilité (chaque commande est documentée)
 * - maintenabilité (ajouter une opération = ajouter un builder)
 */
import {
  VIDEO_CODEC,
  AUDIO_CODEC,
  RESOLUTION,
  FFMPEG_FLAGS,
} from '../constants/ffmpeg.constants';
import { EXPORT_CONFIG } from '../constants/app.constants';
import type {
  TrimParams,
  MergeParams,
  AddAudioParams,
  CompressParams,
  ThumbnailParams,
  ExportParams,
} from './types';

const toFFmpegPath = (path: string): string =>
  path.startsWith('file://') ? decodeURI(path.replace('file://', '')) : path;

const q = (path: string): string => `"${toFFmpegPath(path).replace(/"/g, '\\"')}"`;

const VIDEO_BITRATE = {
  low: '900k',
  medium: '1800k',
  high: '3500k',
} as const;

const videoEncodeArgs = (quality: 'low' | 'medium' | 'high'): string[] => [
  `-c:v ${VIDEO_CODEC.H264}`,
  `-b:v ${VIDEO_BITRATE[quality]}`,
];

/**
 * Trim vidéo (découper une portion)
 *
 * Mode copy (reEncode=false) : ultra rapide, mais la coupe peut être imprécise
 * car FFmpeg ne peut couper qu'aux keyframes.
 *
 * Mode réencode (reEncode=true) : plus lent, mais coupe au frame exact.
 * Recommandé pour les trims finaux avant export.
 */
export const buildTrimCommand = (params: TrimParams): string => {
  const { inputPath, outputPath, startSec, endSec, reEncode = false } = params;
  const duration = endSec - startSec;

  if (reEncode) {
    return [
      FFMPEG_FLAGS.OVERWRITE,
      `-i ${q(inputPath)}`,
      `-ss ${startSec}`,
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

  // Mode copy — rapide, sans réencodage
  return [
    FFMPEG_FLAGS.OVERWRITE,
    `-ss ${startSec}`,        // -ss AVANT -i = seek rapide
    `-i ${q(inputPath)}`,
    `-t ${duration}`,
    `-c copy`,
    FFMPEG_FLAGS.FAST_START,
    q(outputPath),
  ].join(' ');
};

/**
 * Merge plusieurs vidéos (concaténation)
 * Utilise le demuxer concat avec un fichier de liste.
 * Note : le fichier de liste doit être créé avant l'appel.
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
 * Mix audio original + musique de fond
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
 * Extraction de thumbnails (images pour la timeline)
 * Génère N images réparties uniformément sur la durée de la vidéo
 */
export const buildThumbnailCommand = (params: ThumbnailParams): string => {
  const { inputPath, outputDir, count, width = 80, height = 60 } = params;

  return [
    FFMPEG_FLAGS.OVERWRITE,
    `-i ${q(inputPath)}`,
    `-vf "fps=1,scale=${width}:${height}:force_original_aspect_ratio=decrease"`,
    `-frames:v ${count}`,
    `-q:v 5`,                 // qualité JPEG (1=meilleure, 31=pire, 5=bon compromis)
    q(`${outputDir}/thumb_%03d.jpg`),
  ].join(' ');
};

/**
 * Export final complet (trim + audio + qualité + résolution)
 */
export const buildExportCommand = (params: ExportParams): string => {
  const {
    inputPath,
    outputPath,
    trimStart,
    trimEnd,
    audioPath,
    audioVolume = 0.3,
    quality,
    resolution,
    frameRate,
  } = params;

  const res = RESOLUTION[resolution];

  const cmd: string[] = [FFMPEG_FLAGS.OVERWRITE];

  // Trim
  if (trimStart !== undefined) {
    cmd.push(`-ss ${trimStart}`);
  }
  cmd.push(`-i ${q(inputPath)}`);
  if (trimEnd !== undefined && trimStart !== undefined) {
    cmd.push(`-t ${trimEnd - trimStart}`);
  }

  // Audio externe
  if (audioPath) {
    cmd.push(`-i ${q(audioPath)}`);
    cmd.push(
      `-filter_complex "[0:a]volume=1.0[a0];[1:a]volume=${audioVolume}[a1];[a0][a1]amix=inputs=2:duration=first[aout]"`,
      `-map 0:v`,
      `-map "[aout]"`,
    );
  }

  // Video codec + qualité
  cmd.push(
    ...videoEncodeArgs(quality),
    `-r ${frameRate}`,
    `-vf "scale=${res.width}:${res.height}:force_original_aspect_ratio=decrease,pad=${res.width}:${res.height}:(ow-iw)/2:(oh-ih)/2"`,
  );

  // Audio codec
  if (!audioPath) {
    cmd.push(`-c:a ${AUDIO_CODEC.AAC}`, `-b:a ${EXPORT_CONFIG.AUDIO_BITRATE}`);
  } else {
    cmd.push(`-c:a ${AUDIO_CODEC.AAC}`, `-b:a ${EXPORT_CONFIG.AUDIO_BITRATE}`);
  }

  cmd.push(
    FFMPEG_FLAGS.PIXEL_FORMAT,
    FFMPEG_FLAGS.FAST_START,
    FFMPEG_FLAGS.THREADS,
    q(outputPath),
  );

  return cmd.join(' ');
};

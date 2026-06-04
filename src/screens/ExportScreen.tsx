/**
 * EmpireCut — Export Screen
 *
 * Gère l'export final de la vidéo :
 * - Sélection des paramètres (Résolution, Débit/Qualité, Taux d'images)
 * - Orchestre le pipeline FFmpeg (Trim individuel des clips + demux concat)
 * - Indicateur de progression premium étape par étape
 * - Prévisualisation de la vidéo exportée
 * - Sauvegarde dans le dossier de téléchargement public et partage natif
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../theme';
import type { ExportScreenProps, RootStackParamList } from '../navigation/types';
import { useEditorStore } from '../store/editor.store';
import { useUIStore } from '../store/ui.store';
import { ffmpegService } from '../ffmpeg/ffmpeg.service';
import {
  buildExportCommand,
  buildMergeCommand,
  buildXFadeCommand,
} from '../ffmpeg/commands';
import { RESOLUTION } from '../constants/ffmpeg.constants';
import { formatSeconds } from '../utils/time.utils';
import { cleanupTempFiles } from '../utils/cleanup.utils';
import type { ExportQuality, ExportResolution } from '../types/video.types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Export'>;

const sanitizeFilename = (filename: string): string =>
  filename.replace(/[^a-zA-Z0-9._-]/g, '_');

const prepareFFmpegInput = async (uri: string, fallbackFilename: string): Promise<string> => {
  if (!uri.startsWith('content://')) {
    return uri;
  }

  const tempDir = `${RNFS.CachesDirectoryPath}/ffmpeg_inputs`;
  await RNFS.mkdir(tempDir);

  const outputPath = `${tempDir}/${Date.now()}_${sanitizeFilename(fallbackFilename)}`;
  await RNFS.copyFile(uri, outputPath);
  return `file://${outputPath}`;
};

export const ExportScreen: React.FC<ExportScreenProps> = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { showToast } = useUIStore();
  const { clips, exportSettings, setExportSettings, musicTrack, textOverlays } = useEditorStore();

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [exportedVideoPath, setExportedVideoPath] = useState<string | null>(null);

  // Options de résolutions et qualités
  const resolutions: ExportResolution[] = ['480p', '720p', '1080p'];
  const qualities: { key: ExportQuality; label: string }[] = [
    { key: 'low', label: 'Léger' },
    { key: 'medium', label: 'Normal' },
    { key: 'high', label: 'Haute Qualité' },
  ];

  const totalDurationSec = useMemo(() => {
    return clips.reduce((acc, c) => acc + (c.trimEnd - c.trimStart), 0);
  }, [clips]);

  const getExportableMusicTrack = () => {
    if (!musicTrack || musicTrack.uri.startsWith('mock_')) {
      return null;
    }

    return musicTrack;
  };

  const handleStartExport = async () => {
    if (clips.length === 0) return;

    // 0. Vérification de l'espace disque critique avant export
    try {
      const diskInfo = await RNFS.getFSInfo();
      // On demande au moins 200 Mo pour un export serein (fichiers temporaires + final)
      if (diskInfo.freeSpace < 200 * 1024 * 1024) {
        Alert.alert(
          'Espace disque insuffisant ⚠️',
          'Il te reste moins de 200 Mo d\'espace. Libère de la place pour pouvoir exporter ta vidéo sans erreur.'
        );
        return;
      }
    } catch (e) {
      console.warn('[ExportScreen] Disk check failed:', e);
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportedVideoPath(null);

    // Définir le chemin final dans le dossier document privé de l'app
    const exportFolder = `${RNFS.DocumentDirectoryPath}/exports`;
    const finalPath = `${exportFolder}/export_${Date.now()}.mp4`;

    try {
      // S'assurer que le dossier d'export existe
      await RNFS.mkdir(exportFolder);

      if (clips.length === 1) {
        // --- CAS UNIQUE : 1 seul clip ---
        // On effectue l'export en une seule commande FFmpeg optimisée (Trim + Encodage + Résolution)
        setCurrentStep('Compression & Encodage...');
        const clip = clips[0];
        const exportMusicTrack = getExportableMusicTrack();
        const inputPath = await prepareFFmpegInput(clip.uri, `${clip.id}.mp4`);
        const audioPath = exportMusicTrack
          ? await prepareFFmpegInput(exportMusicTrack.uri, `music_${exportMusicTrack.id}.mp3`)
          : undefined;
        // Préparer les overlays pour l'export (uniquement pour export single-clip)
        const exportOverlays = textOverlays?.map((o) => ({
          text: o.text,
          start: o.startTime,
          end: o.endTime,
          positionX: o.positionX,
          positionY: o.positionY,
          style: { fontSize: o.style.fontSize, color: o.style.color },
        }));

        const command = buildExportCommand({
          inputPath,
          outputPath: finalPath,
          trimStart: clip.trimStart,
          trimEnd: clip.trimEnd,
          quality: exportSettings.quality,
          resolution: exportSettings.resolution,
          frameRate: exportSettings.frameRate,
          audioPath,
          audioVolume: exportMusicTrack ? exportMusicTrack.volume : undefined,
          hasAudio: clip.metadata.hasAudio,
          filter: clip.filter,
          textOverlays: exportOverlays,
        });

        const durationMs = (clip.trimEnd - clip.trimStart) * 1000;
        const res = await ffmpegService.execute(
          command,
          (prog) => {
            setExportProgress(prog.percentage);
          },
          durationMs
        );

        if (!res.success) throw new Error(res.error || 'Erreur lors du traitement vidéo');

      } else {
        // --- CAS MULTIPLE : Plusieurs clips dans la timeline ---
        // Étape 1 : Trimmer / Convertir chaque clip individuellement vers un format standardisé
        const tempClipsPaths: string[] = [];
        const numClips = clips.length;

        for (let i = 0; i < numClips; i++) {
          const clip = clips[i];
          setCurrentStep(`Découpe du clip ${i + 1}/${numClips}...`);
          
          const tempPath = `${RNFS.DocumentDirectoryPath}/temp_clip_${i}_${Date.now()}.mp4`;
          tempClipsPaths.push(tempPath);

          // Commande trim avec réencodage pour forcer la synchronisation des formats
          // Note: On utilise buildExportCommand ici au lieu de buildTrimCommand 
          // pour pouvoir appliquer les filtres dès cette étape
          const trimCommand = buildExportCommand({
            inputPath: await prepareFFmpegInput(clip.uri, `${clip.id}.mp4`),
            outputPath: tempPath,
            trimStart: clip.trimStart,
            trimEnd: clip.trimEnd,
            quality: exportSettings.quality,
            resolution: exportSettings.resolution, // Maintenir la résolution cible
            frameRate: exportSettings.frameRate,
            filter: clip.filter,
          });

          const clipDurationMs = (clip.trimEnd - clip.trimStart) * 1000;
          const res = await ffmpegService.execute(
            trimCommand,
            (prog) => {
              // Progression proportionnelle à l'étape en cours (80% du total pour les trims individuels)
              const clipShare = 80 / (numClips + 1);
              const progressBase = i * clipShare;
              const stepProgress = (prog.percentage / 100) * clipShare;
              setExportProgress(Math.round(progressBase + stepProgress));
            },
            clipDurationMs
          );

          if (!res.success) throw new Error(res.error || `Erreur trim clip ${i + 1}`);
        }

        // Étape 2 : Concaténer tous les clips temporaires (avec support Transitions)
        const hasTransitions = clips.some(c => c.transition && c.transition !== 'none');
        let finalMergedPath = '';

        if (!hasTransitions) {
          // --- Chemin classique : Merge simple (rapide) ---
          setCurrentStep('Fusion des pistes (Concat)...');
          const listFilePath = `${RNFS.DocumentDirectoryPath}/concat_list.txt`;
          const listContent = tempClipsPaths
            .map((path) => `file '${path.replace(/'/g, "'\\''")}'`)
            .join('\n');
          await RNFS.writeFile(listFilePath, listContent, 'utf8');

          const tempMergedPath = `${RNFS.DocumentDirectoryPath}/temp_merged_${Date.now()}.mp4`;
          const mergeCommand = buildMergeCommand(listFilePath, tempMergedPath);
          const mergeRes = await ffmpegService.execute(mergeCommand);
          await RNFS.unlink(listFilePath).catch(() => {});
          if (!mergeRes.success) throw new Error(mergeRes.error || 'Erreur lors de la fusion');
          finalMergedPath = tempMergedPath;
        } else {
          // --- Chemin complexe : Transitions xfade (plus lent, nécessite réencodage) ---
          setCurrentStep('Application des transitions...');
          let currentBase = tempClipsPaths[0];
          
          for (let i = 1; i < tempClipsPaths.length; i++) {
            const nextClip = tempClipsPaths[i];
            const clipMeta = clips[i];
            const transition = clipMeta.transition || 'none';
            const tempOut = `${RNFS.DocumentDirectoryPath}/trans_step_${i}_${Date.now()}.mp4`;

            if (transition === 'none') {
              // Concaténation simple si pas de transition pour ce clip
              const listFile = `${RNFS.DocumentDirectoryPath}/list_tmp.txt`;
              await RNFS.writeFile(listFile, `file '${currentBase}'\nfile '${nextClip}'`, 'utf8');
              await ffmpegService.execute(buildMergeCommand(listFile, tempOut));
              await RNFS.unlink(listFile).catch(() => {});
            } else {
              // Calculer la durée de la base actuelle pour l'offset
              const info = await ffmpegService.getMediaInfo(currentBase);
              const duration1 = parseFloat(info?.duration || '0');
              
              const xfadeCmd = buildXFadeCommand({
                input1: currentBase,
                input2: nextClip,
                outputPath: tempOut,
                transition: transition,
                duration1,
                transitionDuration: 1.0, // 1 seconde par défaut
                resolution: RESOLUTION[exportSettings.resolution],
              });
              
              const res = await ffmpegService.execute(xfadeCmd);
              if (!res.success) throw new Error(`Échec transition clip ${i}`);
            }

            // Nettoyage des fichiers intermédiaires
            if (i > 1) await RNFS.unlink(currentBase).catch(() => {});
            currentBase = tempOut;
            setExportProgress(Math.round(80 + (i / tempClipsPaths.length) * 10));
          }
          finalMergedPath = currentBase;
        }

        // Nettoyage des clips individuels trimmés
        for (const tempPath of tempClipsPaths) {
          await RNFS.unlink(tempPath).catch(() => {});
        }

        setExportProgress(90);

        // Étape 3 : Appliquer les overlays et la musique de fond sur la vidéo fusionnée
        const hasOverlays = textOverlays && textOverlays.length > 0;
        const exportMusicTrack = getExportableMusicTrack();
        const hasMusic = !!exportMusicTrack;

        if (hasOverlays || hasMusic) {
          setCurrentStep('Ajout des effets et de la musique...');
          
          const audioPath = exportMusicTrack
            ? await prepareFFmpegInput(exportMusicTrack.uri, `music_${exportMusicTrack.id}.mp3`)
            : undefined;

          const exportOverlays = textOverlays?.map((o) => ({
            text: o.text,
            start: o.startTime,
            end: o.endTime,
            positionX: o.positionX,
            positionY: o.positionY,
            style: { fontSize: o.style.fontSize, color: o.style.color },
          }));

          const mergedHasAudio = clips.some((c) => c.metadata.hasAudio);

          const finalCommand = buildExportCommand({
            inputPath: finalMergedPath,
            outputPath: finalPath,
            quality: exportSettings.quality,
            resolution: exportSettings.resolution,
            frameRate: exportSettings.frameRate,
            audioPath,
            audioVolume: exportMusicTrack ? exportMusicTrack.volume : undefined,
            hasAudio: mergedHasAudio,
            textOverlays: exportOverlays,
          });

          const finalRes = await ffmpegService.execute(
            finalCommand,
            (prog) => {
              const stepProgress = (prog.percentage / 100) * 9;
              setExportProgress(Math.min(99, Math.round(90 + stepProgress)));
            },
            totalDurationSec * 1000
          );

          await RNFS.unlink(finalMergedPath).catch(() => {});
          if (!finalRes.success) throw new Error(finalRes.error || 'Erreur lors de la finalisation');
        } else {
          await RNFS.moveFile(finalMergedPath, finalPath);
        }

        setExportProgress(100);
      }

      // Export réussi !
      setExportedVideoPath(finalPath);
      showToast('Vidéo exportée avec succès ! 🚀', 'success');

      // Nettoyage en arrière-plan après export réussi
      setTimeout(() => cleanupTempFiles(false), 2000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur d'export";
      showToast(msg, 'error');
      console.error('[Export] Failure:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveToDownloads = async () => {
    if (!exportedVideoPath) return;

    try {
      const filename = `EmpireCut_${Date.now()}.mp4`;
      const publicPath = `/storage/emulated/0/Download/${filename}`;
      
      // Copier vers le dossier de téléchargement public
      await RNFS.copyFile(exportedVideoPath, publicPath);
      
      Alert.alert(
        'Sauvegarde réussie ! 💾',
        `La vidéo a été enregistrée dans tes Téléchargements sous le nom :\n${filename}`
      );
      showToast('Enregistré dans Téléchargements !', 'success');
    } catch (error) {
      console.error('[ExportScreen] Save error:', error);
      // Fallback sur le partage direct si l'écriture dans Download échoue (ex: restrictions Android 11+)
      handleShare();
    }
  };

  const handleShare = async () => {
    if (!exportedVideoPath) return;
    try {
      await Share.share({
        url: `file://${exportedVideoPath}`,
        title: 'Ma vidéo EmpireCut',
        message: 'Regarde le montage que je viens de faire avec EmpireCut ! 🎬',
      });
    } catch {
      showToast('Erreur de partage', 'error');
    }
  };

  const handleFinish = () => {
    navigation.navigate('App');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          disabled={isExporting}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Exportation</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!exportedVideoPath ? (
        // Écran de configuration / progression
        <View style={styles.content}>
          {isExporting ? (
            // Progression en cours
            <View style={styles.progressContainer}>
              <View style={styles.loaderWrapper}>
                <ActivityIndicator size="large" color={Colors.accent.primary} />
                <View style={styles.percentageWrapper}>
                  <Text style={styles.percentageText}>{exportProgress}%</Text>
                </View>
              </View>
              
              <Text style={styles.progressLabel}>{currentStep}</Text>
              <Text style={styles.progressSub}>
                Ne ferme pas l'application pendant le traitement.
              </Text>
              
              {/* Barre de progression visuelle */}
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${exportProgress}%` }]} />
              </View>
            </View>
          ) : (
            // Configuration des paramètres
            <View style={styles.settingsContainer}>
              <Text style={styles.sectionTitle}>Paramètres d'export</Text>

              {/* Résolution */}
              <View style={styles.settingOption}>
                <Text style={styles.optionLabel}>Résolution</Text>
                <View style={styles.optionButtonGroup}>
                  {resolutions.map((res) => (
                    <TouchableOpacity
                      key={res}
                      style={[
                        styles.optionButton,
                        exportSettings.resolution === res && styles.optionButtonActive,
                      ]}
                      onPress={() => setExportSettings({ resolution: res })}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          exportSettings.resolution === res && styles.optionButtonTextActive,
                        ]}
                      >
                        {res}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Qualité */}
              <View style={styles.settingOption}>
                <Text style={styles.optionLabel}>Qualité d'encodage</Text>
                <View style={styles.optionButtonGroup}>
                  {qualities.map((q) => (
                    <TouchableOpacity
                      key={q.key}
                      style={[
                        styles.optionButton,
                        exportSettings.quality === q.key && styles.optionButtonActive,
                      ]}
                      onPress={() => setExportSettings({ quality: q.key })}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          exportSettings.quality === q.key && styles.optionButtonTextActive,
                        ]}
                      >
                        {q.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Résumé */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Projet à exporter</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Durée totale :</Text>
                  <Text style={styles.summaryValue}>{formatSeconds(totalDurationSec)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Nombre de clips :</Text>
                  <Text style={styles.summaryValue}>{clips.length}</Text>
                </View>
              </View>

              {/* Bouton de soumission */}
              <TouchableOpacity
                style={styles.exportBtn}
                activeOpacity={0.8}
                onPress={handleStartExport}
              >
                <Text style={styles.exportBtnText}>Exporter la vidéo 🚀</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        // Écran de succès de l'exportation
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Export terminé ! 🎉</Text>
          
          {/* Lecteur de prévisualisation finale */}
          <View style={styles.previewCard}>
            <Video
              source={{ uri: exportedVideoPath }}
              style={styles.previewVideo}
              resizeMode="contain"
              controls={true}
              paused={true}
            />
          </View>

          {/* Boutons d'action */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleSaveToDownloads}>
              <Text style={styles.actionBtnIcon}>💾</Text>
              <Text style={styles.actionBtnLabel}>Enregistrer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Text style={styles.actionBtnIcon}>📤</Text>
              <Text style={styles.actionBtnLabel}>Partager</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.finishBtn]} onPress={handleFinish}>
              <Text style={styles.actionBtnIcon}>🏠</Text>
              <Text style={[styles.actionBtnLabel, styles.finishBtnText]}>Terminer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  headerSpacer: {
    width: 36,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { fontSize: 16, color: Colors.text.primary },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text.primary },
  content: { flex: 1, padding: Spacing[8], justifyContent: 'center' },
  progressContainer: {
    alignItems: 'center',
    gap: Spacing[6],
  },
  loaderWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageWrapper: {
    position: 'absolute',
  },
  percentageText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  progressLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  progressSub: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.background.secondary,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: Spacing[2],
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent.primary,
  },
  settingsContainer: {
    gap: Spacing[6],
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  settingOption: {
    gap: Spacing[3],
  },
  optionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  optionButtonGroup: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  optionButton: {
    flex: 1,
    paddingVertical: Spacing[4],
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: Colors.accent.glow,
    borderColor: Colors.accent.primary,
  },
  optionButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  optionButtonTextActive: {
    color: Colors.accent.primary,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing[6],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  summaryTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    paddingBottom: Spacing[2],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  summaryValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  exportBtn: {
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[5],
    alignItems: 'center',
    marginTop: Spacing[6],
    ...Shadow.accent,
  },
  exportBtnText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: FontSize.base,
  },
  successContainer: {
    flex: 1,
    padding: Spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[6],
  },
  successTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  previewCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.black,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadow.md,
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing[4],
    width: '100%',
    marginTop: Spacing[4],
  },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.default,
    gap: Spacing[1],
    ...Shadow.sm,
  },
  actionBtnIcon: {
    fontSize: 22,
  },
  actionBtnLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  finishBtn: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
    ...Shadow.accent,
  },
  finishBtnText: {
    color: Colors.white,
  },
});

export default ExportScreen;

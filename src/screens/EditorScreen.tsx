import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import Slider from '../components/common/Slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../theme';
import type { EditorScreenProps, RootStackParamList } from '../navigation/types';
import { useEditorStore } from '../store/editor.store';
import { useAuthStore } from '../store/auth.store';
import { useProject } from '../hooks/useProject';
import * as db from '../supabase/database';
import { loadProjectFromCloud, syncProjectToCloud } from '../supabase/projectSync.service';
import { ensureClipCached } from '../supabase/cloudCache.service';
import VideoPlayer from '../components/video/VideoPlayer';
import TimelineBar from '../components/timeline/TimelineBar';
import type { Clip } from '../types/video.types';
import type { ClipRow } from '../types/supabase.types';
import type { EditorTool, TextOverlay } from '../types/editor.types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Editor'>;

const PRESET_MUSIC_TRACKS = [
  { id: 'synth', title: 'Neon Drive', artist: 'Retro Wave', durationSec: 180, uri: 'mock_synth.mp3' },
  { id: 'lofi', title: 'Summer Chill', artist: 'Lofi Beats', durationSec: 210, uri: 'mock_lofi.mp3' },
  { id: 'tech', title: 'Dynamic Beat', artist: 'Tech House', durationSec: 150, uri: 'mock_tech.mp3' },
];

const EditorScreen: React.FC<EditorScreenProps> = ({ route }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const projectId = route.params?.projectId;

  const {
    clips,
    activeTool,
    selectedClipId,
    initEditor,
    resetEditor,
    setActiveTool,
    setClips,
    setSelectedClip,
    textOverlays,
    selectedOverlayId,
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
    setSelectedOverlay,
    musicTrack,
    setMusicTrack,
    currentTimeMs,
    isDirty,
    markClean,
  } = useEditorStore();

  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initialisation du projet...');
  const [projectTitle, setProjectTitle] = useState('Éditeur');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Sauvegarder le projet sur Supabase
  const handleSaveToCloud = useCallback(async () => {
    if (!projectId || isSyncing) return;
    
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      console.error('[EditorScreen] Cannot sync: User is not authenticated');
      return;
    }

    setIsSyncing(true);
    const {
      clips: storeClips,
      textOverlays: storeOverlays,
      musicTrack: storeMusic,
    } = useEditorStore.getState();
    const ok = await syncProjectToCloud({
      projectId,
      userId,
      clips: storeClips,
      textOverlays: storeOverlays,
      musicTrack: storeMusic,
      title: projectTitle,
    });
    setIsSyncing(false);
    if (ok) {
      setLastSynced(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      markClean();
    }
  }, [projectId, isSyncing, projectTitle, markClean]);

  // Charger le projet complet (clips + overlays + musique) depuis Supabase
  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadingMessage('Chargement du projet...');
      try {
        // Chargement complet depuis Supabase (clips + overlays + musique)
        const projectData = await loadProjectFromCloud(projectId);

        if (projectData) {
          setProjectTitle(projectData.title);

          // Télécharger et mettre en cache les clips vidéo locaux
          setLoadingMessage('Mise en cache des vidéos...');
          const cachedClips = await Promise.all(
            projectData.clips.map(async (clip) => {
              const cachedUri = await ensureClipCached(projectId, clip.id, clip.uri);
              return {
                ...clip,
                uri: cachedUri,
                metadata: {
                  ...clip.metadata,
                  uri: cachedUri,
                },
              };
            })
          );

          initEditor(projectId, cachedClips);

          // Restaurer les overlays texte sauvegardés
          if (projectData.textOverlays.length > 0) {
            const { addTextOverlay } = useEditorStore.getState();
            projectData.textOverlays.forEach((overlay) => addTextOverlay(overlay));
          }

          // Restaurer la piste musicale sauvegardée
          if (projectData.musicTrack) {
            const { setMusicTrack } = useEditorStore.getState();
            setMusicTrack(projectData.musicTrack);
          }

          // Sélectionner le premier clip par défaut
          if (projectData.clips.length > 0) {
            setSelectedClip(projectData.clips[0].id);
          }
        } else {
          // Fallback : chargement minimal via les fonctions bas-niveau
          const projectRow = await db.getProjectById(projectId);
          if (projectRow) setProjectTitle(projectRow.title);
          initEditor(projectId, []);
        }
      } catch (error) {
        console.error('[EditorScreen] Erreur chargement projet:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectData();

    return () => {
      resetEditor();
    };
  }, [projectId, initEditor, resetEditor, setSelectedClip]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleExport = () => {
    if (projectId) {
      navigation.navigate('Export', { projectId });
    }
  };

  const getSelectedClip = useCallback(() => {
    return clips.find((c) => c.id === selectedClipId);
  }, [clips, selectedClipId]);

  // Actions de modification du clip sélectionné
  const handleVolumeChange = (value: number) => {
    if (!selectedClipId) return;
    const updatedClips = clips.map((c) =>
      c.id === selectedClipId ? { ...c, volume: value } : c
    );
    setClips(updatedClips);
  };

  const handleTrimStartChange = (value: number) => {
    const selectedClip = getSelectedClip();
    if (!selectedClip) return;
    // S'assurer que le trim de début ne dépasse pas le trim de fin
    const newStart = Math.min(value, selectedClip.trimEnd - 1);
    const updatedClips = clips.map((c) =>
      c.id === selectedClipId ? { ...c, trimStart: newStart } : c
    );
    setClips(updatedClips);
  };

  const handleTrimEndChange = (value: number) => {
    const selectedClip = getSelectedClip();
    if (!selectedClip) return;
    // S'assurer que le trim de fin n'est pas inférieur au trim de début
    const newEnd = Math.max(value, selectedClip.trimStart + 1);
    const updatedClips = clips.map((c) =>
      c.id === selectedClipId ? { ...c, trimEnd: newEnd } : c
    );
    setClips(updatedClips);
  };

  const getSelectedOverlay = useCallback(() => {
    return textOverlays.find((o) => o.id === selectedOverlayId);
  }, [textOverlays, selectedOverlayId]);

  const handleAddText = () => {
    const totalDurationSec = clips.reduce((acc, c) => acc + (c.trimEnd - c.trimStart), 0);
    const start = currentTimeMs / 1000;
    const end = Math.min(totalDurationSec, start + 3); // 3 secondes par défaut
    
    const newOverlay: TextOverlay = {
      id: `text_${Date.now()}`,
      text: 'Nouveau Texte',
      style: {
        fontSize: 18,
        color: '#FFFFFF',
        textAlign: 'center',
      },
      animation: 'none',
      startTime: start,
      endTime: end,
      positionX: 0.5,
      positionY: 0.5,
    };
    addTextOverlay(newOverlay);
    setSelectedOverlay(newOverlay.id);
  };

  const handleSelectMusic = (track: typeof PRESET_MUSIC_TRACKS[0]) => {
    if (musicTrack?.id === track.id) {
      setMusicTrack(null);
    } else {
      setMusicTrack({
        id: track.id,
        uri: track.uri,
        title: track.title,
        artist: track.artist,
        durationSec: track.durationSec,
        startTime: 0,
        volume: 0.5,
        fadeIn: true,
        fadeOut: true,
      });
    }
  };

  const handleMusicVolumeChange = (value: number) => {
    if (!musicTrack) return;
    setMusicTrack({
      ...musicTrack,
      volume: value,
    });
  };

  const tools: { label: string; icon: string; key: EditorTool }[] = [
    { label: 'Couper', icon: '✂️', key: 'trim' },
    { label: 'Texte', icon: '💬', key: 'text' },
    { label: 'Musique', icon: '🎵', key: 'music' },
    { label: 'Volume', icon: '🔊', key: 'volume' },
  ];

  // Rendu du panneau spécifique à l'outil actif
  const renderToolPanel = () => {
    const selectedClip = getSelectedClip();

    if (!selectedClip) {
      return (
        <View style={styles.panelPlaceholder}>
          <Text style={styles.panelPlaceholderText}>Sélectionne un clip dans la timeline pour l'éditer</Text>
        </View>
      );
    }

    switch (activeTool) {
      case 'volume':
        return (
          <View style={styles.panelContent}>
            <View style={styles.panelHeaderRow}>
              <Text style={styles.panelTitle}>Volume du clip</Text>
              <Text style={styles.panelValue}>{Math.round(selectedClip.volume * 100)}%</Text>
            </View>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>🔇</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.05}
                value={selectedClip.volume}
                onValueChange={handleVolumeChange}
              />
              <Text style={styles.sliderLabel}>🔊</Text>
            </View>
          </View>
        );

      case 'trim':
        return (
          <View style={styles.panelContent}>
            <Text style={styles.panelTitle}>Rogner le clip (Trim)</Text>
            <View style={styles.trimSliders}>
              <View style={styles.trimControlRow}>
                <Text style={styles.trimLabel}>Début: {selectedClip.trimStart.toFixed(1)}s</Text>
                <Slider
                  style={styles.trimSlider}
                  minimumValue={0}
                  maximumValue={selectedClip.metadata.durationSec}
                  step={0.1}
                  value={selectedClip.trimStart}
                  onValueChange={handleTrimStartChange}
                />
              </View>
              <View style={styles.trimControlRow}>
                <Text style={styles.trimLabel}>Fin: {selectedClip.trimEnd.toFixed(1)}s</Text>
                <Slider
                  style={styles.trimSlider}
                  minimumValue={0}
                  maximumValue={selectedClip.metadata.durationSec}
                  step={0.1}
                  value={selectedClip.trimEnd}
                  onValueChange={handleTrimEndChange}
                />
              </View>
            </View>
          </View>
        );

      case 'text':
        const selectedOverlay = getSelectedOverlay();
        const totalDurationSec = clips.reduce((acc, c) => acc + (c.trimEnd - c.trimStart), 0);

        if (selectedOverlay) {
          const colors = ['#FFFFFF', '#FFE600', '#FF3B30', '#4CD964', '#7C5CFC', '#5AC8FA'];
          return (
            <ScrollView contentContainerStyle={styles.panelScrollContent}>
              <View style={styles.panelHeaderRow}>
                <Text style={styles.panelTitle}>Éditer le texte</Text>
                <TouchableOpacity
                  style={styles.deleteOverlayBtn}
                  onPress={() => removeTextOverlay(selectedOverlay.id)}
                >
                  <Text style={styles.deleteOverlayBtnText}>Supprimer</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.textInput}
                value={selectedOverlay.text}
                onChangeText={(val) => updateTextOverlay(selectedOverlay.id, { text: val })}
                placeholder="Texte de l'overlay..."
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
              />

              {/* Paramètres style */}
              <View style={styles.styleOptionsRow}>
                <View style={styles.fontSizeControl}>
                  <Text style={styles.sliderLabelMini}>Taille : {selectedOverlay.style.fontSize}px</Text>
                  <Slider
                    style={styles.sliderMini}
                    minimumValue={10}
                    maximumValue={40}
                    step={1}
                    value={selectedOverlay.style.fontSize}
                    onValueChange={(val) =>
                      updateTextOverlay(selectedOverlay.id, {
                        style: { ...selectedOverlay.style, fontSize: val },
                      })
                    }
                  />
                </View>
              </View>

              {/* Couleurs */}
              <View style={styles.colorPaletteGroup}>
                <Text style={styles.sliderLabelMini}>Couleur du texte :</Text>
                <View style={styles.colorRow}>
                  {colors.map((c) => {
                    const isColorSelected = selectedOverlay.style.color === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: c },
                          isColorSelected && styles.colorCircleSelected,
                        ]}
                        onPress={() =>
                          updateTextOverlay(selectedOverlay.id, {
                            style: { ...selectedOverlay.style, color: c },
                          })
                        }
                      />
                    );
                  })}
                </View>
              </View>

              {/* Positions */}
              <View style={styles.positionSliders}>
                <View style={styles.sliderMiniRow}>
                  <Text style={styles.sliderLabelMini}>Position X : {Math.round(selectedOverlay.positionX * 100)}%</Text>
                  <Slider
                    style={styles.sliderMini}
                    minimumValue={0}
                    maximumValue={1}
                    step={0.01}
                    value={selectedOverlay.positionX}
                    onValueChange={(val) => updateTextOverlay(selectedOverlay.id, { positionX: val })}
                  />
                </View>
                <View style={styles.sliderMiniRow}>
                  <Text style={styles.sliderLabelMini}>Position Y : {Math.round(selectedOverlay.positionY * 100)}%</Text>
                  <Slider
                    style={styles.sliderMini}
                    minimumValue={0}
                    maximumValue={1}
                    step={0.01}
                    value={selectedOverlay.positionY}
                    onValueChange={(val) => updateTextOverlay(selectedOverlay.id, { positionY: val })}
                  />
                </View>
              </View>

              {/* Timings */}
              <View style={styles.positionSliders}>
                <View style={styles.sliderMiniRow}>
                  <Text style={styles.sliderLabelMini}>Début : {selectedOverlay.startTime.toFixed(1)}s</Text>
                  <Slider
                    style={styles.sliderMini}
                    minimumValue={0}
                    maximumValue={totalDurationSec}
                    step={0.1}
                    value={selectedOverlay.startTime}
                    onValueChange={(val) =>
                      updateTextOverlay(selectedOverlay.id, {
                        startTime: Math.min(val, selectedOverlay.endTime - 0.5),
                      })
                    }
                  />
                </View>
                <View style={styles.sliderMiniRow}>
                  <Text style={styles.sliderLabelMini}>Fin : {selectedOverlay.endTime.toFixed(1)}s</Text>
                  <Slider
                    style={styles.sliderMini}
                    minimumValue={0}
                    maximumValue={totalDurationSec}
                    step={0.1}
                    value={selectedOverlay.endTime}
                    onValueChange={(val) =>
                      updateTextOverlay(selectedOverlay.id, {
                        endTime: Math.max(val, selectedOverlay.startTime + 0.5),
                      })
                    }
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.deselectBtn}
                onPress={() => setSelectedOverlay(null)}
              >
                <Text style={styles.deselectBtnText}>Désélectionner</Text>
              </TouchableOpacity>
            </ScrollView>
          );
        }

        return (
          <View style={styles.panelContent}>
            <Text style={styles.panelTitle}>Ajouter du Texte</Text>
            <Text style={styles.panelSubText}>
              Ajoute des sous-titres ou des titres stylisés par-dessus tes clips vidéo.
            </Text>
            
            <TouchableOpacity style={styles.addTextBtn} onPress={handleAddText}>
              <Text style={styles.addTextBtnText}>+ Ajouter un texte</Text>
            </TouchableOpacity>

            {textOverlays.length > 0 && (
              <View style={styles.existingTextsList}>
                <Text style={styles.listSectionTitle}>Textes créés :</Text>
                {textOverlays.map((o) => (
                  <TouchableOpacity
                    key={o.id}
                    style={styles.textListItem}
                    onPress={() => setSelectedOverlay(o.id)}
                  >
                    <Text style={styles.textListItemText} numberOfLines={1}>
                      💬 {o.text} ({o.startTime.toFixed(1)}s - {o.endTime.toFixed(1)}s)
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );

      case 'music':
        return (
          <View style={styles.panelContent}>
            <Text style={styles.panelTitle}>Musique de fond</Text>
            
            {/* Liste presets */}
            <View style={styles.musicPresetsContainer}>
              {PRESET_MUSIC_TRACKS.map((track) => {
                const isActive = musicTrack?.id === track.id;
                return (
                  <TouchableOpacity
                    key={track.id}
                    style={[styles.musicTrackItem, isActive && styles.musicTrackItemActive]}
                    onPress={() => handleSelectMusic(track)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.musicTextInfo}>
                      <Text style={[styles.musicTrackTitle, isActive && styles.musicTextActive]}>
                        🎵 {track.title}
                      </Text>
                      <Text style={styles.musicTrackArtist}>{track.artist}</Text>
                    </View>
                    <View style={[styles.musicBadge, isActive && styles.musicBadgeActive]}>
                      <Text style={[styles.musicBadgeText, isActive && styles.musicBadgeTextActive]}>
                        {isActive ? 'Active' : 'Ajouter'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Ajustement volume si actif */}
            {musicTrack && (
              <View style={styles.musicVolumeRow}>
                <View style={styles.panelHeaderRow}>
                  <Text style={styles.panelSubTitle}>Volume de la musique</Text>
                  <Text style={styles.panelValue}>{Math.round(musicTrack.volume * 100)}%</Text>
                </View>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderLabel}>🔇</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    step={0.05}
                    value={musicTrack.volume}
                    onValueChange={handleMusicVolumeChange}
                  />
                  <Text style={styles.sliderLabel}>🔊</Text>
                </View>
              </View>
            )}
          </View>
        );

      default:
        return (
          <View style={styles.panelPlaceholder}>
            <Text style={styles.panelPlaceholderText}>Choisis un outil ci-dessous pour modifier la vidéo</Text>
          </View>
        );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.accent.primary} size="large" />
        <Text style={styles.loadingText}>{loadingMessage}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          testID="editor-back-button"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.topCenterBlock}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {projectTitle}
          </Text>
          {lastSynced ? (
            <Text style={styles.syncedLabel}>✓ Sync {lastSynced}</Text>
          ) : isDirty ? (
            <Text style={styles.unsavedLabel}>● Non sauvegardé</Text>
          ) : null}
        </View>

        <View style={styles.topActions}>
          {/* Bouton sauvegarde cloud */}
          <TouchableOpacity
            style={[styles.syncBtn, isSyncing && styles.syncBtnActive]}
            onPress={handleSaveToCloud}
            disabled={isSyncing || !isDirty}
            testID="editor-sync-button"
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={Colors.accent.primary} />
            ) : (
              <Text style={[
                styles.syncBtnText,
                (!isDirty) && styles.syncBtnTextDimmed,
              ]}>☁</Text>
            )}
          </TouchableOpacity>

          {/* Bouton export */}
          <TouchableOpacity 
            style={styles.exportBtn} 
            onPress={handleExport}
            testID="editor-export-button"
          >
            <Text style={styles.exportBtnText}>Exporter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Video Player */}
      <View style={styles.playerContainer}>
        <VideoPlayer />
      </View>

      {/* Control panel based on selected tool */}
      <View style={styles.controlPanel}>
        {renderToolPanel()}
      </View>

      {/* Timeline */}
      <TimelineBar />

      {/* Toolbar */}
      <View style={[styles.toolbar, { paddingBottom: insets.bottom + Spacing[4] }]}>
        {tools.map((t) => {
          const isActive = activeTool === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={styles.toolButton}
              onPress={() => setActiveTool(t.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.toolIconWrapper, isActive && styles.toolIconWrapperActive]}>
                <Text style={styles.toolIconText}>{t.icon}</Text>
              </View>
              <Text style={[styles.toolLabel, isActive && styles.toolLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[4],
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    gap: Spacing[3],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 18, color: Colors.text.primary },
  topCenterBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  topTitle: { color: Colors.text.primary, fontWeight: '600', fontSize: FontSize.base, textAlign: 'center' },
  syncedLabel: { fontSize: 9, color: Colors.success, fontWeight: '600' },
  unsavedLabel: { fontSize: 9, color: Colors.accent.secondary, fontWeight: '600' },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  syncBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  syncBtnActive: {
    borderColor: Colors.accent.primary,
  },
  syncBtnText: { fontSize: 18, color: Colors.accent.primary },
  syncBtnTextDimmed: { color: Colors.text.muted },
  exportBtn: {
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    ...Shadow.accent,
  },
  exportBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },
  playerContainer: {
    width: '100%',
    backgroundColor: Colors.black,
  },
  controlPanel: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    justifyContent: 'center',
  },
  panelPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
  },
  panelPlaceholderText: {
    color: Colors.text.muted,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  panelContent: {
    padding: Spacing[6],
    gap: Spacing[4],
    width: '100%',
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    color: Colors.text.primary,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  panelValue: {
    color: Colors.accent.primary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  panelSubText: {
    color: Colors.text.muted,
    fontSize: FontSize.sm,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: FontSize.lg,
  },
  trimSliders: {
    gap: Spacing[3],
  },
  trimControlRow: {
    flexDirection: 'column',
    gap: Spacing[1],
  },
  trimLabel: {
    color: Colors.text.secondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  trimSlider: {
    width: '100%',
    height: 30,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.background.elevated,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
    paddingTop: Spacing[5],
  },
  toolButton: { alignItems: 'center', gap: Spacing[2] },
  toolIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  toolIconWrapperActive: {
    backgroundColor: Colors.accent.glow,
    borderColor: Colors.accent.primary,
  },
  toolIconText: {
    fontSize: 20,
  },
  toolLabel: { fontSize: FontSize.xs, color: Colors.text.muted, fontWeight: '500' },
  toolLabelActive: { color: Colors.accent.primary, fontWeight: '700' },
  panelScrollContent: {
    padding: Spacing[6],
    gap: Spacing[4],
  },
  deleteOverlayBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  deleteOverlayBtnText: {
    color: '#FF3B30',
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.base,
    padding: Spacing[3],
    color: Colors.text.primary,
    fontSize: FontSize.sm,
    marginTop: Spacing[2],
  },
  styleOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  fontSizeControl: {
    flex: 1,
  },
  sliderMini: {
    width: '100%',
    height: 25,
  },
  sliderLabelMini: {
    color: Colors.text.secondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginBottom: 2,
  },
  colorPaletteGroup: {
    gap: Spacing[2],
  },
  colorRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    alignItems: 'center',
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  colorCircleSelected: {
    borderColor: Colors.accent.primary,
    borderWidth: 2,
    transform: [{ scale: 1.15 }],
  },
  positionSliders: {
    gap: Spacing[2],
  },
  sliderMiniRow: {
    flexDirection: 'column',
  },
  deselectBtn: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    marginTop: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  deselectBtnText: {
    color: Colors.text.secondary,
    fontWeight: '700',
    fontSize: FontSize.xs,
  },
  addTextBtn: {
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    marginTop: Spacing[2],
    ...Shadow.accent,
  },
  addTextBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  existingTextsList: {
    marginTop: Spacing[4],
    gap: Spacing[2],
  },
  listSectionTitle: {
    color: Colors.text.muted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textListItem: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing[3],
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  textListItemText: {
    color: Colors.text.primary,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  musicPresetsContainer: {
    gap: Spacing[2],
  },
  musicTrackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: Spacing[4],
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  musicTrackItemActive: {
    borderColor: Colors.accent.primary,
    backgroundColor: 'rgba(124, 92, 252, 0.05)',
  },
  musicTextInfo: {
    gap: 2,
  },
  musicTrackTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  musicTextActive: {
    color: Colors.accent.primary,
  },
  musicTrackArtist: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  musicBadge: {
    backgroundColor: Colors.background.tertiary,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.sm,
  },
  musicBadgeActive: {
    backgroundColor: Colors.accent.primary,
  },
  musicBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  musicBadgeTextActive: {
    color: Colors.white,
  },
  musicVolumeRow: {
    marginTop: Spacing[4],
    gap: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
    paddingTop: Spacing[4],
  },
  panelSubTitle: {
    color: Colors.text.secondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});

export default EditorScreen;

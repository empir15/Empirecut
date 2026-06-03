import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../theme';
import type { EditorScreenProps, RootStackParamList } from '../navigation/types';
import { useEditorStore } from '../store/editor.store';
import { useAuthStore } from '../store/auth.store';
import * as db from '../supabase/database';
import { loadProjectFromCloud, syncProjectToCloud } from '../supabase/projectSync.service';
import { ensureClipCached } from '../supabase/cloudCache.service';
import VideoPlayer from '../components/video/VideoPlayer';
import TimelineBar from '../components/timeline/TimelineBar';
import { ToolPanel } from '../components/editor/ToolPanel';
import { BottomToolBar } from '../components/editor/BottomToolBar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Editor'>;

const EditorScreen: React.FC<EditorScreenProps> = ({ route }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const projectId = route.params?.projectId;

  const {
    initEditor,
    resetEditor,
    addTextOverlay,
    setMusicTrack,
    setSelectedClip,
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

  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadingMessage('Chargement du projet...');
      try {
        const projectData = await loadProjectFromCloud(projectId);

        if (projectData) {
          setProjectTitle(projectData.title);

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

          if (projectData.textOverlays.length > 0) {
            projectData.textOverlays.forEach((overlay) => addTextOverlay(overlay));
          }

          if (projectData.musicTrack) {
            setMusicTrack(projectData.musicTrack);
          }

          if (projectData.clips.length > 0) {
            setSelectedClip(projectData.clips[0].id);
          }
        } else {
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
  }, [projectId, initEditor, resetEditor, setSelectedClip, addTextOverlay, setMusicTrack]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleExport = () => {
    if (projectId) {
      navigation.navigate('Export', { projectId });
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
          <TouchableOpacity
            style={[styles.syncBtn, isSyncing && styles.syncBtnActive]}
            onPress={handleSaveToCloud}
            disabled={isSyncing || !isDirty}
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

          <TouchableOpacity 
            style={styles.exportBtn} 
            onPress={handleExport}
          >
            <Text style={styles.exportBtnText}>Exporter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Video Player Area */}
      <View style={styles.playerContainer}>
        <VideoPlayer />
      </View>

      {/* Control panel based on selected tool */}
      <View style={styles.controlPanel}>
        <ToolPanel />
      </View>

      {/* Timeline Section */}
      <View style={styles.timelineContainer}>
        <TimelineBar />
      </View>

      {/* Toolbar Area */}
      <View style={{ paddingBottom: insets.bottom }}>
        <BottomToolBar />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background.primary 
  },
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
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { 
    fontSize: 18, 
    color: Colors.text.primary 
  },
  topCenterBlock: {
    flex: 1,
    alignItems: 'center',
  },
  topTitle: { 
    color: Colors.text.primary, 
    fontWeight: '700', 
    fontSize: FontSize.base 
  },
  syncedLabel: { 
    fontSize: 10, 
    color: Colors.success, 
    fontWeight: '600',
    marginTop: 2,
  },
  unsavedLabel: { 
    fontSize: 10, 
    color: Colors.accent.secondary, 
    fontWeight: '600',
    marginTop: 2,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
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
  syncBtnText: { 
    fontSize: 20, 
    color: Colors.accent.primary 
  },
  syncBtnTextDimmed: { 
    color: Colors.text.muted 
  },
  exportBtn: {
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2.5],
    ...Shadow.accent,
  },
  exportBtnText: { 
    color: Colors.white, 
    fontWeight: '700', 
    fontSize: FontSize.sm 
  },
  playerContainer: {
    flex: 0.45,
    backgroundColor: Colors.black,
    justifyContent: 'center',
  },
  controlPanel: {
    flex: 0.35,
    backgroundColor: Colors.background.primary,
  },
  timelineContainer: {
    flex: 0.2,
  },
});

export default EditorScreen;

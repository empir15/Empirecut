import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../theme';
import { useVideo } from '../hooks/useVideo';
import { useProject } from '../hooks/useProject';
import { compressVideoIfNeeded } from '../supabase/compression.service';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Import'>;

const ImportScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { importFromGallery, isImporting } = useVideo();
  const { createProjectWithVideo } = useProject();
  const [isCreating, setIsCreating] = useState(false);
  const [creatingText, setCreatingText] = useState('Création du projet...');

  const handleImportGallery = async () => {
    if (isImporting || isCreating) return;

    // Vérification de l'espace disque critique avant import
    try {
      const diskInfo = await RNFS.getFSInfo();
      if (diskInfo.freeSpace < 100 * 1024 * 1024) { // 100 Mo
        Alert.alert(
          'Espace disque insuffisant ⚠️',
          'Il te reste moins de 100 Mo d\'espace. Libère de la place pour pouvoir importer et éditer des vidéos.'
        );
        return;
      }
    } catch (e) {
      console.warn('[ImportScreen] Disk check failed:', e);
    }

    const videoMetadata = await importFromGallery();
    if (!videoMetadata) return;

    setIsCreating(true);
    setCreatingText('Optimisation de la vidéo...');
    try {
      // Compression si la vidéo est trop volumineuse (> 15 Mo)
      const compressResult = await compressVideoIfNeeded(videoMetadata.uri);
      const finalMetadata = compressResult.compressed
        ? {
            ...videoMetadata,
            uri: compressResult.uri,
            fileSizeMB: compressResult.newSizeMb,
          }
        : videoMetadata;

      setCreatingText('Création du projet sur le cloud...');
      const now = new Date();
      const dateString = now.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      const defaultTitle = `Projet ${dateString}`;
      
      const projectId = await createProjectWithVideo(defaultTitle, finalMetadata);
      if (projectId) {
        // Rediriger vers l'éditeur avec l'ID du projet créé
        navigation.replace('Editor', { projectId });
      }
    } catch (error) {
      console.error('[ImportScreen] Erreur création projet:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const showLoading = isImporting || isCreating;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeBtn} 
          onPress={() => navigation.goBack()}
          disabled={showLoading}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Importer une vidéo</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {showLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.accent.primary} size="large" />
            <Text style={styles.loadingText}>
              {isImporting ? 'Ouverture de la galerie...' : creatingText}
            </Text>
          </View>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.importCard} 
              activeOpacity={0.8} 
              onPress={handleImportGallery}
              testID="import-from-gallery"
            >
              <View style={styles.emojiContainer}>
                <Text style={styles.importEmoji}>📷</Text>
              </View>
              <Text style={styles.importLabel}>Depuis la galerie</Text>
              <Text style={styles.importSub}>Sélectionner un clip MP4, MOV, MKV</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.importCard, styles.disabledCard]} 
              activeOpacity={0.8}
              disabled={true}
              testID="import-from-files"
            >
              <View style={[styles.emojiContainer, styles.disabledEmoji]}>
                <Text style={styles.importEmoji}>📁</Text>
              </View>
              <Text style={[styles.importLabel, styles.disabledText]}>Depuis les fichiers</Text>
              <Text style={styles.importSub}>Indisponible (utiliser Galerie)</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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
    width: 36, height: 36,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  closeIcon: { fontSize: 16, color: Colors.text.primary },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text.primary },
  content: { flex: 1, padding: Spacing[8], gap: Spacing[6], justifyContent: 'center' },
  importCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing[10],
    alignItems: 'center',
    gap: Spacing[3],
    ...Shadow.sm,
  },
  disabledCard: {
    opacity: 0.5,
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent.glow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledEmoji: {
    backgroundColor: Colors.background.tertiary,
  },
  importEmoji: { fontSize: 36 },
  importLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text.primary },
  disabledText: { color: Colors.text.muted },
  importSub: { fontSize: FontSize.sm, color: Colors.text.muted, textAlign: 'center' },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[4],
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
});

export default ImportScreen;

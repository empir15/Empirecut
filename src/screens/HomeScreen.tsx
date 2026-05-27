/**
 * EmpireCut — Home Screen
 *
 * Dashboard des projets de l'utilisateur :
 * - Chargement depuis Supabase avec nombre de clips réel
 * - Grille 2 colonnes avec cartes premium
 * - Suppression par appui long → Dialog de confirmation
 * - Pull-to-refresh
 * - Skeleton de chargement animé
 */
import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Image,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../theme';
import { useAuthStore } from '../store/auth.store';
import { useProjectStore } from '../store/project.store';
import { loadUserProjects, deleteProjectCompletely } from '../supabase/projectSync.service';
import { clearProjectCache } from '../supabase/cloudCache.service';
import { formatSeconds } from '../utils/time.utils';
import type { RootStackParamList } from '../navigation/types';
import type { ProjectSummary, ProjectStatus } from '../types/project.types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = Spacing[4];
const CARD_WIDTH = (SCREEN_WIDTH - Spacing[8] * 2 - CARD_GAP) / 2;

// =========================================================
// Skeleton Card
// =========================================================
const SkeletonCard: React.FC = () => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonThumb} />
      <View style={styles.skeletonInfo}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
      </View>
    </Animated.View>
  );
};

// =========================================================
// Helper de badge de statut
// =========================================================
const getStatusLabel = (status: ProjectStatus) => {
  switch (status) {
    case 'exported':
      return { label: '✓ Exporté', color: Colors.success };
    case 'archived':
      return { label: '📦 Archivé', color: Colors.text.muted };
    default:
      return null;
  }
};

// =========================================================
// Animated Project Card (Cascade Entry Animation)
// =========================================================
interface AnimatedProjectCardProps {
  item: ProjectSummary;
  index: number;
  onPress: () => void;
  onLongPress: () => void;
}

const AnimatedProjectCard: React.FC<AnimatedProjectCardProps> = ({
  item,
  index,
  onPress,
  onLongPress,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Effet de cascade en cascade (décalage basé sur l'index)
    const delay = Math.min(index * 80, 500);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, index]);

  const badge = getStatusLabel(item.status);

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.projectCard}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.8}
        delayLongPress={500}
        testID={`project-card-${item.id}`}
      >
        {/* Thumbnail */}
        <View style={styles.thumbnail}>
          {item.thumbnailUrl ? (
            <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnailImage} />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Text style={styles.thumbnailIcon}>🎬</Text>
            </View>
          )}

          {/* Durée */}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatSeconds(item.duration)}</Text>
          </View>

          {/* Status badge */}
          {badge && (
            <View style={[styles.statusBadge, { backgroundColor: badge.color }]}>
              <Text style={styles.statusText}>{badge.label}</Text>
            </View>
          )}

          {/* Clips count */}
          {item.clipsCount > 0 && (
            <View style={styles.clipsCountBadge}>
              <Text style={styles.clipsCountText}>
                {item.clipsCount} clip{item.clipsCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.projectInfo}>
          <Text style={styles.projectTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.projectMeta}>
            {new Date(item.updatedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            })}
          </Text>
        </View>

        {/* Long-press hint */}
        <View style={styles.deleteHint}>
          <Text style={styles.deleteHintText}>Appui long pour supprimer</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// =========================================================
// Main Component
// =========================================================
const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { user, profile } = useAuthStore();
  const { projects, isLoading, setProjects, setLoading, removeProject } = useProjectStore();

  const loadProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const summaries = await loadUserProjects(user.id);
      setProjects(summaries);
    } catch (err) {
      console.error('[HomeScreen] loadProjects error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, setProjects, setLoading]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleNewProject = () => navigation.navigate('Import');

  const handleOpenProject = (projectId: string) =>
    navigation.navigate('Editor', { projectId });

  const handleLongPressProject = (item: ProjectSummary) => {
    Alert.alert(
      'Supprimer le projet',
      `Supprimer "${item.title}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteProjectCompletely(item.id);
            if (ok) {
              removeProject(item.id);
              await clearProjectCache(item.id);
            } else {
              Alert.alert('Erreur', 'Impossible de supprimer le projet.');
            }
          },
        },
      ],
    );
  };

  const renderProject = ({ item, index }: { item: ProjectSummary; index: number }) => (
    <AnimatedProjectCard
      item={item}
      index={index}
      onPress={() => handleOpenProject(item.id)}
      onLongPress={() => handleLongPressProject(item)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🎬</Text>
      <Text style={styles.emptyTitle}>Aucun projet pour l'instant</Text>
      <Text style={styles.emptySubtitle}>
        Importe une vidéo pour créer ton premier projet EmpireCut
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={handleNewProject}
        testID="home-create-first-project"
      >
        <Text style={styles.emptyButtonText}>+ Créer un projet</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSkeletons = () => (
    <View style={styles.skeletonGrid}>
      {[1, 2, 3, 4].map((k) => <SkeletonCard key={k} />)}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Bonjour, <Text style={styles.greetingName}>{profile?.username ?? 'créateur'}</Text> 👋
          </Text>
          <Text style={styles.headerSub}>
            {isLoading ? 'Chargement…' : `${projects.length} projet${projects.length !== 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Bouton nouveau projet */}
        <TouchableOpacity
          style={styles.newProjectButton}
          onPress={handleNewProject}
          activeOpacity={0.8}
          testID="home-new-project-button"
        >
          <Text style={styles.newProjectIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Contenu */}
      {isLoading && projects.length === 0 ? (
        renderSkeletons()
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderProject}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.listContent,
            projects.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={isLoading ? null : renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadProjects}
              tintColor={Colors.accent.primary}
              colors={[Colors.accent.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  cardContainer: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  greeting: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text.primary },
  greetingName: { color: Colors.accent.primary },
  headerSub: { fontSize: FontSize.sm, color: Colors.text.muted, marginTop: 2 },
  newProjectButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.accent,
  },
  newProjectIcon: { fontSize: 24, color: Colors.white, lineHeight: 28 },

  // List
  listContent: { padding: Spacing[8], gap: CARD_GAP },
  listEmpty: { flex: 1 },
  columnWrapper: { gap: CARD_GAP },

  // Project card
  projectCard: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadow.sm,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  thumbnailImage: { width: '100%', height: '100%' },
  thumbnailPlaceholder: {
    flex: 1,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailIcon: { fontSize: 28 },
  durationBadge: {
    position: 'absolute',
    bottom: Spacing[2],
    right: Spacing[2],
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  durationText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: '600' },
  statusBadge: {
    position: 'absolute',
    top: Spacing[2],
    left: Spacing[2],
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  statusText: { color: Colors.white, fontSize: 9, fontWeight: '700' },
  clipsCountBadge: {
    position: 'absolute',
    top: Spacing[2],
    right: Spacing[2],
    backgroundColor: 'rgba(124,92,252,0.85)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  clipsCountText: { color: Colors.white, fontSize: 9, fontWeight: '700' },
  projectInfo: { padding: Spacing[4], gap: 2 },
  projectTitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text.primary },
  projectMeta: { fontSize: FontSize.xs, color: Colors.text.muted },
  deleteHint: { paddingHorizontal: Spacing[4], paddingBottom: Spacing[2] },
  deleteHintText: { fontSize: 8, color: Colors.text.muted },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[4] },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text.primary },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: Spacing[8],
  },
  emptyButton: {
    marginTop: Spacing[4],
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[10],
    paddingVertical: Spacing[5],
    ...Shadow.accent,
  },
  emptyButtonText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.base },

  // Skeleton
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing[8],
    gap: CARD_GAP,
  },
  skeletonCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  skeletonThumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.background.tertiary,
  },
  skeletonInfo: { padding: Spacing[4], gap: Spacing[2] },
  skeletonLine: {
    height: 12,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.sm,
  },
  skeletonLineShort: { width: '60%' },
});

export default HomeScreen;

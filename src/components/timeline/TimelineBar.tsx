/**
 * EmpireCut — Timeline Bar Component
 *
 * Composant de montage principal :
 * - Affiche une réglette graduée (time ruler)
 * - Affiche les clips vidéo alignés horizontalement
 * - Tête de lecture (playhead) rouge fixe au centre, la timeline défile en dessous
 * - Synchronisation bidirectionnelle : défilement manuel cherche dans la vidéo (seek),
 *   la lecture vidéo fait défiler la timeline automatiquement.
 */
import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from 'react-native';
import { useEditorStore } from '../../store/editor.store';
import { useTimeline } from '../../hooks/useTimeline';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { formatSeconds } from '../../utils/time.utils';
import TimelineThumbnail from './TimelineThumbnail';
import { TIMELINE_CONFIG, VIDEO_CONFIG } from '../../constants/app.constants';
import { thumbnailService } from '../../timeline/thumbnail.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMBNAIL_WIDTH = VIDEO_CONFIG.THUMBNAIL_WIDTH;

export const TimelineBar: React.FC = () => {
  const {
    clips,
    currentTimeMs,
    isPlaying,
    setCurrentTime,
    setSelectedClip,
    selectedClipId,
    textOverlays,
    selectedOverlayId,
    setSelectedOverlay,
  } = useEditorStore();
  const { layout, zoom, playheadX } = useTimeline();

  const scrollViewRef = useRef<ScrollView>(null);
  const [viewportWidth, setViewportWidth] = useState(SCREEN_WIDTH);
  const [scrollX, setScrollX] = useState(0);
  const [thumbnails, setThumbnails] = useState<Record<string, string[]>>({});
  const thumbnailsRef = useRef<Record<string, string[]>>({});
  
  // Mettre à jour la ref quand l'état change
  useEffect(() => {
    thumbnailsRef.current = thumbnails;
  }, [thumbnails]);

  // Réf pour savoir si le scroll actuel provient d'un drag utilisateur
  const isUserScrolling = useRef(false);
  const lastScrollX = useRef(0);

  const centerOffset = viewportWidth / 2;

  // Calculer la plage de temps visible dans le viewport
  const visibleRange = useMemo(() => {
    const startX = scrollX - centerOffset;
    const endX = startX + viewportWidth;
    return {
      startTime: Math.max(0, startX / zoom),
      endTime: endX / zoom,
    };
  }, [scrollX, viewportWidth, centerOffset, zoom]);

  // Chargement des vignettes réelles avec debounce et filtrage viewport
  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const loadThumbnails = async () => {
      const newThumbs: Record<string, string[]> = {};
      let changed = false;
      
      // On ne traite que les clips actuellement dans le store et VISIBLES ou proches
      for (const clip of clips) {
        if (!active) return;
        
        // Calculer les limites du clip
        const clipIdx = clips.indexOf(clip);
        const clipStartTime = clips.slice(0, clipIdx).reduce((acc, c) => acc + (c.trimEnd - c.trimStart), 0);
        const clipEndTime = clipStartTime + (clip.trimEnd - clip.trimStart);

        // Vérifier si le clip est visible (avec une marge de sécurité d'un demi-viewport)
        const isVisible = clipEndTime >= visibleRange.startTime - 5 && clipStartTime <= visibleRange.endTime + 5;

        if (!isVisible) continue;

        try {
          // Calculer le nombre de vignettes nécessaire pour remplir la largeur du clip au zoom actuel
          const clipDuration = clip.trimEnd - clip.trimStart;
          const clipWidth = clipDuration * zoom;
          
          const numThumbs = Math.min(50, Math.max(2, Math.ceil(clipWidth / THUMBNAIL_WIDTH)));
          
          // Ne régénérer que si le nombre de vignettes a changé significativement (utiliser la ref pour comparer)
          const currentClipThumbs = thumbnailsRef.current[clip.id];
          if (currentClipThumbs && Math.abs(currentClipThumbs.length - numThumbs) < 2) {
            continue;
          }

          const list = await thumbnailService.generateThumbnails(
            clip.uri,
            clip.metadata.durationSec,
            numThumbs
          );
          
          if (list && list.length > 0) {
            newThumbs[clip.id] = list.map((t) => t.uri);
            changed = true;
          }
        } catch (err) {
          console.error('[TimelineBar] Error generating thumbnails:', err);
        }
      }
      
      if (active && changed) {
        setThumbnails(prev => ({ ...prev, ...newThumbs }));
      }
    };

    // Debounce de 400ms pour éviter de spammer FFmpeg pendant le scroll/zoom
    timeoutId = setTimeout(loadThumbnails, 400);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [clips, zoom, visibleRange]);

  // Calculer la durée totale de la timeline
  const totalDurationSec = useMemo(() => {
    return clips.reduce((acc, c) => acc + (c.trimEnd - c.trimStart), 0);
  }, [clips]);

  // Synchroniser le défilement automatique lors de la lecture
  useEffect(() => {
    if (isPlaying && !isUserScrolling.current && scrollViewRef.current) {
      // Trouver la position de scroll nécessaire pour centrer la playhead
      const targetScrollX = playheadX;
      scrollViewRef.current.scrollTo({ x: targetScrollX, animated: false });
      setScrollX(targetScrollX);
    }
  }, [currentTimeMs, playheadX, isPlaying]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    lastScrollX.current = x;
    setScrollX(x);

    // Si le scroll vient de l'utilisateur, on met à jour le temps de lecture
    if (isUserScrolling.current) {
      const timeSec = x / zoom;
      setCurrentTime(Math.min(totalDurationSec, Math.max(0, timeSec)) * 1000);
    }
  };

  const handleScrollBeginDrag = () => {
    isUserScrolling.current = true;
  };

  const handleScrollEndDrag = () => {
    // Petit délai pour éviter les sauts lors de l'arrêt complet
    setTimeout(() => {
      isUserScrolling.current = false;
    }, 100);
  };

  const handleMomentumScrollBegin = () => {
    isUserScrolling.current = true;
  };

  const handleMomentumScrollEnd = () => {
    setTimeout(() => {
      isUserScrolling.current = false;
    }, 100);
  };

  // Génère les graduations de la réglette temporelle (ruler)
  const renderRuler = () => {
    const ticks = [];
    const step = zoom < 40 ? 5 : 2; // Fréquence des graduations en secondes selon le zoom
    const totalTicks = Math.ceil(totalDurationSec);

    for (let i = 0; i <= totalTicks; i += step) {
      const x = i * zoom;
      ticks.push(
        <View key={`tick-${i}`} style={[styles.rulerTickContainer, { left: x }]}>
          <View style={styles.rulerTick} />
          <Text style={styles.rulerText}>{formatSeconds(i)}</Text>
        </View>
      );
    }
    return ticks;
  };

  return (
    <View 
      style={styles.container}
      onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
    >
      {/* Règle temporelle et piste de clips */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={{
          paddingLeft: centerOffset,
          paddingRight: centerOffset,
        }}
      >
        <View style={[styles.timelineContent, { width: layout.totalWidth }]}>
          {/* Réglette graduée */}
          <View style={styles.rulerTrack}>
            {renderRuler()}
          </View>

          {/* Piste des clips vidéo */}
          <View style={styles.clipsTrack}>
            {layout.clips.map((clipLayout) => {
              const clip = clips.find((c) => c.id === clipLayout.clipId);
              if (!clip) return null;

              const isSelected = selectedClipId === clip.id;
              
              // Déterminer combien de vignettes on peut faire rentrer dans le clip
              const numThumbnails = Math.max(1, Math.ceil(clipLayout.width / THUMBNAIL_WIDTH));

              return (
                <TouchableOpacity
                  key={clip.id}
                  style={[
                    styles.clipBlock,
                    {
                      left: clipLayout.x,
                      width: clipLayout.width,
                    },
                    isSelected && styles.clipBlockSelected,
                  ]}
                  activeOpacity={0.9}
                  onPress={() => setSelectedClip(clip.id)}
                >
                  {/* Strip de vignettes */}
                  <View style={styles.thumbnailsStrip}>
                    {Array.from({ length: numThumbnails }).map((_, thumbIndex) => {
                      const thumbUri = thumbnails[clip.id]?.[thumbIndex];
                      return (
                        <TimelineThumbnail
                          key={`${clip.id}-thumb-${thumbIndex}`}
                          uri={thumbUri}
                          width={THUMBNAIL_WIDTH}
                          height={TIMELINE_CONFIG.TRACK_HEIGHT}
                        />
                      );
                    })}
                  </View>

                  {/* Titre du clip */}
                  <View style={styles.clipTitleContainer}>
                    <Text style={styles.clipTitleText} numberOfLines={1}>
                      {clip.metadata.filename}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Piste des textes superposés */}
          <View style={styles.textOverlaysTrack}>
            {textOverlays.map((overlay) => {
              // Convertir start/end en pixels
              const left = overlay.startTime * zoom;
              const width = (overlay.endTime - overlay.startTime) * zoom;
              const isSelected = selectedOverlayId === overlay.id;

              return (
                <TouchableOpacity
                  key={overlay.id}
                  style={[
                    styles.textOverlayBlock,
                    {
                      left,
                      width: Math.max(40, width),
                    },
                    isSelected && styles.textOverlayBlockSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedOverlay(overlay.id);
                    setSelectedClip(null); // Déselectionner le clip si on sélectionne du texte
                  }}
                >
                  <Text style={styles.textOverlayBlockText} numberOfLines={1}>
                    💬 {overlay.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Tête de lecture rouge fixe au centre */}
      <View style={[styles.playhead, { left: centerOffset }]}>
        <View style={styles.playheadCap} />
        <View style={styles.playheadLine} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 190,
    backgroundColor: Colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
    position: 'relative',
  },
  timelineContent: {
    height: '100%',
    position: 'relative',
  },
  rulerTrack: {
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    position: 'relative',
  },
  rulerTickContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: 40,
    marginLeft: -20, // Centrer au point exact
    top: 5,
  },
  rulerTick: {
    width: 1,
    height: 8,
    backgroundColor: Colors.text.muted,
  },
  rulerText: {
    fontSize: 9,
    color: Colors.text.muted,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  clipsTrack: {
    height: TIMELINE_CONFIG.TRACK_HEIGHT,
    marginTop: Spacing[4],
    position: 'relative',
  },
  clipBlock: {
    position: 'absolute',
    height: '100%',
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  clipBlockSelected: {
    borderColor: Colors.accent.primary,
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  thumbnailsStrip: {
    flexDirection: 'row',
    height: '100%',
  },
  clipTitleContainer: {
    position: 'absolute',
    bottom: 2,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  clipTitleText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '500',
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1, // Parfaitement centré sur l'axe
    zIndex: 10,
    pointerEvents: 'none',
  },
  playheadCap: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
    alignSelf: 'center',
    top: 25,
  },
  playheadLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.error,
  },
  textOverlaysTrack: {
    height: 30,
    marginTop: Spacing[3],
    position: 'relative',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
    paddingTop: 4,
  },
  textOverlayBlock: {
    position: 'absolute',
    height: 24,
    backgroundColor: 'rgba(124, 92, 252, 0.15)',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: Spacing[2],
  },
  textOverlayBlockSelected: {
    borderColor: Colors.accent.primary,
    backgroundColor: 'rgba(124, 92, 252, 0.35)',
    borderWidth: 1.5,
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  textOverlayBlockText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '600',
  },
});

export default TimelineBar;

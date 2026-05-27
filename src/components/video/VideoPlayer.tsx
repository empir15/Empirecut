/**
 * EmpireCut — Video Player Component
 *
 * Lecteur vidéo customisé pour l'éditeur :
 * - Lit le clip actif de la timeline dynamiquement
 * - Traduit le temps global de la timeline en temps local du clip
 * - Contrôles personnalisés (Play/Pause, temps, mute)
 * - Supporte la recherche de position (seek)
 */
import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { useEditorStore } from '../../store/editor.store';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import { formatSeconds } from '../../utils/time.utils';
import type { Clip } from '../../types/video.types';

// Traduit le temps absolu de la timeline en clip et temps relatif
export const getPlaybackState = (
  currentTimeMs: number,
  clips: Clip[]
): { activeClip: Clip | null; relativeTimeSec: number; elapsedBeforeSec: number } => {
  if (clips.length === 0) {
    return { activeClip: null, relativeTimeSec: 0, elapsedBeforeSec: 0 };
  }

  let elapsedBeforeSec = 0;
  const currentTimeSec = currentTimeMs / 1000;

  for (const clip of clips) {
    const clipDuration = clip.trimEnd - clip.trimStart;
    if (currentTimeSec >= elapsedBeforeSec && currentTimeSec < elapsedBeforeSec + clipDuration) {
      const relativeTimeSec = currentTimeSec - elapsedBeforeSec + clip.trimStart;
      return { activeClip: clip, relativeTimeSec, elapsedBeforeSec };
    }
    elapsedBeforeSec += clipDuration;
  }

  // Si on est à la fin ou après la fin
  const lastClip = clips[clips.length - 1];
  const lastClipDuration = lastClip.trimEnd - lastClip.trimStart;
  return {
    activeClip: lastClip,
    relativeTimeSec: lastClip.trimEnd,
    elapsedBeforeSec: elapsedBeforeSec - lastClipDuration,
  };
};

export const VideoPlayer: React.FC = () => {
  const {
    clips,
    currentTimeMs,
    isPlaying,
    isMuted,
    setCurrentTime,
    setPlaying,
    setMuted,
    textOverlays,
  } = useEditorStore();

  const videoRef = useRef<VideoRef>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Trackers de seek pour éviter les boucles d'update infinies
  const isSeeking = useRef(false);
  const lastSetTime = useRef(currentTimeMs);

  // 1. Calculer le clip actif et sa position relative
  const { activeClip, relativeTimeSec, elapsedBeforeSec } = useMemo(
    () => getPlaybackState(currentTimeMs, clips),
    [currentTimeMs, clips]
  );

  // Calcul de la durée totale de la timeline
  const totalDurationSec = useMemo(() => {
    return clips.reduce((acc, c) => acc + (c.trimEnd - c.trimStart), 0);
  }, [clips]);

  // Synchroniser le lecteur vidéo si le temps change de l'extérieur (ex: drag timeline)
  useEffect(() => {
    if (Math.abs(currentTimeMs - lastSetTime.current) > 250) {
      if (videoRef.current && !isSeeking.current) {
        videoRef.current.seek(relativeTimeSec);
      }
    }
    lastSetTime.current = currentTimeMs;
  }, [currentTimeMs, relativeTimeSec]);

  // Si aucun clip, afficher un placeholder premium
  if (!activeClip) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderEmoji}>🎬</Text>
        <Text style={styles.placeholderText}>Aucune vidéo chargée</Text>
      </View>
    );
  }

  const handleVideoProgress = (data: { currentTime: number }) => {
    // Si l'utilisateur est en train de seek (drag timeline), on n'update pas depuis le player
    if (isSeeking.current) return;

    // Calcul du temps global absolu
    const absoluteTimeSec = elapsedBeforeSec + (data.currentTime - activeClip.trimStart);
    const absoluteTimeMs = absoluteTimeSec * 1000;
    
    lastSetTime.current = absoluteTimeMs;
    setCurrentTime(absoluteTimeMs);

    // Si on a dépassé la fin trimmée du clip actuel
    if (data.currentTime >= activeClip.trimEnd) {
      // Si c'est le dernier clip, on arrête
      const isLastClip = clips[clips.length - 1].id === activeClip.id;
      if (isLastClip) {
        setPlaying(false);
        setCurrentTime(totalDurationSec * 1000);
      }
    }
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    
    // Positionner au bon endroit au chargement
    if (videoRef.current) {
      videoRef.current.seek(relativeTimeSec);
    }
  };

  const handleVideoEnd = () => {
    // Si c'est le dernier clip, on stoppe la lecture
    const isLastClip = clips[clips.length - 1].id === activeClip.id;
    if (isLastClip) {
      setPlaying(false);
      setCurrentTime(totalDurationSec * 1000);
    }
  };

  const handlePlayPause = () => {
    // Si on est à la fin du projet, recommencer du début
    if (currentTimeMs >= totalDurationSec * 1000) {
      setCurrentTime(0);
      if (videoRef.current) {
        const firstClip = clips[0];
        videoRef.current.seek(firstClip?.trimStart ?? 0);
      }
    }
    setPlaying(!isPlaying);
  };

  return (
    <View style={styles.container}>
      {/* Lecteur vidéo natif */}
      <Video
        ref={videoRef}
        source={{ uri: activeClip.uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        paused={!isPlaying}
        muted={isMuted}
        onProgress={handleVideoProgress}
        onLoad={handleVideoLoad}
        onEnd={handleVideoEnd}
        onLoadStart={() => setIsLoading(true)}
        progressUpdateInterval={100}
        playInBackground={false}
        disableFocus={true}
      />

      {/* Spinner de chargement */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.accent.primary} />
        </View>
      )}

      {/* Rendu des textes superposés */}
      <View style={styles.textOverlaysContainer} pointerEvents="none">
        {textOverlays
          .filter((overlay) => {
            const timeSec = currentTimeMs / 1000;
            return timeSec >= overlay.startTime && timeSec <= overlay.endTime;
          })
          .map((overlay) => (
            <Text
              key={overlay.id}
              style={[
                styles.textOverlay,
                {
                  left: `${overlay.positionX * 100}%`,
                  top: `${overlay.positionY * 100}%`,
                  fontSize: overlay.style.fontSize,
                  color: overlay.style.color,
                  backgroundColor: overlay.style.backgroundColor || 'transparent',
                  fontWeight: overlay.style.fontWeight || 'normal',
                  fontStyle: overlay.style.fontStyle || 'normal',
                  textAlign: overlay.style.textAlign || 'center',
                },
              ]}
            >
              {overlay.text}
            </Text>
          ))}
      </View>

      {/* Overlay des contrôles */}
      <View style={styles.overlay}>
        {/* Play/Pause central temporaire ou discret */}
        <TouchableOpacity style={styles.centerPlayBtn} onPress={handlePlayPause}>
          <View style={styles.playIconContainer}>
            <Text style={styles.playIconText}>{isPlaying ? '⏸' : '▶'}</Text>
          </View>
        </TouchableOpacity>

        {/* Contrôles du bas */}
        <View style={styles.bottomControls}>
          {/* Timecodes */}
          <Text style={styles.timecodeText}>
            {formatSeconds(currentTimeMs / 1000)} / {formatSeconds(totalDurationSec)}
          </Text>

          {/* Mute toggle */}
          <TouchableOpacity
            style={styles.controlIcon}
            onPress={() => setMuted(!isMuted)}
          >
            <Text style={styles.controlIconText}>{isMuted ? '🔇' : '🔊'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.black,
    position: 'relative',
    overflow: 'hidden',
  },
  placeholderContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[4],
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  placeholderText: {
    color: Colors.text.muted,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: Spacing[4],
  },
  centerPlayBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playIconText: {
    color: Colors.white,
    fontSize: 24,
    marginLeft: 2, // Ajustement visuel pour le triangle de play
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  timecodeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  controlIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIconText: {
    color: Colors.white,
    fontSize: FontSize.md,
  },
  textOverlaysContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  textOverlay: {
    position: 'absolute',
    padding: Spacing[2],
    borderRadius: BorderRadius.sm,
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
});

export default VideoPlayer;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useEditorStore } from '../../store/editor.store';
import { Colors } from '../../theme';
import { thumbnailService } from '../../timeline/thumbnail.service';

const ReorderClipItem: React.FC<{
  clip: any;
  index: number;
  isSelected: boolean;
  onPress: () => void;
}> = ({ clip, index, isSelected, onPress }) => {
  const [thumbUri, setThumbUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchThumb = async () => {
      // 1. Essayer de récupérer depuis le cache
      const cached = thumbnailService.getFromCache(clip.uri);
      if (cached && cached.length > 0) {
        setThumbUri(cached[0].uri);
        return;
      }
      
      // 2. Sinon générer une vignette à la volée
      try {
        const duration = clip.trimEnd - clip.trimStart;
        const generated = await thumbnailService.generateThumbnails(clip.uri, duration, 1);
        if (generated && generated.length > 0 && active) {
          setThumbUri(generated[0].uri);
        }
      } catch (err) {
        console.warn('Failed to generate thumbnail for reorder item:', err);
      }
    };

    fetchThumb();
    return () => {
      active = false;
    };
  }, [clip.uri, clip.trimStart, clip.trimEnd]);

  return (
    <TouchableOpacity
      style={[styles.clipItem, isSelected && styles.clipItemSelected]}
      onPress={onPress}
    >
      <View style={[styles.indexBadge, isSelected && styles.indexBadgeSelected]}>
        <Text style={[styles.indexText, isSelected && styles.indexTextSelected]}>{index + 1}</Text>
      </View>
      <View style={[styles.thumbnailWrapper, isSelected && styles.thumbnailWrapperSelected]}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text style={styles.videoIcon}>🎬</Text>
          </View>
        )}
      </View>
      <Text style={[styles.clipName, isSelected && styles.clipNameSelected]} numberOfLines={1}>
        {clip.metadata.filename || `Clip ${index + 1}`}
      </Text>
    </TouchableOpacity>
  );
};

export const ReorderTool: React.FC = () => {
  const { clips, reorderClips, selectedClipId, setSelectedClip, setCurrentTime } = useEditorStore();

  const getClipStartTime = (clipId: string, allClips: typeof clips) => {
    let elapsed = 0;
    for (const c of allClips) {
      if (c.id === clipId) {
        return elapsed;
      }
      elapsed += (c.trimEnd - c.trimStart);
    }
    return 0;
  };

  const handleMove = (direction: 'left' | 'right') => {
    if (!selectedClipId) return;
    
    const currentIndex = clips.findIndex((c) => c.id === selectedClipId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= clips.length) return;
    
    const newClips = [...clips];
    const [movedClip] = newClips.splice(currentIndex, 1);
    newClips.splice(newIndex, 0, movedClip);
    
    reorderClips(newClips);

    // Repositionne le lecteur vidéo au début de la nouvelle position du clip déplacé
    const newStartTimeSec = getClipStartTime(selectedClipId, newClips);
    setCurrentTime(newStartTimeSec * 1000);
  };

  return (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Réorganiser les clips</Text>
      
      <View style={styles.reorderContainer}>
        <TouchableOpacity 
          style={[styles.moveBtn, (!selectedClipId || clips.findIndex(c => c.id === selectedClipId) === 0) && styles.moveBtnDisabled]}
          onPress={() => handleMove('left')}
          disabled={!selectedClipId || clips.findIndex(c => c.id === selectedClipId) === 0}
        >
          <Text style={styles.moveBtnText}>← Déplacer gauche</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.moveBtn, (!selectedClipId || clips.findIndex(c => c.id === selectedClipId) === clips.length - 1) && styles.moveBtnDisabled]}
          onPress={() => handleMove('right')}
          disabled={!selectedClipId || clips.findIndex(c => c.id === selectedClipId) === clips.length - 1}
        >
          <Text style={styles.moveBtnText}>Déplacer droite →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clipsList}>
        {clips.map((clip, index) => {
          const isSelected = selectedClipId === clip.id;
          return (
            <ReorderClipItem
              key={clip.id}
              clip={clip}
              index={index}
              isSelected={isSelected}
              onPress={() => {
                setSelectedClip(clip.id);
                const startTimeSec = getClipStartTime(clip.id, clips);
                setCurrentTime(startTimeSec * 1000);
              }}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  panelContent: {
    padding: 16,
  },
  panelTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20,
  },
  reorderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 25,
  },
  moveBtn: {
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  moveBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  moveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  clipsList: {
    flexDirection: 'row',
  },
  clipItem: {
    width: 100,
    marginRight: 15,
    alignItems: 'center',
    position: 'relative',
  },
  clipItemSelected: {
    transform: [{ scale: 1.05 }],
  },
  indexBadge: {
    position: 'absolute',
    top: -5,
    left: -5,
    zIndex: 10,
    backgroundColor: Colors.accent.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  indexBadgeSelected: {
    backgroundColor: '#FFFFFF',
  },
  indexText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  indexTextSelected: {
    color: Colors.accent.primary,
  },
  thumbnailWrapper: {
    width: 90,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  thumbnailWrapperSelected: {
    borderColor: Colors.accent.primary,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIcon: {
    fontSize: 24,
  },
  clipName: {
    color: Colors.text.muted,
    fontSize: 10,
    textAlign: 'center',
    width: '100%',
  },
  clipNameSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});


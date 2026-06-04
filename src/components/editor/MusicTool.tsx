import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { pick, types, isCancel } from '@react-native-documents/picker';
import Slider from '../common/Slider';
import { Colors } from '../../theme';
import { useEditorStore } from '../../store/editor.store';

const PRESET_MUSIC_TRACKS = [
  { id: 'synth', title: 'Neon Drive', artist: 'Retro Wave', durationSec: 180, uri: 'mock_synth.mp3' },
  { id: 'lofi', title: 'Summer Chill', artist: 'Lofi Beats', durationSec: 210, uri: 'mock_lofi.mp3' },
  { id: 'tech', title: 'Dynamic Beat', artist: 'Tech House', durationSec: 150, uri: 'mock_tech.mp3' },
];

export const MusicTool: React.FC = () => {
  const { musicTrack, setMusicTrack } = useEditorStore();
  const [isPicking, setIsPicking] = useState(false);

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

  const handlePickFile = async () => {
    try {
      setIsPicking(true);
      const res = await pick({
        type: [types.audio],
      });

      const file = res[0];
      setMusicTrack({
        id: `local_${Date.now()}`,
        uri: file.uri,
        title: file.name || 'Musique locale',
        artist: 'Fichier local',
        durationSec: 0, // Sera calculé par FFprobe à l'export si besoin
        startTime: 0,
        volume: 0.5,
        fadeIn: true,
        fadeOut: true,
      });
    } catch (err) {
      if (isCancel(err)) {
        // User cancelled
      } else {
        Alert.alert('Erreur', 'Impossible de sélectionner le fichier audio');
        console.error(err);
      }
    } finally {
      setIsPicking(false);
    }
  };

  const handleMusicVolumeChange = (value: number) => {
    if (!musicTrack) return;
    setMusicTrack({
      ...musicTrack,
      volume: value,
    });
  };

  return (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Musique de fond</Text>
      
      {musicTrack && (
        <View style={styles.activeMusicCard}>
          <View style={styles.musicInfo}>
            <Text style={styles.musicTitleActive}>{musicTrack.title}</Text>
            <Text style={styles.musicArtistActive}>{musicTrack.artist}</Text>
          </View>
          <View style={styles.volumeControl}>
            <Text style={styles.volumeLabel}>Volume: {Math.round(musicTrack.volume * 100)}%</Text>
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={musicTrack.volume}
              onValueChange={handleMusicVolumeChange}
            />
          </View>
          <TouchableOpacity 
            style={styles.removeMusicBtn}
            onPress={() => setMusicTrack(null)}
          >
            <Text style={styles.removeMusicBtnText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.libraryHeader}>
        <Text style={styles.sectionTitle}>Bibliothèque</Text>
        <TouchableOpacity 
          style={styles.importBtn}
          onPress={handlePickFile}
          disabled={isPicking}
        >
          {isPicking ? (
            <ActivityIndicator size="small" color={Colors.accent.primary} />
          ) : (
            <Text style={styles.importBtnText}>+ Importer fichier</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.musicList}>
        {PRESET_MUSIC_TRACKS.map((track) => {
          const isSelected = musicTrack?.id === track.id;
          return (
            <TouchableOpacity
              key={track.id}
              style={[styles.musicItem, isSelected && styles.musicItemSelected]}
              onPress={() => handleSelectMusic(track)}
            >
              <View style={styles.musicIconBox}>
                <Text style={styles.musicIcon}>🎵</Text>
              </View>
              <Text style={styles.musicTitle} numberOfLines={1}>{track.title}</Text>
              <Text style={styles.musicArtist} numberOfLines={1}>{track.artist}</Text>
            </TouchableOpacity>
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
    marginBottom: 15,
  },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  importBtn: {
    backgroundColor: 'rgba(124, 92, 252, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.3)',
  },
  importBtnText: {
    color: Colors.accent.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  activeMusicCard: {
    backgroundColor: 'rgba(124, 92, 252, 0.1)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.3)',
    marginBottom: 20,
  },
  musicInfo: {
    marginBottom: 10,
  },
  musicTitleActive: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  musicArtistActive: {
    color: Colors.accent.primary,
    fontSize: 13,
  },
  volumeControl: {
    marginTop: 5,
  },
  volumeLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginBottom: 5,
  },
  volumeSlider: {
    width: '100%',
  },
  removeMusicBtn: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  removeMusicBtnText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
  },
  musicList: {
    flexDirection: 'row',
  },
  musicItem: {
    width: 120,
    marginRight: 15,
    alignItems: 'center',
  },
  musicItemSelected: {
    opacity: 0.5,
  },
  musicIconBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  musicIcon: {
    fontSize: 30,
  },
  musicTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  musicArtist: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    textAlign: 'center',
  },
});

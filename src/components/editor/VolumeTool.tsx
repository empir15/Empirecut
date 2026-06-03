import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '../common/Slider';
import { Colors } from '../../theme';
import { useEditorStore } from '../../store/editor.store';

export const VolumeTool: React.FC = () => {
  const { clips, selectedClipId, setClips } = useEditorStore();
  const selectedClip = clips.find((c) => c.id === selectedClipId);

  if (!selectedClip) return null;

  const handleVolumeChange = (value: number) => {
    const updatedClips = clips.map((c) =>
      c.id === selectedClipId ? { ...c, volume: value } : c
    );
    setClips(updatedClips);
  };

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
};

const styles = StyleSheet.create({
  panelContent: {
    padding: 16,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  panelTitle: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  panelValue: {
    color: Colors.accent.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 18,
    marginHorizontal: 10,
  },
  slider: {
    flex: 1,
  },
});

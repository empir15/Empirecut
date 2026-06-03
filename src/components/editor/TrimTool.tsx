import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '../common/Slider';
import { useEditorStore } from '../../store/editor.store';

export const TrimTool: React.FC = () => {
  const { clips, selectedClipId, setClips, setCurrentTime } = useEditorStore();
  const selectedClip = clips.find((c) => c.id === selectedClipId);

  if (!selectedClip) return null;

  const handleTrimStartChange = (value: number) => {
    // S'assurer que le trim de début ne dépasse pas le trim de fin
    const newStart = Math.min(value, selectedClip.trimEnd - 1);
    const updatedClips = clips.map((c) =>
      c.id === selectedClipId ? { ...c, trimStart: newStart } : c
    );
    setClips(updatedClips);

    // Seek le player sur le début du trim pour un retour visuel
    let elapsedBefore = 0;
    for (const c of clips) {
      if (c.id === selectedClipId) break;
      elapsedBefore += (c.trimEnd - c.trimStart);
    }
    setCurrentTime(elapsedBefore * 1000);
  };

  const handleTrimEndChange = (value: number) => {
    // S'assurer que le trim de fin n'est pas inférieur au trim de début
    const newEnd = Math.max(value, selectedClip.trimStart + 1);
    const updatedClips = clips.map((c) =>
      c.id === selectedClipId ? { ...c, trimEnd: newEnd } : c
    );
    setClips(updatedClips);

    // Seek le player sur la fin du trim pour un retour visuel
    let elapsedBefore = 0;
    for (const c of clips) {
      if (c.id === selectedClipId) break;
      elapsedBefore += (c.trimEnd - c.trimStart);
    }
    const offset = newEnd - selectedClip.trimStart;
    setCurrentTime((elapsedBefore + offset) * 1000);
  };

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
  trimSliders: {
    gap: 15,
  },
  trimControlRow: {
    marginBottom: 10,
  },
  trimLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 5,
  },
  trimSlider: {
    width: '100%',
  },
});

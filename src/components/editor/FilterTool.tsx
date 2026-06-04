import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../../theme';
import { useEditorStore } from '../../store/editor.store';
import type { FilterType } from '../../types/editor.types';

const FILTERS: { id: FilterType; label: string; emoji: string }[] = [
  { id: 'none', label: 'Aucun', emoji: '🖼️' },
  { id: 'chrome', label: 'Chrome', emoji: '📸' },
  { id: 'noir', label: 'Noir', emoji: '⚫' },
  { id: 'sepia', label: 'Sépia', emoji: '📜' },
  { id: 'vintage', label: 'Vintage', emoji: '🎞️' },
  { id: 'vivid', label: 'Vivid', emoji: '🌈' },
];

export const FilterTool: React.FC = () => {
  const { clips, selectedClipId, setClips } = useEditorStore();
  const selectedClip = clips.find((c) => c.id === selectedClipId);

  if (!selectedClip) return null;

  const handleSelectFilter = (filterId: FilterType) => {
    const updatedClips = clips.map((c) =>
      c.id === selectedClipId ? { ...c, filter: filterId } : c
    );
    setClips(updatedClips);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appliquer un filtre</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {FILTERS.map((f) => {
          const isActive = selectedClip.filter === f.id || (f.id === 'none' && !selectedClip.filter);
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterBtn, isActive && styles.filterBtnActive]}
              onPress={() => handleSelectFilter(f.id)}
            >
              <View style={[styles.emojiBg, isActive && styles.emojiBgActive]}>
                <Text style={styles.emoji}>{f.emoji}</Text>
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20,
  },
  scroll: {
    flexDirection: 'row',
  },
  filterBtn: {
    width: 80,
    alignItems: 'center',
    marginRight: 12,
  },
  filterBtnActive: {},
  emojiBg: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  emojiBgActive: {
    borderColor: Colors.accent.primary,
    backgroundColor: 'rgba(124, 92, 252, 0.15)',
  },
  emoji: {
    fontSize: 28,
  },
  label: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  labelActive: {
    color: Colors.accent.primary,
    fontWeight: '700',
  },
});

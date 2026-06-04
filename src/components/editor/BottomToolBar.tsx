import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Colors, FontSize } from '../../theme';
import { useEditorStore } from '../../store/editor.store';
import type { EditorTool } from '../../types/editor.types';

const TOOLS: { label: string; icon: string; key: EditorTool | 'split_action' | 'delete_action' }[] = [
  { label: 'Diviser', icon: '✂️', key: 'split_action' },
  { label: 'Suppr.', icon: '🗑️', key: 'delete_action' },
  { label: 'Ordre', icon: '🔄', key: 'reorder' },
  { label: 'Couper', icon: '📏', key: 'trim' },
  { label: 'Volume', icon: '🔊', key: 'volume' },
  { label: 'Filtre', icon: '🎨', key: 'filter' },
  { label: 'Trans.', icon: '🎬', key: 'transition' },
  { label: 'Texte', icon: '💬', key: 'text' },
  { label: 'Musique', icon: '🎵', key: 'music' },
];

export const BottomToolBar: React.FC = () => {
  const { 
    activeTool, 
    setActiveTool, 
    splitClip, 
    removeClip, 
    selectedClipId, 
    currentTimeMs, 
    clips 
  } = useEditorStore();

  const handlePress = (key: EditorTool | 'split_action' | 'delete_action') => {
    if (key === 'split_action') {
      if (clips.length === 0) return;
      splitClip(currentTimeMs);
    } else if (key === 'delete_action') {
      if (!selectedClipId) {
        Alert.alert('Info', 'Sélectionne un clip pour le supprimer');
        return;
      }
      removeClip(selectedClipId);
    } else {
      setActiveTool(key);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {TOOLS.map((tool) => {
        const isActive = activeTool === tool.key;
        return (
          <TouchableOpacity
            key={tool.key}
            style={[styles.toolBtn, isActive && styles.toolBtnActive]}
            onPress={() => handlePress(tool.key)}
          >
            <Text style={styles.toolIcon}>{tool.icon}</Text>
            <Text style={[styles.toolLabel, isActive && styles.toolLabelActive]}>
              {tool.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 70,
    backgroundColor: Colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  toolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    height: '100%',
    width: 80,
  },
  toolBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  toolIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  toolLabel: {
    color: Colors.text.muted,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  toolLabelActive: {
    color: Colors.accent.primary,
    fontWeight: '700',
  },
});

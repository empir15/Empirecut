import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSize } from '../../theme';
import { useEditorStore } from '../../store/editor.store';
import type { EditorTool } from '../../types/editor.types';

const TOOLS: { label: string; icon: string; key: EditorTool }[] = [
  { label: 'Couper', icon: '✂️', key: 'trim' },
  { label: 'Filtre', icon: '🎨', key: 'filter' },
  { label: 'Trans.', icon: '🎬', key: 'transition' },
  { label: 'Texte', icon: '💬', key: 'text' },
  { label: 'Musique', icon: '🎵', key: 'music' },
  { label: 'Volume', icon: '🔊', key: 'volume' },
];

export const BottomToolBar: React.FC = () => {
  const { activeTool, setActiveTool } = useEditorStore();

  return (
    <View style={styles.container}>
      {TOOLS.map((tool) => {
        const isActive = activeTool === tool.key;
        return (
          <TouchableOpacity
            key={tool.key}
            style={[styles.toolBtn, isActive && styles.toolBtnActive]}
            onPress={() => setActiveTool(tool.key)}
          >
            <Text style={styles.toolIcon}>{tool.icon}</Text>
            <Text style={[styles.toolLabel, isActive && styles.toolLabelActive]}>
              {tool.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: Colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 5,
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

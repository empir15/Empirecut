import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useEditorStore } from '../../store/editor.store';
import { VolumeTool } from './VolumeTool';
import { TrimTool } from './TrimTool';
import { TextTool } from './TextTool';
import { MusicTool } from './MusicTool';
import { FilterTool } from './FilterTool';
import { TransitionTool } from './TransitionTool';

export const ToolPanel: React.FC = () => {
  const { activeTool, clips, selectedClipId } = useEditorStore();
  const selectedClip = clips.find((c) => c.id === selectedClipId);

  if (activeTool === 'none') return null;

  if (!selectedClip && activeTool !== 'music' && activeTool !== 'text') {
    return (
      <View style={styles.panelPlaceholder}>
        <Text style={styles.panelPlaceholderText}>Sélectionne un clip dans la timeline pour l'éditer</Text>
      </View>
    );
  }

  const renderTool = () => {
    switch (activeTool) {
      case 'volume':
        return <VolumeTool />;
      case 'trim':
        return <TrimTool />;
      case 'text':
        return <TextTool />;
      case 'music':
        return <MusicTool />;
      case 'filter':
        return <FilterTool />;
      case 'transition':
        return <TransitionTool />;
      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderTool()}</View>;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 250,
  },
  panelPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 250,
  },
  panelPlaceholderText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

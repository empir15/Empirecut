import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../../theme';
import { useEditorStore } from '../../store/editor.store';
import type { TransitionType } from '../../types/editor.types';

const TRANSITIONS: { id: TransitionType; label: string; icon: string }[] = [
  { id: 'none', label: 'Aucune', icon: '🚫' },
  { id: 'fade', label: 'Fondu', icon: '🌑' },
  { id: 'wipeleft', label: 'Balayage G', icon: '⬅️' },
  { id: 'wiperight', label: 'Balayage D', icon: '➡️' },
  { id: 'slideup', label: 'Glissement H', icon: '⬆️' },
];

export const TransitionTool: React.FC = () => {
  const { clips, selectedClipId, setClips } = useEditorStore();
  const selectedClip = clips.find((c) => c.id === selectedClipId);

  if (!selectedClip) return null;

  const handleSelectTransition = (transId: TransitionType) => {
    const updatedClips = clips.map((c) =>
      c.id === selectedClipId ? { ...c, transition: transId } : c
    );
    setClips(updatedClips);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transition d'entrée</Text>
      <Text style={styles.subTitle}>La transition s'appliquera entre le clip précédent et celui-ci.</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {TRANSITIONS.map((t) => {
          const isActive = selectedClip.transition === t.id || (t.id === 'none' && !selectedClip.transition);
          return (
            <TouchableOpacity
              key={t.id}
              style={styles.transBtn}
              onPress={() => handleSelectTransition(t.id)}
            >
              <View style={[styles.iconBg, isActive && styles.iconBgActive]}>
                <Text style={styles.icon}>{t.icon}</Text>
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>{t.label}</Text>
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
    marginBottom: 4,
  },
  subTitle: {
    color: Colors.text.muted,
    fontSize: 12,
    marginBottom: 20,
  },
  scroll: {
    flexDirection: 'row',
  },
  transBtn: {
    width: 90,
    alignItems: 'center',
    marginRight: 12,
  },
  iconBg: {
    width: 70,
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  iconBgActive: {
    borderColor: Colors.accent.primary,
    backgroundColor: 'rgba(124, 92, 252, 0.15)',
  },
  icon: {
    fontSize: 24,
  },
  label: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.accent.primary,
    fontWeight: '700',
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '../common/Slider';
import { useEditorStore } from '../../store/editor.store';
import { Colors } from '../../theme';
import { formatSeconds } from '../../utils/time.utils';

export const TrimTool: React.FC = () => {
  const { 
    clips, 
    selectedClipId, 
    setClips, 
    setCurrentTime, 
    setActiveTool,
    setIsEditingTrim
  } = useEditorStore();
  
  const selectedClip = clips.find((c) => c.id === selectedClipId);

  // État local pour le trim temporaire (avant validation)
  const [tempTrim, setTempTrim] = useState({ start: 0, end: 0 });

  useEffect(() => {
    if (selectedClip) {
      setTempTrim({ 
        start: selectedClip.trimStart, 
        end: selectedClip.trimEnd 
      });
      setIsEditingTrim(true);
    }
    return () => setIsEditingTrim(false);
  }, [selectedClip, setIsEditingTrim]);

  if (!selectedClip) return null;

  const calculateGlobalTime = (clipStartTrim: number) => {
    let elapsedBefore = 0;
    for (const c of clips) {
      if (c.id === selectedClipId) break;
      elapsedBefore += (c.trimEnd - c.trimStart);
    }
    return (elapsedBefore + (clipStartTrim - selectedClip.trimStart)) * 1000;
  };

  const handleTrimStartChange = (value: number) => {
    const newStart = Math.min(value, tempTrim.end - 0.5);
    setTempTrim(prev => ({ ...prev, start: newStart }));
    setCurrentTime(calculateGlobalTime(newStart));
  };

  const handleTrimEndChange = (value: number) => {
    const newEnd = Math.max(value, tempTrim.start + 0.5);
    setTempTrim(prev => ({ ...prev, end: newEnd }));
    
    // Pour le trim de fin, on veut voir la frame de fin
    let elapsedBefore = 0;
    for (const c of clips) {
      if (c.id === selectedClipId) break;
      elapsedBefore += (c.trimEnd - c.trimStart);
    }
    const offset = newEnd - selectedClip.trimStart;
    setCurrentTime((elapsedBefore + offset) * 1000);
  };

  const handleConfirm = () => {
    const updatedClips = clips.map((c) =>
      c.id === selectedClipId ? { ...c, trimStart: tempTrim.start, trimEnd: tempTrim.end } : c
    );
    setClips(updatedClips);
    setActiveTool('none');
  };

  const handleCancel = () => {
    setActiveTool('none');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerBtn}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Modifier la durée</Text>
        <TouchableOpacity onPress={handleConfirm} style={styles.headerBtn}>
          <Text style={styles.confirmText}>Valider</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Text style={styles.timeLabel}>{formatSeconds(tempTrim.start)}</Text>
          <Text style={styles.durationLabel}>
            Durée: {(tempTrim.end - tempTrim.start).toFixed(1)}s
          </Text>
          <Text style={styles.timeLabel}>{formatSeconds(tempTrim.end)}</Text>
        </View>

        <View style={styles.visualTrimContainer}>
          {/* Simulation d'une timeline visuelle plus riche */}
          <View style={styles.trackBg}>
            <View 
              style={[
                styles.selectionHighlight, 
                { 
                  left: `${(tempTrim.start / selectedClip.metadata.durationSec) * 100}%`,
                  right: `${(1 - tempTrim.end / selectedClip.metadata.durationSec) * 100}%`
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.slidersContainer}>
          <View style={styles.sliderRow}>
            <Text style={styles.label}>Début</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={selectedClip.metadata.durationSec}
              step={0.1}
              value={tempTrim.start}
              onValueChange={handleTrimStartChange}
            />
          </View>
          <View style={styles.sliderRow}>
            <Text style={styles.label}>Fin</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={selectedClip.metadata.durationSec}
              step={0.1}
              value={tempTrim.end}
              onValueChange={handleTrimEndChange}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  headerBtn: {
    padding: 4,
  },
  cancelText: {
    color: Colors.text.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmText: {
    color: Colors.accent.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeLabel: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  durationLabel: {
    color: Colors.accent.primary,
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: 'rgba(124, 92, 252, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  visualTrimContainer: {
    height: 40,
    marginBottom: 30,
    justifyContent: 'center',
  },
  trackBg: {
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectionHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(124, 92, 252, 0.3)',
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.accent.primary,
  },
  slidersContainer: {
    gap: 20,
  },
  sliderRow: {
    gap: 8,
  },
  label: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});

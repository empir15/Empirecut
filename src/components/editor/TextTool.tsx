import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import Slider from '../common/Slider';
import { Colors } from '../../theme';
import { useEditorStore } from '../../store/editor.store';
import type { TextOverlay } from '../../types/editor.types';

const PRESET_COLORS = ['#FFFFFF', '#FFE600', '#FF3B30', '#4CD964', '#7C5CFC', '#5AC8FA'];

export const TextTool: React.FC = () => {
  const {
    clips,
    textOverlays,
    selectedOverlayId,
    currentTimeMs,
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
    setSelectedOverlay,
  } = useEditorStore();

  const selectedOverlay = textOverlays.find((o) => o.id === selectedOverlayId);
  const totalDurationSec = clips.reduce((acc, c) => acc + (c.trimEnd - c.trimStart), 0);

  const handleAddText = () => {
    const start = currentTimeMs / 1000;
    const end = Math.min(totalDurationSec, start + 3); // 3 secondes par défaut
    
    const newOverlay: TextOverlay = {
      id: `text_${Date.now()}`,
      text: 'Nouveau Texte',
      style: {
        fontSize: 18,
        color: '#FFFFFF',
        textAlign: 'center',
      },
      animation: 'none',
      startTime: start,
      endTime: end,
      positionX: 0.5,
      positionY: 0.5,
    };
    addTextOverlay(newOverlay);
    setSelectedOverlay(newOverlay.id);
  };

  if (selectedOverlay) {
    return (
      <ScrollView contentContainerStyle={styles.panelScrollContent}>
        <View style={styles.panelHeaderRow}>
          <Text style={styles.panelTitle}>Éditer le texte</Text>
          <TouchableOpacity
            style={styles.deleteOverlayBtn}
            onPress={() => removeTextOverlay(selectedOverlay.id)}
          >
            <Text style={styles.deleteOverlayBtnText}>Supprimer</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.textInput}
          value={selectedOverlay.text}
          onChangeText={(val) => updateTextOverlay(selectedOverlay.id, { text: val })}
          placeholder="Texte de l'overlay..."
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
        />

        {/* Paramètres style */}
        <View style={styles.styleOptionsRow}>
          <View style={styles.fontSizeControl}>
            <Text style={styles.sliderLabelMini}>Taille : {selectedOverlay.style.fontSize}px</Text>
            <Slider
              style={styles.sliderMini}
              minimumValue={10}
              maximumValue={40}
              step={1}
              value={selectedOverlay.style.fontSize}
              onValueChange={(val) =>
                updateTextOverlay(selectedOverlay.id, {
                  style: { ...selectedOverlay.style, fontSize: val },
                })
              }
            />
          </View>
        </View>

        {/* Couleurs */}
        <View style={styles.colorPaletteGroup}>
          <Text style={styles.sliderLabelMini}>Couleur du texte :</Text>
          <View style={styles.colorRow}>
            {PRESET_COLORS.map((c) => {
              const isColorSelected = selectedOverlay.style.color === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    isColorSelected && styles.colorCircleSelected,
                  ]}
                  onPress={() =>
                    updateTextOverlay(selectedOverlay.id, {
                      style: { ...selectedOverlay.style, color: c },
                    })
                  }
                />
              );
            })}
          </View>
        </View>

        {/* Positions */}
        <View style={styles.positionSliders}>
          <View style={styles.sliderMiniRow}>
            <Text style={styles.sliderLabelMini}>Position X : {Math.round(selectedOverlay.positionX * 100)}%</Text>
            <Slider
              style={styles.sliderMini}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              value={selectedOverlay.positionX}
              onValueChange={(val) => updateTextOverlay(selectedOverlay.id, { positionX: val })}
            />
          </View>
          <View style={styles.sliderMiniRow}>
            <Text style={styles.sliderLabelMini}>Position Y : {Math.round(selectedOverlay.positionY * 100)}%</Text>
            <Slider
              style={styles.sliderMini}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              value={selectedOverlay.positionY}
              onValueChange={(val) => updateTextOverlay(selectedOverlay.id, { positionY: val })}
            />
          </View>
        </View>

        {/* Timings */}
        <View style={styles.positionSliders}>
          <View style={styles.sliderMiniRow}>
            <Text style={styles.sliderLabelMini}>Début : {selectedOverlay.startTime.toFixed(1)}s</Text>
            <Slider
              style={styles.sliderMini}
              minimumValue={0}
              maximumValue={totalDurationSec}
              step={0.1}
              value={selectedOverlay.startTime}
              onValueChange={(val) =>
                updateTextOverlay(selectedOverlay.id, {
                  startTime: Math.min(val, selectedOverlay.endTime - 0.5),
                })
              }
            />
          </View>
          <View style={styles.sliderMiniRow}>
            <Text style={styles.sliderLabelMini}>Fin : {selectedOverlay.endTime.toFixed(1)}s</Text>
            <Slider
              style={styles.sliderMini}
              minimumValue={0}
              maximumValue={totalDurationSec}
              step={0.1}
              value={selectedOverlay.endTime}
              onValueChange={(val) =>
                updateTextOverlay(selectedOverlay.id, {
                  endTime: Math.max(val, selectedOverlay.startTime + 0.5),
                })
              }
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.deselectBtn}
          onPress={() => setSelectedOverlay(null)}
        >
          <Text style={styles.deselectBtnText}>Désélectionner</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Ajouter du Texte</Text>
      <Text style={styles.panelSubText}>
        Ajoute des overlays texte à ton montage. Tu pourras ensuite les déplacer et changer leur style.
      </Text>
      <TouchableOpacity style={styles.addBtn} onPress={handleAddText}>
        <Text style={styles.addBtnText}>+ Ajouter un texte</Text>
      </TouchableOpacity>

      {textOverlays.length > 0 && (
        <View style={styles.existingTextsList}>
          <Text style={styles.listSectionTitle}>Textes créés :</Text>
          <ScrollView style={styles.textsScroll} showsVerticalScrollIndicator={false}>
            {textOverlays.map((o) => (
              <TouchableOpacity
                key={o.id}
                style={styles.textListItem}
                onPress={() => setSelectedOverlay(o.id)}
              >
                <Text style={styles.textListItemText} numberOfLines={1}>
                  💬 {o.text} ({o.startTime.toFixed(1)}s - {o.endTime.toFixed(1)}s)
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  panelContent: {
    padding: 16,
    flex: 1,
  },
  panelScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  panelTitle: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  panelSubText: {
    color: Colors.text.muted,
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    color: Colors.text.primary,
    fontSize: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  styleOptionsRow: {
    marginBottom: 20,
  },
  fontSizeControl: {
    flex: 1,
  },
  colorPaletteGroup: {
    marginBottom: 20,
  },
  colorRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderColor: Colors.text.primary,
    transform: [{ scale: 1.1 }],
  },
  positionSliders: {
    marginBottom: 15,
    gap: 10,
  },
  sliderMiniRow: {
    marginBottom: 5,
  },
  sliderLabelMini: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginBottom: 2,
  },
  sliderMini: {
    width: '100%',
    height: 30,
  },
  addBtn: {
    backgroundColor: Colors.accent.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addBtnText: {
    color: Colors.background.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  deleteOverlayBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  deleteOverlayBtnText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  deselectBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deselectBtnText: {
    color: Colors.text.muted,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  existingTextsList: {
    flex: 1,
    marginTop: 10,
  },
  listSectionTitle: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  textsScroll: {
    flex: 1,
  },
  textListItem: {
    backgroundColor: Colors.background.tertiary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  textListItemText: {
    color: Colors.text.primary,
    fontSize: 13,
  },
});

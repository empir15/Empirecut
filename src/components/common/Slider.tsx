/**
 * EmpireCut — Custom Slider Component
 *
 * Composant Slider en pur React Native (sans dépendances natives).
 * Gère le toucher et le glissement pour modifier une valeur numérique.
 * Design premium violet aligné sur le thème sombre de l'application.
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../theme';

interface SliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  onValueChange: (value: number) => void;
  style?: ViewStyle;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  minimumValue,
  maximumValue,
  step = 0.01,
  onValueChange,
  style,
}) => {
  const [width, setWidth] = useState(0);

  const updateValue = (event: GestureResponderEvent) => {
    if (width === 0) return;
    const touchX = event.nativeEvent.locationX;
    const ratio = Math.min(1, Math.max(0, touchX / width));
    const rawValue = minimumValue + ratio * (maximumValue - minimumValue);
    
    // Appliquer le pas (step)
    const steppedValue = Math.round(rawValue / step) * step;
    const clampedValue = Math.min(maximumValue, Math.max(minimumValue, steppedValue));
    
    onValueChange(clampedValue);
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: updateValue,
      onPanResponderMove: updateValue,
    })
  ).current;

  // Calcul du pourcentage d'avancement pour le positionnement visuel
  const range = maximumValue - minimumValue;
  const percentage = range > 0 ? ((value - minimumValue) / range) * 100 : 0;

  return (
    <View
      style={[styles.container, style]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={styles.track}>
        <View style={[styles.activeTrack, { width: `${percentage}%` }]} />
      </View>
      <View style={[styles.thumb, { left: `${percentage}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 30,
    justifyContent: 'center',
    position: 'relative',
    minWidth: 100,
  },
  track: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    width: '100%',
  },
  activeTrack: {
    height: '100%',
    backgroundColor: Colors.accent.primary,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.accent.primary,
    marginLeft: -7,
  },
});

export default Slider;

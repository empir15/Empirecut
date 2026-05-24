/**
 * EmpireCut — LoadingOverlay Component
 *
 * Overlay plein écran semi-transparent avec spinner
 * et message optionnel. Utilisé pendant les opérations FFmpeg.
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import { useUIStore } from '../../store/ui.store';

const LoadingOverlay: React.FC = () => {
  const { isGlobalLoading, globalLoadingMessage } = useUIStore();

  if (!isGlobalLoading) return null;

  return (
    <Modal transparent animationType="fade" visible={isGlobalLoading} statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={Colors.accent.primary} />
          {globalLoadingMessage ? (
            <Text style={styles.message}>{globalLoadingMessage}</Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.background.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.background.elevated,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing[12],
    paddingHorizontal: Spacing[16],
    alignItems: 'center',
    gap: Spacing[6],
    borderWidth: 1,
    borderColor: Colors.border.default,
    minWidth: 200,
  },
  message: {
    color: Colors.text.secondary,
    fontSize: FontSize.base,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default LoadingOverlay;

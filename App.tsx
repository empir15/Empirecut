/**
 * EmpireCut — App.tsx
 * Point d'entrée de l'application.
 *
 * Ordre des providers (important) :
 * 1. GestureHandlerRootView  — Doit envelopper TOUT (requis par Gesture Handler)
 * 2. SafeAreaProvider        — Insets safe area
 * 3. NavigationContainer     — Container de navigation React Navigation
 * 4. RootNavigator           — Notre navigator principal avec guard auth
 *
 * StatusBar est gérée dans chaque écran individuellement
 * pour un meilleur contrôle selon le contexte (dark/light).
 */
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { cleanupTempFiles } from './src/utils/cleanup.utils';

const App: React.FC = () => {
  useEffect(() => {
    // Nettoyage au démarrage (mode non-force pour garder les thumbnails récentes)
    cleanupTempFiles(false);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;

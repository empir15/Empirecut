/**
 * EmpireCut — Root Navigator
 *
 * Gère le guard d'authentification :
 * - Splash (initialisation)
 * - Auth Stack (non connecté)
 * - App Stack (connecté)
 *
 * Écoute onAuthStateChange de Supabase pour basculer
 * automatiquement entre les deux stacks.
 */
import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthStore } from '../store/auth.store';
import { onAuthStateChange } from '../supabase/auth';
import { getProfile } from '../supabase/database';

import SplashScreen from '../screens/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import ImportScreen from '../screens/ImportScreen';
import EditorScreen from '../screens/EditorScreen';
import ExportScreen from '../screens/ExportScreen';

import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isInitializing, setSession, setProfile, setInitializing } =
    useAuthStore();

  useEffect(() => {
    // Écoute les changements de session Supabase
    const unsubscribe = onAuthStateChange(async (session) => {
      setSession(session);

      // Charge le profil si connecté
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        setProfile(profile);
      } else {
        setProfile(null);
      }

      setInitializing(false);
    });

    return unsubscribe;
  }, [setSession, setProfile, setInitializing]);

  if (isInitializing) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="App" component={AppNavigator} />
          <Stack.Screen
            name="Import"
            component={ImportScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="Editor"
            component={EditorScreen}
            options={{ animation: 'slide_from_right', gestureEnabled: false }}
          />
          <Stack.Screen
            name="Export"
            component={ExportScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

/**
 * EmpireCut — App Navigator (Bottom Tabs)
 * Navigation principale post-authentification
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Text } from 'react-native';
import { Colors, Spacing, FontSize } from '../theme';
import type { AppTabParamList } from './types';

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<AppTabParamList>();

// Icônes custom légères (emojis en dev, à remplacer par vector-icons)
const TAB_ICONS: Record<string, string> = {
  HomeTab: '✦',
  ProfileTab: '◎',
  SettingsTab: '⚙',
};

const TAB_LABELS: Record<string, string> = {
  HomeTab: 'Projets',
  ProfileTab: 'Profil',
  SettingsTab: 'Paramètres',
};

interface TabIconProps {
  routeName: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ routeName, focused }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
      {TAB_ICONS[routeName] ?? '•'}
    </Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
      {TAB_LABELS[routeName] ?? routeName}
    </Text>
  </View>
);

export const AppNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: styles.tabBar,
      // eslint-disable-next-line react/no-unstable-nested-components
      tabBarIcon: ({ focused }) => (
        <TabIcon routeName={route.name} focused={focused} />
      ),
    })}>
    <Tab.Screen name="HomeTab" component={HomeScreen} />
    <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    <Tab.Screen name="SettingsTab" component={SettingsScreen} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBar.background,
    borderTopColor: Colors.tabBar.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 0,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingTop: Spacing[2],
  },
  tabIcon: {
    fontSize: FontSize.lg,
    color: Colors.tabBar.inactive,
  },
  tabIconActive: {
    color: Colors.tabBar.active,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    color: Colors.tabBar.inactive,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.tabBar.active,
  },
});

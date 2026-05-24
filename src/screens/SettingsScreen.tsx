/**
 * EmpireCut — Settings Screen
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

interface SettingRow {
  id: string;
  icon: string;
  label: string;
  value?: string;
  toggle?: boolean;
}

const SETTINGS: SettingRow[] = [
  { id: 'quality', icon: '🎞', label: 'Qualité export par défaut', value: '720p' },
  { id: 'autoSave', icon: '💾', label: 'Sauvegarde automatique', toggle: true },
  { id: 'notifications', icon: '🔔', label: 'Notifications', toggle: true },
  { id: 'storage', icon: '☁️', label: 'Stockage utilisé', value: '0 MB / 5 GB' },
  { id: 'version', icon: 'ℹ️', label: 'Version', value: '1.0.0' },
];

const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Paramètres</Text>
      </View>
      <View style={styles.section}>
        {SETTINGS.map((item, index) => (
          <React.Fragment key={item.id}>
            <TouchableOpacity style={styles.row} testID={`settings-${item.id}`}>
              <Text style={styles.rowIcon}>{item.icon}</Text>
              <Text style={styles.rowLabel}>{item.label}</Text>
              {item.toggle ? (
                <Switch
                  value={false}
                  trackColor={{ false: Colors.background.tertiary, true: Colors.accent.primary }}
                  thumbColor={Colors.white}
                />
              ) : (
                <Text style={styles.rowValue}>{item.value}</Text>
              )}
            </TouchableOpacity>
            {index < SETTINGS.length - 1 && <View style={styles.separator} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    paddingHorizontal: Spacing[8], paddingVertical: Spacing[6],
    borderBottomWidth: 1, borderBottomColor: Colors.border.subtle,
  },
  screenTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text.primary },
  section: {
    margin: Spacing[8],
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing[7], gap: Spacing[4],
  },
  rowIcon: { fontSize: 20 },
  rowLabel: { flex: 1, fontSize: FontSize.base, color: Colors.text.primary, fontWeight: '500' },
  rowValue: { fontSize: FontSize.sm, color: Colors.text.muted },
  separator: { height: 1, backgroundColor: Colors.border.subtle, marginLeft: Spacing[14] },
});

export default SettingsScreen;

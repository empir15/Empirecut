/**
 * EmpireCut — Profile Screen (Phase 2 — Complet)
 * - Avatar avec initiale
 * - Username éditable
 * - Stats projets
 * - Logout avec confirmation
 * - Détails du compte
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../theme';
import { useAuthStore } from '../store/auth.store';
import { useProjectStore } from '../store/project.store';
import { signOut } from '../supabase/auth';
import { updateProfile } from '../supabase/database';
import { useUIStore } from '../store/ui.store';
import { validateUsername } from '../utils/validation.utils';

const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { profile, user, clearAuth, setProfile } = useAuthStore();
  const { projects, clearProjects } = useProjectStore();
  const { showToast } = useUIStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(profile?.username ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveUsername = useCallback(async () => {
    const v = validateUsername(editUsername);
    if (!v.valid) {
      showToast(v.error ?? 'Nom invalide', 'error');
      return;
    }
    if (!user) return;

    setIsSaving(true);
    const success = await updateProfile(user.id, { username: editUsername.trim() });
    setIsSaving(false);

    if (success) {
      setProfile(profile ? { ...profile, username: editUsername.trim() } : null);
      setIsEditing(false);
      showToast('Profil mis à jour ✓', 'success');
    } else {
      showToast('Erreur de mise à jour', 'error');
    }
  }, [editUsername, user, profile, setProfile, showToast]);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Tu vas être déconnecté de ton compte.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            clearAuth();
            clearProjects();
          },
        },
      ],
    );
  };

  const stats = [
    { label: 'Projets', value: projects.length, icon: '📂' },
    { label: 'Exportés', value: projects.filter(p => p.status === 'exported').length, icon: '✓' },
    { label: 'Brouillons', value: projects.filter(p => p.status === 'draft').length, icon: '📝' },
  ];

  const initial = (profile?.username ?? user?.email ?? 'U')[0].toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Mon Profil</Text>
        </View>

        {/* Avatar Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.avatarGlow} />
          </View>

          <View style={styles.profileInfo}>
            {isEditing ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  autoFocus
                  maxLength={30}
                  placeholder="Nom d'utilisateur"
                  placeholderTextColor={Colors.text.muted}
                />
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveUsername}
                  disabled={isSaving}>
                  {isSaving ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.saveBtnText}>✓</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setIsEditing(false); setEditUsername(profile?.username ?? ''); }}>
                  <Text style={styles.cancelBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={styles.usernameRow}>
                <Text style={styles.username}>{profile?.username ?? 'Utilisateur'}</Text>
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.email}>{user?.email ?? ''}</Text>
            {memberSince ? (
              <Text style={styles.memberSince}>Membre depuis {memberSince}</Text>
            ) : null}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Compte</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="🔒" label="Changer le mot de passe" testID="profile-change-password" />
            <View style={styles.menuSep} />
            <MenuItem icon="☁️" label="Stockage cloud" value="0 MB" testID="profile-storage" />
            <View style={styles.menuSep} />
            <MenuItem icon="🗑" label="Supprimer le compte" danger testID="profile-delete-account" />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
          testID="profile-logout-button">
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

// Menu item helper
const MenuItem: React.FC<{
  icon: string;
  label: string;
  value?: string;
  danger?: boolean;
  testID?: string;
}> = ({ icon, label, value, danger, testID }) => (
  <TouchableOpacity style={styles.menuItem} testID={testID}>
    <Text style={styles.menuItemIcon}>{icon}</Text>
    <Text style={[styles.menuItemLabel, danger && styles.menuItemDanger]}>{label}</Text>
    {value ? <Text style={styles.menuItemValue}>{value}</Text> : null}
    <Text style={styles.menuItemChevron}>›</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  scrollContent: { paddingBottom: Spacing[12] },
  header: {
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  screenTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text.primary },

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[6],
    padding: Spacing[8],
    margin: Spacing[8],
    marginBottom: Spacing[5],
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadow.sm,
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  avatarText: { fontSize: FontSize['2xl'], fontWeight: '700', color: Colors.white },
  avatarGlow: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.accent.glow,
    transform: [{ scale: 1.3 }],
  },
  profileInfo: { flex: 1, gap: Spacing[1] },
  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  username: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text.primary },
  editIcon: { fontSize: 14 },
  email: { fontSize: FontSize.sm, color: Colors.text.muted },
  memberSince: { fontSize: FontSize.xs, color: Colors.text.muted, marginTop: Spacing[1] },

  // Edit
  editRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  editInput: {
    flex: 1,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.accent.primary,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    color: Colors.text.primary,
    fontSize: FontSize.base,
  },
  saveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  cancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { color: Colors.text.muted, fontSize: 14 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[8],
    gap: Spacing[4],
    marginBottom: Spacing[8],
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing[5],
    alignItems: 'center',
    gap: Spacing[1],
  },
  statIcon: { fontSize: 18 },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.accent.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.text.muted, fontWeight: '500' },

  // Menu
  menuSection: { paddingHorizontal: Spacing[8], marginBottom: Spacing[6] },
  menuTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.muted,
    letterSpacing: 0.5,
    marginBottom: Spacing[3],
    marginLeft: Spacing[1],
  },
  menuCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[6],
    gap: Spacing[4],
  },
  menuItemIcon: { fontSize: 18 },
  menuItemLabel: { flex: 1, fontSize: FontSize.base, color: Colors.text.primary, fontWeight: '500' },
  menuItemDanger: { color: Colors.error },
  menuItemValue: { fontSize: FontSize.sm, color: Colors.text.muted },
  menuItemChevron: { fontSize: FontSize.lg, color: Colors.text.muted },
  menuSep: { height: 1, backgroundColor: Colors.border.subtle, marginLeft: Spacing[14] },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
    marginHorizontal: Spacing[8],
    marginTop: Spacing[4],
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    paddingVertical: Spacing[6],
  },
  logoutIcon: { fontSize: 18 },
  logoutText: { color: Colors.error, fontWeight: '700', fontSize: FontSize.base },
});

export default ProfileScreen;

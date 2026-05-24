/**
 * EmpireCut — Register Screen (Phase 2 — Complet)
 * - Validation en temps réel
 * - Force du mot de passe
 * - Animations d'entrée
 * - Supabase signUp connecté
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Animated,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../theme';
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from '../../utils/validation.utils';
import { signUp } from '../../supabase/auth';
import { useUIStore } from '../../store/ui.store';
import { TIMING } from '../../constants/app.constants';
import type { RegisterScreenProps } from '../../navigation/types';

type PasswordStrength = 'weak' | 'medium' | 'strong';

const getPasswordStrength = (pwd: string): PasswordStrength => {
  if (pwd.length < 8) return 'weak';
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  if (score >= 3 && pwd.length >= 10) return 'strong';
  if (score >= 2) return 'medium';
  return 'weak';
};

const STRENGTH_COLORS: Record<PasswordStrength, string> = {
  weak: Colors.error,
  medium: Colors.warning,
  strong: Colors.success,
};

const STRENGTH_LABELS: Record<PasswordStrength, string> = {
  weak: 'Faible',
  medium: 'Moyen',
  strong: 'Fort',
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirm?: string;
    global?: string;
  }>({});

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const { showToast } = useUIStore();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: TIMING.ANIMATION_NORMAL,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: TIMING.ANIMATION_NORMAL,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const pwdStrength = password.length > 0 ? getPasswordStrength(password) : null;

  const handleRegister = useCallback(async () => {
    const usernameV = validateUsername(username);
    const emailV = validateEmail(email);
    const passwordV = validatePassword(password);
    const confirmV =
      password !== confirmPassword
        ? { valid: false, error: 'Les mots de passe ne correspondent pas' }
        : { valid: true };

    if (!usernameV.valid || !emailV.valid || !passwordV.valid || !confirmV.valid) {
      setErrors({
        username: usernameV.error,
        email: emailV.error,
        password: passwordV.error,
        confirm: confirmV.error,
      });
      return;
    }
    setErrors({});
    setIsLoading(true);

    const result = await signUp(email, password, username);
    setIsLoading(false);

    if (!result.success) {
      const msg = result.error?.includes('already registered')
        ? 'Cet email est déjà utilisé'
        : result.error ?? 'Inscription échouée';
      setErrors({ global: msg });
      return;
    }

    showToast('Bienvenue sur EmpireCut ! 🎬', 'success', 5000);
  }, [username, email, password, confirmPassword, showToast]);

  const clearError = (field: keyof typeof errors) =>
    setErrors((e) => ({ ...e, [field]: undefined, global: undefined }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />
      <View style={styles.glowTop} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="register-back-button">
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              Crée ton compte
            </Text>
            <Text style={styles.subtitle}>
              Rejoins EmpireCut et commence à créer 🚀
            </Text>
          </Animated.View>

          {/* Formulaire */}
          <Animated.View
            style={[
              styles.form,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}>

            {/* Username */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom d'utilisateur</Text>
              <View style={[styles.inputWrapper, errors.username && styles.inputError]}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={(v) => { setUsername(v.replace(/\s/g, '')); clearError('username'); }}
                  placeholder="montageur_pro"
                  placeholderTextColor={Colors.text.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  testID="register-username-input"
                />
              </View>
              {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Text style={styles.inputIcon}>✉</Text>
                <TextInput
                  ref={emailRef}
                  style={styles.input}
                  value={email}
                  onChangeText={(v) => { setEmail(v); clearError('email'); }}
                  placeholder="ton@email.com"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  testID="register-email-input"
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={(v) => { setPassword(v); clearError('password'); }}
                  placeholder="Min. 8 caractères"
                  placeholderTextColor={Colors.text.muted}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  testID="register-password-input"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(v => !v)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.eyeIcon}>{showPassword ? '👁' : '🙈'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

              {/* Password strength bar */}
              {pwdStrength && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: pwdStrength === 'weak' ? '33%' : pwdStrength === 'medium' ? '66%' : '100%',
                          backgroundColor: STRENGTH_COLORS[pwdStrength],
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[pwdStrength] }]}>
                    {STRENGTH_LABELS[pwdStrength]}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirmer</Text>
              <View style={[styles.inputWrapper, errors.confirm && styles.inputError]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  ref={confirmRef}
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); clearError('confirm'); }}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.text.muted}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  testID="register-confirm-input"
                />
                {confirmPassword.length > 0 && password === confirmPassword && (
                  <Text style={styles.matchIcon}>✓</Text>
                )}
              </View>
              {errors.confirm ? <Text style={styles.errorText}>{errors.confirm}</Text> : null}
            </View>

            {/* Erreur globale */}
            {errors.global ? (
              <View style={styles.globalError}>
                <Text style={styles.globalErrorIcon}>⚠️</Text>
                <Text style={styles.globalErrorText}>{errors.global}</Text>
              </View>
            ) : null}

            {/* Bouton */}
            <TouchableOpacity
              style={[styles.registerBtn, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
              testID="register-submit-button">
              {isLoading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.registerBtnText}>Créer mon compte</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              testID="register-go-login">
              <Text style={styles.footerLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background.primary },
  glowTop: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Colors.accent.glow,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing[8],
    paddingTop: 56,
    paddingBottom: Spacing[10],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  backIcon: { fontSize: 20, color: Colors.text.primary },
  header: { marginBottom: Spacing[8], gap: Spacing[3] },
  title: { fontSize: FontSize['2xl'], fontWeight: '800', color: Colors.text.primary, marginTop: Spacing[5] },
  subtitle: { fontSize: FontSize.sm, color: Colors.text.secondary },
  form: { gap: Spacing[5] },
  fieldGroup: { gap: Spacing[2] },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text.secondary, letterSpacing: 0.3, marginLeft: Spacing[1] },
  inputWrapper: {
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing[5],
  },
  inputError: { borderColor: Colors.error },
  inputIcon: { fontSize: 16, marginRight: Spacing[2] },
  input: {
    flex: 1,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[6],
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  passwordInput: { paddingRight: 48 },
  eyeButton: {
    position: 'absolute',
    right: Spacing[4],
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: Spacing[2],
  },
  eyeIcon: { fontSize: 18 },
  matchIcon: {
    position: 'absolute',
    right: Spacing[5],
    fontSize: 16,
    color: Colors.success,
    fontWeight: '700',
  },
  errorText: { fontSize: FontSize.xs, color: Colors.error, marginLeft: Spacing[1] },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginTop: Spacing[1],
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.background.tertiary,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: { fontSize: FontSize.xs, fontWeight: '600', minWidth: 40 },
  globalError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    padding: Spacing[5],
  },
  globalErrorIcon: { fontSize: 16 },
  globalErrorText: { color: Colors.error, fontSize: FontSize.sm, flex: 1 },
  registerBtn: {
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[7],
    alignItems: 'center',
    marginTop: Spacing[2],
    ...Shadow.accent,
  },
  buttonDisabled: { opacity: 0.6 },
  registerBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700', letterSpacing: 0.5 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing[10],
    paddingBottom: Spacing[6],
  },
  footerText: { color: Colors.text.secondary, fontSize: FontSize.sm },
  footerLink: { color: Colors.accent.primary, fontSize: FontSize.sm, fontWeight: '700' },
});

export default RegisterScreen;

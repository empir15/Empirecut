/**
 * EmpireCut — Login Screen (Phase 2 — Complet)
 * - Validation en temps réel
 * - Supabase Auth connecté
 * - Animations d'entrée
 * - Eye toggle mot de passe
 * - Lien forgot password
 * - Navigation vers Register
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
import { validateEmail, validatePassword } from '../../utils/validation.utils';
import { signIn, resetPassword } from '../../supabase/auth';
import { useUIStore } from '../../store/ui.store';
import { TIMING } from '../../constants/app.constants';
import type { LoginScreenProps } from '../../navigation/types';

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; global?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const { showToast } = useUIStore();

  // Animations d'entrée
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
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
      ]),
      Animated.parallel([
        Animated.timing(formFade, {
          toValue: 1,
          duration: TIMING.ANIMATION_NORMAL,
          useNativeDriver: true,
        }),
        Animated.timing(formSlide, {
          toValue: 0,
          duration: TIMING.ANIMATION_NORMAL,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim, formFade, formSlide]);

  const handleLogin = useCallback(async () => {
    const emailV = validateEmail(email);
    const passwordV = validatePassword(password);
    if (!emailV.valid || !passwordV.valid) {
      setErrors({ email: emailV.error, password: passwordV.error });
      return;
    }
    setErrors({});
    setIsLoading(true);

    const result = await signIn(email, password);
    setIsLoading(false);

    if (!result.success) {
      const msg = result.error?.includes('Invalid login')
        ? 'Email ou mot de passe incorrect'
        : result.error ?? 'Connexion échouée';
      setErrors({ global: msg });
      return;
    }
    showToast('Connexion réussie ! 🎬', 'success');
  }, [email, password, showToast]);

  const handleForgotPassword = useCallback(async () => {
    const emailV = validateEmail(email);
    if (!emailV.valid) {
      setErrors({ email: 'Entre ton email pour réinitialiser' });
      return;
    }
    setIsResetting(true);
    const result = await resetPassword(email);
    setIsResetting(false);
    if (result.success) {
      showToast('Email de réinitialisation envoyé 📧', 'success', 5000);
    } else {
      showToast(result.error ?? 'Erreur', 'error');
    }
  }, [email, showToast]);

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

          {/* Header animé */}
          <Animated.View
            style={[
              styles.header,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}>
            <View style={styles.logoRow}>
              <View style={styles.logoMark}>
                <Text style={styles.logoSymbol}>▶</Text>
              </View>
              <Text style={styles.logoName}>
                <Text style={styles.logoAccent}>Empire</Text>Cut
              </Text>
            </View>
            <Text style={styles.title}>
              Bon retour ! 👋
            </Text>
            <Text style={styles.subtitle}>
              Connecte-toi pour retrouver tes projets
            </Text>
          </Animated.View>

          {/* Formulaire animé */}
          <Animated.View
            style={[
              styles.form,
              { opacity: formFade, transform: [{ translateY: formSlide }] },
            ]}>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Text style={styles.inputIcon}>✉</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setErrors(e => ({ ...e, email: undefined, global: undefined })); }}
                  placeholder="ton@email.com"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  testID="login-email-input"
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Mot de passe */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrors(e => ({ ...e, password: undefined, global: undefined })); }}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.text.muted}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  testID="login-password-input"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(v => !v)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  testID="login-toggle-password">
                  <Text style={styles.eyeIcon}>{showPassword ? '👁' : '🙈'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={isResetting}
              style={styles.forgotButton}
              testID="login-forgot-password">
              <Text style={styles.forgotText}>
                {isResetting ? 'Envoi en cours...' : 'Mot de passe oublié ?'}
              </Text>
            </TouchableOpacity>

            {/* Erreur globale */}
            {errors.global ? (
              <View style={styles.globalError}>
                <Text style={styles.globalErrorIcon}>⚠️</Text>
                <Text style={styles.globalErrorText}>{errors.global}</Text>
              </View>
            ) : null}

            {/* Bouton Login */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
              testID="login-submit-button">
              {isLoading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            {/* Séparateur */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>ou</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Bouton vers Register */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.8}
              testID="login-go-register">
              <Text style={styles.registerButtonText}>Créer un compte</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Version footer */}
          <Text style={styles.versionText}>EmpireCut v1.0.0</Text>

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
    top: -140,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: Colors.accent.glow,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing[8],
    paddingTop: 72,
    paddingBottom: Spacing[10],
  },
  header: { marginBottom: Spacing[12], gap: Spacing[4] },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    marginBottom: Spacing[6],
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.accent,
  },
  logoSymbol: { fontSize: 18, color: Colors.white },
  logoName: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text.primary },
  logoAccent: { color: Colors.accent.primary },
  title: {
    fontSize: FontSize['3xl'],
    fontWeight: '800',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.text.secondary,
    marginTop: Spacing[1],
  },
  form: { gap: Spacing[5] },
  fieldGroup: { gap: Spacing[2] },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
    letterSpacing: 0.3,
    marginLeft: Spacing[1],
  },
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
  errorText: { fontSize: FontSize.xs, color: Colors.error, marginLeft: Spacing[1] },
  forgotButton: { alignSelf: 'flex-end', paddingVertical: Spacing[1] },
  forgotText: {
    color: Colors.accent.primary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
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
  loginButton: {
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[7],
    alignItems: 'center',
    marginTop: Spacing[2],
    ...Shadow.accent,
  },
  buttonDisabled: { opacity: 0.6 },
  loginButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    marginVertical: Spacing[2],
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.default,
  },
  separatorText: {
    color: Colors.text.muted,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  registerButton: {
    borderWidth: 1.5,
    borderColor: Colors.accent.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[6],
    alignItems: 'center',
  },
  registerButtonText: {
    color: Colors.accent.primary,
    fontSize: FontSize.base,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  versionText: {
    color: Colors.text.muted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: 'auto',
    paddingTop: Spacing[10],
  },
});

export default LoginScreen;

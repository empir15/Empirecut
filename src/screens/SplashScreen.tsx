/**
 * EmpireCut — Splash Screen (Phase 2 — Complet)
 * 
 * Affiché pendant l'initialisation :
 * - Animation premium avec logo + glow + pulse
 * - Loading dots animés
 * - Vérifie la session Supabase en arrière-plan
 * - Disparaît automatiquement via isInitializing dans RootNavigator
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';

const { width } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Glow + Logo apparaissent ensemble
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.8,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // 2. Subtitle + tag
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(tagOpacity, {
          toValue: 1,
          duration: 350,
          delay: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Pulse continu du glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.15,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [logoScale, logoOpacity, subtitleOpacity, glowOpacity, glowScale, tagOpacity]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />

      {/* Glow background */}
      <Animated.View
        style={[
          styles.glow,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />

      {/* Logo + Titre */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}>
        {/* Logo */}
        <View style={styles.logoMark}>
          <View style={styles.logoInner}>
            <Text style={styles.logoSymbol}>▶</Text>
          </View>
        </View>

        <Text style={styles.logoText}>
          <Text style={styles.logoTextAccent}>Empire</Text>Cut
        </Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        Montage vidéo professionnel
      </Animated.Text>

      {/* Tag */}
      <Animated.View style={[styles.tagContainer, { opacity: tagOpacity }]}>
        <Text style={styles.tagText}>Propulsé par FFmpeg</Text>
      </Animated.View>

      {/* Loading */}
      <Animated.View style={[styles.loadingContainer, { opacity: subtitleOpacity }]}>
        <LoadingDots />
      </Animated.View>

      {/* Version */}
      <Animated.Text style={[styles.version, { opacity: tagOpacity }]}>
        v1.0.0
      </Animated.Text>
    </View>
  );
};

const LoadingDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 350, useNativeDriver: true }),
          Animated.delay(500),
        ]),
      );

    animate(dot1, 0).start();
    animate(dot2, 150).start();
    animate(dot3, 300).start();
  }, [dot1, dot2, dot3]);

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) },
    ],
  });

  return (
    <View style={styles.dots}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.View key={i} style={[styles.dot, dotStyle(d)]} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: Colors.accent.glow,
  },
  logoContainer: {
    alignItems: 'center',
    gap: Spacing[5],
  },
  logoMark: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 20,
  },
  logoInner: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: Colors.accent.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSymbol: { fontSize: 34, color: Colors.white },
  logoText: {
    fontSize: FontSize['4xl'],
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -1,
  },
  logoTextAccent: { color: Colors.accent.primary },
  subtitle: {
    marginTop: Spacing[4],
    fontSize: FontSize.base,
    color: Colors.text.secondary,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  tagContainer: {
    marginTop: Spacing[4],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.glass.background,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  tagText: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing[3],
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.accent.primary,
  },
  version: {
    position: 'absolute',
    bottom: 40,
    color: Colors.text.muted,
    fontSize: FontSize.xs,
  },
});

export default SplashScreen;

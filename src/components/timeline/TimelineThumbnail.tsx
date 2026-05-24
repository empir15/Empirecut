/**
 * EmpireCut — Timeline Thumbnail Component
 *
 * Affiche l'image de la vignette à un instant précis de la timeline.
 * Si l'image n'est pas encore générée (ex: en Phase 3 / mock),
 * affiche un shimmer de chargement premium violet/sombre.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, BorderRadius } from '../../theme';

interface TimelineThumbnailProps {
  uri?: string;
  width: number;
  height: number;
}

export const TimelineThumbnail: React.FC<TimelineThumbnailProps> = ({
  uri,
  width,
  height,
}) => {
  const [hasError, setHasError] = useState(false);
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    // Animation infinie de shimmer
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnim]);

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  // Si on a un URI valide qui n'a pas crash au chargement, on affiche l'image
  const showImage = uri && !hasError && !uri.includes('mock');

  // Translation du shimmer de gauche à droite
  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[styles.container, { width, height }]}>
      {showImage ? (
        <Image
          source={{ uri }}
          style={styles.image}
          onError={() => setHasError(true)}
          resizeMode="cover"
        />
      ) : (
        // Fallback premium avec dégradé et shimmer
        <View style={[StyleSheet.absoluteFill, styles.fallback]}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [{ translateX }],
              },
            ]}
          >
            <LinearGradient
              colors={[
                'rgba(123, 97, 255, 0)',
                'rgba(123, 97, 255, 0.25)',
                'rgba(123, 97, 255, 0)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shimmer}
            />
          </Animated.View>
          <View style={styles.placeholderDot} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.tertiary,
    overflow: 'hidden',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    backgroundColor: 'rgba(30, 27, 46, 0.95)', // fond violet ultra sombre
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  placeholderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(123, 97, 255, 0.4)', // point violet pulse discret
  },
});

export default TimelineThumbnail;

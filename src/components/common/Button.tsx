/**
 * EmpireCut — Button Component
 *
 * Bouton réutilisable avec variantes :
 * - primary (accent violet, plein)
 * - secondary (fond transparent, bordure)
 * - ghost (aucun fond)
 * - danger (rouge)
 *
 * Gère loading state, disabled, et taille (sm / md / lg).
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  testID?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  testID,
}) => {
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    styles[`variant_${variant}` as keyof typeof styles],
    styles[`size_${size}` as keyof typeof styles],
    fullWidth ? styles.fullWidth : undefined,
    isDisabled ? styles.disabled : undefined,
  ].filter(Boolean) as ViewStyle[];

  const textStyle = [
    styles.text,
    styles[`textVariant_${variant}` as keyof typeof styles],
    styles[`textSize_${size}` as keyof typeof styles],
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      testID={testID}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? Colors.white : Colors.accent.primary}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={textStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
    borderRadius: BorderRadius.md,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.55 },

  // Variants
  variant_primary: {
    backgroundColor: Colors.accent.primary,
    ...Shadow.accent,
  },
  variant_secondary: {
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.accent.primary,
  },
  variant_ghost: {
    backgroundColor: Colors.transparent,
  },
  variant_danger: {
    backgroundColor: Colors.error,
  },

  // Sizes
  size_sm: {
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[5],
  },
  size_md: {
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[8],
  },
  size_lg: {
    paddingVertical: Spacing[7],
    paddingHorizontal: Spacing[10],
  },

  // Text
  text: { fontWeight: '700', letterSpacing: 0.3 },
  textVariant_primary: { color: Colors.white },
  textVariant_secondary: { color: Colors.accent.primary },
  textVariant_ghost: { color: Colors.accent.primary },
  textVariant_danger: { color: Colors.white },

  textSize_sm: { fontSize: FontSize.sm },
  textSize_md: { fontSize: FontSize.base },
  textSize_lg: { fontSize: FontSize.md },
});

export default Button;

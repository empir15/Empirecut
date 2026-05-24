/**
 * EmpireCut — Input Component
 *
 * TextInput réutilisable avec label, erreur, icône.
 */
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, error, icon, style, ...rest }) => {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
        <TextInput
          style={[styles.input, icon ? styles.inputWithIcon : null, style]}
          placeholderTextColor={Colors.text.muted}
          selectionColor={Colors.accent.primary}
          cursorColor={Colors.accent.primary}
          {...rest}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: Spacing[2] },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputError: { borderColor: Colors.error },
  iconContainer: {
    paddingLeft: Spacing[5],
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[5],
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  inputWithIcon: {
    paddingLeft: Spacing[3],
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
  },
});

export default Input;

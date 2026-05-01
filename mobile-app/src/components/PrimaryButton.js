import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

export function PrimaryButton({ title, onPress, secondary = false, loading = false, disabled = false }) {
  const isDisabled = disabled || loading;
  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={[styles.button, secondary && styles.secondary, isDisabled && styles.disabled]}>
      {loading ? (
        <ActivityIndicator color={secondary ? colors.dark : '#ffffff'} />
      ) : (
        <Text style={[styles.text, secondary && styles.secondaryText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.dark,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center'
  },
  secondary: {
    backgroundColor: colors.primary
  },
  disabled: {
    opacity: 0.65
  },
  text: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15
  },
  secondaryText: {
    color: colors.dark
  }
});

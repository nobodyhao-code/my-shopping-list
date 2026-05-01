import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';

export function FormField({ label, value, onChangeText, placeholder, secureTextEntry = false, keyboardType = 'default' }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: { color: colors.dark, fontWeight: '700' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.text
  }
});

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

function buildBars(value) {
  const digits = String(value || '').replace(/\D/g, '').split('');
  return digits.flatMap((digit, index) => {
    const number = Number(digit);
    return [1 + (number % 3), 1, 2 + ((number + index) % 2), 1];
  });
}

export function BarcodePreview({ value }) {
  const bars = useMemo(() => buildBars(value), [value]);
  return (
    <View style={styles.container}>
      <View style={styles.barcode}>
        {bars.map((width, index) => (
          <View key={`${index}-${width}`} style={[styles.bar, { width: width * 2 }, index % 2 === 0 ? styles.darkBar : styles.lightBar]} />
        ))}
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 10 },
  barcode: {
    width: '100%',
    minHeight: 96,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 12
  },
  bar: { height: '100%', borderRadius: 2 },
  darkBar: { backgroundColor: colors.dark },
  lightBar: { backgroundColor: 'transparent' },
  value: { letterSpacing: 2, fontWeight: '700', color: colors.dark }
});

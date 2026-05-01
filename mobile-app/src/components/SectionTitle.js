import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export function SectionTitle({ title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  title: { fontSize: 22, fontWeight: '900', color: colors.dark },
  subtitle: { color: colors.muted, lineHeight: 20 }
});

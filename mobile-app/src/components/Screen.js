import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function Screen({ children, contentContainerStyle }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, contentContainerStyle]}>{children}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 36 }
});

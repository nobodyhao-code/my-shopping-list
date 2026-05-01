import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { BarcodePreview } from '../components/BarcodePreview';
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionTitle } from '../components/SectionTitle';
import { colors } from '../theme/colors';
import { useUser } from '../context/UserContext';
import { api } from '../api/client';

function StatusChip({ label, active }) {
  return <Text style={[styles.chip, active ? styles.chipActive : styles.chipMuted]}>{label}</Text>;
}

export function LoyaltyScreen() {
  const { user } = useUser();
  const [card, setCard] = useState(null);
  const [checking, setChecking] = useState(false);

  async function loadCard() {
    try {
      const result = await api.getLoyaltyCard(user.username);
      setCard(result.loyaltyCard);
    } catch (error) {
      Alert.alert('Unable to load loyalty card', error.message);
    }
  }

  useEffect(() => {
    loadCard();
  }, []);

  async function verifyCard() {
    if (!card?.barcode) return;
    try {
      setChecking(true);
      const result = await api.verifyLoyalty(card.barcode);
      Alert.alert('Checkout check', `Card verified for ${result.username}.`);
    } catch (error) {
      Alert.alert('Verification failed', error.message);
    } finally {
      setChecking(false);
    }
  }

  return (
    <Screen>
      <SectionTitle title="Loyalty card" subtitle="A unique customer identifier ready for checkout." />
      <Card style={styles.cardHero}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.cardLabel}>Digital member card</Text>
            <Text style={styles.cardName}>{user.displayName || user.username}</Text>
          </View>
          <Text style={styles.logo}>◉</Text>
        </View>
        <Text style={styles.memberId}>{card?.memberId || 'Loading…'}</Text>
        <BarcodePreview value={card?.barcode || '0000000000000'} />
        <Text style={styles.note}>QR / wallet / NFC fields are prepared in the backend model so stronger checkout methods can be added later.</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Card capabilities</Text>
        <View style={styles.chipRow}>
          <StatusChip label="Barcode ready" active />
          <StatusChip label="QR ready in model" active />
          <StatusChip label="Wallet planned" active={false} />
          <StatusChip label="NFC planned" active={false} />
        </View>
        <PrimaryButton title={checking ? 'Checking…' : 'Test checkout identifier'} onPress={verifyCard} loading={checking} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardHero: { backgroundColor: colors.primary, gap: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLabel: { color: colors.dark, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  cardName: { fontSize: 24, fontWeight: '900', color: colors.dark, marginTop: 8 },
  logo: { fontSize: 26, fontWeight: '900', color: colors.accent },
  memberId: { color: colors.dark, fontWeight: '700' },
  note: { color: colors.dark, lineHeight: 21 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.dark, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, fontWeight: '700' },
  chipActive: { backgroundColor: '#e6f7ea', color: colors.success },
  chipMuted: { backgroundColor: '#f3f4f6', color: colors.muted }
});

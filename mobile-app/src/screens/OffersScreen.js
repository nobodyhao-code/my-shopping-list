import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { SectionTitle } from '../components/SectionTitle';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import { useUser } from '../context/UserContext';
import { api } from '../api/client';

export function OffersScreen() {
  const { user, updateUser } = useUser();
  const [offers, setOffers] = useState([]);
  const [busyOfferId, setBusyOfferId] = useState('');
  const [query, setQuery] = useState('');
  const [showActivatedOnly, setShowActivatedOnly] = useState(false);

  async function loadOffers() {
    try {
      const data = await api.getOffers(user.username);
      setOffers(data);
    } catch (error) {
      Alert.alert('Unable to load offers', error.message);
    }
  }

  useEffect(() => {
    loadOffers();
  }, []);

  async function activate(offerId) {
    try {
      setBusyOfferId(offerId);
      const result = await api.activateOffer(offerId, user.username);
      updateUser({ activatedOffers: result.activatedOffers });
      await loadOffers();
    } catch (error) {
      Alert.alert('Activation failed', error.message);
    } finally {
      setBusyOfferId('');
    }
  }

  const filteredOffers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return offers.filter((offer) => {
      const matchesSearch =
        !keyword ||
        offer.name.toLowerCase().includes(keyword) ||
        offer.description.toLowerCase().includes(keyword) ||
        offer.couponCode.toLowerCase().includes(keyword);

      const matchesActivatedState = !showActivatedOnly || offer.isActivated;
      return matchesSearch && matchesActivatedState;
    });
  }, [offers, query, showActivatedOnly]);

  return (
    <Screen>
      <SectionTitle title="Offers & coupons" subtitle="Active promotions with simple activation, no coupon-clipping scissors required." />

      <Card>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search offers, description, or coupon code"
          placeholderTextColor={colors.muted}
        />
        <View style={styles.switchRow}>
          <View style={styles.switchTextWrap}>
            <Text style={styles.switchTitle}>Show activated only</Text>
            <Text style={styles.switchHint}>Useful when you only want the coupons already attached to the account.</Text>
          </View>
          <Switch value={showActivatedOnly} onValueChange={setShowActivatedOnly} />
        </View>
      </Card>

      {filteredOffers.map((offer) => (
        <Card key={offer.id} style={styles.offerCard}>
          <Image source={{ uri: offer.image }} style={styles.image} resizeMode="cover" />
          <View style={styles.tagRow}>
            <Text style={styles.tag}>Valid {offer.validityPeriod}</Text>
            <Text style={[styles.tag, offer.isActivated && styles.tagActive]}>
              {offer.isActivated ? 'Activated' : offer.couponCode}
            </Text>
          </View>
          <Text style={styles.offerTitle}>{offer.name}</Text>
          <Text style={styles.offerBody}>{offer.description}</Text>
          <PrimaryButton
            title={offer.isActivated ? 'Activated' : 'Activate coupon'}
            onPress={() => activate(offer.id)}
            loading={busyOfferId === offer.id}
            disabled={offer.isActivated}
            secondary={offer.isActivated}
          />
        </Card>
      ))}

      {!filteredOffers.length ? (
        <Card>
          <Text style={styles.emptyTitle}>No offers matched</Text>
          <Text style={styles.emptyBody}>Try another keyword or turn off the “activated only” filter.</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.text,
    marginBottom: 12
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  switchTextWrap: { flex: 1 },
  switchTitle: { fontWeight: '800', color: colors.dark },
  switchHint: { color: colors.muted, marginTop: 4, lineHeight: 20 },
  offerCard: { gap: 12 },
  image: { width: '100%', height: 180, borderRadius: 18, backgroundColor: colors.surfaceAlt },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  tag: {
    backgroundColor: colors.surfaceAlt,
    color: colors.dark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '700'
  },
  tagActive: { backgroundColor: '#fde2ee', color: colors.accent },
  offerTitle: { fontSize: 21, fontWeight: '900', color: colors.dark },
  offerBody: { color: colors.text, lineHeight: 22 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: colors.dark, marginBottom: 8 },
  emptyBody: { color: colors.text, lineHeight: 22 }
});

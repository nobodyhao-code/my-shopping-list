import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionTitle } from '../components/SectionTitle';
import { colors } from '../theme/colors';
import { useUser } from '../context/UserContext';
import { api } from '../api/client';

export function ProfileScreen() {
  const { user, signOut, signIn } = useUser();
  const [form, setForm] = useState({
    displayName: user.displayName || '',
    email: user.email || '',
    phone: user.phone || '',
    marketingConsent: user.consent?.marketing || false,
    privacyAccepted: user.consent?.privacyAccepted || false
  });
  const [receipts, setReceipts] = useState([]);
  const [expandedReceiptId, setExpandedReceiptId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getProfile(user.username)
      .then((profile) => {
        signIn(profile);
        setForm({
          displayName: profile.displayName || '',
          email: profile.email || '',
          phone: profile.phone || '',
          marketingConsent: profile.consent?.marketing || false,
          privacyAccepted: profile.consent?.privacyAccepted || false
        });
      })
      .catch(() => {});

    api.getReceipts(user.username)
      .then(setReceipts)
      .catch(() => {});
  }, []);

  const insights = useMemo(() => {
    const totalSpent = receipts.reduce((sum, receipt) => sum + Number(receipt.total || 0), 0);
    const averageBasket = receipts.length ? totalSpent / receipts.length : 0;
    const storeCounts = receipts.reduce((acc, receipt) => {
      acc[receipt.storeName] = (acc[receipt.storeName] || 0) + 1;
      return acc;
    }, {});
    const favoriteReceiptStore =
      Object.entries(storeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No purchase data yet';

    return {
      totalSpent,
      averageBasket,
      receiptsCount: receipts.length,
      latestPurchase: receipts[0]?.purchasedAt || null,
      favoriteReceiptStore
    };
  }, [receipts]);

  async function saveProfile() {
    try {
      setLoading(true);
      const result = await api.updateProfile(user.username, form);
      signIn(result.user);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (error) {
      Alert.alert('Profile update failed', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <SectionTitle title="Profile & receipts" subtitle="Lightweight user profile now, room for stronger authentication later." />
      <Card>
        <FormField
          label="Display name"
          value={form.displayName}
          onChangeText={(displayName) => setForm((prev) => ({ ...prev, displayName }))}
          placeholder="Your name"
        />
        <FormField
          label="Email"
          value={form.email}
          onChangeText={(email) => setForm((prev) => ({ ...prev, email }))}
          placeholder="you@example.com"
          keyboardType="email-address"
        />
        <FormField
          label="Phone"
          value={form.phone}
          onChangeText={(phone) => setForm((prev) => ({ ...prev, phone }))}
          placeholder="+358..."
          keyboardType="phone-pad"
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Privacy consent</Text>
          <Switch value={form.privacyAccepted} onValueChange={(privacyAccepted) => setForm((prev) => ({ ...prev, privacyAccepted }))} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Marketing consent</Text>
          <Switch value={form.marketingConsent} onValueChange={(marketingConsent) => setForm((prev) => ({ ...prev, marketingConsent }))} />
        </View>

        <PrimaryButton title="Save profile" onPress={saveProfile} loading={loading} />
      </Card>

      <Card style={styles.insightCard}>
        <Text style={styles.sectionTitle}>Spending insights</Text>
        <View style={styles.insightGrid}>
          <View style={styles.insightBox}>
            <Text style={styles.insightValue}>€{insights.totalSpent.toFixed(2)}</Text>
            <Text style={styles.insightLabel}>Total spent</Text>
          </View>
          <View style={styles.insightBox}>
            <Text style={styles.insightValue}>{insights.receiptsCount}</Text>
            <Text style={styles.insightLabel}>Receipts</Text>
          </View>
          <View style={styles.insightBox}>
            <Text style={styles.insightValue}>€{insights.averageBasket.toFixed(2)}</Text>
            <Text style={styles.insightLabel}>Average basket</Text>
          </View>
          <View style={styles.insightBox}>
            <Text style={styles.insightValueSmall}>{insights.favoriteReceiptStore}</Text>
            <Text style={styles.insightLabel}>Most visited store</Text>
          </View>
        </View>
        <Text style={styles.note}>
          {insights.latestPurchase
            ? `Latest recorded purchase: ${new Date(insights.latestPurchase).toLocaleString()}`
            : 'Make a purchase and the summary will wake up dramatically.'}
        </Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Purchase history</Text>
        {receipts.map((receipt) => {
          const expanded = expandedReceiptId === receipt.id;
          return (
            <Pressable key={receipt.id} style={styles.receiptCard} onPress={() => setExpandedReceiptId(expanded ? '' : receipt.id)}>
              <View style={styles.receiptHeader}>
                <View>
                  <Text style={styles.receiptStore}>{receipt.storeName}</Text>
                  <Text style={styles.receiptDate}>{new Date(receipt.purchasedAt).toLocaleString()}</Text>
                </View>
                <Text style={styles.receiptTotal}>€{receipt.total.toFixed(2)}</Text>
              </View>
              {expanded ? (
                <View style={styles.receiptDetail}>
                  {receipt.lines.map((line, index) => (
                    <View key={`${receipt.id}-${index}`} style={styles.lineRow}>
                      <Text style={styles.lineText}>
                        {line.name} × {line.qty}
                      </Text>
                      <Text style={styles.lineText}>€{line.total.toFixed(2)}</Text>
                    </View>
                  ))}
                  <PrimaryButton title="Open structured receipt file" secondary onPress={() => Linking.openURL(api.getReceiptFileUrl(receipt.id))} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Authentication roadmap</Text>
        <Text style={styles.note}>Current mode: email or username + password. Backend data model already keeps auth metadata so SMS OTP and stronger e-identification can be added later.</Text>
        <View style={styles.logoutWrap}>
          <PrimaryButton title="Log out" onPress={signOut} />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  switchText: { color: colors.dark, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.dark, marginBottom: 12 },
  insightCard: { backgroundColor: '#fff7d4' },
  insightGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  insightBox: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  insightValue: { fontSize: 24, fontWeight: '900', color: colors.dark },
  insightValueSmall: { fontSize: 16, fontWeight: '900', color: colors.dark },
  insightLabel: { color: colors.muted, marginTop: 6 },
  receiptCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#fffdf7'
  },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  receiptStore: { fontWeight: '800', color: colors.dark },
  receiptDate: { color: colors.muted, marginTop: 4 },
  receiptTotal: { fontWeight: '900', fontSize: 18, color: colors.accent },
  receiptDetail: { marginTop: 12, gap: 10 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  lineText: { color: colors.text },
  note: { color: colors.text, lineHeight: 22 },
  logoutWrap: { marginTop: 14 }
});

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { SectionTitle } from '../components/SectionTitle';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import { useUser } from '../context/UserContext';
import { api } from '../api/client';
import { getMapUrl } from '../utils/maps';

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QtyButton({ label, onPress, disabled = false }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.qtyButton, disabled && styles.qtyButtonDisabled]}>
      <Text style={styles.qtyButtonText}>{label}</Text>
    </Pressable>
  );
}

export function HomeScreen() {
  const { user } = useUser();
  const [home, setHome] = useState(null);
  const [products, setProducts] = useState([]);
  const [shoppingList, setShoppingList] = useState({ items: [], enrichedItems: [], totalItems: 0, estimatedTotal: 0 });
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingList, setSavingList] = useState(false);

  async function loadOverview() {
    const result = await api.getHome(user.username);
    setHome(result);
  }

  async function loadProducts() {
    const result = await api.getProducts();
    setProducts(result);
  }

  async function loadShoppingList() {
    const result = await api.getShoppingList(user.username);
    setShoppingList(result);
  }

  async function refreshAll() {
    try {
      setLoading(true);
      await Promise.all([loadOverview(), loadProducts(), loadShoppingList()]);
    } catch (error) {
      Alert.alert('Unable to load home data', error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(keyword) || (product.category || '').toLowerCase().includes(keyword)
    );
  }, [products, query]);

  function qtyFor(productId) {
    return shoppingList.items.find((item) => item.productId === productId)?.qty || 0;
  }

  async function changeProductQty(productId, delta) {
    const currentQty = qtyFor(productId);
    const nextQty = Math.max(0, currentQty + delta);

    const nextMap = new Map(shoppingList.items.map((item) => [item.productId, item.qty]));
    if (nextQty === 0) {
      nextMap.delete(productId);
    } else {
      nextMap.set(productId, nextQty);
    }

    const nextItems = Array.from(nextMap.entries()).map(([savedProductId, qty]) => ({
      productId: savedProductId,
      qty
    }));

    try {
      setSavingList(true);
      const result = await api.saveShoppingList(user.username, nextItems);
      setShoppingList(result);
    } catch (error) {
      Alert.alert('Shopping list update failed', error.message);
    } finally {
      setSavingList(false);
    }
  }

  return (
    <Screen>
      <Card style={styles.hero}>
        <Text style={styles.hello}>Hi {home?.greetingName || user.displayName || user.username} 👋</Text>
        <Text style={styles.heroTitle}>Your checkout-ready membership lives here.</Text>
        <Text style={styles.heroBody}>
          Use your loyalty identifier at checkout, activate coupons, find the closest Kokkola store, and keep a simple mobile shopping list ready for the next grocery run.
        </Text>
        <PrimaryButton title={loading ? 'Refreshing…' : 'Refresh overview'} onPress={refreshAll} secondary loading={loading} />
      </Card>

      <SectionTitle title="Overview" subtitle="The app keeps things short, sweet, and actually useful." />
      <View style={styles.statsGrid}>
        <StatCard label="Stores" value={home?.summary?.storesCount ?? 3} />
        <StatCard label="Offers" value={home?.summary?.offersCount ?? 0} />
        <StatCard label="Activated" value={home?.summary?.activatedOffers ?? 0} />
        <StatCard label="Latest €" value={home?.summary?.latestReceiptTotal ?? 0} />
      </View>

      {home?.favoriteStore ? (
        <Card style={styles.favoriteCard}>
          <Text style={styles.sectionTitle}>Favorite store</Text>
          <Text style={styles.favoriteName}>{home.favoriteStore.name}</Text>
          <Text style={styles.favoriteInfo}>{home.favoriteStore.address}</Text>
          <Text style={styles.favoriteInfo}>Hours: {home.favoriteStore.openingHours}</Text>
          <PrimaryButton
            title="Open favorite store in maps"
            onPress={() => Linking.openURL(getMapUrl(home.favoriteStore.latitude, home.favoriteStore.longitude))}
          />
        </Card>
      ) : (
        <Card>
          <Text style={styles.sectionTitle}>Favorite store</Text>
          <Text style={styles.bullet}>You have not picked one yet. Head to the Stores tab and crown your grocery champion.</Text>
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>What is already covered</Text>
        <Text style={styles.bullet}>• Digital loyalty card with unique checkout identifier</Text>
        <Text style={styles.bullet}>• Lightweight registration and login flow</Text>
        <Text style={styles.bullet}>• Three virtual Kokkola stores with map links and geolocation</Text>
        <Text style={styles.bullet}>• Offer activation and purchase history structure</Text>
        <Text style={styles.bullet}>• Persistent shopping list stored per user</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Recent receipts</Text>
        {(home?.recentReceipts || []).map((receipt) => (
          <View key={receipt.id} style={styles.receiptRow}>
            <View>
              <Text style={styles.receiptStore}>{receipt.storeName}</Text>
              <Text style={styles.receiptDate}>{new Date(receipt.purchasedAt).toLocaleString()}</Text>
            </View>
            <Text style={styles.receiptTotal}>€{receipt.total.toFixed(2)}</Text>
          </View>
        ))}
      </Card>

      <SectionTitle
        title="Smart shopping list"
        subtitle="A lightweight list tied to the current user account. Add items now, shop later, feel organized for at least seven glorious minutes."
      />

      <Card>
        <Text style={styles.shoppingSummary}>
          {shoppingList.totalItems > 0
            ? `${shoppingList.totalItems} item(s) selected • Estimated total €${shoppingList.estimatedTotal.toFixed(2)}`
            : 'No items selected yet.'}
        </Text>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search products or categories"
          placeholderTextColor={colors.muted}
        />
        {filteredProducts.map((product) => (
          <View key={product.id} style={styles.productRow}>
            <View style={styles.productInfoWrap}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productMeta}>
                {product.category} • €{Number(product.price || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.qtyControls}>
              <QtyButton label="−" onPress={() => changeProductQty(product.id, -1)} disabled={savingList || qtyFor(product.id) === 0} />
              <Text style={styles.qtyValue}>{qtyFor(product.id)}</Text>
              <QtyButton label="+" onPress={() => changeProductQty(product.id, 1)} disabled={savingList} />
            </View>
          </View>
        ))}
        {!filteredProducts.length ? <Text style={styles.emptyText}>No products matched your search.</Text> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.dark },
  hello: { color: colors.primary, fontWeight: '800', marginBottom: 8 },
  heroTitle: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '900' },
  heroBody: { color: '#e5e7eb', lineHeight: 22, marginVertical: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16
  },
  statValue: { fontSize: 28, fontWeight: '900', color: colors.dark },
  statLabel: { color: colors.muted, marginTop: 6 },
  favoriteCard: { backgroundColor: '#fff7d4' },
  favoriteName: { fontSize: 20, fontWeight: '900', color: colors.dark, marginBottom: 6 },
  favoriteInfo: { color: colors.text, lineHeight: 21, marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.dark, marginBottom: 10 },
  bullet: { color: colors.text, lineHeight: 22, marginBottom: 6 },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  receiptStore: { fontWeight: '700', color: colors.dark },
  receiptDate: { color: colors.muted, marginTop: 4 },
  receiptTotal: { fontWeight: '900', color: colors.accent, fontSize: 18 },
  shoppingSummary: { color: colors.dark, fontWeight: '700', marginBottom: 12 },
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
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  productInfoWrap: { flex: 1 },
  productName: { fontWeight: '800', color: colors.dark },
  productMeta: { color: colors.muted, marginTop: 4 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center'
  },
  qtyButtonDisabled: { opacity: 0.4 },
  qtyButtonText: { color: '#fff', fontWeight: '900', fontSize: 18, marginTop: -1 },
  qtyValue: { minWidth: 20, textAlign: 'center', fontWeight: '800', color: colors.dark },
  emptyText: { color: colors.muted, marginTop: 8 }
});

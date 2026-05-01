import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionTitle } from '../components/SectionTitle';
import { colors } from '../theme/colors';
import { api } from '../api/client';
import { getMapUrl } from '../utils/maps';
import { useUser } from '../context/UserContext';

export function StoresScreen() {
  const { user, updateUser } = useUser();
  const [stores, setStores] = useState([]);
  const [nearest, setNearest] = useState(null);
  const [loadingNearest, setLoadingNearest] = useState(false);
  const [savingFavoriteId, setSavingFavoriteId] = useState('');

  const loadStores = useCallback(async () => {
    try {
      const data = await api.getStores();
      setStores(data);
    } catch (error) {
      Alert.alert('Unable to load stores', error.message);
    }
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const orderedStores = useMemo(() => {
    if (!user?.favoriteStoreId) return stores;
    const favorite = stores.find((store) => store.id === user.favoriteStoreId);
    const rest = stores.filter((store) => store.id !== user.favoriteStoreId);
    return favorite ? [favorite, ...rest] : stores;
  }, [stores, user?.favoriteStoreId]);

  async function findNearest() {
    try {
      setLoadingNearest(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission needed', 'Location access is required to show the nearest store.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const data = await api.getNearestStore(position.coords.latitude, position.coords.longitude);
      setNearest(data);
    } catch (error) {
      Alert.alert('Nearest store lookup failed', error.message);
    } finally {
      setLoadingNearest(false);
    }
  }

  async function saveFavoriteStore(storeId) {
    try {
      setSavingFavoriteId(storeId);
      const result = await api.updateProfile(user.username, { favoriteStoreId: storeId });
      updateUser(result.user);
      Alert.alert('Favorite store saved', 'Your preferred store has been updated.');
    } catch (error) {
      Alert.alert('Unable to save favorite store', error.message);
    } finally {
      setSavingFavoriteId('');
    }
  }

  return (
    <Screen>
      <SectionTitle title="Store finder" subtitle="Three virtual stores, all kept inside the Kokkola area as requested." />
      <Card>
        <Text style={styles.lead}>Use geolocation to reveal the closest shop, or browse the full list below.</Text>
        <PrimaryButton title={loadingNearest ? 'Finding…' : 'Find nearest store'} onPress={findNearest} secondary loading={loadingNearest} />
      </Card>

      {nearest ? (
        <Card style={styles.nearestCard}>
          <Text style={styles.badge}>Nearest store</Text>
          <Text style={styles.storeName}>{nearest.name}</Text>
          <Text style={styles.info}>{nearest.address}</Text>
          <Text style={styles.info}>{nearest.openingHours}</Text>
          <Text style={styles.info}>Distance: {nearest.distanceKm?.toFixed(2)} km</Text>
          <PrimaryButton title="Open map" onPress={() => Linking.openURL(getMapUrl(nearest.latitude, nearest.longitude))} />
        </Card>
      ) : null}

      {orderedStores.map((store) => {
        const isFavorite = user?.favoriteStoreId === store.id;
        return (
          <Card key={store.id}>
            {isFavorite ? <Text style={styles.favoriteBadge}>Favorite store</Text> : null}
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.info}>{store.address}</Text>
            <Text style={styles.info}>Hours: {store.openingHours}</Text>
            <Text style={styles.info}>Phone: {store.phone}</Text>
            <Text style={styles.info}>Email: {store.email}</Text>
            <View style={styles.buttonRow}>
              <View style={styles.buttonHalf}>
                <PrimaryButton title="Open map" onPress={() => Linking.openURL(store.mapLink)} />
              </View>
              <View style={styles.buttonHalf}>
                <PrimaryButton
                  title={isFavorite ? 'Saved' : 'Set favorite'}
                  onPress={() => saveFavoriteStore(store.id)}
                  secondary
                  disabled={isFavorite}
                  loading={savingFavoriteId === store.id}
                />
              </View>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { color: colors.text, lineHeight: 22, marginBottom: 14 },
  nearestCard: { backgroundColor: '#fff7d4' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '800'
  },
  favoriteBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.dark,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '800',
    marginBottom: 10
  },
  storeName: { fontSize: 20, fontWeight: '900', color: colors.dark, marginTop: 10, marginBottom: 8 },
  info: { color: colors.text, lineHeight: 22, marginBottom: 4 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  buttonHalf: { flex: 1 }
});

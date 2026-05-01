import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import { api } from '../api/client';
import { useUser } from '../context/UserContext';

export function AuthScreen() {
  const { signIn } = useUser();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ identifier: 'demoUser', password: '123456' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    displayName: '',
    email: '',
    phone: '',
    password: '',
    privacyAccepted: true,
    marketingConsent: false
  });

  async function submitLogin() {
    try {
      setLoading(true);
      const result = await api.login(loginForm);
      signIn(result.user);
    } catch (error) {
      Alert.alert('Login failed', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister() {
    try {
      setLoading(true);
      const result = await api.register(registerForm);
      signIn(result.user);
    } catch (error) {
      Alert.alert('Registration failed', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <Card style={styles.hero}>
        <Text style={styles.eyebrow}>Kokkola retail app</Text>
        <Text style={styles.title}>Loyalty, offers, stores and receipts in one calm little pocket universe.</Text>
        <Text style={styles.subtitle}>
          Cross-platform first version for iOS and Android. Clean UI, light auth, and data model ready for stronger identity later.
        </Text>
      </Card>

      <View style={styles.segment}>
        <Pressable style={[styles.segmentButton, mode === 'login' && styles.segmentActive]} onPress={() => setMode('login')}>
          <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>Login</Text>
        </Pressable>
        <Pressable style={[styles.segmentButton, mode === 'register' && styles.segmentActive]} onPress={() => setMode('register')}>
          <Text style={[styles.segmentText, mode === 'register' && styles.segmentTextActive]}>Register</Text>
        </Pressable>
      </View>

      {mode === 'login' ? (
        <Card>
          <FormField
            label="Username or email"
            value={loginForm.identifier}
            onChangeText={(identifier) => setLoginForm((prev) => ({ ...prev, identifier }))}
            placeholder="demoUser"
          />
          <FormField
            label="Password"
            value={loginForm.password}
            onChangeText={(password) => setLoginForm((prev) => ({ ...prev, password }))}
            placeholder="••••••••"
            secureTextEntry
          />
          <Text style={styles.demo}>Demo: demoUser / 123456</Text>
          <PrimaryButton title="Enter app" onPress={submitLogin} loading={loading} />
        </Card>
      ) : (
        <Card>
          <FormField
            label="Username"
            value={registerForm.username}
            onChangeText={(username) => setRegisterForm((prev) => ({ ...prev, username }))}
            placeholder="lingyu"
          />
          <FormField
            label="Display name"
            value={registerForm.displayName}
            onChangeText={(displayName) => setRegisterForm((prev) => ({ ...prev, displayName }))}
            placeholder="Lingyu"
          />
          <FormField
            label="Email"
            value={registerForm.email}
            onChangeText={(email) => setRegisterForm((prev) => ({ ...prev, email }))}
            placeholder="you@example.com"
            keyboardType="email-address"
          />
          <FormField
            label="Phone"
            value={registerForm.phone}
            onChangeText={(phone) => setRegisterForm((prev) => ({ ...prev, phone }))}
            placeholder="+358..."
            keyboardType="phone-pad"
          />
          <FormField
            label="Password"
            value={registerForm.password}
            onChangeText={(password) => setRegisterForm((prev) => ({ ...prev, password }))}
            placeholder="At least one memorable secret"
            secureTextEntry
          />

          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchTitle}>Privacy consent</Text>
              <Text style={styles.switchHint}>Required for GDPR-style consent tracking.</Text>
            </View>
            <Switch
              value={registerForm.privacyAccepted}
              onValueChange={(privacyAccepted) => setRegisterForm((prev) => ({ ...prev, privacyAccepted }))}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchTitle}>Marketing consent</Text>
              <Text style={styles.switchHint}>Optional in this first version.</Text>
            </View>
            <Switch
              value={registerForm.marketingConsent}
              onValueChange={(marketingConsent) => setRegisterForm((prev) => ({ ...prev, marketingConsent }))}
            />
          </View>

          <PrimaryButton title="Create account" onPress={submitRegister} loading={loading} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', minHeight: '100%', gap: 16 },
  hero: { backgroundColor: colors.primary },
  eyebrow: { textTransform: 'uppercase', fontWeight: '900', letterSpacing: 1, color: colors.dark },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '900', color: colors.dark, marginTop: 8 },
  subtitle: { color: colors.dark, lineHeight: 22, marginTop: 10 },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4
  },
  segmentButton: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.dark },
  segmentText: { fontWeight: '800', color: colors.dark },
  segmentTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  switchTextWrap: { flex: 1 },
  switchTitle: { fontWeight: '700', color: colors.dark },
  switchHint: { color: colors.muted, marginTop: 4 },
  demo: { color: colors.muted, marginTop: 10, marginBottom: 4 }
});

import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { NoticeBanner } from '@/components/StateViews';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/context/AuthContext';

/**
 * Deep-link landing route (`forteoptions://auth-callback`).
 *
 * The normal sign-in path completes inside AuthContext via
 * `WebBrowser.openAuthSessionAsync`, which captures the redirect before this
 * route renders. This screen exists so that a redirect delivered directly by
 * the system (e.g. the app was cold-started by the OAuth callback) still
 * lands somewhere safe: AuthContext's Linking handler performs the PKCE code
 * exchange, and once the session appears we continue to the app. It also
 * prevents Expo Router "unmatched route" errors for the auth redirect.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { user, loading, error } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [loading, user, router]);

  return (
    <View style={styles.screen}>
      <Text style={styles.wordmark}>FORTE</Text>
      {error ? (
        <NoticeBanner
          tone="error"
          message={`${error} You can close this screen and try again from the Account tab.`}
        />
      ) : (
        <>
          <ActivityIndicator size="large" color={Brand.ink} />
          <Text style={styles.label}>Completing Google sign-in…</Text>
          <Text style={styles.sublabel}>
            You will return to the app automatically.
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
  },
  wordmark: { fontSize: 30, fontWeight: '900', color: Brand.ink, letterSpacing: -1 },
  label: { fontSize: 15, fontWeight: '800', color: Brand.ink },
  sublabel: { fontSize: 12, color: Brand.muted, textAlign: 'center' },
});

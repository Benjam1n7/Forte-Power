import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { NoticeBanner } from '@/components/StateViews';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function AccountScreen() {
  const {
    user,
    session,
    loading,
    signingIn,
    error,
    isConfigured,
    signInWithGoogle,
    signOut,
    clearError,
  } = useAuth();
  const { syncState, syncError, lastSyncedAt, totalItemCount } = useCart();

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User';
  const userEmail = user?.email ?? '';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Account</Text>

      {!isConfigured ? (
        <NoticeBanner
          tone="error"
          message="Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env, then rebuild."
        />
      ) : null}
      {error ? <NoticeBanner tone="error" message={error} /> : null}

      {loading ? (
        <View style={styles.card}>
          <Text style={styles.muted}>Checking your session…</Text>
        </View>
      ) : user ? (
        <>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              {userAvatar ? (
                // Remote Google avatar (only shown when Google provided one).
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarLetter}>
                    {userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarLetter}>
                    {userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.userName} numberOfLines={1}>
                  {userName}
                </Text>
                {userEmail ? (
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {userEmail}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>Cart sync</Text>
                <Text style={styles.metaValue}>
                  {syncState === 'synced'
                    ? 'Synced'
                    : syncState === 'offline' || syncState === 'error'
                      ? 'Pending'
                      : 'Syncing…'}
                </Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>Items in cart</Text>
                <Text style={styles.metaValue}>{totalItemCount}</Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>Last sync</Text>
                <Text style={styles.metaValue}>
                  {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : '—'}
                </Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>Session</Text>
                <Text style={styles.metaValue}>
                  {session?.expires_at
                    ? `Valid to ${new Date(session.expires_at * 1000).toLocaleTimeString()}`
                    : 'Active'}
                </Text>
              </View>
            </View>

            <Text style={styles.accountNote}>
              This is the same Google account used on the Forte website — no separate
              mobile account exists.
            </Text>
          </View>

          {syncError ? (
            <NoticeBanner
              tone="warning"
              message={syncError}
              actionLabel="Retry"
              onAction={() => undefined}
            />
          ) : null}

          <Pressable
            onPress={() => void signOut()}
            style={styles.signOutButton}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={16} color={Brand.danger} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.card}>
          <Ionicons name="logo-google" size={26} color={Brand.blue} />
          <Text style={styles.signInTitle}>Sign in with Google</Text>
          <Text style={styles.mutedCentered}>
            Access your shared Forte cart, check out with your saved details, and keep the
            website and this app in sync.
          </Text>
          <Pressable
            onPress={() => void signInWithGoogle().finally(clearError)}
            disabled={signingIn}
            style={[styles.googleButton, signingIn && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            <Text style={styles.googleButtonText}>
              {signingIn ? 'Opening Google sign-in…' : 'Continue with Google'}
            </Text>
          </Pressable>
          <Text style={styles.finePrint}>
            {signingIn
              ? 'A browser window will open. Cancel any time — nothing is shared without your consent.'
              : 'You will be redirected to Google, then returned to this app.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  title: { fontSize: 28, fontWeight: '900', color: Brand.ink, letterSpacing: -0.5 },
  card: {
    backgroundColor: Brand.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: Brand.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: Brand.lime, fontSize: 22, fontWeight: '900' },
  userName: { fontSize: 16, fontWeight: '800', color: Brand.ink },
  userEmail: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignSelf: 'stretch',
  },
  metaBox: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: Brand.bg,
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Brand.muted,
    textTransform: 'uppercase',
  },
  metaValue: { fontSize: 13, fontWeight: '800', color: Brand.ink },
  accountNote: { fontSize: 11, color: Brand.muted, textAlign: 'center', lineHeight: 16 },
  muted: { fontSize: 13, color: Brand.muted },
  mutedCentered: {
    fontSize: 13,
    color: Brand.muted,
    textAlign: 'center',
    lineHeight: 19,
  },
  signInTitle: { fontSize: 17, fontWeight: '900', color: Brand.ink },
  googleButton: {
    alignSelf: 'stretch',
    backgroundColor: Brand.ink,
    borderRadius: 14,
    paddingVertical: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: { color: Brand.white, fontSize: 15, fontWeight: '800' },
  finePrint: { fontSize: 11, color: Brand.muted, textAlign: 'center', lineHeight: 16 },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 13,
    minHeight: 46,
  },
  signOutText: { color: Brand.danger, fontSize: 14, fontWeight: '800' },
});

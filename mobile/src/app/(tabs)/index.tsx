import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ProductCard } from '@/components/ProductCard';
import { ErrorState, LoadingState, NoticeBanner } from '@/components/StateViews';
import { Brand, categoryLabel } from '@/constants/brand';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductsContext';

export default function HomeScreen() {
  const router = useRouter();
  const {
    user,
    signingIn,
    signInWithGoogle,
    error: authError,
    clearError,
  } = useAuth();
  const { products, loading, error, refetch, source } = useProducts();
  const { syncState, syncError, refreshCart, totalItemCount } = useCart();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refreshCart()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refreshCart]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [products]);

  const featured = useMemo(
    () => [...products].sort((a, b) => a.price_naira - b.price_naira).slice(0, 6),
    [products]
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.ink} />
      }
    >
      {/* Brand wordmark */}
      <View style={styles.header}>
        <View>
          <View style={styles.wordmarkRow}>
            <Text style={styles.wordmark}>FORTE</Text>
            <View style={styles.signalDot} />
          </View>
          <Text style={styles.wordmarkSub}>OPTIONS</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/cart')}
          style={styles.cartButton}
          accessibilityRole="button"
          accessibilityLabel={`Open cart, ${totalItemCount} items`}
        >
          <Ionicons name="bag-outline" size={16} color={Brand.white} />
          <Text style={styles.cartButtonText}>{totalItemCount}</Text>
        </Pressable>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>POWER RESILIENCE · NIGERIA</Text>
        <Text style={styles.heroTitle}>When the grid collapses, light stays on.</Text>
        <Text style={styles.heroBody}>
          Silent DC fans, laptop-grade power banks, solar mats and emergency lighting —
          the same verified hardware sold on the Forte storefront.
        </Text>
        <Pressable
          onPress={() => router.push('/(tabs)/products')}
          style={styles.heroCta}
          accessibilityRole="button"
          accessibilityLabel="Browse the shop"
        >
          <Text style={styles.heroCtaText}>Browse the Shop</Text>
          <Ionicons name="arrow-forward" size={16} color={Brand.ink} />
        </Pressable>
      </View>

      {/* Auth + sync status */}
      {!user ? (
        <Pressable
          onPress={() => void signInWithGoogle().finally(clearError)}
          disabled={signingIn}
          style={[styles.signInCard, signingIn && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google to sync your cart"
        >
          <Ionicons name="logo-google" size={18} color={Brand.blue} />
          <View style={{ flex: 1 }}>
            <Text style={styles.signInTitle}>
              {signingIn ? 'Opening Google sign-in…' : 'Sign in to sync your cart'}
            </Text>
            <Text style={styles.signInBody}>
              Uses the same Google account as the Forte website — your website cart appears
              here automatically.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Brand.muted} />
        </Pressable>
      ) : (
        <NoticeBanner
          tone={
            syncError
              ? 'warning'
              : syncState === 'synced'
                ? 'success'
                : 'info'
          }
          message={
            syncError ??
            (syncState === 'synced'
              ? 'Cart synced with your Forte account — website changes appear here automatically.'
              : 'Syncing your cart with your Forte account…')
          }
        />
      )}
      {authError ? <NoticeBanner tone="error" message={authError} /> : null}
      {/* Categories */}
      {categories.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop by category</Text>
          <View style={styles.chipRow}>
            {categories.map((category) => (
              <Pressable
                key={category}
                onPress={() =>
                  router.push(`/products?category=${encodeURIComponent(category)}`)
                }
                style={styles.chip}
                accessibilityRole="button"
                accessibilityLabel={`${categoryLabel(category)} category`}
              >
                <Text style={styles.chipText}>{categoryLabel(category)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {/* Catalogue */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured hardware</Text>
        {loading ? (
          <LoadingState label="Loading products…" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void refetch()} />
        ) : featured.length === 0 ? (
          <ErrorState title="No products yet" message="The product catalogue is empty." />
        ) : (
          <View style={styles.grid}>
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                compact
                onAdd={(p) => router.push(`/product/${encodeURIComponent(p.id)}`)}
              />
            ))}
          </View>
        )}
        {source === 'fallback' && !loading ? (
          <NoticeBanner
            tone="warning"
            message="Showing the local cached catalogue (database unreachable)."
          />
        ) : null}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wordmark: { fontSize: 26, fontWeight: '900', color: Brand.ink, letterSpacing: -1 },
  signalDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: Brand.orange,
    marginTop: 4,
  },
  wordmarkSub: {
    fontSize: 10,
    letterSpacing: 4,
    color: Brand.muted,
    fontWeight: '700',
    marginTop: -2,
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.ink,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minHeight: 40,
  },
  cartButtonText: { color: Brand.white, fontWeight: '800', fontSize: 13 },
  hero: {
    backgroundColor: Brand.ink,
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },
  heroKicker: {
    color: Brand.lime,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heroTitle: {
    color: Brand.white,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  heroBody: {
    color: 'rgba(245,241,232,0.75)',
    fontSize: 13,
    lineHeight: 19,
  },
  heroCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.orange,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    marginTop: 4,
    minHeight: 44,
  },
  heroCtaText: { color: Brand.white, fontWeight: '800', fontSize: 14 },
  signInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Brand.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 14,
  },
  signInTitle: { fontSize: 14, fontWeight: '800', color: Brand.ink },
  signInBody: { fontSize: 12, color: Brand.muted, lineHeight: 17, marginTop: 2 },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Brand.muted,
    textTransform: 'uppercase',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    minHeight: 38,
    justifyContent: 'center',
  },
  chipText: { fontSize: 12, fontWeight: '700', color: Brand.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});



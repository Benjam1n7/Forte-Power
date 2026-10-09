import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ProductCard } from '@/components/ProductCard';
import { EmptyState, ErrorState, LoadingState, NoticeBanner } from '@/components/StateViews';
import { Brand, categoryLabel } from '@/constants/brand';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductsContext';

export default function ProductsScreen() {
  const { products, loading, error, refetch, source } = useProducts();
  const { refreshCart, addToCart } = useCart();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const [selected, setSelected] = useState<string>(params.category ?? 'all');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const handleAdd = useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      addToCart(product, 1);
      setJustAddedId(productId);
      setTimeout(() => {
        setJustAddedId((current) => (current === productId ? null : current));
      }, 2200);
    },
    [products, addToCart]
  );

  // Cross-device cart sync: refetch the shared cart whenever this screen
  // (or any screen layered above it in this tab group) regains focus.
  useFocusEffect(
    useCallback(() => {
      void refreshCart();
    }, [refreshCart])
  );

  // Keep the filter in sync when a category link is opened from Home.
  React.useEffect(() => {
    if (params.category) setSelected(params.category);
  }, [params.category]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = selected === 'all' || p.category === selected;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [products, selected, query]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refreshCart()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refreshCart]);

  return (
    <View style={styles.screen}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Shop</Text>
        <Text style={styles.subtitle}>
          {products.length} verified power-resilience products · prices in Nigerian naira
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search products…"
          placeholderTextColor={Brand.muted}
          style={styles.search}
          accessibilityLabel="Search products"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {[{ id: 'all', label: 'All' }, ...categories.map((c) => ({ id: c, label: categoryLabel(c) }))].map(
            (chip) => (
              <Pressable
                key={chip.id}
                onPress={() => setSelected(chip.id)}
                style={[styles.chip, selected === chip.id && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: selected === chip.id }}
                accessibilityLabel={chip.label}
              >
                <Text style={[styles.chipText, selected === chip.id && styles.chipTextActive]}>
                  {chip.label}
                </Text>
              </Pressable>
            )
          )}
        </ScrollView>
      </View>

      {source === 'fallback' && !loading ? (
        <View style={styles.bannerWrap}>
          <NoticeBanner
            tone="warning"
            message="Showing the local cached catalogue (database unreachable)."
          />
        </View>
      ) : null}

      {loading ? (
        <LoadingState label="Loading products…" />
      ) : error && products.length === 0 ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.ink} />
          }
        >
          {filtered.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="No products match"
              message={
                query
                  ? `Nothing found for “${query}”.`
                  : 'No products in this category yet.'
              }
              actionLabel="Clear filters"
              onAction={() => {
                setQuery('');
                setSelected('all');
              }}
            />
          ) : (
            <View style={styles.grid}>
              {filtered.map((product) => (
                <View key={product.id} style={styles.gridItem}>
                  <ProductCard
                    product={product}
                    adding={justAddedId === product.id}
                    onAdd={(p) => handleAdd(p.id)}
                  />
                </View>
              ))}
            </View>
          )}
          {justAddedId ? (
            <NoticeBanner
              tone="success"
              message="Added to your cart."
              actionLabel="View cart"
              onAction={() => router.push('/(tabs)/cart')}
            />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  headerBlock: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 10,
    backgroundColor: Brand.bg,
  },
  title: { fontSize: 28, fontWeight: '900', color: Brand.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Brand.muted },
  search: {
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Brand.ink,
    minHeight: 44,
  },
  chipRow: { gap: 8, paddingRight: 16 },
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
  chipActive: {
    backgroundColor: Brand.ink,
    borderColor: Brand.ink,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: Brand.ink },
  chipTextActive: { color: Brand.white },
  bannerWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  list: { padding: 16, paddingTop: 6, paddingBottom: 32, gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '48%', flexGrow: 1 },
});


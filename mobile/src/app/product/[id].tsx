import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { QuantityStepper } from '@/components/QuantityStepper';
import { ErrorState, LoadingState } from '@/components/StateViews';
import { Brand, categoryLabel } from '@/constants/brand';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductsContext';
import { formatNaira } from '@/lib/format';
import { PLACEHOLDER_PRODUCT_IMAGE, resolveProductImage } from '@/lib/images';
import type { Product } from '@/lib/types';

function specRows(product: Product): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const specs = (product.specifications ?? {}) as Record<string, any>;
  if (product.watts) rows.push({ label: 'Power', value: `${product.watts}W` });
  if (product.battery_wh) rows.push({ label: 'Battery capacity', value: `${product.battery_wh}Wh` });
  if (specs.capacity_mah) rows.push({ label: 'Capacity', value: `${specs.capacity_mah} mAh` });
  if (specs.solar_watts) rows.push({ label: 'Solar output', value: `${specs.solar_watts}W` });
  if (specs.fan_blade_inches) rows.push({ label: 'Blade size', value: `${specs.fan_blade_inches}"` });
  if (specs.lamp_lumens) rows.push({ label: 'Brightness', value: `${specs.lamp_lumens} lm` });
  if (specs.battery_life_hours) rows.push({ label: 'Runtime', value: String(specs.battery_life_hours) });
  if (specs.weight_kg) rows.push({ label: 'Weight', value: `${specs.weight_kg} kg` });
  if (Array.isArray(specs.outputs) && specs.outputs.length) {
    rows.push({ label: 'Outputs', value: specs.outputs.join(' · ') });
  }
  if (Array.isArray(specs.inputs) && specs.inputs.length) {
    rows.push({ label: 'Inputs', value: specs.inputs.join(' · ') });
  }
  if (product.warranty_months) rows.push({ label: 'Warranty', value: `${product.warranty_months} months` });
  return rows;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { products, loading, error, refetch } = useProducts();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const productId = typeof id === 'string' ? decodeURIComponent(id) : '';
  const product = products.find((p) => p.id === productId);

  if (loading && !product) {
    return <LoadingState label="Loading product…" />;
  }
  if (!product) {
    return (
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={Brand.ink} />
          </Pressable>
        </View>
        <ErrorState
          title="Product not found"
          message={error ?? `No product with ID “${productId}” is in the catalogue.`}
          onRetry={() => void refetch()}
        />
      </View>
    );
  }

  const source = resolveProductImage(product.image_url) ?? PLACEHOLDER_PRODUCT_IMAGE;
  const outOfStock = product.stock_quantity <= 0;
  const specs = specRows(product);

  const handleAdd = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image source={source} style={styles.hero} resizeMode="cover" />

        <View style={styles.body}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{categoryLabel(product.category)}</Text>
            </View>
            {product.is_verified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={12} color={Brand.blue} />
                <Text style={styles.verifiedText}>Verified Genuine</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{formatNaira(product.price_naira)}</Text>
          <Text style={styles.stock}>
            {outOfStock
              ? 'Out of stock'
              : product.stock_quantity <= 10
                ? `Only ${product.stock_quantity} left in stock`
                : 'In stock · Nationwide delivery available'}
          </Text>

          <Text style={styles.description}>{product.description}</Text>

          {specs.length > 0 ? (
            <View style={styles.specCard}>
              <Text style={styles.specTitle}>Laboratory specifications</Text>
              {specs.map((row) => (
                <View key={row.label} style={styles.specRow}>
                  <Text style={styles.specLabel}>{row.label}</Text>
                  <Text style={styles.specValue} numberOfLines={3}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <QuantityStepper
          quantity={quantity}
          onChange={setQuantity}
          max={Math.max(1, Math.min(99, product.stock_quantity))}
          accessibilityLabelSuffix={product.short_name || product.name}
        />
        <Pressable
          onPress={handleAdd}
          disabled={outOfStock}
          style={[styles.addButton, outOfStock && styles.addButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel={`Add ${product.name} to cart`}
        >
          <Ionicons name="bag-add" size={17} color={Brand.white} />
          <Text style={styles.addText}>
            {outOfStock
              ? 'Out of Stock'
              : added
                ? 'Added ✓'
                : `Add · ${formatNaira(product.price_naira * quantity)}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  topBar: { paddingHorizontal: 16, paddingTop: 12 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingBottom: 24 },
  hero: { width: '100%', height: 300, backgroundColor: Brand.cardMuted },
  body: { padding: 16, gap: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  categoryBadge: {
    backgroundColor: Brand.ink,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  categoryBadgeText: {
    color: Brand.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF0FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  verifiedText: { fontSize: 11, fontWeight: '700', color: Brand.blue },
  name: { fontSize: 22, fontWeight: '900', color: Brand.ink, lineHeight: 28 },
  price: { fontSize: 26, fontWeight: '900', color: Brand.orange },
  stock: { fontSize: 12, color: Brand.muted },
  description: { fontSize: 14, color: Brand.ink, lineHeight: 21, opacity: 0.85, marginTop: 4 },
  specCard: {
    backgroundColor: Brand.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 14,
    marginTop: 8,
    gap: 8,
  },
  specTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Brand.muted,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
    paddingTop: 8,
  },
  specLabel: { fontSize: 12, color: Brand.muted, flexShrink: 0 },
  specValue: { fontSize: 12, fontWeight: '700', color: Brand.ink, flex: 1, textAlign: 'right' },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: Brand.white,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brand.ink,
    borderRadius: 16,
    paddingVertical: 15,
    minHeight: 52,
  },
  addButtonDisabled: { opacity: 0.45 },
  addText: { color: Brand.white, fontSize: 15, fontWeight: '800' },
});


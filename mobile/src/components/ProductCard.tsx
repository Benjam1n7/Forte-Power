import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '../constants/brand';
import { formatNaira } from '../lib/format';
import { PLACEHOLDER_PRODUCT_IMAGE, resolveProductImage } from '../lib/images';
import { Product } from '../lib/types';

interface Props {
  product: Product;
  onAdd: (product: Product) => void;
  adding?: boolean;
  compact?: boolean;
}

export const ProductCard: React.FC<Props> = ({ product, onAdd, adding, compact }) => {
  const router = useRouter();
  const source = resolveProductImage(product.image_url) ?? PLACEHOLDER_PRODUCT_IMAGE;
  const outOfStock = product.stock_quantity <= 0;

  return (
    <Pressable
      onPress={() => router.push(`/product/${encodeURIComponent(product.id)}`)}
      style={[styles.card, compact && styles.cardCompact]}
      accessibilityRole="button"
      accessibilityLabel={`View ${product.name}, ${formatNaira(product.price_naira)}`}
    >
      <Image source={source} style={styles.image} resizeMode="cover" />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatNaira(product.price_naira)}</Text>
          {product.is_verified ? (
            <View style={styles.verified}>
              <Ionicons name="shield-checkmark" size={11} color={Brand.blue} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.stock} numberOfLines={1}>
          {outOfStock
            ? 'Out of stock'
            : product.stock_quantity <= 10
              ? `Only ${product.stock_quantity} left`
              : 'In stock'}
        </Text>
        <Pressable
          onPress={() => !outOfStock && !adding && onAdd(product)}
          disabled={outOfStock || adding}
          style={[styles.addButton, (outOfStock || adding) && styles.addButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel={`Add ${product.name} to cart`}
        >
          <Ionicons name="bag-add" size={15} color={Brand.white} />
          <Text style={styles.addText}>{adding ? 'Adding…' : outOfStock ? 'Unavailable' : 'Add to Cart'}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Brand.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.border,
    overflow: 'hidden',
  },
  cardCompact: {
    maxWidth: 220,
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: Brand.cardMuted,
  },
  body: {
    padding: 12,
    gap: 6,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.ink,
    lineHeight: 17,
    minHeight: 34,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: Brand.ink,
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EAF0FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: Brand.blue,
  },
  stock: {
    fontSize: 11,
    color: Brand.muted,
  },
  addButton: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Brand.ink,
    borderRadius: 14,
    paddingVertical: 11,
    minHeight: 44,
  },
  addButtonDisabled: {
    opacity: 0.45,
  },
  addText: {
    color: Brand.white,
    fontSize: 13,
    fontWeight: '700',
  },
});

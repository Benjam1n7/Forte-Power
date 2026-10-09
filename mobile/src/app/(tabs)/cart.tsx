import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { QuantityStepper } from '@/components/QuantityStepper';
import { EmptyState, LoadingState, NoticeBanner } from '@/components/StateViews';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { formatNaira } from '@/lib/format';
import { PLACEHOLDER_PRODUCT_IMAGE, resolveProductImage } from '@/lib/images';

export default function CartScreen() {
  const router = useRouter();
  const { user, signInWithGoogle, error: authError, clearError } = useAuth();
  const {
    items,
    groupedItems,
    loading,
    syncing,
    syncState,
    syncError,
    refreshCart,
    updateQuantity,
    removeFromCart,
    totalItemCount,
    subtotalNaira,
    discountPercent,
    discountNaira,
    shippingFeeNaira,
    totalNaira,
  } = useCart();
  const [refreshing, setRefreshing] = useState(false);

  // Cross-device sync: refetch the shared cart whenever the Cart tab (or a
  // screen pushed on top of it) regains focus.
  useFocusEffect(
    useCallback(() => {
      void refreshCart();
    }, [refreshCart])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshCart();
    } finally {
      setRefreshing(false);
    }
  }, [refreshCart]);

  const handleCheckout = async () => {
    if (user) {
      router.push('/checkout');
      return;
    }
    const { error, cancelled } = await signInWithGoogle();
    if (!error && !cancelled) {
      clearError();
      router.push('/checkout');
    }
  };

  const syncMessage = syncError
    ? syncError
    : !user
      ? 'You are browsing a device-local cart. Sign in to share it with the Forte website.'
      : syncState === 'synced'
        ? 'Cart synced with your Forte account.'
        : 'Syncing your cart…';

  if (loading && items.length === 0) {
    return <LoadingState label="Loading your cart…" />;
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.ink} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Kit Bag</Text>
          <Text style={styles.subtitle}>
            {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
            {syncing ? ' · syncing…' : ''}
          </Text>
        </View>
        <View style={styles.statusPill}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: !user
                  ? Brand.muted
                  : syncState === 'synced'
                    ? Brand.success
                    : syncState === 'offline' || syncState === 'error'
                      ? Brand.orange
                      : Brand.blue,
              },
            ]}
          />
          <Text style={styles.statusText}>
            {!user
              ? 'Local'
              : syncState === 'synced'
                ? 'Synced'
                : syncState === 'offline' || syncState === 'error'
                  ? 'Pending'
                  : 'Syncing'}
          </Text>
        </View>
      </View>

      <NoticeBanner
        tone={!user ? 'info' : syncError ? 'warning' : 'info'}
        message={syncMessage}
        actionLabel={syncError ? 'Retry' : undefined}
        onAction={syncError ? () => void refreshCart() : undefined}
      />
      {authError ? <NoticeBanner tone="error" message={authError} /> : null}
      {items.length === 0 ? (
        <EmptyState
          icon="bag-handle-outline"
          title="Your kit bag is empty"
          message="Browse the shop and add power-resilience hardware — it stays in sync across the website and this app."
          actionLabel="Browse the Shop"
          onAction={() => router.push('/(tabs)/products')}
        />
      ) : (
        groupedItems.map((group) => (
          <View key={group.kitId} style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>{group.kitName}</Text>
              <Text style={styles.groupSubtotal}>{formatNaira(group.subtotal)}</Text>
            </View>

            {group.items.map((item) => {
              const source =
                resolveProductImage(item.product.image_url) ?? PLACEHOLDER_PRODUCT_IMAGE;
              return (
                <View key={item.id} style={styles.itemCard}>
                  <Image source={source} style={styles.itemImage} resizeMode="cover" />
                  <View style={styles.itemBody}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.product.short_name || item.product.name}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {formatNaira(item.product.price_naira)} each ·{' '}
                      {formatNaira(item.product.price_naira * item.quantity)}
                    </Text>
                    <View style={styles.itemControls}>
                      <QuantityStepper
                        quantity={item.quantity}
                        onChange={(next) => updateQuantity(item.id, next)}
                        accessibilityLabelSuffix={
                          item.product.short_name || item.product.name
                        }
                      />
                      <Pressable
                        onPress={() => removeFromCart(item.id)}
                        style={styles.removeButton}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${item.product.name} from cart`}
                      >
                        <Ionicons name="trash-outline" size={16} color={Brand.danger} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ))
      )}
      {/* Totals + checkout */}
      {items.length > 0 ? (
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Hardware Subtotal</Text>
            <Text style={styles.totalValue}>{formatNaira(subtotalNaira)}</Text>
          </View>
          {discountPercent > 0 ? (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: Brand.blue }]}>
                Bundle Discount ({discountPercent}%)
              </Text>
              <Text style={[styles.totalValue, { color: Brand.blue }]}>
                -{formatNaira(discountNaira)}
              </Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Nationwide Delivery</Text>
            <Text style={styles.totalValue}>
              {shippingFeeNaira === 0 ? 'FREE' : formatNaira(shippingFeeNaira)}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowGrand]}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>{formatNaira(totalNaira)}</Text>
          </View>

          <Pressable
            onPress={() => void handleCheckout()}
            style={[styles.checkoutButton, syncing && styles.checkoutButtonBusy]}
            accessibilityRole="button"
            accessibilityLabel={
              user ? 'Proceed to checkout' : 'Sign in with Google and proceed to checkout'
            }
          >
            <Text style={styles.checkoutText}>
              {user ? 'Proceed to Checkout' : 'Sign in & Checkout'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={Brand.ink} />
          </Pressable>
          <Text style={styles.checkoutNote}>
            Prices are re-verified on the server at checkout. Delivery is FREE from
            ₦150,000.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 28, fontWeight: '900', color: Brand.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusDot: { width: 8, height: 8, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '800', color: Brand.ink },
  group: { gap: 10 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Brand.muted,
  },
  groupSubtotal: { fontSize: 12, fontWeight: '700', color: Brand.muted },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Brand.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 10,
    gap: 12,
  },
  itemImage: { width: 84, height: 84, borderRadius: 12, backgroundColor: Brand.cardMuted },
  itemBody: { flex: 1, gap: 4 },
  itemName: { fontSize: 13, fontWeight: '800', color: Brand.ink, lineHeight: 17 },
  itemPrice: { fontSize: 12, color: Brand.muted },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  removeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
  },
  totalsCard: {
    backgroundColor: Brand.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 16,
    gap: 8,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, color: Brand.muted },
  totalValue: { fontSize: 13, fontWeight: '700', color: Brand.ink },
  totalRowGrand: {
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    paddingTop: 10,
    marginTop: 4,
  },
  grandLabel: { fontSize: 15, fontWeight: '800', color: Brand.ink },
  grandValue: { fontSize: 22, fontWeight: '900', color: Brand.ink },
  checkoutButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brand.lime,
    borderRadius: 16,
    paddingVertical: 15,
    minHeight: 52,
  },
  checkoutButtonBusy: { opacity: 0.7 },
  checkoutText: { fontSize: 15, fontWeight: '900', color: Brand.ink },
  checkoutNote: { fontSize: 11, color: Brand.muted, textAlign: 'center', lineHeight: 16 },
});



import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { NoticeBanner } from '@/components/StateViews';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { NIGERIAN_STATES } from '@/data/catalog';
import { formatNaira } from '@/lib/format';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { CreateOrderResponse, PaymentMethod } from '@/lib/types';

interface FormFields {
  fullName: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
}

const NG_PHONE_REGEX = /^(\+234|234|0)[789][01]\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(name: keyof FormFields, value: string): string | undefined {
  switch (name) {
    case 'fullName':
      if (!value.trim()) return 'Full name is required.';
      if (value.trim().length < 2) return 'Please enter your complete name (min 2 letters).';
      return undefined;
    case 'email':
      if (!value.trim()) return 'Email address is required.';
      if (!EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address.';
      return undefined;
    case 'phone': {
      if (!value.trim()) return 'Phone number is required for delivery rider dispatch.';
      const cleanPhone = value.replace(/[\s-]/g, '');
      if (!NG_PHONE_REGEX.test(cleanPhone)) {
        return 'Enter a valid Nigerian phone number (e.g. 0803 123 4567).';
      }
      return undefined;
    }
    case 'streetAddress':
      if (!value.trim()) return 'Street address is required.';
      if (value.trim().length < 5) return 'Specify street name and house/office number.';
      return undefined;
    case 'city':
      if (!value.trim()) return 'City or Town is required.';
      if (value.trim().length < 2) return 'City must be at least 2 characters.';
      return undefined;
    case 'state':
      if (!value.trim()) return 'Please select a delivery state.';
      return undefined;
    default:
      return undefined;
  }
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    items,
    clearCart,
    subtotalNaira,
    discountNaira,
    shippingFeeNaira,
    totalNaira,
  } = useCart();

  const [form, setForm] = useState<FormFields>({
    fullName: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
    email: user?.email || '',
    phone: '',
    streetAddress: '',
    city: '',
    state: 'Lagos',
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pay_on_delivery');
  const [confirmedOrder, setConfirmedOrder] = useState<CreateOrderResponse | null>(null);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      fullName:
        prev.fullName || user?.user_metadata?.full_name || user?.user_metadata?.name || '',
      email: prev.email || user?.email || '',
    }));
  }, [user]);

  const handleChange = (name: keyof FormFields, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateAll = (): boolean => {
    const next: Record<string, string | undefined> = {};
    (Object.keys(form) as (keyof FormFields)[]).forEach((key) => {
      const err = validateField(key, form[key]);
      if (err) next[key] = err;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  /**
   * Submits through the SAME `create-order` Supabase Edge Function the
   * website uses. Only product IDs and quantities leave the device — all
   * prices, discounts, and fees are recalculated server-side from the
   * products table, and the order row is written with the service-role
   * client inside the function (never by this app).
   */
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmissionError(null);

    if (items.length === 0) {
      setSubmissionError('Your cart is empty. Add products before checking out.');
      return;
    }
    if (!user) {
      setSubmissionError('Please sign in with Google before checking out.');
      return;
    }
    if (!validateAll()) {
      setSubmissionError('Please fix the highlighted fields before proceeding.');
      return;
    }
    if (!isSupabaseConfigured) {
      setSubmissionError('Supabase is not configured — checkout is unavailable.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          kitId: item.kitId,
          kitName: item.kitName,
        })),
        delivery_name: form.fullName.trim(),
        delivery_phone: form.phone.trim(),
        delivery_address: `${form.streetAddress.trim()}, ${form.city.trim()}`,
        delivery_state: form.state.trim(),
        payment_method: paymentMethod,
      };

      const { data, error } = await supabase.functions.invoke<CreateOrderResponse>(
        'create-order',
        { body: payload }
      );

      if (error) {
        throw new Error(
          error.message ||
            'Could not reach the order service. Check your connection and try again.'
        );
      }
      if (!data?.orderNumber) {
        throw new Error('The order service returned an unexpected response.');
      }

      setConfirmedOrder(data);
      clearCart();
    } catch (err) {
      setSubmissionError(
        (err as Error).message || 'Failed to submit order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Guard: never render a checkout form without a signed-in user.
  if (!user) {
    return (
      <View style={styles.screen}>
        <Header onBack={() => router.back()} title="Checkout" />
        <NoticeBanner
          tone="info"
          message="Checkout requires Google sign-in so your order is attached to your account."
        />
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // ORDER CONFIRMATION (server response only — nothing is invented here)
  // ---------------------------------------------------------------------------
  if (confirmedOrder) {
    const order = confirmedOrder.order;
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.confirmScroll}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Text style={styles.confirmIconText}>✓</Text>
            </View>
            <Text style={styles.confirmTitle}>Order {order.status}</Text>
            <Text style={styles.confirmNumber}>{confirmedOrder.orderNumber}</Text>
            <Text style={styles.confirmNote}>
              Payment method: {order.payment_method === 'bank_transfer' ? 'Bank transfer' : 'Pay on delivery'}. Our team will contact you on{' '}
              {order.delivery_phone} to confirm delivery to {order.delivery_state}.
            </Text>

            <View style={styles.confirmTotals}>
              <Row label="Subtotal" value={formatNaira(Number(order.subtotal))} />
              {Number(order.discount) > 0 ? (
                <Row label="Discount" value={`-${formatNaira(Number(order.discount))}`} />
              ) : null}
              <Row
                label="Delivery"
                value={Number(order.delivery_fee) === 0 ? 'FREE' : formatNaira(Number(order.delivery_fee))}
              />
              <Row bold label="Total" value={formatNaira(Number(order.total))} />
            </View>

            {Array.isArray(order.items) && order.items.length > 0 ? (
              <View style={styles.confirmItems}>
                {order.items.map((item, index) => (
                  <Text key={`${item.product_id}-${index}`} style={styles.confirmItem} numberOfLines={2}>
                    {item.name} × {item.quantity}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={styles.primaryButton}
            accessibilityRole="button"
            accessibilityLabel="Back to home"
          >
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </Pressable>
          <Text style={styles.finePrint}>
            Prices above were recalculated and verified on the Forte server from the live
            product database.
          </Text>
        </ScrollView>
      </View>
    );
  }
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Header onBack={() => router.back()} title="Checkout" />

        <NoticeBanner
          tone="info"
          message="Order totals are recalculated on the Forte server from live database prices — client-side prices are never trusted."
        />
        {submissionError ? <NoticeBanner tone="error" message={submissionError} /> : null}

        {/* Delivery details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery details</Text>

          <Field
            label="Full name"
            value={form.fullName}
            onChangeText={(v) => handleChange('fullName', v)}
            error={errors.fullName}
            autoCapitalize="words"
          />
          <Field
            label="Email"
            value={form.email}
            onChangeText={(v) => handleChange('email', v)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Phone"
            value={form.phone}
            onChangeText={(v) => handleChange('phone', v)}
            error={errors.phone}
            keyboardType="phone-pad"
            placeholder="0803 123 4567"
          />
          <Field
            label="Street address"
            value={form.streetAddress}
            onChangeText={(v) => handleChange('streetAddress', v)}
            error={errors.streetAddress}
            placeholder="12 Adeola Odeku Street, Victoria Island"
          />
          <Field
            label="City / Town"
            value={form.city}
            onChangeText={(v) => handleChange('city', v)}
            error={errors.city}
          />

          <Text style={styles.fieldLabel}>State</Text>
          <View style={styles.stateWrap}>
            {NIGERIAN_STATES.map((stateName) => (
              <Pressable
                key={stateName}
                onPress={() => handleChange('state', stateName)}
                style={[styles.stateChip, form.state === stateName && styles.stateChipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: form.state === stateName }}
                accessibilityLabel={stateName}
              >
                <Text
                  style={[
                    styles.stateChipText,
                    form.state === stateName && styles.stateChipTextActive,
                  ]}
                >
                  {stateName}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Payment method — exactly the two options implemented by the backend */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment method</Text>
          {(
            [
              { id: 'pay_on_delivery', label: 'Pay on delivery' },
              { id: 'bank_transfer', label: 'Bank transfer' },
            ] as { id: PaymentMethod; label: string }[]
          ).map((option) => (
            <Pressable
              key={option.id}
              onPress={() => setPaymentMethod(option.id)}
              style={[styles.payRow, paymentMethod === option.id && styles.payRowActive]}
              accessibilityRole="radio"
              accessibilityState={{ selected: paymentMethod === option.id }}
              accessibilityLabel={option.label}
            >
              <View style={[styles.radio, paymentMethod === option.id && styles.radioActive]} />
              <Text style={styles.payLabel}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Order summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order summary</Text>
          {items.map((item) => (
            <Row
              key={item.id}
              label={`${item.product.short_name || item.product.name} × ${item.quantity}`}
              value={formatNaira(item.product.price_naira * item.quantity)}
            />
          ))}
          <View style={styles.divider} />
          <Row label="Subtotal" value={formatNaira(subtotalNaira)} />
          {discountNaira > 0 ? (
            <Row accent label="Bundle discount" value={`-${formatNaira(discountNaira)}`} />
          ) : null}
          <Row
            label="Nationwide delivery"
            value={shippingFeeNaira === 0 ? 'FREE' : formatNaira(shippingFeeNaira)}
          />
          <Row bold label="Total payable" value={formatNaira(totalNaira)} />
        </View>

        <Pressable
          onPress={() => void handleSubmit()}
          disabled={submitting}
          style={[styles.primaryButton, submitting && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel="Place order"
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? 'Placing order…' : `Place Order · ${formatNaira(totalNaira)}`}
          </Text>
        </Pressable>
        <Text style={styles.finePrint}>
          By placing this order you confirm the delivery details above. An order reference
          is issued by the Forte server; payment is collected via your chosen method after
          order confirmation.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Simple labeled text field with inline validation error. */
function Field({
  label,
  error,
  ...inputProps
}: {
  label: string;
  error?: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...inputProps}
        style={[styles.input, error ? styles.inputError : null]}
        placeholderTextColor={Brand.muted}
        accessibilityLabel={label}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

/** Label/value summary row. */
function Row({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.rowLabel,
          bold && styles.rowBold,
          accent && { color: Brand.blue },
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.rowValue,
          bold && styles.rowBoldValue,
          accent && { color: Brand.blue },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/** Stack-screen header with an Android-friendly back button. */
function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={styles.backButton}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backButtonText}>‹</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 42 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
  backButtonText: { fontSize: 26, color: Brand.ink, marginTop: -4 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Brand.ink },
  card: {
    backgroundColor: Brand.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Brand.muted,
  },
  field: { gap: 5 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Brand.ink },
  input: {
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: Brand.ink,
    minHeight: 44,
  },
  inputError: { borderColor: Brand.danger },
  fieldError: { fontSize: 11, color: Brand.danger },
  stateWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stateChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.bg,
    minHeight: 36,
    justifyContent: 'center',
  },
  stateChipActive: { backgroundColor: Brand.ink, borderColor: Brand.ink },
  stateChipText: { fontSize: 12, fontWeight: '700', color: Brand.ink },
  stateChipTextActive: { color: Brand.white },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Brand.bg,
  },
  payRowActive: { borderColor: Brand.ink, backgroundColor: Brand.white },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Brand.muted,
  },
  radioActive: {
    borderColor: Brand.ink,
    backgroundColor: Brand.orange,
  },
  payLabel: { fontSize: 14, fontWeight: '700', color: Brand.ink },
  divider: { height: 1, backgroundColor: Brand.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontSize: 13, color: Brand.muted, flexShrink: 1 },
  rowValue: { fontSize: 13, fontWeight: '700', color: Brand.ink },
  rowBold: { fontWeight: '900', color: Brand.ink, fontSize: 15 },
  rowBoldValue: { fontWeight: '900', color: Brand.ink, fontSize: 18 },
  primaryButton: {
    backgroundColor: Brand.orange,
    borderRadius: 16,
    paddingVertical: 16,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: Brand.white, fontSize: 16, fontWeight: '900' },
  finePrint: { fontSize: 11, color: Brand.muted, textAlign: 'center', lineHeight: 16 },
  confirmScroll: { padding: 24, gap: 16, alignItems: 'center' },
  confirmCard: {
    backgroundColor: Brand.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 24,
    gap: 10,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  confirmIcon: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmIconText: { fontSize: 30, color: Brand.success, fontWeight: '900' },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Brand.ink,
    textTransform: 'capitalize',
  },
  confirmNumber: { fontSize: 15, fontWeight: '800', color: Brand.orange },
  confirmNote: {
    fontSize: 13,
    color: Brand.muted,
    textAlign: 'center',
    lineHeight: 19,
  },
  confirmTotals: { alignSelf: 'stretch', gap: 6, marginTop: 8 },
  confirmItems: {
    alignSelf: 'stretch',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  confirmItem: { fontSize: 12, color: Brand.ink },
});




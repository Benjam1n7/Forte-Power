import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatNaira } from '../../lib/formatters';
import { NIGERIAN_STATES } from '../../data/products';
import { SignalDot } from '../ui/SignalDot';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import {
  ShieldCheck,
  Lock,
  Truck,
  CheckCircle2,
  ArrowLeft,
  Building2,
  CreditCard,
  AlertCircle,
  PackageCheck,
  Printer,
  ChevronRight,
} from 'lucide-react';

interface CheckoutPageProps {
  onBackToShop: () => void;
}

interface FormFields {
  fullName: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  paymentMethod: 'pay_on_delivery' | 'bank_transfer';
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  paymentMethod?: string;
  [key: string]: string | undefined;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBackToShop }) => {
  const { items, clearCart, subtotalNaira, discountNaira, shippingFeeNaira, totalNaira } = useCart();
  const { user } = useAuth();

  // Prefilled from Google Profile
  const [form, setForm] = useState<FormFields>({
    fullName: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
    email: user?.email || '',
    phone: '',
    streetAddress: '',
    city: '',
    state: 'Lagos',
    paymentMethod: 'pay_on_delivery',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  // Submission & Confirmation state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);

  // Sync Google profile data if user loads late
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: prev.fullName || user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  // Inline Validation on every field
  const validateField = (name: keyof FormFields, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required.';
        if (value.trim().length < 2) return 'Please enter your complete name (min 2 letters).';
        return undefined;

      case 'email':
        if (!value.trim()) return 'Email address is required.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return 'Please enter a valid email address.';
        return undefined;

      case 'phone':
        if (!value.trim()) return 'Phone number is required for delivery rider dispatch.';
        // Nigerian phone check: standard 11 digits or +234 followed by 10 digits
        const cleanPhone = value.replace(/[\s-]/g, '');
        const ngPhoneRegex = /^(\+234|234|0)[789][01]\d{8}$/;
        if (!ngPhoneRegex.test(cleanPhone)) {
          return 'Enter a valid Nigerian phone number (e.g. 0803 123 4567 or +234 803 123 4567).';
        }
        return undefined;

      case 'streetAddress':
        if (!value.trim()) return 'Street address is required.';
        if (value.trim().length < 5) return 'Please specify street name and house/office number.';
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
  };

  const handleFieldChange = (name: keyof FormFields, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleFieldBlur = (name: keyof FormFields) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, form[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    (Object.keys(form) as Array<keyof FormFields>).forEach(key => {
      const err = validateField(key, form[key]);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      streetAddress: true,
      city: true,
      state: true,
    });
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler: calls Edge Function "create-order"
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double-submit
    if (isSubmitting) return;

    setSubmissionError(null);

    if (items.length === 0) {
      setSubmissionError('Your cart is empty. Add a kit before checking out.');
      return;
    }

    if (!validateAll()) {
      setSubmissionError('Please fix the errors highlighted in red before proceeding.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          kitId: item.kitId,
          kitName: item.kitName,
        })),
        delivery_name: form.fullName.trim(),
        delivery_phone: form.phone.trim(),
        delivery_address: form.streetAddress.trim(),
        delivery_state: form.state.trim(),
        payment_method: form.paymentMethod,
      };

      let orderResponseData: any = null;

      // 1. Try invoking the deployed Supabase Edge Function "create-order"
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.functions.invoke('create-order', {
            body: payload,
          });

          if (!error && data?.orderNumber) {
            orderResponseData = data;
          }
        } catch (edgeFnErr) {
          console.warn('Edge Function direct invocation bypassed:', edgeFnErr);
        }
      }

      // 2. Fallback to server route proxy if Edge Function is in local development mode
      if (!orderResponseData) {
        const res = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: payload.items,
            customerName: payload.delivery_name,
            customerEmail: form.email.trim(),
            customerPhone: payload.delivery_phone,
            shippingAddress: {
              streetAddress: payload.delivery_address,
              city: form.city.trim(),
              state: payload.delivery_state,
            },
            paymentReference: `PAY-${payload.payment_method.toUpperCase()}-${Date.now()}`,
          }),
        });

        const data = await res.json();
        if (data.success && data.order) {
          orderResponseData = {
            orderId: data.order.id,
            orderNumber: data.order.orderNumber,
            order: data.order,
          };
        } else {
          throw new Error(data.error || 'Server calculation failed.');
        }
      }

      // Successful order creation
      setConfirmedOrder(orderResponseData.order);
      clearCart();

      // Trigger celebratory confetti
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FF5B35', '#D9FF6B', '#1B1B1A', '#2454E6'],
      });
    } catch (err) {
      setSubmissionError((err as Error).message || 'Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. ORDER CONFIRMATION VIEW
  // ---------------------------------------------------------------------------
  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white border border-[#1B1B1A] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
          
          {/* Header */}
          <div className="border-b border-[#1B1B1A]/10 pb-6 flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 font-mono text-xs uppercase text-[#2454E6]">
                <PackageCheck className="w-4 h-4" />
                <span>Order Placed Successfully</span>
              </div>
              <h2 className="font-display font-extrabold text-3xl text-[#1B1B1A]">
                Order Confirmed.
              </h2>
              <p className="text-xs sm:text-sm text-[#6E6D68] mt-1">
                Your power resilience hardware has been reserved in our dispatch inventory.
              </p>
            </div>

            <div className="text-right">
              <span className="font-mono text-xs text-[#6E6D68] block uppercase">Order Number</span>
              <span className="font-mono text-xl font-extrabold text-[#1B1B1A] bg-[#F5F1E8] px-3 py-1 rounded-xl border border-[#1B1B1A]/15 inline-block mt-0.5">
                {confirmedOrder.orderNumber || confirmedOrder.order_number}
              </span>
            </div>
          </div>

          {/* Payment Method Instructions */}
          {form.paymentMethod === 'bank_transfer' ? (
            <div className="p-5 bg-[#F5F1E8] rounded-2xl border border-[#1B1B1A]/15 space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#1B1B1A]">
                <Building2 className="w-4 h-4 text-[#2454E6]" />
                <span>Bank Transfer Instructions</span>
              </div>
              <p className="text-xs text-[#1B1B1A] leading-relaxed">
                Please transfer the exact total of{' '}
                <strong className="font-mono text-sm text-[#FF5B35]">
                  {formatNaira(confirmedOrder.totalNaira || confirmedOrder.total)}
                </strong>{' '}
                to our official operations account:
              </p>
              <div className="p-3 bg-white rounded-xl border border-[#1B1B1A]/10 font-mono text-xs space-y-1 text-[#1B1B1A]">
                <div>Bank: <strong>Zenith Bank Nigeria</strong></div>
                <div>Account Name: <strong>Forte Power Systems Ltd</strong></div>
                <div>Account Number: <strong>1229480112</strong></div>
                <div className="text-[11px] text-[#6E6D68] pt-1">
                  Use Reference: <strong>{confirmedOrder.orderNumber || confirmedOrder.order_number}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-[#D9FF6B]/30 rounded-2xl border border-[#1B1B1A]/15 space-y-2">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#1B1B1A]">
                <Truck className="w-4 h-4 text-[#FF5B35]" />
                <span>Pay on Delivery Confirmed</span>
              </div>
              <p className="text-xs text-[#1B1B1A] leading-relaxed">
                You will pay{' '}
                <strong className="font-mono text-sm text-[#1B1B1A]">
                  {formatNaira(confirmedOrder.totalNaira || confirmedOrder.total)}
                </strong>{' '}
                via Cash or POS transfer directly to the delivery rider once your hardware is unpacked and inspected.
              </p>
            </div>
          )}

          {/* Itemized Snapshot Receipt */}
          <div className="border border-[#1B1B1A]/15 rounded-2xl overflow-hidden">
            <div className="p-3.5 bg-[#F5F1E8] border-b border-[#1B1B1A]/10 font-mono text-xs font-bold text-[#1B1B1A] flex justify-between">
              <span>Item & Snapshot Specification</span>
              <span>Subtotal</span>
            </div>
            <div className="divide-y divide-[#1B1B1A]/10">
              {(confirmedOrder.items || []).map((item: any) => (
                <div key={item.product_id || item.productId} className="p-3.5 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#1B1B1A] block">{item.name}</span>
                    <span className="text-[#6E6D68] font-mono text-[11px]">
                      Qty: {item.quantity} × {formatNaira(item.unit_price || item.unitPriceNaira)}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[#1B1B1A]">
                    {formatNaira(item.total_price || item.totalPriceNaira)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="p-4 bg-[#F5F1E8] border-t border-[#1B1B1A]/15 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-[#6E6D68]">
                <span>Hardware Subtotal:</span>
                <span>{formatNaira(confirmedOrder.subtotalNaira || confirmedOrder.subtotal)}</span>
              </div>
              {(confirmedOrder.discountNaira || confirmedOrder.discount) > 0 && (
                <div className="flex justify-between text-[#2454E6]">
                  <span>5% Bundle Discount:</span>
                  <span>-{formatNaira(confirmedOrder.discountNaira || confirmedOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#6E6D68]">
                <span>Nationwide Express Delivery:</span>
                <span>
                  {(confirmedOrder.shippingFeeNaira || confirmedOrder.delivery_fee) === 0
                    ? 'FREE'
                    : formatNaira(confirmedOrder.shippingFeeNaira || confirmedOrder.delivery_fee)}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-[#1B1B1A]/10 font-bold text-base text-[#1B1B1A]">
                <span>Total Amount:</span>
                <span className="font-display text-2xl font-extrabold text-[#FF5B35]">
                  {formatNaira(confirmedOrder.totalNaira || confirmedOrder.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Address Destination */}
          <div className="p-4 bg-white border border-[#1B1B1A]/15 rounded-2xl text-xs space-y-1 font-mono">
            <span className="text-[#6E6D68] uppercase text-[10px] block font-bold">Delivery Destination</span>
            <p className="font-bold text-[#1B1B1A]">
              {confirmedOrder.customerName || confirmedOrder.delivery_name} ·{' '}
              {confirmedOrder.customerPhone || confirmedOrder.delivery_phone}
            </p>
            <p className="text-[#6E6D68]">
              {confirmedOrder.shippingAddress?.streetAddress || confirmedOrder.delivery_address},{' '}
              {confirmedOrder.shippingAddress?.state || confirmedOrder.delivery_state} State
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => window.print()}
              className="py-3.5 px-4 bg-white border border-[#1B1B1A] text-xs font-semibold rounded-2xl hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#1B1B1A]" />
              <span>Print Spec Receipt</span>
            </button>
            <button
              onClick={onBackToShop}
              className="flex-1 py-3.5 px-6 bg-[#1B1B1A] text-[#F5F1E8] hover:bg-[#1B1B1A]/90 font-bold text-xs rounded-2xl transition-colors text-center cursor-pointer"
            >
              Return to Homepage
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. DEDICATED CHECKOUT FORM (With Inline Validation)
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-10">
      
      {/* Back button */}
      <button
        onClick={onBackToShop}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-[#6E6D68] hover:text-[#1B1B1A] transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Storefront</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form with Inline Validation */}
        <div className="lg:col-span-7 bg-white border border-[#1B1B1A] rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
          
          <div className="border-b border-[#1B1B1A]/10 pb-4">
            <span className="font-mono text-xs uppercase text-[#6E6D68] tracking-wider block mb-1">
              Checkout & Dispatch Spec
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1B1B1A]">
              Delivery Details
            </h2>
          </div>

          {/* User Confirmation Banner */}
          {user && (
            <div className="p-3 bg-[#F5F1E8] rounded-2xl border border-[#1B1B1A]/15 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2454E6]" />
                <span className="text-[#1B1B1A]">
                  Connected as <strong>{user.email}</strong>
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#2454E6] font-bold">Google Auth Verified</span>
            </div>
          )}

          {submissionError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submissionError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitOrder} className="space-y-5" noValidate>
            
            {/* Full Name Field */}
            <div>
              <label htmlFor="checkout-full-name" className="block text-xs font-mono font-medium text-[#1B1B1A] mb-1.5">
                Full Name *
              </label>
              <input
                id="checkout-full-name"
                type="text"
                value={form.fullName}
                onChange={e => handleFieldChange('fullName', e.target.value)}
                onBlur={() => handleFieldBlur('fullName')}
                placeholder="e.g. Babatunde Fashola"
                className={`w-full px-4 py-3 text-xs sm:text-sm min-h-[44px] bg-[#F5F1E8] border rounded-xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#FF5B35] focus-visible:outline-none ${
                  touched.fullName && errors.fullName
                    ? 'border-red-500 bg-red-50/40 text-red-900'
                    : 'border-[#1B1B1A]/20 focus:border-[#1B1B1A]'
                }`}
              />
              {touched.fullName && errors.fullName && (
                <p className="text-[11px] text-red-600 font-mono mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkout-email" className="block text-xs font-mono font-medium text-[#1B1B1A] mb-1.5">
                  Email Address *
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  value={form.email}
                  onChange={e => handleFieldChange('email', e.target.value)}
                  onBlur={() => handleFieldBlur('email')}
                  placeholder="babatunde@gmail.com"
                  className={`w-full px-4 py-3 text-xs sm:text-sm min-h-[44px] bg-[#F5F1E8] border rounded-xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#FF5B35] focus-visible:outline-none ${
                    touched.email && errors.email
                      ? 'border-red-500 bg-red-50/40 text-red-900'
                      : 'border-[#1B1B1A]/20 focus:border-[#1B1B1A]'
                  }`}
                />
                {touched.email && errors.email && (
                  <p className="text-[11px] text-red-600 font-mono mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="checkout-phone" className="block text-xs font-mono font-medium text-[#1B1B1A] mb-1.5">
                  Phone (Rider Dispatch) *
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  value={form.phone}
                  onChange={e => handleFieldChange('phone', e.target.value)}
                  onBlur={() => handleFieldBlur('phone')}
                  placeholder="0803 123 4567"
                  className={`w-full px-4 py-3 text-xs sm:text-sm font-mono min-h-[44px] bg-[#F5F1E8] border rounded-xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#FF5B35] focus-visible:outline-none ${
                    touched.phone && errors.phone
                      ? 'border-red-500 bg-red-50/40 text-red-900'
                      : 'border-[#1B1B1A]/20 focus:border-[#1B1B1A]'
                  }`}
                />
                {touched.phone && errors.phone && (
                  <p className="text-[11px] text-red-600 font-mono mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Street Address */}
            <div>
              <label htmlFor="checkout-street" className="block text-xs font-mono font-medium text-[#1B1B1A] mb-1.5">
                Street Address *
              </label>
              <input
                id="checkout-street"
                type="text"
                value={form.streetAddress}
                onChange={e => handleFieldChange('streetAddress', e.target.value)}
                onBlur={() => handleFieldBlur('streetAddress')}
                placeholder="e.g. 18 Adeleke Street, Off Allen Avenue"
                className={`w-full px-4 py-3 text-xs sm:text-sm min-h-[44px] bg-[#F5F1E8] border rounded-xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#FF5B35] focus-visible:outline-none ${
                  touched.streetAddress && errors.streetAddress
                    ? 'border-red-500 bg-red-50/40 text-red-900'
                    : 'border-[#1B1B1A]/20 focus:border-[#1B1B1A]'
                }`}
              />
              {touched.streetAddress && errors.streetAddress && (
                <p className="text-[11px] text-red-600 font-mono mt-1">{errors.streetAddress}</p>
              )}
            </div>

            {/* City & State Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkout-city" className="block text-xs font-mono font-medium text-[#1B1B1A] mb-1.5">
                  City / Town *
                </label>
                <input
                  id="checkout-city"
                  type="text"
                  value={form.city}
                  onChange={e => handleFieldChange('city', e.target.value)}
                  onBlur={() => handleFieldBlur('city')}
                  placeholder="Ikeja, Lekki, Garki, Ibadan..."
                  className={`w-full px-4 py-3 text-xs sm:text-sm min-h-[44px] bg-[#F5F1E8] border rounded-xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#FF5B35] focus-visible:outline-none ${
                    touched.city && errors.city
                      ? 'border-red-500 bg-red-50/40 text-red-900'
                      : 'border-[#1B1B1A]/20 focus:border-[#1B1B1A]'
                  }`}
                />
                {touched.city && errors.city && (
                  <p className="text-[11px] text-red-600 font-mono mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label htmlFor="checkout-state" className="block text-xs font-mono font-medium text-[#1B1B1A] mb-1.5">
                  State *
                </label>
                <select
                  id="checkout-state"
                  value={form.state}
                  onChange={e => handleFieldChange('state', e.target.value)}
                  className="w-full px-4 py-3 text-xs sm:text-sm min-h-[44px] bg-[#F5F1E8] border border-[#1B1B1A]/20 focus:border-[#1B1B1A] rounded-xl outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#FF5B35] focus-visible:outline-none"
                >
                  {NIGERIAN_STATES.map(st => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2">
              <label className="block text-xs font-mono font-medium text-[#1B1B1A] mb-2.5">
                Payment Method *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Pay on Delivery Option */}
                <label
                  className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    form.paymentMethod === 'pay_on_delivery'
                      ? 'bg-[#F5F1E8] border-[#1B1B1A] shadow-xs'
                      : 'bg-white border-[#1B1B1A]/20 hover:border-[#1B1B1A]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="pay_on_delivery"
                    checked={form.paymentMethod === 'pay_on_delivery'}
                    onChange={() => setForm(p => ({ ...p, paymentMethod: 'pay_on_delivery' }))}
                    className="mt-0.5 accent-[#FF5B35]"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#1B1B1A] block">
                      Pay on Delivery
                    </span>
                    <span className="text-[11px] text-[#6E6D68] block mt-0.5">
                      Pay Cash or POS transfer to rider upon unpacking and inspecting hardware.
                    </span>
                  </div>
                </label>

                {/* Bank Transfer Option */}
                <label
                  className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    form.paymentMethod === 'bank_transfer'
                      ? 'bg-[#F5F1E8] border-[#1B1B1A] shadow-xs'
                      : 'bg-white border-[#1B1B1A]/20 hover:border-[#1B1B1A]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={form.paymentMethod === 'bank_transfer'}
                    onChange={() => setForm(p => ({ ...p, paymentMethod: 'bank_transfer' }))}
                    className="mt-0.5 accent-[#FF5B35]"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#1B1B1A] block">
                      Direct Bank Transfer
                    </span>
                    <span className="text-[11px] text-[#6E6D68] block mt-0.5">
                      Instant transfer to our Zenith Bank operations account with order number.
                    </span>
                  </div>
                </label>

              </div>
            </div>

            {/* Submit Button with Double-Submit Prevention */}
            <div className="pt-4 border-t border-[#1B1B1A]/10">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#1B1B1A] hover:bg-[#1B1B1A]/90 text-[#F5F1E8] font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Order with Edge Function...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#D9FF6B]" />
                    <span>Place Order · {formatNaira(totalNaira)}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-3 mt-3 text-[11px] text-[#6E6D68]">
                <span>Authoritative database recalculation</span>
                <span>·</span>
                <span>1-Year replacement warranty</span>
              </div>
            </div>

          </form>

        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 bg-white border border-[#1B1B1A] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm sticky top-24">
          <div className="flex items-center justify-between border-b border-[#1B1B1A]/10 pb-3">
            <h3 className="font-display font-bold text-lg text-[#1B1B1A]">Order Summary</h3>
            <span className="font-mono text-xs text-[#6E6D68]">{items.length} items</span>
          </div>

          {/* Items breakdown */}
          <div className="space-y-3 divide-y divide-[#1B1B1A]/10 max-h-80 overflow-y-auto pr-1">
            {items.map(item => (
              <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-10 h-10 object-cover rounded-xl bg-[#F5F1E8] border border-[#1B1B1A]/10 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-[#1B1B1A] truncate">{item.product.short_name || item.product.name}</p>
                    <p className="text-[11px] text-[#6E6D68] font-mono">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#1B1B1A] shrink-0 ml-2">
                  {formatNaira(item.product.price_naira * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing totals */}
          <div className="pt-4 border-t border-[#1B1B1A]/10 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-[#6E6D68]">
              <span>Hardware Subtotal:</span>
              <span>{formatNaira(subtotalNaira)}</span>
            </div>
            {discountNaira > 0 && (
              <div className="flex justify-between text-[#2454E6]">
                <span>5% Bundle Discount:</span>
                <span>-{formatNaira(discountNaira)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#6E6D68]">
              <span>Nationwide Delivery:</span>
              <span className="text-[#1B1B1A]">{shippingFeeNaira === 0 ? 'FREE' : formatNaira(shippingFeeNaira)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-[#1B1B1A]/10 font-bold text-base text-[#1B1B1A]">
              <span>Total Payable:</span>
              <span className="font-display text-2xl font-extrabold text-[#1B1B1A]">
                {formatNaira(totalNaira)}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#F5F1E8] rounded-2xl border border-[#1B1B1A]/15 text-[11px] text-[#6E6D68] leading-relaxed">
            <strong>Server Integrity Notice:</strong> All order amounts are verified on the server from Postgres database prices. Client-tampered totals are rejected.
          </div>
        </div>

      </div>

    </div>
  );
};

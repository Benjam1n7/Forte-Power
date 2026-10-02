export type Archetype = 'student' | 'remote_worker' | 'shop_owner' | 'family';

export type ProductCategory = 'lamp' | 'power_bank' | 'fan' | 'usb_fan' | 'solar_charger' | 'inverter_bulb' | 'cable';

export interface ProductSpecs {
  capacity_mah?: number;
  watt_hours?: number;
  solar_watts?: number;
  fan_speeds?: number;
  fan_blade_inches?: number;
  lamp_lumens?: number;
  light_modes?: string[];
  battery_life_hours?: string;
  outputs?: string[];
  inputs?: string[];
  weight_kg?: number;
}

export interface Product {
  id: string; // e.g. 'FO-PB-60K'
  name: string;
  short_name: string;
  category: ProductCategory;
  description: string;
  specifications: ProductSpecs;
  price_naira: number;
  watts?: number;
  battery_wh?: number;
  warranty_months?: number;
  is_verified?: boolean;
  image_url: string;
  stock_quantity: number;
  is_included_in_default?: boolean;
}

export interface PredefinedKit {
  id: string; // 'kit-student', 'kit-worker', 'kit-shop', 'kit-family'
  code: string; // 'FO-KIT-01'
  name: string;
  target_audience: Archetype;
  audience_title: string;
  tagline: string;
  description: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  bundle_discount_percent: number;
  daily_fuel_saved_liters: number;
  generator_noise_reduction_db: number;
  monthly_savings_naira: number;
  badge_label: string;
  typical_appliances: string[];
}

export interface CartItem {
  id: string; // cart item unique ID
  productId: string;
  product: Product;
  quantity: number;
  kitSourceId?: string; // If added as part of a kit
  kitId?: string;
  kitName?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  streetAddress: string;
  city: string;
  state: string; // Nigerian state
  deliveryNotes?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPriceNaira: number;
  totalPriceNaira: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotalNaira: number;
  shippingFeeNaira: number;
  discountNaira: number;
  totalNaira: number;
  status: 'pending_payment' | 'paid' | 'dispatched' | 'delivered';
  paymentReference?: string;
  emailNotificationSent?: boolean;
}

export interface ComparisonScenario {
  hoursWithoutGridPerDay: number;
  petrolPricePerLiter: number; // e.g. ₦1,050
  generatorLitersPerHour: number; // e.g. 0.8L/hr for "I-pass-my-neighbor" (0.9kVA - 1.2kVA)
}

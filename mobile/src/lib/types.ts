// Domain types mirrored from the Forte Power website (src/types/index.ts).
// Kept intentionally identical so cart payloads are byte-compatible with the
// web CartContext and the shared Supabase `carts.items` JSONB column.

export type ProductCategory =
  | 'lamp'
  | 'power_bank'
  | 'fan'
  | 'usb_fan'
  | 'solar_charger'
  | 'inverter_bulb'
  | 'cable';

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

/** Exactly the shape persisted in Supabase `carts.items` by the website. */
export interface CartItem {
  id: string; // cart item unique ID
  productId: string;
  product: Product;
  quantity: number;
  kitSourceId?: string; // If added as part of a kit
  kitId?: string;
  kitName?: string;
}

export interface GroupedCart {
  kitId: string;
  kitName: string;
  items: CartItem[];
  subtotal: number;
}

export type Archetype = 'student' | 'remote_worker' | 'shop_owner' | 'family';

export type PaymentMethod = 'pay_on_delivery' | 'bank_transfer';

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  kitId?: string;
  kitName?: string;
}

/** Response shape returned by the `create-order` Supabase Edge Function. */
export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  orderNumber: string;
  order: {
    id: string;
    order_number: string;
    status: string;
    subtotal: number;
    discount: number;
    delivery_fee: number;
    total: number;
    delivery_name: string;
    delivery_phone: string;
    delivery_address: string;
    delivery_state: string;
    payment_method: string;
    created_at?: string;
    items?: {
      product_id: string;
      name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      kit_id?: string | null;
    }[];
  };
}

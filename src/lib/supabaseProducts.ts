import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Product } from '../types';
import { PRODUCTS as FALLBACK_PRODUCTS } from '../data/products';

export interface ProductsState {
  data: Product[];
  loading: boolean;
  error: string | null;
  source: 'supabase' | 'fallback';
}

export async function fetchProductsFromDatabase(): Promise<{
  data: Product[];
  error: string | null;
  source: 'supabase' | 'fallback';
}> {
  try {
    if (!isSupabaseConfigured) {
      // Supabase credentials not yet injected into .env
      return {
        data: FALLBACK_PRODUCTS,
        error: null,
        source: 'fallback',
      };
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('price_naira', { ascending: true });

    if (error) {
      console.warn('Supabase products fetch failed:', error.message);
      return {
        data: FALLBACK_PRODUCTS,
        error: `Database connection notice: ${error.message}. Displaying local cached catalogue.`,
        source: 'fallback',
      };
    }

    if (!data || data.length === 0) {
      return {
        data: FALLBACK_PRODUCTS,
        error: 'The "products" table in Supabase is empty. Please run the SQL schema script in Supabase SQL Editor.',
        source: 'fallback',
      };
    }

    // Map database rows to Product domain types
    const mapped: Product[] = data.map((row: any) => ({
      id: row.id,
      name: row.name,
      short_name: row.name.split(' ')[1] ? `${row.name.split(' ')[0]} ${row.name.split(' ')[1]}` : row.name,
      category: row.category,
      description: row.description,
      specifications: row.specifications || {
        watt_hours: row.battery_wh,
        capacity_mah: row.battery_wh ? Math.round(row.battery_wh * 1000 / 3.7) : undefined,
      },
      price_naira: Number(row.price_naira),
      watts: Number(row.watts) || 0,
      battery_wh: Number(row.battery_wh) || 0,
      warranty_months: row.warranty_months || 12,
      is_verified: row.is_verified ?? true,
      stock_quantity: row.stock_quantity ?? 100,
      image_url: row.image_url || '/src/assets/images/product_power_bank_1790950977000.jpg',
    }));

    return {
      data: mapped,
      error: null,
      source: 'supabase',
    };
  } catch (err) {
    return {
      data: FALLBACK_PRODUCTS,
      error: (err as Error).message,
      source: 'fallback',
    };
  }
}

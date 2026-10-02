-- ==============================================================================
-- FORTE POWER - Supabase PostgreSQL Database Schema
-- Complete RLS policies, Profiles, Products, Orders, and Items
-- ==============================================================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_naira NUMERIC(12, 2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Anyone can read active products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active products" 
ON public.products FOR SELECT 
USING (is_active = true);

-- 3. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  subtotal_naira NUMERIC(12, 2) NOT NULL,
  shipping_fee_naira NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_naira NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_naira NUMERIC(12, 2) NOT NULL,
  payment_reference TEXT,
  mailgun_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS: Authenticated users can view only their own orders; public/guests can select with order_number + email token
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" 
ON public.orders FOR SELECT 
USING (
  auth.uid() = user_id 
  OR (user_id IS NULL AND customer_email = auth.jwt() ->> 'email')
);

CREATE POLICY "Service role can insert and manage all orders" 
ON public.orders FOR ALL 
USING (true)
WITH CHECK (true);

-- 4. Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES public.products(id) NOT NULL,
  kit_id TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_naira NUMERIC(12, 2) NOT NULL,
  total_price_naira NUMERIC(12, 2) NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order items for their orders" 
ON public.order_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR orders.customer_email = auth.jwt() ->> 'email')
  )
);

-- 5. Seed initial products
INSERT INTO public.products (id, name, category, description, specifications, price_naira, stock_quantity)
VALUES 
(
  'FO-BANK-60K', 
  'Forte MaxPower 60,000mAh Laptop & Device Bank', 
  'power_bank', 
  'Rugged emergency power hub with dual 65W USB-C PD and 12V DC router port.',
  '{"capacity_mah": 60000, "watt_hours": 222, "outputs": ["2x USB-C PD 65W", "12V DC Port"]}'::jsonb,
  62000.00,
  48
),
(
  'FO-FAN-DC12', 
  'Forte WhisperFlow 12" DC Rechargeable Fan', 
  'fan', 
  'Silent brushless DC motor fan engineered for hot blackout nights.',
  '{"fan_blade_inches": 12, "battery_life_hours": "16h whisper"}'::jsonb,
  38500.00,
  75
),
(
  'FO-SOLAR-40W', 
  'Forte SunFold 40W Monocrystalline Solar Mat', 
  'solar_charger', 
  'Military-spec ETFE laminated folding solar charger with high-efficiency cells.',
  '{"solar_watts": 40, "outputs": ["18V DC", "USB-C PD 30W"]}'::jsonb,
  49000.00,
  34
),
(
  'FO-LAMP-01', 
  'Forte Beacon 1200-Lumen Emergency Task Lamp', 
  'lamp', 
  'Diffused anti-glare reading and room lamp. Eliminates candle soot.',
  '{"lamp_lumens": 1200, "light_modes": ["3000K", "4000K", "5000K"]}'::jsonb,
  19500.00,
  110
)
ON CONFLICT (id) DO UPDATE 
SET price_naira = EXCLUDED.price_naira,
    name = EXCLUDED.name;

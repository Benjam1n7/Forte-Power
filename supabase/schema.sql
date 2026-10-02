-- ==============================================================================
-- FORTE POWER — Production Supabase PostgreSQL Schema & Seeds
-- Run this complete script in the Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing objects cleanly if recreating
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.carts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;

-- ==============================================================================
-- 3. PROFILES TABLE (Linked to Supabase Auth)
-- ==============================================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  state TEXT DEFAULT 'Lagos',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. PRODUCTS TABLE (14 Specialized Power-Resilience Items)
-- ==============================================================================
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('lamp', 'power_bank', 'usb_fan', 'solar_charger', 'inverter_bulb', 'cable')),
  description TEXT NOT NULL,
  price_naira NUMERIC(12, 2) NOT NULL CHECK (price_naira > 0),
  watts NUMERIC(8, 2) NOT NULL DEFAULT 0,
  battery_wh NUMERIC(8, 2) NOT NULL DEFAULT 0,
  warranty_months INTEGER NOT NULL DEFAULT 12,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  stock_quantity INTEGER NOT NULL DEFAULT 100,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 5. ORDERS TABLE (Server-Authoritative Pricing & Delivery Fields)
-- ==============================================================================
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0),
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  delivery_name TEXT NOT NULL,
  delivery_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_state TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'pay_on_delivery' CHECK (payment_method IN ('pay_on_delivery', 'bank_transfer', 'paystack', 'card')),
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 6. ORDER ITEMS TABLE (Immutable Price Snapshot)
-- ==============================================================================
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price > 0),
  total_price NUMERIC(12, 2) NOT NULL CHECK (total_price > 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 7. CARTS TABLE (Persistent User Shopping Cart)
-- ==============================================================================
CREATE TABLE public.carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 8. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- A. Products (Public read-only; admin/service role write)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

-- B. Profiles (Owner read and update only)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- C. Orders (Owners can view and create their own orders)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- D. Order Items (Owners can view items belonging to their orders)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

-- E. Carts (Owners can manage their persistent cart)
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart"
  ON public.carts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own cart"
  ON public.carts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
  ON public.carts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart"
  ON public.carts FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 10. SEED: 14 REALISTIC NIGERIAN MARKET PRODUCTS
-- ==============================================================================
INSERT INTO public.products (
  id, name, category, description, price_naira, watts, battery_wh, warranty_months, is_verified, stock_quantity, image_url
) VALUES
-- 1. Heavy Laptop Power Bank
(
  'FO-PB-60K',
  'Forte MaxPower 60,000mAh 65W PD Laptop & Station Bank',
  'power_bank',
  'Dual 65W USB-C Power Delivery with dedicated 12V DC router port and digital LED percentage meter. Charges MacBooks, ThinkPads, and phones during 18-hour grid collapses.',
  62000.00,
  65.0,
  222.0,
  18,
  true,
  55,
  '/src/assets/images/product_power_bank_1790950977000.jpg'
),

-- 2. Compact Fast Power Bank
(
  'FO-PB-30K',
  'Forte PocketGrid 30,000mAh 22.5W QuickCharge Bank',
  'power_bank',
  'Slim airline-approved high-density polymer battery with 22.5W SuperCharge for Samsung, iPhone, and Android devices. 7 full phone refills.',
  28500.00,
  22.5,
  111.0,
  12,
  true,
  90,
  '/src/assets/images/product_power_bank_1790950977000.jpg'
),

-- 3. Everyday Emergency Pocket Bank
(
  'FO-PB-20K',
  'Forte DailyCommute 20,000mAh Dual-Port Power Bank',
  'power_bank',
  'Lightweight textured matte casing with LED indicators. Keeps two phones powered through daily bus commutes and sudden evening cuts.',
  18500.00,
  18.0,
  74.0,
  12,
  true,
  120,
  '/src/assets/images/product_power_bank_1790950977000.jpg'
),

-- 4. 12-inch DC Rechargeable Fan
(
  'FO-FAN-12DC',
  'Forte WhisperFlow 12" Brushless DC Oscillating Fan',
  'usb_fan',
  'Engineered for hot Nigerian nights. Silent brushless motor running up to 16 hours on whisper mode or direct USB-C input. Zero motor hum.',
  38500.00,
  15.0,
  44.4,
  12,
  true,
  70,
  '/src/assets/images/product_dc_fan_1790951011811.jpg'
),

-- 5. 8-inch Desk & Clip Fan
(
  'FO-FAN-08CP',
  'Forte BreezeClip 8" Rechargeable Desk & Bedpost Fan',
  'usb_fan',
  'Dual-purpose base and heavy-duty spring clamp. Attaches to university hostel bed frames, study desks, or cashier counters. 10 hours runtime.',
  21000.00,
  10.0,
  29.6,
  12,
  true,
  85,
  '/src/assets/images/product_dc_fan_1790951011811.jpg'
),

-- 6. Portable Personal Neck & Hand Fan
(
  'FO-FAN-MINI',
  'Forte TurboAir Handheld & Hands-Free Personal Fan',
  'usb_fan',
  'Turbine bladeless airflow with digital battery percentage readout. Ideal for crowded lecture halls, market stalls, and Lagos traffic.',
  9500.00,
  5.0,
  14.8,
  6,
  true,
  150,
  '/src/assets/images/product_dc_fan_1790951011811.jpg'
),

-- 7. 40W Monocrystalline Folding Solar Mat
(
  'FO-SOL-40W',
  'Forte SunFold 40W Monocrystalline ETFE Solar Mat',
  'solar_charger',
  'Military-grade laminated solar charger with 23.4% high-efficiency cells. Direct DC5521 18V output to recharge 60k power bank + 30W USB-C.',
  49000.00,
  40.0,
  0.0,
  24,
  true,
  40,
  '/src/assets/images/product_solar_charger_1790950999126.jpg'
),

-- 8. 80W Heavy-Duty Briefcase Solar Panel
(
  'FO-SOL-80W',
  'Forte SunBase 80W High-Yield Briefcase Solar System',
  'solar_charger',
  'Twin folding kickstand panels designed for balconies, rooftops, and shopfronts. Replenishes dual power banks in 3.5 hours of equatorial sun.',
  84000.00,
  80.0,
  0.0,
  24,
  true,
  25,
  '/src/assets/images/product_solar_charger_1790950999126.jpg'
),

-- 9. 21W Ultra-Portable Solar Backpack Mat
(
  'FO-SOL-21W',
  'Forte TrailSun 21W Dual USB Pocket Solar Charger',
  'solar_charger',
  'Folds down to the size of a notebook. Weatherproof canvas sleeve with brass eyelets to hang on windows or balconies for steady phone topping.',
  29500.00,
  21.0,
  0.0,
  12,
  true,
  60,
  '/src/assets/images/product_solar_charger_1790950999126.jpg'
),

-- 10. 1200-Lumen Emergency Task Lamp
(
  'FO-LMP-1200',
  'Forte Beacon 1200-Lumen Anti-Glare Emergency Task Lamp',
  'lamp',
  'Rotary step-less dimming from 3000K warm reading light to 5000K daylight beam. Heavy aluminum handle and up to 36 hours reading illumination.',
  19500.00,
  12.0,
  37.0,
  12,
  true,
  110,
  '/src/assets/images/product_task_lamp_1790951023412.jpg'
),

-- 11. Magnetic LED Work & Kitchen Tube Light
(
  'FO-LMP-TUBE',
  'Forte StripLite 60cm Magnetic Rechargeable Tube Lamp',
  'lamp',
  'Mounts under kitchen cabinets, study carrels, and boutique shelves with peel-and-stick magnetic plates. Motion-sensor or continuous mode.',
  14500.00,
  8.0,
  18.5,
  12,
  true,
  95,
  '/src/assets/images/product_task_lamp_1790951023412.jpg'
),

-- 12. 9W Automatic Rechargeable Inverter Bulb (B22/E27)
(
  'FO-BLB-09W',
  'Forte AutoGlow 9W Inverter Emergency LED Bulb',
  'inverter_bulb',
  'Screws into standard light bulb socket. Charges automatically while grid power is on; switches on instantly within 0.1s of blackout for 4 hours.',
  5800.00,
  9.0,
  7.4,
  12,
  true,
  200,
  '/src/assets/images/product_task_lamp_1790951023412.jpg'
),

-- 13. 15W High-Lumen Living Room Inverter Bulb
(
  'FO-BLB-15W',
  'Forte SuperGlow 15W High-Lumen Inverter Bulb',
  'inverter_bulb',
  'High-output emergency bulb for living rooms, shops, and pharmacies. Up to 5 hours backup with dual lithium internal cells.',
  8200.00,
  15.0,
  11.1,
  12,
  true,
  140,
  '/src/assets/images/product_task_lamp_1790951023412.jpg'
),

-- 14. 100W Smart Meter Braided Cable + Router Kit
(
  'FO-CBL-100W',
  'Forte PowerLink 100W Watt-Display Cable & DC Router Jack Kit',
  'cable',
  'Heavy braided Kevlar USB-C to USB-C cable with real-time digital wattage display + 12V step-up adapter for MTN/Airtel/Spectranet WiFi routers.',
  7500.00,
  100.0,
  0.0,
  12,
  true,
  250,
  '/src/assets/images/product_task_lamp_1790951023412.jpg'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  price_naira = EXCLUDED.price_naira,
  watts = EXCLUDED.watts,
  battery_wh = EXCLUDED.battery_wh,
  warranty_months = EXCLUDED.warranty_months,
  is_verified = EXCLUDED.is_verified,
  stock_quantity = EXCLUDED.stock_quantity,
  image_url = EXCLUDED.image_url;

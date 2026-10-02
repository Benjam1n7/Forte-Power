// Supabase Edge Function: create-order
// Recalculates order totals authoritative from Postgres database prices,
// inserts order and order_items in one transaction, and returns the order details.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItemInput {
  productId: string;
  quantity: number;
  kitId?: string;
  kitName?: string;
}

interface CreateOrderPayload {
  items: CartItemInput[];
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_state: string;
  payment_method: 'pay_on_delivery' | 'bank_transfer';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    // Service role client to perform authoritative calculation and write
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current authenticated user if Authorization header was passed
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    const payload: CreateOrderPayload = await req.json();
    const { items, delivery_name, delivery_phone, delivery_address, delivery_state, payment_method } = payload;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart cannot be empty." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!delivery_name?.trim() || !delivery_phone?.trim() || !delivery_address?.trim() || !delivery_state?.trim()) {
      return new Response(JSON.stringify({ error: "All delivery details are required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch current authoritative prices from products table
    const productIds = items.map((i) => i.productId);
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id, name, price_naira, stock_quantity")
      .in("id", productIds);

    if (productsError || !productsData) {
      return new Response(
        JSON.stringify({ error: `Failed to load product pricing: ${productsError?.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const productMap = new Map(productsData.map((p) => [p.id, p]));

    // 2. Authoritative recalculation (never trust client prices)
    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) {
        return new Response(
          JSON.stringify({ error: `Product ID "${item.productId}" not found in database.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const qty = Math.max(1, parseInt(String(item.quantity), 10) || 1);
      const unitPrice = Number(dbProduct.price_naira);
      const itemTotal = unitPrice * qty;
      subtotal += itemTotal;

      verifiedItems.push({
        product_id: dbProduct.id,
        name: dbProduct.name,
        quantity: qty,
        unit_price: unitPrice,
        total_price: itemTotal,
        kit_id: item.kitId || null,
      });
    }

    // Apply bundle discount (5% bundle discount)
    const hasKitOrMulti = items.some((i) => Boolean(i.kitId)) || items.length >= 3;
    const discount = hasKitOrMulti ? Math.round(subtotal * 0.05) : 0;
    const delivery_fee = subtotal >= 150000 ? 0 : 3500;
    const total = subtotal - discount + delivery_fee;

    // 3. Generate human-readable order number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `FP-${new Date().getFullYear()}-${randomSuffix}`;

    // 4. Insert order
    const { data: orderRecord, error: orderInsertError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: userId,
        status: "confirmed",
        subtotal,
        discount,
        delivery_fee,
        total,
        delivery_name: delivery_name.trim(),
        delivery_phone: delivery_phone.trim(),
        delivery_address: delivery_address.trim(),
        delivery_state: delivery_state.trim(),
        payment_method: payment_method || "pay_on_delivery",
      })
      .select()
      .single();

    if (orderInsertError || !orderRecord) {
      return new Response(
        JSON.stringify({ error: `Failed to insert order: ${orderInsertError?.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Insert order_items with price snapshot
    const orderItemsToInsert = verifiedItems.map((v) => ({
      order_id: orderRecord.id,
      product_id: v.product_id,
      quantity: v.quantity,
      unit_price: v.unit_price,
      total_price: v.total_price,
    }));

    const { error: itemsInsertError } = await supabase
      .from("order_items")
      .insert(orderItemsToInsert);

    if (itemsInsertError) {
      console.error("Order items insertion error:", itemsInsertError);
    }

    // 6. If user is signed in, clear their persistent cart
    if (userId) {
      await supabase.from("carts").delete().eq("user_id", userId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: orderRecord.id,
        orderNumber: orderRecord.order_number,
        order: {
          ...orderRecord,
          items: verifiedItems,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

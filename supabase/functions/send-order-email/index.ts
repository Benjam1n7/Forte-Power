// Supabase Edge Function: send-order-email
// Triggered on successful order checkout. Calls Mailgun API securely server-side.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface OrderEmailPayload {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPriceNaira: number;
    totalPriceNaira: number;
  }>;
  subtotalNaira: number;
  shippingFeeNaira: number;
  totalNaira: number;
  shippingAddress: {
    streetAddress: string;
    city: string;
    state: string;
  };
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const payload: OrderEmailPayload = await req.json();

    const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY');
    const mailgunDomain = Deno.env.get('MAILGUN_DOMAIN') || 'mg.fortepower.ng';

    if (!mailgunApiKey) {
      console.warn('MAILGUN_API_KEY not configured. Simulating successful email send.');
      return new Response(
        JSON.stringify({ 
          success: true, 
          simulated: true, 
          message: 'Mailgun key not configured in environment. Simulated order dispatch.' 
        }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const itemsHtml = payload.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${item.name} x ${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">₦${item.totalPriceNaira.toLocaleString()}</td>
      </tr>
    `).join('');

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F5F1E8; color: #1B1B1A; padding: 24px; border: 1px solid #1B1B1A; border-radius: 8px;">
        <div style="border-bottom: 2px solid #1B1B1A; padding-bottom: 16px; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: -0.5px;">FORTE POWER</h1>
          <p style="margin: 4px 0 0; color: #FF5B35; font-size: 14px; font-weight: bold;">Light stays on. Work never stops.</p>
        </div>

        <p>Dear ${payload.customerName},</p>
        <p>Your order <strong>${payload.orderNumber}</strong> has been confirmed. Our logistics dispatch team is preparing your power-resilience kit for shipment to <strong>${payload.shippingAddress.city}, ${payload.shippingAddress.state}</strong>.</p>

        <h3 style="border-bottom: 1px solid #1B1B1A; padding-bottom: 8px; margin-top: 24px;">ORDER SPEC SHEET</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="text-align: left; background: #ece7db;">
              <th style="padding: 8px;">Item</th>
              <th style="padding: 8px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Delivery (Nationwide Express):</td>
              <td style="padding: 8px; text-align: right; font-family: monospace;">₦${payload.shippingFeeNaira.toLocaleString()}</td>
            </tr>
            <tr style="font-size: 18px; font-weight: bold; background: #1B1B1A; color: #F5F1E8;">
              <td style="padding: 10px;">Total Paid:</td>
              <td style="padding: 10px; text-align: right; font-family: monospace; color: #D9FF6B;">₦${payload.totalNaira.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background: #ffffff; padding: 14px; border-radius: 6px; border: 1px solid #d5cfc0; margin-top: 20px;">
          <p style="margin: 0; font-size: 13px; color: #4b4b49;">
            <strong>Need assistance with your setup?</strong> Reply directly to this email or contact support@fortepower.ng. All Forte components come with our standard 1-year replacement warranty.
          </p>
        </div>
      </div>
    `;

    const form = new FormData();
    form.append('from', `Forte Power <orders@${mailgunDomain}>`);
    form.append('to', payload.customerEmail);
    form.append('subject', `Order Confirmed: ${payload.orderNumber} - Forte Power`);
    form.append('html', htmlBody);

    const mailgunResponse = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
      },
      body: form,
    });

    const resJson = await mailgunResponse.json();

    return new Response(JSON.stringify(resJson), {
      status: mailgunResponse.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});

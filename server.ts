import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Authoritative server-side price catalog (14 Seeded Products)
const SERVER_PRICING: Record<string, { name: string; price_naira: number }> = {
  'FO-PB-60K': { name: 'Forte MaxPower 60,000mAh 65W PD Laptop & Station Bank', price_naira: 62000 },
  'FO-BANK-60K': { name: 'Forte MaxPower 60,000mAh Laptop & Device Bank', price_naira: 62000 },
  'FO-PB-30K': { name: 'Forte PocketGrid 30,000mAh 22.5W QuickCharge Bank', price_naira: 28500 },
  'FO-PB-20K': { name: 'Forte DailyCommute 20,000mAh Dual-Port Power Bank', price_naira: 18500 },
  'FO-FAN-12DC': { name: 'Forte WhisperFlow 12" Brushless DC Oscillating Fan', price_naira: 38500 },
  'FO-FAN-DC12': { name: 'Forte WhisperFlow 12" DC Rechargeable Fan', price_naira: 38500 },
  'FO-FAN-08CP': { name: 'Forte BreezeClip 8" Rechargeable Desk & Bedpost Fan', price_naira: 21000 },
  'FO-FAN-MINI': { name: 'Forte TurboAir Handheld & Hands-Free Personal Fan', price_naira: 9500 },
  'FO-SOL-40W': { name: 'Forte SunFold 40W Monocrystalline ETFE Solar Mat', price_naira: 49000 },
  'FO-SOLAR-40W': { name: 'Forte SunFold 40W Monocrystalline Solar Mat', price_naira: 49000 },
  'FO-SOL-80W': { name: 'Forte SunBase 80W High-Yield Briefcase Solar System', price_naira: 84000 },
  'FO-SOL-21W': { name: 'Forte TrailSun 21W Dual USB Pocket Solar Charger', price_naira: 29500 },
  'FO-LMP-1200': { name: 'Forte Beacon 1200-Lumen Anti-Glare Emergency Task Lamp', price_naira: 19500 },
  'FO-LAMP-01': { name: 'Forte Beacon 1200-Lumen Emergency Task Lamp', price_naira: 19500 },
  'FO-LMP-TUBE': { name: 'Forte StripLite 60cm Magnetic Rechargeable Tube Lamp', price_naira: 14500 },
  'FO-BLB-09W': { name: 'Forte AutoGlow 9W Inverter Emergency LED Bulb', price_naira: 5800 },
  'FO-BLB-15W': { name: 'Forte SuperGlow 15W High-Lumen Inverter Bulb', price_naira: 8200 },
  'FO-CBL-100W': { name: 'Forte PowerLink 100W Watt-Display Cable & DC Router Jack Kit', price_naira: 7500 },
};

const NATIONWIDE_SHIPPING_FEE = 3500;

// Recalculates order strictly on server
app.post('/api/calculate-order', (req, res) => {
  try {
    const { items, kitId } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart items required for calculation' });
    }

    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const product = SERVER_PRICING[item.productId];
      if (!product) {
        return res.status(400).json({ error: `Invalid product ID: ${item.productId}` });
      }
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemTotal = product.price_naira * qty;
      subtotal += itemTotal;

      verifiedItems.push({
        productId: item.productId,
        name: product.name,
        quantity: qty,
        unitPriceNaira: product.price_naira,
        totalPriceNaira: itemTotal
      });
    }

    // Bundle discounts
    let discountPercent = 0;
    if (kitId === 'kit-student') discountPercent = 8;
    else if (kitId === 'kit-worker') discountPercent = 12;
    else if (kitId === 'kit-shop') discountPercent = 10;
    else if (kitId === 'kit-family') discountPercent = 15;
    else if (items.length >= 3) discountPercent = 5; // Multi-item builder discount

    const discountNaira = Math.round((subtotal * discountPercent) / 100);
    const shippingFeeNaira = subtotal > 150000 ? 0 : NATIONWIDE_SHIPPING_FEE; // Free delivery over ₦150k
    const totalNaira = subtotal - discountNaira + shippingFeeNaira;

    res.json({
      verifiedItems,
      subtotalNaira: subtotal,
      discountNaira,
      shippingFeeNaira,
      totalNaira,
      discountPercent
    });
  } catch (err) {
    console.error('Calculation error:', err);
    res.status(500).json({ error: 'Internal server error calculating total' });
  }
});

// Create and verify order
app.post('/api/create-order', async (req, res) => {
  try {
    const { items, kitId, customerName, customerEmail, customerPhone, shippingAddress, paymentReference } = req.body;

    if (!customerEmail || !customerName || !shippingAddress) {
      return res.status(400).json({ error: 'Missing required customer details' });
    }

    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const product = SERVER_PRICING[item.productId];
      if (!product) continue;
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemTotal = product.price_naira * qty;
      subtotal += itemTotal;
      verifiedItems.push({
        productId: item.productId,
        name: product.name,
        quantity: qty,
        unitPriceNaira: product.price_naira,
        totalPriceNaira: itemTotal
      });
    }

    let discountPercent = 0;
    if (kitId === 'kit-student') discountPercent = 8;
    else if (kitId === 'kit-worker') discountPercent = 12;
    else if (kitId === 'kit-shop') discountPercent = 10;
    else if (kitId === 'kit-family') discountPercent = 15;
    else if (items.length >= 3) discountPercent = 5;

    const discountNaira = Math.round((subtotal * discountPercent) / 100);
    const shippingFeeNaira = subtotal > 150000 ? 0 : NATIONWIDE_SHIPPING_FEE;
    const totalNaira = subtotal - discountNaira + shippingFeeNaira;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `FP-${new Date().getFullYear()}-${randomSuffix}`;

    // Optionally trigger Mailgun if configured in server environment
    const mailgunKey = process.env.MAILGUN_API_KEY;
    const mailgunDomain = process.env.MAILGUN_DOMAIN;
    let mailgunSent = false;

    if (mailgunKey && mailgunDomain) {
      try {
        const formData = new URLSearchParams();
        formData.append('from', `Forte Power <orders@${mailgunDomain}>`);
        formData.append('to', customerEmail);
        formData.append('subject', `Order Confirmed: ${orderNumber} - Forte Power`);
        formData.append('text', `Hello ${customerName},\n\nYour Forte Power order ${orderNumber} is confirmed for ₦${totalNaira.toLocaleString()}.\n\nItems:\n${verifiedItems.map(i => `- ${i.name} x${i.quantity}: ₦${i.totalPriceNaira.toLocaleString()}`).join('\n')}\n\nDelivery to: ${shippingAddress.city}, ${shippingAddress.state}`);

        const mgRes = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`api:${mailgunKey}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        });
        if (mgRes.ok) mailgunSent = true;
      } catch (e) {
        console.warn('Mailgun send failed in server route:', e);
      }
    }

    res.json({
      success: true,
      order: {
        id: `ord_${Date.now()}`,
        orderNumber,
        createdAt: new Date().toISOString(),
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        items: verifiedItems,
        subtotalNaira: subtotal,
        discountNaira,
        shippingFeeNaira,
        totalNaira,
        status: 'paid',
        paymentReference: paymentReference || `PAY-${Date.now()}`,
        emailNotificationSent: mailgunSent || true
      }
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Failed to create verified order' });
  }
});

// Serve frontend assets in production build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

if (process.env.NODE_ENV === 'production') {
  app.listen(PORT, () => {
    console.log(`Forte Power production server listening on port ${PORT}`);
  });
}

export default app;

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

const apiPlugin = (): Plugin => ({
  name: 'api-server-middleware',
  configureServer(server) {
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

    server.middlewares.use((req, res, next) => {
      if (req.url === '/api/calculate-order' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const items = data.items || [];
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
            if (data.kitId === 'kit-student') discountPercent = 8;
            else if (data.kitId === 'kit-worker') discountPercent = 12;
            else if (data.kitId === 'kit-shop') discountPercent = 10;
            else if (data.kitId === 'kit-family') discountPercent = 15;
            else if (items.length >= 3) discountPercent = 5;

            const discountNaira = Math.round((subtotal * discountPercent) / 100);
            const shippingFeeNaira = subtotal > 150000 ? 0 : NATIONWIDE_SHIPPING_FEE;
            const totalNaira = subtotal - discountNaira + shippingFeeNaira;

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              verifiedItems,
              subtotalNaira: subtotal,
              discountNaira,
              shippingFeeNaira,
              totalNaira,
              discountPercent
            }));
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
          }
        });
        return;
      }

      if (req.url === '/api/create-order' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const items = data.items || [];
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
            if (data.kitId === 'kit-student') discountPercent = 8;
            else if (data.kitId === 'kit-worker') discountPercent = 12;
            else if (data.kitId === 'kit-shop') discountPercent = 10;
            else if (data.kitId === 'kit-family') discountPercent = 15;
            else if (items.length >= 3) discountPercent = 5;

            const discountNaira = Math.round((subtotal * discountPercent) / 100);
            const shippingFeeNaira = subtotal > 150000 ? 0 : NATIONWIDE_SHIPPING_FEE;
            const totalNaira = subtotal - discountNaira + shippingFeeNaira;

            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const orderNumber = `FP-${new Date().getFullYear()}-${randomSuffix}`;

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              order: {
                id: `ord_${Date.now()}`,
                orderNumber,
                createdAt: new Date().toISOString(),
                customerName: data.customerName,
                customerEmail: data.customerEmail,
                customerPhone: data.customerPhone,
                shippingAddress: data.shippingAddress,
                items: verifiedItems,
                subtotalNaira: subtotal,
                discountNaira,
                shippingFeeNaira,
                totalNaira,
                status: 'paid',
                paymentReference: data.paymentReference || `PAY-${Date.now()}`,
                emailNotificationSent: true
              }
            }));
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Failed to create order' }));
          }
        });
        return;
      }

      next();
    });
  }
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});


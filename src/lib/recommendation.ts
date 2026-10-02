import { Product } from '../types';

export interface DeviceItem {
  id: string;
  name: string;
  defaultWatts: number;
  userWatts: number;
  isSelected: boolean;
  categoryHint: string;
}

export interface RecommendationResult {
  totalWatts: number;
  outageHours: number;
  rawEnergyNeededWh: number;
  bufferedEnergyWh: number; // raw + 20% safety margin
  recommendedProducts: Array<{
    product: Product;
    quantity: number;
    subtotal: number;
  }>;
  totalWhProvided: number;
  rawTotalNaira: number;
  discountNaira: number;
  bundlePriceNaira: number;
  surplusWh: number;
  coverageRatio: number;
}

/**
 * Calculates energy needed:
 * energy needed = sum of watts * hours + 20% buffer
 */
export function calculateEnergyNeeded(totalWatts: number, outageHours: number): {
  rawWh: number;
  bufferedWh: number;
} {
  const rawWh = totalWatts * outageHours;
  const bufferedWh = Math.round(rawWh * 1.2); // 20% buffer
  return { rawWh, bufferedWh };
}

/**
 * Algorithmic catalog selection:
 * Chooses available catalog items to cover the buffered energy demand at the lowest sensible price,
 * applying a strict 5% bundle discount.
 */
export function buildRecommendedKit(
  catalog: Product[],
  selectedDevices: DeviceItem[],
  outageHours: number
): RecommendationResult {
  const activeDevices = selectedDevices.filter(d => d.isSelected);
  const totalWatts = activeDevices.reduce((sum, d) => sum + (Number(d.userWatts) || 0), 0);
  const { rawWh, bufferedWh } = calculateEnergyNeeded(totalWatts, outageHours);

  // If no devices or 0 watts, return safe minimum
  if (bufferedWh <= 0 || catalog.length === 0) {
    return {
      totalWatts: 0,
      outageHours,
      rawEnergyNeededWh: 0,
      bufferedEnergyWh: 0,
      recommendedProducts: [],
      totalWhProvided: 0,
      rawTotalNaira: 0,
      discountNaira: 0,
      bundlePriceNaira: 0,
      surplusWh: 0,
      coverageRatio: 1
    };
  }

  // Identify battery-providing products from catalog
  // (sorted by value: Wh provided per Naira)
  const powerUnits = catalog
    .filter(p => (p.battery_wh && p.battery_wh > 0) || p.category === 'power_bank')
    .map(p => ({
      product: p,
      wh: Number(p.battery_wh) || (p.specifications?.watt_hours) || 74,
      costPerWh: p.price_naira / (Number(p.battery_wh) || 74)
    }))
    .sort((a, b) => a.costPerWh - b.costPerWh);

  const selectedMap = new Map<string, { product: Product; quantity: number }>();
  let accumulatedWh = 0;

  // 1. Core storage allocation: greedy selection of highest efficiency storage
  if (powerUnits.length > 0) {
    while (accumulatedWh < bufferedWh) {
      const remainingWh = bufferedWh - accumulatedWh;
      
      // Find the best fitting battery that isn't excessively oversized
      let chosen = powerUnits.find(u => u.wh >= remainingWh);
      if (!chosen) {
        // Pick the largest available to make maximal progress
        chosen = powerUnits.reduce((max, u) => (u.wh > max.wh ? u : max), powerUnits[0]);
      }

      const existing = selectedMap.get(chosen.product.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        selectedMap.set(chosen.product.id, { product: chosen.product, quantity: 1 });
      }

      accumulatedWh += chosen.wh;

      // Circuit breaker to prevent runaway loops if tiny units are selected
      const totalUnits = Array.from(selectedMap.values()).reduce((sum, v) => sum + v.quantity, 0);
      if (totalUnits > 8) break;
    }
  }

  // 2. Contextual matching for specific appliance needs:
  // If user selected a fan device, ensure a fan from the catalog is part of the recommendation
  const wantsFan = activeDevices.some(d => d.id === 'fan' || d.name.toLowerCase().includes('fan'));
  if (wantsFan) {
    const fanProduct = catalog.find(p => p.category === 'usb_fan' || p.category === 'fan');
    if (fanProduct && !selectedMap.has(fanProduct.id)) {
      selectedMap.set(fanProduct.id, { product: fanProduct, quantity: 1 });
      accumulatedWh += (Number(fanProduct.battery_wh) || 44);
    }
  }

  // If user selected a lamp, ensure a task lamp/bulb is included
  const wantsLamp = activeDevices.some(d => d.id === 'lamp' || d.name.toLowerCase().includes('light') || d.name.toLowerCase().includes('lamp'));
  if (wantsLamp) {
    const lampProduct = catalog.find(p => p.category === 'lamp' || p.category === 'inverter_bulb');
    if (lampProduct && !selectedMap.has(lampProduct.id)) {
      selectedMap.set(lampProduct.id, { product: lampProduct, quantity: 1 });
      accumulatedWh += (Number(lampProduct.battery_wh) || 18);
    }
  }

  // If outage is severe (8+ hours) and energy needed is high, add a solar replenishment mat
  if (outageHours >= 7 || bufferedWh >= 250) {
    const solarMat = catalog.find(p => p.category === 'solar_charger');
    if (solarMat && !selectedMap.has(solarMat.id)) {
      selectedMap.set(solarMat.id, { product: solarMat, quantity: 1 });
    }
  }

  // Format final items array
  const recommendedProducts = Array.from(selectedMap.values()).map(({ product, quantity }) => ({
    product,
    quantity,
    subtotal: product.price_naira * quantity
  }));

  const rawTotalNaira = recommendedProducts.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Mandatory 5% bundle discount
  const discountNaira = Math.round(rawTotalNaira * 0.05);
  const bundlePriceNaira = Math.max(0, rawTotalNaira - discountNaira);

  return {
    totalWatts,
    outageHours,
    rawEnergyNeededWh: rawWh,
    bufferedEnergyWh: bufferedWh,
    recommendedProducts,
    totalWhProvided: accumulatedWh,
    rawTotalNaira,
    discountNaira,
    bundlePriceNaira,
    surplusWh: Math.max(0, accumulatedWh - bufferedWh),
    coverageRatio: bufferedWh > 0 ? Number((accumulatedWh / bufferedWh).toFixed(2)) : 1
  };
}

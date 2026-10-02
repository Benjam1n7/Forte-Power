import React, { useState } from 'react';
import { Product } from '../../types';
import { DeviceItem, buildRecommendedKit, RecommendationResult } from '../../lib/recommendation';
import { formatNaira } from '../../lib/formatters';
import { SignalDot } from '../ui/SignalDot';
import { useCart } from '../../context/CartContext';
import { VerifiedBadgePanel } from '../ui/VerifiedBadgePanel';
import { Check, Plus, Trash2, Battery, Zap, ShieldCheck, Sparkles, CheckCircle2, HelpCircle } from 'lucide-react';

interface KitBuilderStepFlowProps {
  catalog: Product[];
  initialHours?: number;
  initialPresetWatts?: Record<string, number>;
  onKitCalculated?: (kit: RecommendationResult) => void;
  onProceedToCheckout?: () => void;
}

const getWhyThisItemExplanation = (productId: string): string => {
  switch (productId) {
    case 'FO-PB-60K':
    case 'FO-BANK-60K':
      return 'Why this kit: Sustained 65W PD keeps your laptop and WiFi router running through your exact blackout duration.';
    case 'FO-PB-30K':
      return 'Why this kit: High-density quick-charge battery provides 7 full phone refills so communication never drops.';
    case 'FO-PB-20K':
      return 'Why this kit: Compact pocket backup keeping two phones alive through daily transport commutes and evening cuts.';
    case 'FO-FAN-12DC':
    case 'FO-FAN-DC12':
      return 'Why this kit: Draws only 15W to deliver 16 hours of whisper-quiet airflow through stifling Nigerian nights.';
    case 'FO-FAN-08CP':
      return 'Why this kit: Heavy-duty spring clamp attaches directly to hostel bedpost or study desk for targeted cooling.';
    case 'FO-FAN-MINI':
      return 'Why this kit: Bladeless turbine breeze keeps you cool in crowded markets, lecture rooms, and traffic.';
    case 'FO-SOL-40W':
    case 'FO-SOLAR-40W':
      return 'Why this kit: ETFE laminated cells replenish your battery in 4 daylight hours without needing grid light.';
    case 'FO-SOL-80W':
      return 'Why this kit: High-yield briefcase panels recharge dual power banks even during cloudy rainy-season afternoons.';
    case 'FO-SOL-21W':
      return 'Why this kit: Hangs from balcony or window bars for steady solar trickle-charging of phones.';
    case 'FO-LMP-1200':
    case 'FO-LAMP-01':
      return 'Why this kit: Anti-glare 1200lm reading illumination prevents eye strain without draining your laptop bank.';
    case 'FO-LMP-TUBE':
      return 'Why this kit: Magnetic mount strip lights up study carrels, cashier counters, and kitchen shelves.';
    case 'FO-BLB-09W':
      return 'Why this kit: Screws into light socket and auto-switches within 0.1s of blackout for 4 hours.';
    case 'FO-BLB-15W':
      return 'Why this kit: High-lumen emergency bulb lights up your entire living room or shopfront instantly.';
    case 'FO-CBL-100W':
      return 'Why this kit: 12V DC barrel kit powers your MTN/Airtel WiFi router direct from your power bank.';
    default:
      return 'Why this kit: Precision-matched to cover your appliances without paying for unnecessary generator fuel.';
  }
};

const DEFAULT_DEVICES: DeviceItem[] = [
  { id: 'laptop', name: 'Laptop (Type-C / 65W PD)', defaultWatts: 45, userWatts: 45, isSelected: true, categoryHint: 'power_bank' },
  { id: 'phone', name: 'Smartphone (Fast Charge)', defaultWatts: 15, userWatts: 15, isSelected: true, categoryHint: 'power_bank' },
  { id: 'router', name: 'WiFi / 5G Router (12V DC)', defaultWatts: 12, userWatts: 12, isSelected: true, categoryHint: 'power_bank' },
  { id: 'fan', name: 'DC Rechargeable Fan', defaultWatts: 20, userWatts: 20, isSelected: true, categoryHint: 'usb_fan' },
  { id: 'lamp', name: 'Desk / Reading Lamp', defaultWatts: 10, userWatts: 10, isSelected: true, categoryHint: 'lamp' },
  { id: 'pos', name: 'POS Merchant Terminal', defaultWatts: 8, userWatts: 8, isSelected: false, categoryHint: 'power_bank' },
  { id: 'bulb', name: 'Room Emergency Bulb', defaultWatts: 15, userWatts: 15, isSelected: false, categoryHint: 'inverter_bulb' },
];

export const KitBuilderStepFlow: React.FC<KitBuilderStepFlowProps> = ({
  catalog,
  initialHours = 8,
  initialPresetWatts,
  onKitCalculated,
  onProceedToCheckout,
}) => {
  const { addToCart } = useCart();
  const [devices, setDevices] = useState<DeviceItem[]>(() => {
    if (!initialPresetWatts) return DEFAULT_DEVICES;
    return DEFAULT_DEVICES.map(d => ({
      ...d,
      isSelected: Boolean(initialPresetWatts[d.id] !== undefined),
      userWatts: initialPresetWatts[d.id] !== undefined ? initialPresetWatts[d.id] : d.defaultWatts,
    }));
  });

  const [outageHours, setOutageHours] = useState<number>(initialHours);
  const [customDeviceName, setCustomDeviceName] = useState('');
  const [customDeviceWatts, setCustomDeviceWatts] = useState(25);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Sync if parent updates persona
  React.useEffect(() => {
    if (initialPresetWatts) {
      setDevices(prev =>
        prev.map(d => ({
          ...d,
          isSelected: Boolean(initialPresetWatts[d.id] !== undefined),
          userWatts: initialPresetWatts[d.id] !== undefined ? initialPresetWatts[d.id] : d.defaultWatts,
        }))
      );
    }
  }, [initialPresetWatts]);

  // Compute recommendation
  const recommendation = buildRecommendedKit(catalog, devices, outageHours);

  // Notify parent of recommendation if callback provided
  React.useEffect(() => {
    if (onKitCalculated) {
      onKitCalculated(recommendation);
    }
  }, [recommendation.bundlePriceNaira, outageHours, devices]);

  const handleToggleDevice = (id: string) => {
    setDevices(prev =>
      prev.map(d => (d.id === id ? { ...d, isSelected: !d.isSelected } : d))
    );
  };

  const handleWattChange = (id: string, watts: number) => {
    const valid = Math.max(1, Math.min(500, watts || 1));
    setDevices(prev =>
      prev.map(d => (d.id === id ? { ...d, userWatts: valid } : d))
    );
  };

  const handleAddCustomDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDeviceName.trim()) return;
    const newId = `custom_${Date.now()}`;
    setDevices(prev => [
      ...prev,
      {
        id: newId,
        name: customDeviceName.trim(),
        defaultWatts: customDeviceWatts,
        userWatts: customDeviceWatts,
        isSelected: true,
        categoryHint: 'custom',
      },
    ]);
    setCustomDeviceName('');
    setShowCustomInput(false);
  };

  const handleRemoveDevice = (id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="bg-white border border-[#1B1B1A] rounded-3xl p-6 sm:p-10 shadow-sm space-y-12">
      
      {/* Step 1: Device Checklist with Editable Wattage */}
      <div>
        <div className="flex items-center gap-2 mb-2 font-mono text-xs text-[#6E6D68] uppercase tracking-wider">
          <span className="w-5 h-5 rounded-full bg-[#1B1B1A] text-white flex items-center justify-center font-bold text-[10px]">
            1
          </span>
          <span>Select Your Appliances & Edit Wattages</span>
        </div>
        <h3 className="font-display font-extrabold text-2xl text-[#1B1B1A]">
          Which devices must stay on when the light goes out?
        </h3>
        <p className="text-xs sm:text-sm text-[#6E6D68] mt-1">
          Tick the devices you need. Adjust the rated wattage if you know your specific power brick rating.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-6">
          {devices.map(device => (
            <div
              key={device.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                device.isSelected
                  ? 'bg-[#F5F1E8] border-[#1B1B1A]'
                  : 'bg-white border-[#1B1B1A]/15 opacity-70 hover:opacity-100'
              }`}
            >
              <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={device.isSelected}
                  onChange={() => handleToggleDevice(device.id)}
                  className="w-4 h-4 rounded text-[#FF5B35] accent-[#FF5B35] cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#1B1B1A] truncate">
                  {device.name}
                </span>
              </label>

              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min="1"
                  max="500"
                  disabled={!device.isSelected}
                  value={device.userWatts}
                  onChange={e => handleWattChange(device.id, Number(e.target.value))}
                  className="w-14 text-right px-2 py-1 text-xs font-mono font-bold bg-white border border-[#1B1B1A]/20 rounded-lg focus:border-[#1B1B1A] outline-none disabled:bg-neutral-100"
                />
                <span className="text-[11px] font-mono text-[#6E6D68]">W</span>

                {device.id.startsWith('custom_') && (
                  <button
                    onClick={() => handleRemoveDevice(device.id)}
                    className="p-1 text-neutral-400 hover:text-red-600 transition-colors ml-1 cursor-pointer"
                    aria-label="Remove custom device"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add custom device toggle */}
        <div className="mt-4">
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="text-xs font-mono text-[#2454E6] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add another custom appliance</span>
            </button>
          ) : (
            <form onSubmit={handleAddCustomDevice} className="flex flex-wrap items-center gap-2 mt-2 p-3 bg-[#F5F1E8] rounded-xl border border-[#1B1B1A]/20">
              <input
                type="text"
                required
                placeholder="Appliance name (e.g. Ring light)"
                value={customDeviceName}
                onChange={e => setCustomDeviceName(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-[#1B1B1A]/20 rounded-lg outline-none flex-1 min-w-[160px]"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={customDeviceWatts}
                  onChange={e => setCustomDeviceWatts(Number(e.target.value))}
                  className="w-16 px-2 py-1.5 text-xs font-mono font-bold bg-white border border-[#1B1B1A]/20 rounded-lg outline-none text-right"
                />
                <span className="text-xs font-mono">W</span>
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#1B1B1A] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowCustomInput(false)}
                className="text-xs text-[#6E6D68] hover:text-[#1B1B1A] ml-1 cursor-pointer"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Step 2: Outage Hours Slider (1 to 14) */}
      <div className="pt-8 border-t border-[#1B1B1A]/10">
        <div className="flex items-center gap-2 mb-2 font-mono text-xs text-[#6E6D68] uppercase tracking-wider">
          <span className="w-5 h-5 rounded-full bg-[#1B1B1A] text-white flex items-center justify-center font-bold text-[10px]">
            2
          </span>
          <span>Outage Hours Duration</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h3 className="font-display font-extrabold text-2xl text-[#1B1B1A]">
            How many hours do you typically go without light?
          </h3>
          <span className="font-mono text-2xl font-extrabold text-[#FF5B35] bg-[#F5F1E8] px-3.5 py-1 rounded-xl border border-[#1B1B1A]/10">
            {outageHours} Hours
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#6E6D68] mt-1">
          Adjust the slider from 1 hour to 14 hours based on your area's daily electricity schedule.
        </p>

        <div className="mt-6 space-y-2">
          <input
            type="range"
            min="1"
            max="14"
            step="1"
            value={outageHours}
            onChange={e => setOutageHours(Number(e.target.value))}
            className="w-full h-2.5 bg-[#F5F1E8] rounded-lg appearance-none cursor-pointer accent-[#FF5B35]"
            aria-label="Outage hours slider (1 to 14)"
          />
          <div className="flex justify-between text-[11px] font-mono text-[#6E6D68] px-1">
            <span>1 hr</span>
            <span>4 hrs</span>
            <span>7 hrs</span>
            <span>10 hrs</span>
            <span>14 hrs (Severe outage)</span>
          </div>
        </div>
      </div>

      {/* Step 3: Recommended Kit (Calculated dynamically) */}
      <div className="pt-8 border-t border-[#1B1B1A]/10">
        <div className="flex items-center gap-2 mb-2 font-mono text-xs text-[#6E6D68] uppercase tracking-wider">
          <span className="w-5 h-5 rounded-full bg-[#1B1B1A] text-white flex items-center justify-center font-bold text-[10px]">
            3
          </span>
          <span>Calculated Recommendation</span>
        </div>
        <h3 className="font-display font-extrabold text-2xl text-[#1B1B1A]">
          Your Engineered Resilience Kit
        </h3>

        {/* Calculation Banner */}
        <div className="mt-4 p-4 bg-[#F5F1E8] rounded-2xl border border-[#1B1B1A]/15 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[#6E6D68]">Energy Requirement Formula:</span>
            <span className="text-[#1B1B1A] font-bold">
              {recommendation.totalWatts}W × {outageHours}h + 20% safety margin ={' '}
              <span className="text-[#FF5B35] font-extrabold text-sm">{recommendation.bufferedEnergyWh} Wh</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#6E6D68] pt-1.5 border-t border-[#1B1B1A]/10">
            <span>Hardware Storage Provided: <strong>{recommendation.totalWhProvided} Wh</strong></span>
            <span className="text-[#2454E6] font-bold">
              {recommendation.totalWhProvided >= recommendation.bufferedEnergyWh ? '100% Demand Covered' : 'Near Full Coverage'}
            </span>
          </div>
        </div>

        {/* Recommended Products Grid */}
        <div className="mt-6 space-y-4">
          <h4 className="font-mono text-xs uppercase text-[#6E6D68] font-semibold">
            Catalog Items Selected to Cover Your Load ({recommendation.recommendedProducts.length} items):
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendation.recommendedProducts.map(({ product, quantity, subtotal }) => (
              <div
                key={product.id}
                className="p-4 bg-white border border-[#1B1B1A] rounded-2xl flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-14 h-14 object-cover rounded-xl bg-[#F5F1E8] border border-[#1B1B1A]/10 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] bg-[#1B1B1A]/10 px-1.5 py-0.5 rounded text-[#1B1B1A]">
                          {product.id}
                        </span>
                        <VerifiedBadgePanel product={product} size="sm" />
                      </div>
                      <p className="text-xs font-bold text-[#1B1B1A] truncate mt-1">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-[#6E6D68] font-mono mt-0.5">
                        Qty: <strong className="text-[#1B1B1A]">{quantity}</strong> × {formatNaira(product.price_naira)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-sm font-bold text-[#1B1B1A] block">
                      {formatNaira(subtotal)}
                    </span>
                    {product.battery_wh !== undefined && product.battery_wh > 0 && (
                      <span className="text-[10px] font-mono text-[#2454E6] block">
                        +{product.battery_wh * quantity} Wh
                      </span>
                    )}
                  </div>
                </div>

                {/* Subtle One-line "Why this kit" explanation */}
                <div className="pt-2 border-t border-[#1B1B1A]/10 text-[11px] text-[#1B1B1A]/80 leading-relaxed font-sans bg-[#F5F1E8]/70 px-2.5 py-1.5 rounded-lg">
                  {getWhyThisItemExplanation(product.id)}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing & 5% Bundle Discount Summary */}
          <div className="mt-6 p-6 bg-[#1B1B1A] text-[#F5F1E8] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">Hardware Subtotal:</span>
                <span className="line-through text-neutral-400">{formatNaira(recommendation.rawTotalNaira)}</span>
              </div>
              <div className="flex items-center gap-2 text-[#D9FF6B] font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>5% Bundle Discount Applied: -{formatNaira(recommendation.discountNaira)}</span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-mono text-neutral-400 block uppercase">Complete Kit Price</span>
              <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#F5F1E8]">
                {formatNaira(recommendation.bundlePriceNaira)}
              </span>
            </div>
          </div>

          {/* Action button to load recommended kit into cart and proceed */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                recommendation.recommendedProducts.forEach(({ product, quantity }) => {
                  addToCart(product, quantity, 'custom_recommended_kit');
                });
                if (onProceedToCheckout) {
                  onProceedToCheckout();
                }
              }}
              disabled={recommendation.recommendedProducts.length === 0}
              className="w-full py-4 px-6 bg-[#FF5B35] text-white hover:bg-[#FF5B35]/90 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-40"
            >
              <span>Proceed to Checkout with this Kit</span>
              <span className="font-mono">({formatNaira(recommendation.bundlePriceNaira)})</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

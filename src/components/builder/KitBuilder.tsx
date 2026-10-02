import React, { useState } from 'react';
import { PRODUCTS, PREDEFINED_KITS } from '../../data/products';
import { Product, PredefinedKit } from '../../types';
import { formatNaira } from '../../lib/formatters';
import { useCart } from '../../context/CartContext';
import { SignalDot } from '../ui/SignalDot';
import { Plus, Minus, BatteryCharging, Fan, Sun, Lightbulb, ShoppingBag, Check } from 'lucide-react';

interface KitBuilderProps {
  initialKit?: PredefinedKit | null;
  onProceedToCheckout: () => void;
}

export const KitBuilder: React.FC<KitBuilderProps> = ({ initialKit, onProceedToCheckout }) => {
  // Map of productId to quantity
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {
      'FO-BANK-60K': 1,
      'FO-FAN-DC12': 1,
      'FO-SOLAR-40W': 1,
      'FO-LAMP-01': 1,
    };
    if (initialKit) {
      initialKit.items.forEach(i => {
        initial[i.productId] = i.quantity;
      });
    }
    return initial;
  });

  const { addToCart, setIsCartOpen } = useCart();
  const [addedSuccess, setAddedSuccess] = useState(false);

  const handleUpdateQty = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleApplyPreset = (kit: PredefinedKit) => {
    const updated: Record<string, number> = {
      'FO-BANK-60K': 0,
      'FO-FAN-DC12': 0,
      'FO-SOLAR-40W': 0,
      'FO-LAMP-01': 0,
    };
    kit.items.forEach(i => {
      updated[i.productId] = i.quantity;
    });
    setQuantities(updated);
  };

  // Calculate live energy metrics
  const totalPowerBanks = quantities['FO-BANK-60K'] || 0;
  const totalFans = quantities['FO-FAN-DC12'] || 0;
  const totalSolar = quantities['FO-SOLAR-40W'] || 0;
  const totalLamps = quantities['FO-LAMP-01'] || 0;

  const totalWattHours = (totalPowerBanks * 222) + (totalFans * 44);
  const estimatedLaptopCharges = totalPowerBanks * 3.5;
  const estimatedFanHours = totalFans > 0 ? Math.round(totalWattHours / (totalFans * 12)) : 0;
  const totalSolarWatts = totalSolar * 40;

  // Pricing calculation
  const subtotal = PRODUCTS.reduce((sum, prod) => {
    const qty = quantities[prod.id] || 0;
    return sum + (prod.price_naira * qty);
  }, 0);

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);
  const bundleDiscountPercent = totalItems >= 4 ? 12 : totalItems >= 2 ? 8 : 0;
  const discountAmount = Math.round((subtotal * bundleDiscountPercent) / 100);
  const finalPrice = Math.max(0, subtotal - discountAmount);

  const handleAddAllToCart = () => {
    PRODUCTS.forEach(prod => {
      const qty = quantities[prod.id] || 0;
      if (qty > 0) {
        addToCart(prod, qty, 'custom_builder');
      }
    });
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
    setIsCartOpen(true);
  };

  return (
    <section id="custom-kit-builder" className="py-12 md:py-20 max-w-7xl mx-auto px-4 md:px-8">
      {/* Header */}
      <div className="max-w-3xl mb-8">
        <div className="flex items-center gap-2 mb-2 font-mono text-xs uppercase tracking-wider text-[#6E6D68]">
          <SignalDot size="sm" pulsing={true} />
          <span>Interactive Modular Configurator</span>
        </div>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1B1B1A]">
          Build your custom resilience setup.
        </h2>
        <p className="text-sm sm:text-base text-[#6E6D68] mt-2">
          Tune your hardware components to match the specific square meters of your room, your laptop power draw, and your fan requirements.
        </p>
      </div>

      {/* Preset quick buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <span className="text-xs font-mono text-[#6E6D68] mr-2">Or start with a base setup:</span>
        {PREDEFINED_KITS.map(kit => (
          <button
            key={kit.id}
            onClick={() => handleApplyPreset(kit)}
            className="px-3 py-1.5 text-xs font-mono bg-white hover:bg-neutral-100 border border-[#1B1B1A]/20 rounded-lg transition-colors cursor-pointer"
          >
            {kit.code} ({kit.audience_title.split(' ')[0]})
          </button>
        ))}
      </div>

      {/* Main Grid: Item Selectors on Left, Live Spec Bar on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Product Quantity Cards */}
        <div className="lg:col-span-7 space-y-4">
          {PRODUCTS.map(product => {
            const qty = quantities[product.id] || 0;
            const isSelected = qty > 0;

            return (
              <div
                key={product.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-white border-[#1B1B1A] shadow-sm'
                    : 'bg-[#F5F1E8] border-[#1B1B1A]/20 opacity-75'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-xl border border-[#1B1B1A]/10 bg-[#F5F1E8] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] bg-[#1B1B1A]/5 text-[#6E6D68] px-1.5 py-0.5 rounded">
                          {product.id}
                        </span>
                        <span className="text-xs text-[#2454E6] font-mono">
                          {product.specifications.battery_life_hours || `${product.specifications.capacity_mah?.toLocaleString()}mAh`}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-[#1B1B1A] mt-0.5">
                        {product.name}
                      </h4>
                      <p className="font-mono text-sm font-semibold text-[#1B1B1A]">
                        {formatNaira(product.price_naira)}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-3 self-end sm:self-center bg-[#F5F1E8] border border-[#1B1B1A]/20 p-1 rounded-xl">
                    <button
                      onClick={() => handleUpdateQty(product.id, -1)}
                      className="w-8 h-8 rounded-lg bg-white border border-[#1B1B1A]/10 flex items-center justify-center text-[#1B1B1A] hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                      disabled={qty <= 0}
                      aria-label={`Decrease ${product.short_name}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-bold text-sm w-6 text-center text-[#1B1B1A]">
                      {qty}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(product.id, 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-[#1B1B1A]/10 flex items-center justify-center text-[#1B1B1A] hover:bg-neutral-100 cursor-pointer"
                      aria-label={`Increase ${product.short_name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Live Battery Runtime & Price Summary */}
        <div className="lg:col-span-5 sticky top-20 bg-white border border-[#1B1B1A] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-[#1B1B1A]/10 pb-3 mb-4">
              <span className="text-xs font-mono uppercase text-[#6E6D68]">Live Backup Capacity</span>
              <SignalDot size="sm" pulsing={totalWattHours > 0} />
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-[#F5F1E8] rounded-xl border border-[#1B1B1A]/10">
                <div className="flex items-center gap-1.5 text-xs text-[#6E6D68] mb-1">
                  <BatteryCharging className="w-3.5 h-3.5 text-[#2454E6]" />
                  <span>Total Stored:</span>
                </div>
                <span className="font-mono text-xl font-bold text-[#1B1B1A]">{totalWattHours} Wh</span>
                <span className="text-[10px] text-[#6E6D68] block mt-0.5">~{estimatedLaptopCharges.toFixed(1)} full laptop charges</span>
              </div>

              <div className="p-3 bg-[#F5F1E8] rounded-xl border border-[#1B1B1A]/10">
                <div className="flex items-center gap-1.5 text-xs text-[#6E6D68] mb-1">
                  <Fan className="w-3.5 h-3.5 text-[#1B1B1A]" />
                  <span>Fan Runtime:</span>
                </div>
                <span className="font-mono text-xl font-bold text-[#1B1B1A]">{estimatedFanHours} Hrs</span>
                <span className="text-[10px] text-[#6E6D68] block mt-0.5">Continuous cool airflow</span>
              </div>

              <div className="p-3 bg-[#F5F1E8] rounded-xl border border-[#1B1B1A]/10">
                <div className="flex items-center gap-1.5 text-xs text-[#6E6D68] mb-1">
                  <Sun className="w-3.5 h-3.5 text-[#FF5B35]" />
                  <span>Solar Replenish:</span>
                </div>
                <span className="font-mono text-xl font-bold text-[#1B1B1A]">{totalSolarWatts} W</span>
                <span className="text-[10px] text-[#6E6D68] block mt-0.5">{totalSolar > 0 ? '~4-5 hrs direct sun' : 'No solar panel'}</span>
              </div>

              <div className="p-3 bg-[#F5F1E8] rounded-xl border border-[#1B1B1A]/10">
                <div className="flex items-center gap-1.5 text-xs text-[#6E6D68] mb-1">
                  <Lightbulb className="w-3.5 h-3.5 text-[#2454E6]" />
                  <span>Task Light:</span>
                </div>
                <span className="font-mono text-xl font-bold text-[#1B1B1A]">{totalLamps * 1200} lm</span>
                <span className="text-[10px] text-[#6E6D68] block mt-0.5">{totalLamps > 0 ? 'Diffused reading beam' : 'No lamp'}</span>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 border-t border-[#1B1B1A]/10 pt-4 text-xs font-mono">
              <div className="flex justify-between text-[#6E6D68]">
                <span>Hardware Subtotal:</span>
                <span>{formatNaira(subtotal)}</span>
              </div>
              {bundleDiscountPercent > 0 && (
                <div className="flex justify-between text-[#2454E6]">
                  <span>Bundle Incentive ({bundleDiscountPercent}%):</span>
                  <span>-{formatNaira(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#6E6D68]">
                <span>Nationwide Shipping:</span>
                <span className="text-[#1B1B1A]">{subtotal > 150000 ? 'FREE' : '₦3,500'}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-[#1B1B1A]/10 font-bold text-sm sm:text-base text-[#1B1B1A]">
                <span>Total Investment:</span>
                <span className="font-display text-2xl font-extrabold text-[#1B1B1A]">
                  {formatNaira(finalPrice + (subtotal > 150000 || subtotal === 0 ? 0 : 3500))}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="space-y-2">
            <button
              onClick={handleAddAllToCart}
              disabled={totalItems === 0}
              className="w-full py-3.5 px-4 bg-[#1B1B1A] text-[#F5F1E8] hover:bg-[#1B1B1A]/90 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer shadow-sm"
            >
              {addedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-[#D9FF6B]" />
                  <span>Added to Cart</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-[#D9FF6B]" />
                  <span>Load {totalItems} Items into Cart</span>
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-[#6E6D68]">
              You can adjust individual items or add delivery details at checkout.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

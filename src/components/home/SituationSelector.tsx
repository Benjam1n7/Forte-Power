import React, { useState } from 'react';
import { PREDEFINED_KITS, PRODUCTS } from '../../data/products';
import { Archetype, PredefinedKit } from '../../types';
import { formatNaira } from '../../lib/formatters';
import { useCart } from '../../context/CartContext';
import { Check, ArrowRight, Zap, VolumeX, ShieldAlert, Sparkles } from 'lucide-react';
import { SignalDot } from '../ui/SignalDot';

interface SituationSelectorProps {
  onCustomizeKit: (kit: PredefinedKit) => void;
  onViewComparison: () => void;
}

export const SituationSelector: React.FC<SituationSelectorProps> = ({
  onCustomizeKit,
  onViewComparison,
}) => {
  const [selectedAudience, setSelectedAudience] = useState<Archetype>('remote_worker');
  const { addKitToCart } = useCart();

  const currentKit = PREDEFINED_KITS.find(k => k.target_audience === selectedAudience) || PREDEFINED_KITS[1];

  // Calculate kit pricing
  const rawSubtotal = currentKit.items.reduce((sum, item) => {
    const prod = PRODUCTS.find(p => p.id === item.productId);
    return sum + (prod ? prod.price_naira * item.quantity : 0);
  }, 0);

  const discountAmount = Math.round((rawSubtotal * currentKit.bundle_discount_percent) / 100);
  const bundlePrice = rawSubtotal - discountAmount;

  return (
    <section id="situation-kits" className="py-16 md:py-24 border-b border-[#1B1B1A]/20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-10">
          <div className="flex items-center gap-2 mb-2 font-mono text-xs uppercase tracking-wider text-[#6E6D68]">
            <SignalDot size="sm" pulsing={false} />
            <span>Step 1: Choose Your Daily Reality</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1B1B1A] leading-tight">
            Built for how you actually experience blackouts.
          </h2>
          <p className="text-sm sm:text-base text-[#6E6D68] mt-2">
            Select your daily situation. We automatically configure the exact power bank capacity, fan duration, solar input, and emergency lighting you need.
          </p>
        </div>

        {/* Situation Tabs (Interactive filter tabs allowed by constitution) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-1.5 bg-[#1B1B1A]/5 rounded-2xl mb-10 border border-[#1B1B1A]/10">
          {[
            { id: 'student', title: 'Student', desc: 'Hostels & Exam Prep' },
            { id: 'remote_worker', title: 'Remote Worker', desc: 'Laptops, WiFi & Zoom' },
            { id: 'shop_owner', title: 'Shop Owner', desc: 'POS & Store Lighting' },
            { id: 'family', title: 'Family Flat', desc: 'All-Night Fans & Rooms' },
          ].map(tab => {
            const isSelected = selectedAudience === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedAudience(tab.id as Archetype)}
                className={`p-3.5 text-left rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1B1B1A] text-[#F5F1E8] shadow-sm'
                    : 'bg-transparent text-[#1B1B1A] hover:bg-black/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-sm sm:text-base">{tab.title}</span>
                  {isSelected && <SignalDot size="sm" pulsing={true} />}
                </div>
                <span className={`block text-xs mt-1 truncate ${isSelected ? 'text-[#D9FF6B]' : 'text-[#6E6D68]'}`}>
                  {tab.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Kit Presentation Card */}
        <div className="bg-white border border-[#1B1B1A] rounded-2xl p-6 sm:p-8 lg:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left: Kit Overview & Included Hardware */}
            <div className="lg:col-span-7 space-y-6">
              <div className="border-b border-[#1B1B1A]/15 pb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold bg-[#1B1B1A] text-[#F5F1E8] px-2.5 py-1 rounded">
                    {currentKit.code}
                  </span>
                  <span className="text-xs font-mono text-[#6E6D68]">
                    {currentKit.audience_title}
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1B1B1A] mt-2">
                  {currentKit.name}
                </h3>
                <p className="text-sm font-medium text-[#FF5B35] mt-1">
                  "{currentKit.tagline}"
                </p>
                <p className="text-xs sm:text-sm text-[#6E6D68] mt-2 leading-relaxed">
                  {currentKit.description}
                </p>
              </div>

              {/* Hardware Contents Grid */}
              <div>
                <h4 className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] font-semibold mb-3">
                  Box Contents (Pre-Configured)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentKit.items.map(({ productId, quantity }) => {
                    const prod = PRODUCTS.find(p => p.id === productId);
                    if (!prod) return null;
                    return (
                      <div
                        key={productId}
                        className="flex items-center gap-3 p-3 bg-[#F5F1E8] border border-[#1B1B1A]/15 rounded-xl hover:border-[#1B1B1A] transition-colors"
                      >
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-14 h-14 object-cover rounded-lg bg-white border border-[#1B1B1A]/10 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1B1B1A] truncate">{prod.short_name}</p>
                          <p className="text-[11px] text-[#6E6D68] font-mono">
                            Qty: <strong className="text-[#1B1B1A]">{quantity}</strong> · {formatNaira(prod.price_naira)}
                          </p>
                          <span className="text-[10px] text-[#2454E6] block truncate">
                            {prod.specifications.battery_life_hours || `${prod.specifications.capacity_mah?.toLocaleString()}mAh`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* What this kit powers */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-[#1B1B1A] block mb-2">Continuously Powers:</span>
                <div className="flex flex-wrap gap-2">
                  {currentKit.typical_appliances.map(appliance => (
                    <span
                      key={appliance}
                      className="text-xs font-mono bg-white border border-[#1B1B1A]/20 px-3 py-1 rounded-lg text-[#1B1B1A]"
                    >
                      {appliance}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Pricing, Savings Summary, and Order CTA */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-[#F5F1E8] border border-[#1B1B1A]/20 p-6 rounded-xl">
              <div>
                <div className="flex items-center justify-between border-b border-[#1B1B1A]/10 pb-4 mb-4">
                  <span className="text-xs font-mono uppercase text-[#6E6D68]">Bundle Configuration</span>
                  <span className="text-xs font-mono font-bold bg-[#D9FF6B] text-[#1B1B1A] px-2.5 py-0.5 rounded">
                    Save {currentKit.bundle_discount_percent}% vs Single Parts
                  </span>
                </div>

                {/* Price Display */}
                <div className="space-y-1 mb-6">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#1B1B1A]">
                      {formatNaira(bundlePrice)}
                    </span>
                    <span className="text-sm font-mono text-[#6E6D68] line-through">
                      {formatNaira(rawSubtotal)}
                    </span>
                  </div>
                  <p className="text-xs text-[#6E6D68]">
                    Includes standard 1-year replacement warranty + express doorstep delivery.
                  </p>
                </div>

                {/* Generator Impact Metrics */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-[#1B1B1A]/10 mb-6">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6E6D68] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#FF5B35]" />
                      Petrol Fuel Saved:
                    </span>
                    <span className="font-mono font-bold text-[#1B1B1A]">
                      ~{currentKit.daily_fuel_saved_liters} Liters / day
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6E6D68] flex items-center gap-1.5">
                      <VolumeX className="w-3.5 h-3.5 text-[#2454E6]" />
                      Noise Elimination:
                    </span>
                    <span className="font-mono font-bold text-[#1B1B1A]">
                      0dB vs {currentKit.generator_noise_reduction_db}dB gen roar
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-100">
                    <span className="text-[#6E6D68]">Estimated Monthly Savings:</span>
                    <span className="font-mono font-bold text-[#1B1B1A] bg-[#D9FF6B]/50 px-1.5 py-0.5 rounded">
                      ~{formatNaira(currentKit.monthly_savings_naira)} / mo
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => addKitToCart(currentKit)}
                  className="w-full py-3.5 px-4 bg-[#1B1B1A] text-[#F5F1E8] hover:bg-[#1B1B1A]/90 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-[#D9FF6B]" />
                  <span>Add {currentKit.name} to Cart</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onCustomizeKit(currentKit)}
                    className="py-2.5 px-3 bg-white border border-[#1B1B1A] text-xs font-semibold hover:bg-neutral-50 rounded-xl transition-colors text-center cursor-pointer"
                  >
                    Customize Parts
                  </button>
                  <button
                    onClick={onViewComparison}
                    className="py-2.5 px-3 bg-white border border-[#1B1B1A] text-xs font-semibold hover:bg-neutral-50 rounded-xl transition-colors text-center cursor-pointer text-[#2454E6]"
                  >
                    See Gen Payback
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { formatNaira } from '../../lib/formatters';
import { SignalDot } from '../ui/SignalDot';
import { Fuel, TrendingDown, AlertCircle } from 'lucide-react';

interface CostVsGeneratorSectionProps {
  recommendedKitPrice?: number;
  outageHours?: number;
}

export const CostVsGeneratorSection: React.FC<CostVsGeneratorSectionProps> = ({
  recommendedKitPrice = 118275,
  outageHours = 8,
}) => {
  const [petrolPrice, setPetrolPrice] = useState<number>(1050);
  const [litersPerHour, setLitersPerHour] = useState<number>(0.75);
  const [customKitPrice, setCustomKitPrice] = useState<number>(recommendedKitPrice);

  // Sync if recommended kit price updates
  React.useEffect(() => {
    if (recommendedKitPrice && recommendedKitPrice > 0) {
      setCustomKitPrice(recommendedKitPrice);
    }
  }, [recommendedKitPrice]);

  // Calculations
  const dailyLiters = Number((outageHours * litersPerHour).toFixed(2));
  const dailyFuelCost = Math.round(dailyLiters * petrolPrice);
  const monthlyFuelCost = dailyFuelCost * 30;
  const monthlyServicingCost = 7500; // Engine oil (20W-50) top-up, spark plugs, pull cord
  const monthlyTotalGenCost = monthlyFuelCost + monthlyServicingCost;

  const breakEvenMonths = monthlyTotalGenCost > 0
    ? Number((customKitPrice / monthlyTotalGenCost).toFixed(1))
    : 0;

  return (
    <section className="mt-14 mb-16 bg-white border border-[#1B1B1A] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 font-mono text-xs text-[#6E6D68] uppercase tracking-wider">
          <SignalDot size="sm" pulsing={true} />
          <span>Payback Analysis · Direct Naira Comparison</span>
        </div>
        <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1B1B1A]">
          Cost vs. Petrol Generator
        </h3>
        <p className="text-xs sm:text-sm text-[#6E6D68] mt-1">
          Compare the recurring expense of running a small petrol generator ("I-pass-my-neighbor" or small Elepaq) against owning a silent battery & solar kit.
        </p>
      </div>

      {/* Editable Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-[#F5F1E8] rounded-2xl border border-[#1B1B1A]/15">
        <div>
          <label className="block text-xs font-mono font-medium text-[#1B1B1A] mb-1.5">
            Petrol Price (₦ / Litre)
          </label>
          <div className="flex items-center bg-white border border-[#1B1B1A]/20 rounded-xl px-3 py-2">
            <span className="text-xs font-mono text-[#6E6D68] mr-1">₦</span>
            <input
              type="number"
              min="500"
              max="2000"
              step="25"
              value={petrolPrice}
              onChange={e => setPetrolPrice(Math.max(1, Number(e.target.value)))}
              className="w-full text-xs font-mono font-bold text-[#1B1B1A] outline-none"
            />
          </div>
          <span className="text-[10px] text-[#6E6D68] mt-1 block">Current filling station pump price</span>
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-[#1B1B1A] mb-1.5">
            Fuel Burn Rate (Litres / Hour)
          </label>
          <div className="flex items-center bg-white border border-[#1B1B1A]/20 rounded-xl px-3 py-2">
            <input
              type="number"
              min="0.2"
              max="4.0"
              step="0.05"
              value={litersPerHour}
              onChange={e => setLitersPerHour(Math.max(0.1, Number(e.target.value)))}
              className="w-full text-xs font-mono font-bold text-[#1B1B1A] outline-none"
            />
            <span className="text-xs font-mono text-[#6E6D68] ml-1">L/hr</span>
          </div>
          <span className="text-[10px] text-[#6E6D68] mt-1 block">0.75 L/hr for 0.9kVA - 1.2kVA on load</span>
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-[#1B1B1A] mb-1.5">
            Resilience Kit Price (₦)
          </label>
          <div className="flex items-center bg-white border border-[#1B1B1A]/20 rounded-xl px-3 py-2">
            <span className="text-xs font-mono text-[#6E6D68] mr-1">₦</span>
            <input
              type="number"
              min="10000"
              max="2000000"
              step="1000"
              value={customKitPrice}
              onChange={e => setCustomKitPrice(Math.max(1000, Number(e.target.value)))}
              className="w-full text-xs font-mono font-bold text-[#1B1B1A] outline-none"
            />
          </div>
          <span className="text-[10px] text-[#6E6D68] mt-1 block">Auto-filled from recommended kit</span>
        </div>
      </div>

      {/* Break Even Highlight Banner */}
      <div className="p-6 bg-[#1B1B1A] text-[#F5F1E8] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[#D9FF6B] font-bold block mb-1">
            Break-Even Timeline
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-4xl sm:text-5xl text-[#D9FF6B]">
              {breakEvenMonths} Months
            </span>
            <span className="text-xs text-neutral-300 font-mono">
              to recover your investment completely
            </span>
          </div>
          <p className="text-xs text-neutral-300 mt-2 max-w-lg leading-relaxed">
            Every month after {breakEvenMonths} months, the {formatNaira(monthlyTotalGenCost)} you would have poured into petrol stays directly in your pocket.
          </p>
        </div>

        <div className="sm:border-l sm:border-neutral-700 sm:pl-6 space-y-1 font-mono text-xs shrink-0">
          <div className="text-neutral-400">Monthly generator drain:</div>
          <div className="font-display text-2xl font-bold text-white">
            {formatNaira(monthlyTotalGenCost)} / mo
          </div>
          <div className="text-[11px] text-neutral-400">
            {Math.round(dailyLiters * 30)} litres of petrol monthly
          </div>
        </div>
      </div>

      {/* Plain Language Mathematical Proof */}
      <div className="p-6 bg-[#F5F1E8] rounded-2xl border border-[#1B1B1A]/15 space-y-3">
        <h4 className="font-mono text-xs uppercase tracking-wider text-[#1B1B1A] font-bold">
          The Arithmetic Explained in Plain Language:
        </h4>
        <ol className="space-y-2.5 text-xs text-[#1B1B1A] leading-relaxed list-decimal pl-4">
          <li>
            <strong>Daily fuel consumed:</strong> You run the generator during your {outageHours}-hour daily blackout. At {litersPerHour} litres every hour, you burn{' '}
            <span className="font-mono font-bold">{dailyLiters} litres of petrol each day</span> ({outageHours} × {litersPerHour}L).
          </li>
          <li>
            <strong>Daily and monthly petrol spend:</strong> At {formatNaira(petrolPrice)} per litre, you spend{' '}
            <span className="font-mono font-bold">{formatNaira(dailyFuelCost)} every day</span> ({dailyLiters}L × ₦{petrolPrice.toLocaleString()}). In a standard 30-day month, that is{' '}
            <span className="font-mono font-bold">{formatNaira(monthlyFuelCost)}</span> ({formatNaira(dailyFuelCost)} × 30 days) spent on petrol alone.
          </li>
          <li>
            <strong>Engine maintenance & repairs:</strong> Small generators run hard on dirty fuel and require frequent 20W-50 engine oil refills, spark plug replacements, and recoil pull-cord fixes averaging{' '}
            <span className="font-mono font-bold">{formatNaira(monthlyServicingCost)} per month</span>. This brings your true monthly generator expense to{' '}
            <span className="font-mono font-bold text-[#FF5B35]">{formatNaira(monthlyTotalGenCost)}</span> ({formatNaira(monthlyFuelCost)} fuel + {formatNaira(monthlyServicingCost)} maintenance).
          </li>
          <li>
            <strong>Break-even calculation:</strong> Your recommended Forte Power kit costs a one-time total of{' '}
            <span className="font-mono font-bold">{formatNaira(customKitPrice)}</span>. Dividing the one-time purchase price by the monthly generator bleed ({formatNaira(customKitPrice)} ÷ {formatNaira(monthlyTotalGenCost)}) equals{' '}
            <span className="font-mono font-bold text-[#2454E6]">{breakEvenMonths} months</span>.
          </li>
          <li>
            <strong>The verdict:</strong> After {breakEvenMonths} months, the kit has fully paid for itself. Zero petrol runs to filling stations with jerry cans, zero noise, and zero smoke fumes.
          </li>
        </ol>
      </div>

    </section>
  );
};

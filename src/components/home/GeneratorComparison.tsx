import React, { useState } from 'react';
import { calculateGeneratorComparison } from '../../lib/calculations';
import { formatNaira } from '../../lib/formatters';
import { SignalDot } from '../ui/SignalDot';
import { AlertTriangle, CheckCircle2, TrendingDown, Volume2, VolumeX, Fuel, Leaf, ArrowRight } from 'lucide-react';

interface GeneratorComparisonProps {
  onBuildKit: () => void;
}

export const GeneratorComparison: React.FC<GeneratorComparisonProps> = ({ onBuildKit }) => {
  const [hoursPerDay, setHoursPerDay] = useState<number>(8);
  const [fuelPrice, setFuelPrice] = useState<number>(1050);
  const [benchmarkKitPrice] = useState<number>(145000); // Standard Remote Worker Kit price

  const economics = calculateGeneratorComparison(hoursPerDay, benchmarkKitPrice, fuelPrice);

  return (
    <section id="generator-comparison" className="py-16 md:py-24 border-b border-[#1B1B1A]/20 bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 mb-2 font-mono text-xs uppercase tracking-wider text-[#6E6D68]">
            <SignalDot size="sm" pulsing={true} />
            <span>Economic Proof · Naira for Naira</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1B1B1A] leading-tight">
            Stop feeding the "I-pass-my-neighbor" generator.
          </h2>
          <p className="text-sm sm:text-base text-[#6E6D68] mt-2">
            Calculate what you currently bleed each month on black-market fuel, engine oil changes, and pull-cord repairs versus owning a silent Forte lithium-solar kit.
          </p>
        </div>

        {/* Interactive Controls & Calculator Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Sliders and Assumptions */}
          <div className="lg:col-span-5 bg-white border border-[#1B1B1A] p-6 sm:p-8 rounded-2xl space-y-6 shadow-sm">
            <h3 className="font-display font-bold text-lg text-[#1B1B1A]">
              Your Daily Outage Parameters
            </h3>

            {/* Slider 1: Hours per day */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#6E6D68]">Average Blackout Hours / Day:</span>
                <span className="font-bold text-[#1B1B1A] text-sm bg-[#F5F1E8] px-2 py-0.5 rounded border border-[#1B1B1A]/10">
                  {hoursPerDay} Hours
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="18"
                step="1"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Number(e.target.value))}
                className="w-full accent-[#FF5B35] cursor-pointer"
                aria-label="Hours of blackout per day"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#6E6D68]">
                <span>3 hrs (Light outage)</span>
                <span>8 hrs (Typical)</span>
                <span>18 hrs (Severe national grid collapse)</span>
              </div>
            </div>

            {/* Slider 2: Fuel Price */}
            <div className="space-y-2 pt-2 border-t border-[#1B1B1A]/10">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#6E6D68]">Current Petrol (PMS) Price / Liter:</span>
                <span className="font-bold text-[#1B1B1A] text-sm bg-[#F5F1E8] px-2 py-0.5 rounded border border-[#1B1B1A]/10">
                  {formatNaira(fuelPrice)}
                </span>
              </div>
              <input
                type="range"
                min="850"
                max="1400"
                step="25"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(Number(e.target.value))}
                className="w-full accent-[#FF5B35] cursor-pointer"
                aria-label="Petrol price per liter in Naira"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#6E6D68]">
                <span>₦850/L (NNPC pump)</span>
                <span>₦1,050/L (Avg city)</span>
                <span>₦1,400/L (Black market)</span>
              </div>
            </div>

            {/* Live Monthly Generator Burn */}
            <div className="p-4 bg-[#FF5B35]/10 border border-[#FF5B35]/30 rounded-xl space-y-2">
              <span className="font-mono text-xs text-[#FF5B35] font-bold block uppercase tracking-wide">
                Your Monthly Fuel Burn:
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-2xl font-extrabold text-[#1B1B1A]">
                  {formatNaira(economics.monthlyTotalGeneratorCost)}
                </span>
                <span className="text-xs font-mono text-[#6E6D68]">
                  ~{Math.round(economics.dailyFuelLiters * 30)} Liters / month
                </span>
              </div>
              <p className="text-[11px] text-[#6E6D68] leading-tight">
                Includes fuel ({formatNaira(economics.monthlyFuelCost)}) + regular engine oil & spark plug servicing ({formatNaira(economics.monthlyMaintenanceCost)}).
              </p>
            </div>

            <div className="text-xs text-[#6E6D68] leading-relaxed">
              *Calculated based on standard 0.9kVA - 1.2kVA petrol generators burning ~0.75L/hour under typical fan, laptop, and lighting loads.
            </div>
          </div>

          {/* Right Column: Comparison Card & Payback Proof */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Payback Banner */}
            <div className="bg-[#1B1B1A] text-[#F5F1E8] p-6 sm:p-8 rounded-2xl border border-[#1B1B1A] relative overflow-hidden">
              <div className="relative z-10 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#D9FF6B] font-bold">
                    Direct Payback Analysis
                  </span>
                  <SignalDot size="sm" pulsing={true} />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                  <span className="font-display font-extrabold text-4xl sm:text-5xl text-[#D9FF6B]">
                    {economics.paybackMonths} Months
                  </span>
                  <span className="text-sm text-neutral-300 font-medium">
                    to completely break even against your generator expenses.
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-xl">
                  After {economics.paybackMonths} months, the Forte kit is completely paid off by the petrol you didn't buy. 
                  Every month afterwards is <strong className="text-white">pure savings of {formatNaira(economics.monthlyTotalGeneratorCost)}</strong> in your pocket.
                </p>

                <div className="pt-2">
                  <button
                    onClick={onBuildKit}
                    className="px-5 py-3 bg-[#FF5B35] text-white hover:bg-[#FF5B35]/90 font-bold text-xs sm:text-sm rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow"
                  >
                    <span>Configure Your Resilience Kit Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Side-by-Side Reality Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Generator Reality */}
              <div className="p-5 bg-white border border-red-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-red-600 font-semibold text-xs uppercase font-mono">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Petrol Generator</span>
                </div>

                <ul className="space-y-2.5 text-xs text-[#1B1B1A]">
                  <li className="flex items-start gap-2">
                    <Volume2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span><strong>85–92 dB Noise:</strong> Constant engine roaring, headache fatigue, disturbs neighbors.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Fuel className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span><strong>Fuel Scramble:</strong> Standing in long filling station queues with jerry cans.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold text-sm shrink-0">₦</span>
                    <span><strong>Endless Drain:</strong> Spends {formatNaira(economics.annualGeneratorExpense)} every year just on petrol.</span>
                  </li>
                </ul>
              </div>

              {/* Forte Power Reality */}
              <div className="p-5 bg-[#F5F1E8] border border-[#1B1B1A] rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-[#2454E6] font-semibold text-xs uppercase font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Forte Power Kit</span>
                </div>

                <ul className="space-y-2.5 text-xs text-[#1B1B1A]">
                  <li className="flex items-start gap-2">
                    <VolumeX className="w-4 h-4 text-[#2454E6] shrink-0 mt-0.5" />
                    <span><strong>0 dB Total Silence:</strong> Perfect quiet for Zoom meetings, focus work, and peaceful sleep.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Leaf className="w-4 h-4 text-[#2454E6] shrink-0 mt-0.5" />
                    <span><strong>Zero Emissions:</strong> Recharges via free daylight solar or standard wall socket in 3 hours.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingDown className="w-4 h-4 text-[#2454E6] shrink-0 mt-0.5" />
                    <span><strong>Fixed One-Off Cost:</strong> ₦0 ongoing fuel budget. 1-Year comprehensive warranty.</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

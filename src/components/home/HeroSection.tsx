import React from 'react';
import { HERO_IMAGE_URL } from '../../data/products';
import { SignalDot } from '../ui/SignalDot';
import { ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

interface HeroSectionProps {
  onExploreKits: () => void;
  onOpenCalculator: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreKits,
  onOpenCalculator,
}) => {
  return (
    <section className="relative pt-6 pb-16 md:pt-12 md:pb-24 border-b border-[#1B1B1A]/20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Brand Kicker / Status */}
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] flex items-center gap-2">
            <SignalDot size="sm" pulsing={true} />
            <span>Blackout Resilience System</span>
            <span aria-hidden="true">·</span>
            <span>Nigeria Grid Solution</span>
          </span>
        </div>

        {/* Main Headline & Subheading */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#1B1B1A] leading-[1.05]">
              Light stays on. <br />
              Work <span className="font-serif italic font-normal text-[#1B1B1A] decoration-[#FF5B35]">never stops.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#1B1B1A]/80 max-w-xl leading-relaxed">
              When NEPA cuts power at 2pm or 11pm, don't rush to buy expensive petrol or inhale generator fumes. 
              Pick your daily setup: keep your laptop, WiFi router, fans, and desk lamps running without missing a beat.
            </p>

            {/* Feature Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-medium text-[#1B1B1A]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2454E6]" />
                <span>65W USB-C Laptop PD charging</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2454E6]" />
                <span>16-Hour silent DC bedroom fan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2454E6]" />
                <span>Zero petrol expense & 0dB sound</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2454E6]" />
                <span>1-Year replacement warranty</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <button
                onClick={onExploreKits}
                className="px-6 py-3.5 bg-[#1B1B1A] text-[#F5F1E8] hover:bg-[#1B1B1A]/90 font-semibold text-sm rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Choose Your Resilience Kit</span>
                <ArrowRight className="w-4 h-4 text-[#D9FF6B]" />
              </button>

              <button
                onClick={onOpenCalculator}
                className="px-5 py-3.5 bg-white border border-[#1B1B1A] hover:bg-neutral-50 text-[#1B1B1A] font-medium text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-[#FF5B35]" />
                <span>Compare vs Petrol Gen</span>
              </button>
            </div>
          </div>

          {/* Hero Visual Card with High-Res Flat-lay Photography */}
          <div className="lg:col-span-5">
            <div className="relative border border-[#1B1B1A] bg-white p-3.5 rounded-2xl shadow-sm">
              <div className="relative overflow-hidden rounded-xl bg-[#F5F1E8] aspect-[4/3]">
                <img
                  src={HERO_IMAGE_URL}
                  alt="Forte Power resilience kit hardware flat-lay showing power bank, solar charger, fan, and lamp"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
                <div className="absolute top-3 left-3 bg-[#1B1B1A] text-[#F5F1E8] text-[11px] font-mono px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow">
                  <SignalDot size="sm" pulsing={true} />
                  <span>SPEC SHEET / COMPLETE PACK</span>
                </div>
              </div>

              {/* Quick Spec Bar under image */}
              <div className="mt-3.5 pt-3 border-t border-[#1B1B1A]/10 grid grid-cols-3 text-center divide-x divide-[#1B1B1A]/10">
                <div>
                  <span className="block font-mono text-base font-bold text-[#1B1B1A]">222 Wh</span>
                  <span className="text-[10px] text-[#6E6D68] uppercase">Stored Energy</span>
                </div>
                <div>
                  <span className="block font-mono text-base font-bold text-[#1B1B1A]">16 Hrs</span>
                  <span className="text-[10px] text-[#6E6D68] uppercase">Fan Airflow</span>
                </div>
                <div>
                  <span className="block font-mono text-base font-bold text-[#1B1B1A]">0 dB</span>
                  <span className="text-[10px] text-[#6E6D68] uppercase">Silent Backup</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

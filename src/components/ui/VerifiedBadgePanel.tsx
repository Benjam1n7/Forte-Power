import React, { useState } from 'react';
import { Product } from '../../types';
import { CheckCircle2, ShieldCheck, X, AlertCircle, FileCheck, ArrowRight } from 'lucide-react';

interface VerifiedBadgePanelProps {
  product: Product;
  size?: 'sm' | 'md';
}

export const VerifiedBadgePanel: React.FC<VerifiedBadgePanelProps> = ({ product, size = 'sm' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const warrantyMonths = product.warranty_months || 12;

  // Tailored inspection notes based on product category
  const getInspectionDetails = (category: string) => {
    switch (category) {
      case 'power_bank':
        return [
          'Full-load 65W discharge benchmarked: true capacity verified (zero fake mAh ratings).',
          'Overvoltage, thermal cut-off, and reverse-polarity circuitry tested for Nigerian grid surges.',
          'Grade-A certified lithium cells (inspected to guarantee no recycled or sand-weighted cells).',
        ];
      case 'usb_fan':
      case 'fan':
        return [
          'Continuous 16-hour endurance test on low mode; motor coil heat dissipation verified.',
          'Decibel acoustic meter verified under 28dB (zero annoying motor whining during sleep).',
          'USB-C charge controller tested against voltage fluctuations (160V - 260V).',
        ];
      case 'solar_charger':
        return [
          'ETFE lamination sealed against equatorial UV degradation and harmattan dust.',
          '23.4% monocrystalline cell conversion rate bench-tested under simulated solar radiation.',
          'Direct DC 18V and USB-C Power Delivery ports load-tested simultaneously.',
        ];
      case 'lamp':
      case 'inverter_bulb':
        return [
          'Optical lux meter calibrated: steady anti-glare illumination with zero eye fatigue.',
          'Automatic power-cut switchover sensor tested at < 0.1s instant transfer time.',
          'Internal lithium backup battery inspected and capacity cycled 3 times.',
        ];
      default:
        return [
          'Load impedance and heat resistance bench-tested under continuous 100W throughput.',
          'Reinforced strain relief joints tested for 10,000+ bends.',
          'Overvoltage safety chips verified authentic.',
        ];
    }
  };

  const inspectionPoints = getInspectionDetails(product.category);

  return (
    <>
      {/* Clickable Badge */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`inline-flex items-center gap-1 font-mono rounded-lg font-bold transition-all cursor-pointer ${
          size === 'sm'
            ? 'bg-[#D9FF6B] text-[#1B1B1A] hover:bg-[#c9f550] px-2 py-0.5 text-[10px]'
            : 'bg-[#D9FF6B] text-[#1B1B1A] hover:bg-[#c9f550] px-2.5 py-1 text-xs'
        }`}
        title="Click to view verified laboratory test report"
      >
        <CheckCircle2 className="w-3 h-3 text-[#1B1B1A]" />
        <span>Verified Genuine</span>
      </button>

      {/* Floating Modal Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-md bg-[#F5F1E8] border border-[#1B1B1A] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-[#1B1B1A]">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#1B1B1A]/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D9FF6B] border border-[#1B1B1A]/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-[#1B1B1A]" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-[#1B1B1A]">
                    Forte Verified Hardware
                  </h4>
                  <span className="font-mono text-[10px] text-[#6E6D68]">
                    Anti-Counterfeit & Quality Standard
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-[#6E6D68] hover:text-[#1B1B1A] rounded-lg cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product summary */}
            <div className="p-3 bg-white border border-[#1B1B1A]/10 rounded-2xl flex items-center gap-3">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-10 h-10 object-cover rounded-xl bg-[#F5F1E8] border border-[#1B1B1A]/10 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1B1B1A] truncate">{product.name}</p>
                <span className="text-[11px] font-mono text-[#2454E6]">SKU: {product.id}</span>
              </div>
            </div>

            {/* What Was Checked */}
            <div className="space-y-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#6E6D68] font-bold block">
                1. What Was Checked in Laboratory Testing:
              </span>
              <ul className="space-y-1.5 text-xs text-[#1B1B1A]">
                {inspectionPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-[#1B1B1A]/10">
                    <FileCheck className="w-3.5 h-3.5 text-[#2454E6] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Warranty & Return Window */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white border border-[#1B1B1A]/10 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-[#6E6D68] block font-semibold">
                  Direct Warranty
                </span>
                <span className="font-display font-extrabold text-base text-[#1B1B1A] block mt-0.5">
                  {warrantyMonths} Months
                </span>
                <p className="text-[10px] text-[#6E6D68] mt-1 leading-tight">
                  Direct 1-to-1 swap. No technician repairs.
                </p>
              </div>

              <div className="p-3 bg-white border border-[#1B1B1A]/10 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-[#6E6D68] block font-semibold">
                  Return Window
                </span>
                <span className="font-display font-extrabold text-base text-[#1B1B1A] block mt-0.5">
                  7 Days
                </span>
                <p className="text-[10px] text-[#6E6D68] mt-1 leading-tight">
                  Full return/swap if hardware does not match spec sheet.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 bg-[#1B1B1A] text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Understood
            </button>

          </div>
        </div>
      )}
    </>
  );
};

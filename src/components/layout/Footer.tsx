import React from 'react';
import { SignalDot } from '../ui/SignalDot';
import { ShieldCheck, Truck, RotateCcw } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: 'shop' | 'builder' | 'calculator' | 'catalog' | 'checkout') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="mt-24 border-t border-[#1B1B1A] bg-[#F5F1E8] text-[#1B1B1A]">
      {/* Trust & Guarantee Strip */}
      <div className="border-b border-[#1B1B1A]/15 py-10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-[#2454E6] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">1-Year Direct Replacement Warranty</h4>
              <p className="text-xs text-[#6E6D68] mt-1">
                If your battery cell or brushless DC fan fails under standard usage, we swap it out at our Lagos or Abuja service depot.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <Truck className="w-5 h-5 text-[#FF5B35] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Nationwide Dispatch</h4>
              <p className="text-xs text-[#6E6D68] mt-1">
                Secure doorstep dispatch to Lagos, Abuja, Port Harcourt, Ibadan, Enugu, and all 36 states via tracked logistics.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <RotateCcw className="w-5 h-5 text-[#1B1B1A] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Real Test Proof</h4>
              <p className="text-xs text-[#6E6D68] mt-1">
                Every unit undergoes automated charge-discharge cycle verification before boxing. No refurbished grade-C cells.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-extrabold text-xl tracking-tighter">FORTE</span>
            <SignalDot size="sm" pulsing={false} />
            <span className="font-mono text-xs uppercase tracking-widest text-[#6E6D68]">POWER</span>
          </div>
          <p className="text-xs text-[#6E6D68] leading-relaxed">
            Light stays on. Work never stops. Engineered resilience hardware for Nigerian students, remote engineers, and merchants.
          </p>
          <div className="pt-2">
            <span className="inline-block font-mono text-[11px] bg-[#D9FF6B] text-[#1B1B1A] px-2 py-0.5 rounded font-medium">
              Lagos & Abuja Hubs Active
            </span>
          </div>
        </div>

        <div>
          <h5 className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] mb-3 font-semibold">Resilience Kits</h5>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('shop')} className="hover:text-[#FF5B35] transition-colors cursor-pointer">
                FO-01 Student Study Box
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop')} className="hover:text-[#FF5B35] transition-colors cursor-pointer">
                FO-02 Remote Worker 24/7 Box
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop')} className="hover:text-[#FF5B35] transition-colors cursor-pointer">
                FO-03 POS & Retail Merchant Box
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop')} className="hover:text-[#FF5B35] transition-colors cursor-pointer">
                FO-04 Whole-Apartment Family Box
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] mb-3 font-semibold">Tools & Analysis</h5>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('calculator')} className="hover:text-[#FF5B35] transition-colors cursor-pointer">
                Cost vs Petrol Gen Calculator
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('builder')} className="hover:text-[#FF5B35] transition-colors cursor-pointer">
                Custom Capacity Configurator
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('catalog')} className="hover:text-[#FF5B35] transition-colors cursor-pointer">
                Hardware Technical Specifications
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="font-mono text-xs uppercase tracking-wider text-[#6E6D68] mb-3 font-semibold">Contact & Support</h5>
          <p className="text-xs text-[#6E6D68] leading-relaxed mb-2">
            Engineering inquiries, bulk orders for corporate teams, or hostel cooperatives:
          </p>
          <p className="font-mono text-xs font-medium text-[#1B1B1A]">orders@fortepower.ng</p>
          <p className="font-mono text-xs text-[#6E6D68] mt-1">+234 814 900 3210</p>
        </div>
      </div>

      <div className="border-t border-[#1B1B1A]/10 py-6 px-4 md:px-8 text-center text-xs text-[#6E6D68]">
        <p>© {new Date().getFullYear()} Forte Power Systems Nigeria. All rights reserved. Zero carbon emissions.</p>
      </div>
    </footer>
  );
};

import React, { useState } from 'react';
import { PRODUCTS } from '../../data/products';
import { Product, ProductCategory } from '../../types';
import { formatNaira } from '../../lib/formatters';
import { useCart } from '../../context/CartContext';
import { SignalDot } from '../ui/SignalDot';
import { ShoppingBag, ShieldCheck, CheckCircle2, Zap, Battery, Sparkles } from 'lucide-react';

export const ProductCatalog: React.FC = () => {
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All 14 Parts' },
    { id: 'power_bank', label: 'Power Banks' },
    { id: 'usb_fan', label: 'DC / USB Fans' },
    { id: 'solar_charger', label: 'Solar Chargers' },
    { id: 'lamp', label: 'Emergency Lamps' },
    { id: 'inverter_bulb', label: 'Inverter Bulbs' },
    { id: 'cable', label: 'Cables & DC Kits' },
  ];

  const filteredProducts = selectedCategory === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === selectedCategory || (selectedCategory === 'usb_fan' && p.category === 'fan'));

  return (
    <section id="hardware-catalog" className="py-16 md:py-24 max-w-7xl mx-auto px-4 md:px-8 border-b border-[#1B1B1A]/20">
      {/* Header */}
      <div className="max-w-2xl mb-8">
        <div className="flex items-center gap-2 mb-2 font-mono text-xs uppercase tracking-wider text-[#6E6D68]">
          <SignalDot size="sm" pulsing={false} />
          <span>Forte Hardware Catalog · 14 Seeded Parts</span>
        </div>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1B1B1A] leading-tight">
          Individual resilience components.
        </h2>
        <p className="text-sm sm:text-base text-[#6E6D68] mt-2">
          Precision-tested hardware for the Nigerian power environment. Every unit is pre-calibrated, verified, and backed by a direct swap warranty.
        </p>
      </div>

      {/* Category filter buttons */}
      <div className="flex flex-wrap gap-2 mb-10 pb-2 border-b border-[#1B1B1A]/10">
        {categories.map(cat => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#1B1B1A] text-[#F5F1E8] shadow-xs'
                  : 'bg-white border border-[#1B1B1A]/20 text-[#1B1B1A] hover:bg-neutral-100'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Grid of Product Spec Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => {
          return (
            <div
              key={product.id}
              className="bg-white border border-[#1B1B1A] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#FF5B35] transition-all"
            >
              <div>
                {/* Product Image */}
                <div className="relative aspect-[16/10] bg-[#F5F1E8] overflow-hidden border-b border-[#1B1B1A]/10">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="bg-[#1B1B1A] text-[#F5F1E8] font-mono text-[10px] px-2 py-0.5 rounded">
                      {product.id}
                    </span>
                    {product.is_verified && (
                      <span className="bg-[#D9FF6B] text-[#1B1B1A] font-mono text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-[#1B1B1A]" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Details & Specs */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-display font-bold text-base text-[#1B1B1A] leading-snug">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[#6E6D68] mt-1.5 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Specification Breakdown */}
                  <div className="p-3 bg-[#F5F1E8] rounded-xl border border-[#1B1B1A]/10 space-y-1.5 text-xs">
                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                      {product.watts !== undefined && product.watts > 0 && (
                        <div className="flex items-center gap-1 text-[#1B1B1A]">
                          <Zap className="w-3 h-3 text-[#FF5B35]" />
                          <span>{product.watts} Watts</span>
                        </div>
                      )}
                      {product.battery_wh !== undefined && product.battery_wh > 0 && (
                        <div className="flex items-center gap-1 text-[#1B1B1A]">
                          <Battery className="w-3 h-3 text-[#2454E6]" />
                          <span>{product.battery_wh} Wh Battery</span>
                        </div>
                      )}
                      {product.warranty_months && (
                        <div className="flex items-center gap-1 text-[#6E6D68] col-span-2 pt-1 border-t border-[#1B1B1A]/10">
                          <ShieldCheck className="w-3 h-3 text-[#2454E6]" />
                          <span>{product.warranty_months} Months Direct Replacement Warranty</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Purchase Bar */}
              <div className="p-5 pt-0 flex items-center justify-between border-t border-[#1B1B1A]/10 mt-2">
                <div>
                  <span className="text-[10px] font-mono text-[#6E6D68] block">Naira Price:</span>
                  <span className="font-mono text-base font-bold text-[#1B1B1A]">
                    {formatNaira(product.price_naira)}
                  </span>
                </div>

                <button
                  onClick={() => addToCart(product, 1)}
                  className="px-3.5 py-2 bg-[#1B1B1A] text-[#F5F1E8] hover:bg-[#1B1B1A]/90 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#D9FF6B]" />
                  <span>Add to Bag</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

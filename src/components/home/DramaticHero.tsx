import React from 'react';
import { Product } from '../../types';
import { formatNaira } from '../../lib/formatters';
import { useCart } from '../../context/CartContext';
import { Plus, ArrowRight, ShieldCheck, Zap, Battery, Sparkles } from 'lucide-react';

interface DramaticHeroProps {
  onExploreBuilder: () => void;
  featuredProducts: Product[];
  onSelectProduct?: (product: Product) => void;
}

export const DramaticHero: React.FC<DramaticHeroProps> = ({
  onExploreBuilder,
  featuredProducts,
  onSelectProduct,
}) => {
  const { addToCart } = useCart();

  // Top 3 spotlight products for the bottom rail
  const spotlightItems = featuredProducts.slice(0, 3);

  return (
    <section className="relative overflow-hidden bg-[#131215] text-[#F5F1E8] rounded-3xl md:rounded-[36px] shadow-2xl mb-12 sm:mb-16 border border-[#2B292F]">
      
      {/* Spotlight Conical Beam Effects (inspired by Pendant Lamp inspiration) */}
      <div 
        className="absolute -top-12 left-10 md:left-24 w-72 md:w-96 h-[480px] pointer-events-none opacity-40 mix-blend-screen"
        style={{
          background: 'conic-gradient(from 180deg at 50% 0%, rgba(255, 238, 204, 0.45) 0deg, rgba(255, 220, 160, 0.15) 35deg, transparent 65deg, transparent 295deg, rgba(255, 220, 160, 0.15) 325deg, rgba(255, 238, 204, 0.45) 360deg)',
          filter: 'blur(18px)',
        }}
      />
      <div 
        className="absolute -top-16 right-10 md:right-28 w-80 md:w-[420px] h-[520px] pointer-events-none opacity-35 mix-blend-screen"
        style={{
          background: 'conic-gradient(from 180deg at 50% 0%, rgba(255, 240, 215, 0.4) 0deg, rgba(255, 210, 150, 0.12) 30deg, transparent 60deg, transparent 300deg, rgba(255, 210, 150, 0.12) 330deg, rgba(255, 240, 215, 0.4) 360deg)',
          filter: 'blur(22px)',
        }}
      />

      {/* Hanging Pendant Lamp Graphic Fixtures */}
      <div className="absolute top-0 left-16 md:left-32 flex flex-col items-center pointer-events-none z-10 animate-pendant-swing">
        <div className="w-[1.5px] h-20 md:h-28 bg-gradient-to-b from-neutral-600 to-neutral-400" />
        <div className="w-12 h-10 md:w-16 md:h-12 bg-gradient-to-b from-[#EAE6DF] to-[#D5CFC5] rounded-t-full shadow-lg relative flex items-end justify-center pb-0.5">
          <div className="w-8 h-2 md:w-11 md:h-2.5 bg-[#FFF4DC] rounded-full blur-[1px] shadow-[0_0_15px_#FFE7B3] animate-bulb-glow" />
        </div>
      </div>

      <div className="absolute top-0 right-14 md:right-36 flex flex-col items-center pointer-events-none z-10 hidden sm:flex animate-pendant-swing-delayed">
        <div className="w-[1.5px] h-24 md:h-36 bg-gradient-to-b from-neutral-600 to-neutral-400" />
        <div className="w-16 h-11 md:w-20 md:h-14 bg-gradient-to-b from-[#2E2B33] to-[#1C1A20] rounded-t-full border-t border-neutral-600 shadow-xl relative flex items-end justify-center pb-0.5">
          <div className="w-10 h-2 md:w-14 md:h-2.5 bg-[#FFE1A8] rounded-full blur-[2px] shadow-[0_0_20px_#FFCC80] animate-bulb-glow" />
        </div>
      </div>

      {/* Vertical Brand Watermark Label (left edge) */}
      <div className="hidden lg:flex absolute left-6 bottom-32 -rotate-90 origin-left items-center gap-3 text-[10px] font-mono tracking-[0.3em] uppercase text-neutral-400 pointer-events-none">
        <span>Forte Power</span>
        <span className="w-6 h-[1px] bg-neutral-600" />
        <span>Blackout Resilience</span>
      </div>

      {/* Main Hero Content */}
      <div className="relative z-20 px-6 sm:px-10 lg:px-16 pt-32 sm:pt-40 pb-12 md:pb-16 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Dual-Tone Display Headline (inspired by "Lighting Up Creative Minds") */}
        <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.08] max-w-4xl">
          <span className="text-white block">Lighting Up</span>
          <span className="text-[#D4B895] italic font-serif font-normal block mt-1">
            Resilient Minds.
          </span>
        </h1>

        {/* Editorial Subtitle */}
        <p className="mt-5 text-sm sm:text-base text-neutral-300 max-w-xl font-normal leading-relaxed">
          Zero petrol exhaust. Zero noise. When the national grid collapses, our custom lithium and DC kits keep your workstation, fans, and light alive.
        </p>

        {/* Floating Spec Pill Badge (inspired by `$ 79.99 • Ø 300 cm [+]`) */}
        <div className="mt-8 inline-flex items-center gap-3.5 bg-[#232128]/90 backdrop-blur-md border border-[#3D3A44] hover:border-[#D4B895]/50 px-5 py-2.5 rounded-full text-xs font-mono transition-all shadow-xl group">
          <span className="text-white font-bold tracking-tight text-sm">
            {formatNaira(118275)}
          </span>
          <span className="text-neutral-500">•</span>
          <span className="text-neutral-300 flex items-center gap-1">
            <Battery className="w-3.5 h-3.5 text-[#2454E6]" />
            222 Wh Backup
          </span>
          <span className="text-neutral-500">•</span>
          <span className="text-[#D4B895]">16h Silent Run</span>
          
          <button
            onClick={onExploreBuilder}
            className="w-7 h-7 rounded-full bg-[#D4B895] hover:bg-white text-[#131215] flex items-center justify-center transition-all ml-1 cursor-pointer"
            title="Configure in 3-Step Builder"
            aria-label="Configure in 3-Step Builder"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Hero Section: Ambient Stat & Featured Product Cards (inspired by bottom rail) */}
        <div className="w-full mt-14 sm:mt-18 pt-8 border-t border-[#26242B] flex flex-col lg:flex-row items-center justify-between gap-8 text-left">
          
          {/* Bottom-left Stat Callout (inspired by "27% Energy-efficient light bulbs installed") */}
          <div className="shrink-0 max-w-xs space-y-1">
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-white">
              78<span className="text-[#D4B895]">%</span>
            </div>
            <p className="text-xs text-neutral-400 font-mono leading-tight">
              Average reduction in monthly generator petrol expenditure for remote workers.
            </p>
          </div>

          {/* Featured Cards Rail (inspired by bottom white cards with thumbnails and (+) buttons) */}
          <div className="w-full lg:w-auto flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {spotlightItems.map(item => (
              <div
                key={item.id}
                className="bg-white text-[#1B1B1A] rounded-2xl p-3.5 shadow-lg flex items-center justify-between gap-3 border border-neutral-200 hover:border-[#D4B895] transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover bg-neutral-50 border border-neutral-100 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase block truncate">
                      {item.category.replace('_', ' ')}
                    </span>
                    <h4 className="text-xs font-bold text-[#1B1B1A] truncate group-hover:text-[#FF5B35] transition-colors">
                      {item.short_name || item.name}
                    </h4>
                    <span className="font-mono text-xs font-extrabold text-[#1B1B1A] block mt-0.5">
                      {formatNaira(item.price_naira)}
                    </span>
                  </div>
                </div>

                {/* Circular Action Button (+) */}
                <button
                  onClick={() => addToCart(item, 1)}
                  className="w-8 h-8 rounded-full bg-[#1B1B1A] hover:bg-[#FF5B35] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-[#FF5B35]"
                  aria-label={`Add ${item.name} to cart`}
                  title="Add item to kit bag"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

        </div>

      </div>

    </section>
  );
};

import React from 'react';
import { Product, CartItem } from '../../types';
import { formatNaira } from '../../lib/formatters';
import { X, RefreshCw, Check, Zap, Battery, ShieldCheck } from 'lucide-react';

interface SwapItemModalProps {
  itemToSwap: CartItem | null;
  catalog: Product[];
  onClose: () => void;
  onConfirmSwap: (cartItemId: string, replacement: Product) => void;
}

export const SwapItemModal: React.FC<SwapItemModalProps> = ({
  itemToSwap,
  catalog,
  onClose,
  onConfirmSwap,
}) => {
  if (!itemToSwap) return null;

  const currentProduct = itemToSwap.product;

  // Filter catalog products of matching category, excluding the current product
  const categoryToMatch = currentProduct.category === 'usb_fan' ? 'fan' : currentProduct.category;
  
  const alternatives = catalog.filter(p => {
    if (p.id === currentProduct.id) return false;
    const cat = p.category === 'usb_fan' ? 'fan' : p.category;
    return cat === categoryToMatch || p.category === currentProduct.category;
  });

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-[#F5F1E8] border border-[#1B1B1A] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#1B1B1A]/10 pb-4">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#6E6D68] block">
              Customize Kit Component
            </span>
            <h3 className="font-display font-bold text-xl text-[#1B1B1A] mt-0.5">
              Swap "{currentProduct.short_name}"
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#6E6D68] hover:text-[#1B1B1A] hover:bg-black/5 rounded-lg cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Selection summary */}
        <div className="p-3.5 bg-white border border-[#1B1B1A]/15 rounded-2xl flex items-center gap-3">
          <img
            src={currentProduct.image_url}
            alt={currentProduct.name}
            className="w-12 h-12 rounded-xl object-cover bg-[#F5F1E8] border border-[#1B1B1A]/10 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-mono text-[#6E6D68] block">Currently in kit:</span>
            <p className="text-xs font-bold text-[#1B1B1A] truncate">{currentProduct.name}</p>
            <span className="text-xs font-mono font-bold text-[#1B1B1A]">
              {formatNaira(currentProduct.price_naira)}
            </span>
          </div>
        </div>

        {/* Alternatives List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <span className="text-xs font-mono uppercase text-[#6E6D68] font-semibold block">
            Compatible Alternatives ({alternatives.length}):
          </span>

          {alternatives.length === 0 ? (
            <p className="text-xs text-[#6E6D68] py-8 text-center">
              No alternative components found in this hardware category.
            </p>
          ) : (
            alternatives.map(alt => {
              const priceDiff = alt.price_naira - currentProduct.price_naira;
              const isMore = priceDiff > 0;
              const isSame = priceDiff === 0;

              return (
                <div
                  key={alt.id}
                  className="p-4 bg-white border border-[#1B1B1A]/15 hover:border-[#1B1B1A] rounded-2xl flex items-center justify-between gap-3.5 transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={alt.image_url}
                      alt={alt.name}
                      className="w-12 h-12 rounded-xl object-cover bg-[#F5F1E8] border border-[#1B1B1A]/10 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1B1B1A] truncate group-hover:text-[#FF5B35] transition-colors">
                        {alt.name}
                      </p>
                      
                      {/* Specs pills */}
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#6E6D68]">
                        {alt.watts !== undefined && alt.watts > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 text-[#FF5B35]" />
                            {alt.watts}W
                          </span>
                        )}
                        {alt.battery_wh !== undefined && alt.battery_wh > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Battery className="w-2.5 h-2.5 text-[#2454E6]" />
                            {alt.battery_wh}Wh
                          </span>
                        )}
                        <span>{formatNaira(alt.price_naira)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1.5">
                    <span
                      className={`text-[11px] font-mono font-bold block ${
                        isSame
                          ? 'text-[#6E6D68]'
                          : isMore
                          ? 'text-[#1B1B1A]'
                          : 'text-[#2454E6]'
                      }`}
                    >
                      {isSame ? 'Same price' : isMore ? `+${formatNaira(priceDiff)}` : `-${formatNaira(Math.abs(priceDiff))}`}
                    </span>

                    <button
                      onClick={() => onConfirmSwap(itemToSwap.id, alt)}
                      className="px-3 py-1 bg-[#1B1B1A] text-[#F5F1E8] hover:bg-[#1B1B1A]/90 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 text-[#D9FF6B]" />
                      <span>Swap</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { formatNaira } from '../../lib/formatters';
import { SignalDot } from '../ui/SignalDot';
import { SwapItemModal } from './SwapItemModal';
import { PRODUCTS } from '../../data/products';
import { CartItem, Product } from '../../types';
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag, RefreshCw, Layers, Truck, CheckCircle2, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
  onNavigateToCheckout: () => void;
  catalog?: Product[];
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigateToCheckout, catalog = PRODUCTS }) => {
  const {
    items,
    groupedItems,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    swapItem,
    subtotalNaira,
    discountNaira,
    shippingFeeNaira,
    totalNaira,
    discountPercent,
  } = useCart();

  const [itemToSwap, setItemToSwap] = useState<CartItem | null>(null);

  if (!isCartOpen) return null;

  const handleSwapConfirm = (cartItemId: string, replacement: Product) => {
    swapItem(cartItemId, replacement);
    setItemToSwap(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-[#F5F1E8] border-l border-[#1B1B1A] flex flex-col shadow-2xl">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#1B1B1A]/15 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#1B1B1A]" />
                <h3 className="font-display font-bold text-lg text-[#1B1B1A]">Kit Bag</h3>
                <SignalDot size="sm" pulsing={items.length > 0} />
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg text-[#6E6D68] hover:text-[#1B1B1A] hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Close cart drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List Grouped by Kit */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {items.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#1B1B1A]/5 flex items-center justify-center mx-auto text-[#6E6D68]">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <p className="font-display font-semibold text-base text-[#1B1B1A]">Your kit bag is empty</p>
                  <p className="text-xs text-[#6E6D68] max-w-xs mx-auto">
                    Configure your power requirements with the 3-step builder to generate a tailored resilience kit.
                  </p>
                </div>
              ) : (
                groupedItems.map(group => (
                  <div key={group.kitId} className="space-y-2.5">
                    
                    {/* Kit Header */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#1B1B1A] uppercase tracking-wider">
                        <Layers className="w-3.5 h-3.5 text-[#2454E6]" />
                        <span>{group.kitName}</span>
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#6E6D68]">
                        {formatNaira(group.subtotal)}
                      </span>
                    </div>

                    {/* Group Items */}
                    <div className="space-y-2.5">
                      {group.items.map(item => (
                        <div
                          key={item.id}
                          className="p-3.5 bg-white border border-[#1B1B1A]/15 rounded-2xl flex items-center gap-3.5 shadow-2xs"
                        >
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-14 h-14 object-cover rounded-xl bg-[#F5F1E8] border border-[#1B1B1A]/10 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-[#1B1B1A] truncate">
                              {item.product.short_name || item.product.name}
                            </h4>
                            <p className="font-mono text-xs font-semibold text-[#1B1B1A] mt-0.5">
                              {formatNaira(item.product.price_naira * item.quantity)}
                            </p>

                            {/* Stepper, Swap & Trash Controls */}
                            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                              {/* Quantity Stepper (44px tap targets) */}
                              <div className="flex items-center border border-[#1B1B1A]/20 rounded-xl bg-[#F5F1E8] overflow-hidden">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-11 h-11 flex items-center justify-center hover:bg-neutral-200 text-[#1B1B1A] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#FF5B35] focus-visible:outline-none"
                                  aria-label={`Decrease quantity of ${item.product.name}`}
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono text-xs px-2.5 font-bold min-w-[24px] text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-11 h-11 flex items-center justify-center hover:bg-neutral-200 text-[#1B1B1A] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#FF5B35] focus-visible:outline-none"
                                  aria-label={`Increase quantity of ${item.product.name}`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Swap item button (44px tap target) */}
                              <button
                                onClick={() => setItemToSwap(item)}
                                className="h-11 px-3 text-xs font-mono text-[#2454E6] hover:bg-blue-50 border border-blue-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#FF5B35] focus-visible:outline-none"
                                title={`Swap ${item.product.name} with alternative product of same type`}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Swap</span>
                              </button>

                              {/* Remove item (44px tap target) */}
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="w-11 h-11 flex items-center justify-center text-[#55544E] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors ml-auto cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                                aria-label={`Remove ${item.product.name} from kit bag`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                ))
              )}

              {/* How We Deliver Block */}
              {items.length > 0 && (
                <div className="p-4 bg-white border border-[#1B1B1A]/15 rounded-2xl space-y-3 mt-4 text-[#1B1B1A]">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#1B1B1A]">
                    <Truck className="w-4 h-4 text-[#2454E6]" />
                    <span>How We Deliver Across Nigeria</span>
                  </div>

                  {/* Time Ranges */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[#F5F1E8] p-2.5 rounded-xl border border-[#1B1B1A]/10">
                    <div>
                      <span className="text-[#6E6D68] block">Lagos & Abuja:</span>
                      <strong className="text-[#1B1B1A]">24 – 48 Hours</strong>
                    </div>
                    <div>
                      <span className="text-[#6E6D68] block">Major State Capitals:</span>
                      <strong className="text-[#1B1B1A]">2 – 3 Days</strong>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-[#1B1B1A]/10">
                      <span className="text-[#6E6D68]">Other Nationwide Towns: </span>
                      <strong className="text-[#1B1B1A]">3 – 5 Days (Tracked Waybill)</strong>
                    </div>
                  </div>

                  {/* Inspection on Delivery Guarantee */}
                  <div className="flex items-start gap-2 pt-1 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#FF5B35] shrink-0 mt-0.5" />
                    <p className="leading-relaxed text-[#1B1B1A]/85">
                      <strong className="text-[#1B1B1A]">Rider waits while you inspect:</strong> Open the package, check the anti-tamper security seal, and plug in your phone/laptop to test charging before completing payment or signing off.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer & Checkout Action */}
            {items.length > 0 && (
              <div className="p-5 bg-white border-t border-[#1B1B1A]/15 space-y-3">
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-[#6E6D68]">
                    <span>Hardware Subtotal:</span>
                    <span>{formatNaira(subtotalNaira)}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-[#2454E6]">
                      <span>Bundle Discount ({discountPercent}%):</span>
                      <span>-{formatNaira(discountNaira)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#6E6D68]">
                    <span>Nationwide Express:</span>
                    <span className="text-[#1B1B1A]">
                      {shippingFeeNaira === 0 ? 'FREE' : formatNaira(shippingFeeNaira)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-[#1B1B1A]/10 font-bold text-base text-[#1B1B1A]">
                    <span>Total Amount:</span>
                    <span className="font-display text-xl font-extrabold">{formatNaira(totalNaira)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onNavigateToCheckout();
                  }}
                  className="w-full py-4 px-4 bg-[#1B1B1A] hover:bg-[#1B1B1A]/90 text-[#F5F1E8] font-bold text-sm rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>Proceed to Dedicated Checkout</span>
                  <ArrowRight className="w-4 h-4 text-[#D9FF6B]" />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Item Swap Modal */}
      <SwapItemModal
        itemToSwap={itemToSwap}
        catalog={catalog}
        onClose={() => setItemToSwap(null)}
        onConfirmSwap={handleSwapConfirm}
      />
    </>
  );
};

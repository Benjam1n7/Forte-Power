import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, PredefinedKit, CartItem } from '../types';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface GroupedCart {
  kitId: string;
  kitName: string;
  items: CartItem[];
  subtotal: number;
}

interface CartContextType {
  items: CartItem[];
  groupedItems: GroupedCart[];
  isCartOpen: boolean;
  activeKitId: string | null;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, kitId?: string, kitName?: string) => void;
  addKitToCart: (kit: PredefinedKit) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  swapItem: (cartItemId: string, replacementProduct: Product) => void;
  clearCart: () => void;
  totalItemCount: number;
  subtotalNaira: number;
  discountNaira: number;
  shippingFeeNaira: number;
  totalNaira: number;
  discountPercent: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('forte_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeKitId, setActiveKitId] = useState<string | null>(() => {
    return localStorage.getItem('forte_active_kit_id') || null;
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // 1. Load cart from Supabase if user signs in
  useEffect(() => {
    if (user && isSupabaseConfigured) {
      supabase
        .from('carts')
        .select('items')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data?.items && Array.isArray(data.items) && data.items.length > 0) {
            setItems(data.items);
          }
        });
    }
  }, [user]);

  // 2. Persist cart to localStorage + Supabase on update
  useEffect(() => {
    try {
      localStorage.setItem('forte_cart_items', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }

    // Persist to Supabase if signed in
    if (user && isSupabaseConfigured) {
      supabase
        .from('carts')
        .upsert(
          {
            user_id: user.id,
            items: items,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .then(({ error }) => {
          if (error) console.warn('Supabase cart sync notice:', error.message);
        });
    }
  }, [items, user]);

  useEffect(() => {
    if (activeKitId) {
      localStorage.setItem('forte_active_kit_id', activeKitId);
    } else {
      localStorage.removeItem('forte_active_kit_id');
    }
  }, [activeKitId]);

  const addToCart = (
    product: Product,
    quantity = 1,
    kitId: string = 'standalone',
    kitName: string = 'Individual Hardware'
  ) => {
    setItems(prevItems => {
      // Check if this exact product is already in the same kit group
      const existingIndex = prevItems.findIndex(
        item => item.productId === product.id && (item.kitId || 'standalone') === kitId
      );

      if (existingIndex > -1) {
        const copy = [...prevItems];
        copy[existingIndex].quantity += quantity;
        return copy;
      }

      return [
        ...prevItems,
        {
          id: `item_${product.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          product,
          quantity,
          kitId,
          kitName,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const addKitToCart = (kit: PredefinedKit) => {
    setActiveKitId(kit.id);
    // Pre-populate items tagged with this kit
    setItems(prev => {
      // Remove previous items from this kit if any, to cleanly replace
      const filtered = prev.filter(i => i.kitId !== kit.id);
      const newKitItems: CartItem[] = [];

      kit.items.forEach(({ productId, quantity }) => {
        // Will be matched with real product from catalog
        const dummyProd: Product = {
          id: productId,
          name: productId,
          short_name: productId,
          category: 'power_bank',
          description: '',
          price_naira: 0,
          specifications: {},
          image_url: '',
          stock_quantity: 100,
        };
        newKitItems.push({
          id: `kit_${kit.id}_${productId}_${Date.now()}`,
          productId,
          product: dummyProd,
          quantity,
          kitId: kit.id,
          kitName: kit.name,
        });
      });

      return [...filtered, ...newKitItems];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setItems(prev =>
      prev.map(item => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setItems(prev => prev.filter(item => item.id !== cartItemId));
  };

  // Swap an item in a kit for an alternative of the same category
  const swapItem = (cartItemId: string, replacementProduct: Product) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== cartItemId) return item;
        return {
          ...item,
          productId: replacementProduct.id,
          product: replacementProduct,
        };
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setActiveKitId(null);
    localStorage.removeItem('forte_cart_items');
    localStorage.removeItem('forte_active_kit_id');

    if (user && isSupabaseConfigured) {
      supabase.from('carts').delete().eq('user_id', user.id).then();
    }
  };

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotalNaira = items.reduce(
    (sum, item) => sum + item.product.price_naira * item.quantity,
    0
  );

  // Group items by kit
  const groupedMap = new Map<string, GroupedCart>();
  items.forEach(item => {
    const kId = item.kitId || 'standalone';
    const kName = item.kitName || (kId === 'standalone' ? 'Individual Parts' : 'Resilience Kit');
    if (!groupedMap.has(kId)) {
      groupedMap.set(kId, {
        kitId: kId,
        kitName: kName,
        items: [],
        subtotal: 0,
      });
    }
    const group = groupedMap.get(kId)!;
    group.items.push(item);
    group.subtotal += item.product.price_naira * item.quantity;
  });

  const groupedItems = Array.from(groupedMap.values());

  // 5% bundle discount if kit present or 3+ items
  const hasBundle = items.some(i => i.kitId && i.kitId !== 'standalone') || items.length >= 3;
  const discountPercent = hasBundle ? 5 : 0;
  const discountNaira = Math.round((subtotalNaira * discountPercent) / 100);
  const shippingFeeNaira = subtotalNaira >= 150000 || subtotalNaira === 0 ? 0 : 3500;
  const totalNaira = Math.max(0, subtotalNaira - discountNaira + shippingFeeNaira);

  return (
    <CartContext.Provider
      value={{
        items,
        groupedItems,
        isCartOpen,
        activeKitId,
        setIsCartOpen,
        addToCart,
        addKitToCart,
        updateQuantity,
        removeFromCart,
        swapItem,
        clearCart,
        totalItemCount,
        subtotalNaira,
        discountNaira,
        shippingFeeNaira,
        totalNaira,
        discountPercent,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

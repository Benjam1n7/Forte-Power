import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { CartItem, GroupedCart, Product } from '../lib/types';
import { useAuth } from './AuthContext';

/**
 * Persistent cart synchronised with the Forte website.
 *
 * Data model: identical to the website — a single row in the Supabase
 * `carts` table per authenticated user (`user_id` unique), `items` JSONB
 * holding the same CartItem shape the web CartContext writes, protected by
 * the existing Row Level Security policies (no service-role key is used).
 *
 * Consistency strategy:
 *  - Local changes are applied optimistically and pushed to Supabase through
 *    a single-flight write queue that always writes the *latest* snapshot
 *    (queued writes collapse), so a slow stale write can never overwrite a
 *    newer state.
 *  - A cart read is only applied when no local change happened while the
 *    read was in flight (mutation-epoch guard) and after any pending local
 *    write has been flushed (or the read is skipped entirely when offline).
 *  - On the first read after sign-in, server cart and local cart are merged
 *    with per-key quantity maxima so neither side's items are silently lost
 *    or duplicated; the merged result is pushed back.
 *  - Cross-device updates are picked up when the app regains focus or the
 *    app returns to the foreground, plus after every local mutation (push).
 *    This is NOT push-based real-time: the website's database schema does
 *    not add `carts` to the Supabase Realtime publication.
 */

const LOCAL_CART_KEY = 'forte_cart_items';

export type CartSyncState =
  | 'loading'
  | 'synced'
  | 'local-only'
  | 'offline'
  | 'error';

interface CartContextType {
  items: CartItem[];
  groupedItems: GroupedCart[];
  /** True while the initial local load or a sign-in hydration is running. */
  loading: boolean;
  /** True while a server read/write is in flight. */
  syncing: boolean;
  syncState: CartSyncState;
  syncError: string | null;
  lastSyncedAt: number | null;
  addToCart: (product: Product, quantity?: number, kitId?: string, kitName?: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  /** Refetch the server cart (pull-to-refresh, focus, manual retry). */
  refreshCart: () => Promise<void>;
  totalItemCount: number;
  subtotalNaira: number;
  discountNaira: number;
  shippingFeeNaira: number;
  totalNaira: number;
  discountPercent: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/** Drop malformed entries and merge duplicates by (productId, kitId). */
function normalizeItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const merged = new Map<string, CartItem>();
  for (const entry of raw as CartItem[]) {
    if (!entry || typeof entry !== 'object') continue;
    if (typeof entry.productId !== 'string' || !entry.productId) continue;
    const quantity = Math.max(1, Math.floor(Number(entry.quantity) || 1));
    const kitId = entry.kitId || 'standalone';
    const key = `${entry.productId}::${kitId}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += quantity;
    } else {
      merged.set(key, {
        ...entry,
        quantity,
        kitId,
        product:
          entry.product && typeof entry.product === 'object'
            ? entry.product
            : ({
                id: entry.productId,
                name: entry.productId,
                short_name: entry.productId,
                category: 'power_bank',
                description: '',
                specifications: {},
                price_naira: 0,
                image_url: '',
                stock_quantity: 100,
              } as Product),
      });
    }
  }
  return Array.from(merged.values());
}

function itemKey(item: CartItem): string {
  return `${item.productId}::${item.kitId || 'standalone'}`;
}

/**
 * Initial sign-in merge: the server cart (freshest cross-device state) is the
 * base; local-only items are appended; matching keys keep the higher quantity
 * so neither an increase made on the website nor one made on the device is
 * dropped. Result is duplicate-free.
 */
function mergeCarts(server: CartItem[], local: CartItem[]): CartItem[] {
  if (server.length === 0) return local;
  if (local.length === 0) return server;
  const merged = server.map((item) => ({ ...item }));
  const indexByKey = new Map(merged.map((item, i) => [itemKey(item), i]));
  for (const localItem of local) {
    const idx = indexByKey.get(itemKey(localItem));
    if (idx === undefined) {
      indexByKey.set(itemKey(localItem), merged.length);
      merged.push({ ...localItem });
    } else {
      merged[idx] = {
        ...merged[idx],
        quantity: Math.max(merged[idx].quantity, localItem.quantity),
      };
    }
  }
  return merged;
}
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [items, setItemsState] = useState<CartItem[]>([]);
  const [localReady, setLocalReady] = useState(false);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const [settledUserId, setSettledUserId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncState, setSyncState] = useState<CartSyncState>('loading');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const itemsRef = useRef<CartItem[]>([]);
  const userRef = useRef(user);
  userRef.current = user;
  const hydratedForRef = useRef<string | null>(null);
  const pushQueueRef = useRef<CartItem[] | null>(null);
  const pushingRef = useRef(false);
  const mutationEpochRef = useRef(0);
  const refreshInFlightRef = useRef<Promise<boolean> | null>(null);
  const hydrationRetryRef = useRef(0);
  const lastAutoRefreshRef = useRef(0);
  const refreshFnRef = useRef<() => Promise<boolean>>(async () => false);
  const drainFnRef = useRef<() => Promise<void>>(async () => undefined);

  const applyItems = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    setItemsState(next);
  }, []);

  const persistLocal = useCallback((next: CartItem[]) => {
    AsyncStorage.setItem(LOCAL_CART_KEY, JSON.stringify(next)).catch((err) =>
      console.warn('Failed to save cart to local storage', err)
    );
  }, []);

  /**
   * Single-flight write loop. The queue only ever holds the newest snapshot
   * (writes collapse), so a slow request can never persist stale state over
   * a newer one. Writes run only after the user's server cart was hydrated.
   */
  const drainPushes = useCallback(async (): Promise<void> => {
    if (pushingRef.current) return;
    const uid = userRef.current?.id;
    if (!uid || !isSupabaseConfigured) return;
    if (hydratedForRef.current !== uid) return; // hydration decides what to push
    pushingRef.current = true;
    setSyncing(true);
    try {
      while (pushQueueRef.current && userRef.current?.id === uid) {
        const payload = pushQueueRef.current;
        pushQueueRef.current = null;
        const { error } = await supabase.from('carts').upsert(
          {
            user_id: uid,
            items: payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
        if (error) {
          // Keep the newest snapshot queued for a later retry.
          if (!pushQueueRef.current) pushQueueRef.current = payload;
          setSyncError(`Cart changes are not synced yet: ${error.message}`);
          setSyncState('offline');
          break;
        }
        setSyncError(null);
        setSyncState('synced');
        setLastSyncedAt(Date.now());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network unavailable.';
      setSyncError(`Cart changes are not synced yet: ${message}`);
      setSyncState('offline');
    } finally {
      pushingRef.current = false;
      setSyncing(false);
    }
  }, []);
  /**
   * Reads the user's server cart. Applies it only when it is safe to do so:
   * pending local writes are flushed first (read skipped if that fails), and
   * a read is discarded when a local mutation happened while it was in
   * flight. The first read for a user performs the sign-in merge of the
   * server cart with the device-local cart (no items lost, no duplicates).
   */
  const refresh = useCallback(async (): Promise<boolean> => {
    const uid = userRef.current?.id;
    if (!uid || !isSupabaseConfigured) return false;
    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    const run = (async () => {
      setSyncing(true);
      let settled = false;
      try {
        const isFirstHydration = hydratedForRef.current !== uid;
        if (!isFirstHydration) {
          // Flush local changes first so an older server read can never
          // overwrite newer local state.
          if (pushQueueRef.current || pushingRef.current) {
            await drainPushes();
            if (pushQueueRef.current) {
              setSyncState('offline');
              return false; // offline: keep newer local state
            }
          }
        }

        const epoch = mutationEpochRef.current;
        const { data, error } = await supabase
          .from('carts')
          .select('items, updated_at')
          .eq('user_id', uid)
          .maybeSingle();

        if (error) {
          setSyncError(`Could not load your saved cart: ${error.message}`);
          setSyncState('offline');
          settled = true; // hydration attempt finished (failed) — stop loading
          return false;
        }

        if (mutationEpochRef.current !== epoch) {
          // Local state changed while reading — discard this stale response
          // and retry shortly so hydration still completes.
          if (isFirstHydration && hydrationRetryRef.current < 3) {
            hydrationRetryRef.current += 1;
            setTimeout(() => void refreshFnRef.current(), 400);
            return false;
          }
          if (isFirstHydration) {
            setSyncError('Cart sync was interrupted. Pull down to refresh.');
            setSyncState('error');
            settled = true;
          }
          return false;
        }

        const serverItems = normalizeItems(data?.items);
        const localItems = itemsRef.current;
        const next = isFirstHydration ? mergeCarts(serverItems, localItems) : serverItems;

        hydratedForRef.current = uid;
        applyItems(next);
        persistLocal(next);

        // Any queued pre-hydration snapshot is superseded by the merged one.
        pushQueueRef.current = null;
        if (JSON.stringify(next) !== JSON.stringify(serverItems)) {
          pushQueueRef.current = next;
          void drainPushes();
        }

        setSyncError(null);
        setSyncState('synced');
        setLastSyncedAt(Date.now());
        hydrationRetryRef.current = 0;
        settled = true;
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network unavailable.';
        setSyncError(`Could not load your saved cart: ${message}`);
        setSyncState('offline');
        settled = true;
        return false;
      } finally {
        setSyncing(false);
        setHydratedUserId(hydratedForRef.current);
        if (settled) setSettledUserId(uid);
      }
    })();

    refreshInFlightRef.current = run.finally(() => {
      refreshInFlightRef.current = null;
    });
    return refreshInFlightRef.current;
  }, [applyItems, persistLocal, drainPushes]);

  refreshFnRef.current = refresh;
  drainFnRef.current = drainPushes;
  /** Applies a local change, caches it, and queues a server push. */
  const commitItems = useCallback(
    (next: CartItem[]) => {
      mutationEpochRef.current += 1;
      applyItems(next);
      persistLocal(next);
      if (userRef.current && isSupabaseConfigured) {
        pushQueueRef.current = next;
        void drainFnRef.current();
      }
    },
    [applyItems, persistLocal]
  );

  const addToCart = useCallback(
    (
      product: Product,
      quantity = 1,
      kitId: string = 'standalone',
      kitName: string = 'Individual Hardware'
    ) => {
      const prev = itemsRef.current;
      // Same rule as the website: one entry per product per kit group;
      // adding again increments the quantity instead of duplicating rows.
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && (item.kitId || 'standalone') === kitId
      );
      if (existingIndex > -1) {
        commitItems(
          prev.map((item, i) =>
            i === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
          )
        );
        return;
      }
      commitItems([
        ...prev,
        {
          id: `item_${product.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          product,
          quantity,
          kitId,
          kitName,
        },
      ]);
    },
    [commitItems]
  );

  const updateQuantity = useCallback(
    (cartItemId: string, quantity: number) => {
      if (quantity <= 0) {
        commitItems(itemsRef.current.filter((item) => item.id !== cartItemId));
        return;
      }
      commitItems(
        itemsRef.current.map((item) =>
          item.id === cartItemId ? { ...item, quantity } : item
        )
      );
    },
    [commitItems]
  );

  const removeFromCart = useCallback(
    (cartItemId: string) => {
      commitItems(itemsRef.current.filter((item) => item.id !== cartItemId));
    },
    [commitItems]
  );

  const clearCart = useCallback(() => {
    commitItems([]);
  }, [commitItems]);

  /** Public refetch: pull-to-refresh, focus, error retry. */
  const refreshCart = useCallback(async () => {
    await refreshFnRef.current();
  }, []);

  // 1. Restore the device-local cart on cold start (works signed-out too).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LOCAL_CART_KEY);
        if (saved && !cancelled) {
          const parsed = normalizeItems(JSON.parse(saved));
          itemsRef.current = parsed;
          setItemsState(parsed);
        }
      } catch (err) {
        console.warn('Failed to restore local cart', err);
      } finally {
        if (!cancelled) setLocalReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Hydrate the shared server cart when the user signs in (or on app
  //    start with an existing session); reset sync state on sign-out.
  useEffect(() => {
    const uid = user?.id ?? null;
    if (!uid) {
      hydratedForRef.current = null;
      pushQueueRef.current = null;
      hydrationRetryRef.current = 0;
      setHydratedUserId(null);
      setSettledUserId(null);
      if (isSupabaseConfigured) setSyncState('local-only');
      return;
    }
    if (hydratedForRef.current === uid || refreshInFlightRef.current) return;
    setSyncState('loading');
    void refreshFnRef.current();
  }, [user?.id]);

  // 3. Revalidate when the app returns to the foreground so changes made on
  //    the other platform are picked up automatically (throttled).
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (!userRef.current) return;
      const now = Date.now();
      if (now - lastAutoRefreshRef.current < 3000) return;
      lastAutoRefreshRef.current = now;
      void refreshFnRef.current();
    });
    return () => subscription.remove();
  }, []);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotalNaira = items.reduce(
    (sum, item) => sum + item.product.price_naira * item.quantity,
    0
  );

  // Group items by kit — identical logic to the website CartContext.
  const groupedMap = new Map<string, GroupedCart>();
  items.forEach((item) => {
    const kId = item.kitId || 'standalone';
    const kName =
      item.kitName || (kId === 'standalone' ? 'Individual Parts' : 'Resilience Kit');
    if (!groupedMap.has(kId)) {
      groupedMap.set(kId, { kitId: kId, kitName: kName, items: [], subtotal: 0 });
    }
    const group = groupedMap.get(kId)!;
    group.items.push(item);
    group.subtotal += item.product.price_naira * item.quantity;
  });
  const groupedItems = Array.from(groupedMap.values());

  // 5% bundle discount if a kit is present or 3+ line items — same rule as
  // the website cart. (Checkout totals are recalculated server-side.)
  const hasBundle =
    items.some((i) => i.kitId && i.kitId !== 'standalone') || items.length >= 3;
  const discountPercent = hasBundle ? 5 : 0;
  const discountNaira = Math.round((subtotalNaira * discountPercent) / 100);
  const shippingFeeNaira =
    subtotalNaira >= 150000 || subtotalNaira === 0 ? 0 : 3500;
  const totalNaira = Math.max(0, subtotalNaira - discountNaira + shippingFeeNaira);

  const loading =
    !localReady || (!!user && settledUserId !== user.id && hydratedUserId !== user.id);

  const value: CartContextType = {
    items,
    groupedItems,
    loading,
    syncing,
    syncState: !user && isSupabaseConfigured && settledUserId === null && !loading ? 'local-only' : syncState,
    syncError,
    lastSyncedAt,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
    totalItemCount,
    subtotalNaira,
    discountNaira,
    shippingFeeNaira,
    totalNaira,
    discountPercent,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};





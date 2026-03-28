"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useState,
} from "react";
import type { CartItem, Product } from "@/types";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import {
  CART_OWNER_STORAGE_KEY,
  CART_STORAGE_KEY,
  readStoredCartItems,
  readStoredCartOwner,
  sanitizeCartItems,
  writeStoredCartItems,
} from "@/lib/cart/shared";

type CartMode = "guest" | "account";

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  refresh: () => Promise<void>;
  subtotal: number;
  itemCount: number;
  mode: CartMode;
  isHydrating: boolean;
  isSyncing: boolean;
  syncError: string | null;
  accountSyncAvailable: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { supabaseUser } = useAuth();
  const accountSyncAvailable = createClient() !== null;
  const [items, setItems] = useState<CartItem[]>(() => readStoredCartItems());
  const [mode, setMode] = useState<CartMode>("guest");
  const [isHydrating, setIsHydrating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const skipNextAccountSyncRef = useRef(false);
  const skipNextStorageWriteRef = useRef(false);
  const accountCartReadyRef = useRef(false);

  const loadAccountCart = useCallback(
    async (opts?: { mergeGuestItems?: CartItem[] }) => {
      if (!supabaseUser || !accountSyncAvailable) {
        accountCartReadyRef.current = false;
        setMode("guest");
        return;
      }

      setIsHydrating(true);
      setSyncError(null);

      try {
        const response = await fetch("/api/cart", {
          method: opts?.mergeGuestItems?.length ? "POST" : "GET",
          headers: { "Content-Type": "application/json" },
          body: opts?.mergeGuestItems?.length
            ? JSON.stringify({ items: sanitizeCartItems(opts.mergeGuestItems) })
            : undefined,
        });
        const payload = (await response.json()) as {
          items?: CartItem[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load account cart.");
        }

        skipNextAccountSyncRef.current = true;
        setItems(sanitizeCartItems(payload.items ?? []));
        setMode("account");
        accountCartReadyRef.current = true;
      } catch (error) {
        accountCartReadyRef.current = false;
        setMode("guest");
        setSyncError(error instanceof Error ? error.message : "Account cart sync failed.");
      } finally {
        setIsHydrating(false);
      }
    },
    [accountSyncAvailable, supabaseUser],
  );

  useEffect(() => {
    const owner = mode === "account" && supabaseUser ? supabaseUser.id : "guest";

    if (skipNextStorageWriteRef.current) {
      skipNextStorageWriteRef.current = false;
      return;
    }

    writeStoredCartItems(items, owner);
  }, [items, mode, supabaseUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function onStorage(event: StorageEvent) {
      if (
        event.key !== CART_STORAGE_KEY &&
        event.key !== CART_OWNER_STORAGE_KEY
      ) {
        return;
      }

      skipNextStorageWriteRef.current = true;
      skipNextAccountSyncRef.current = true;
      setItems(readStoredCartItems());
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!supabaseUser || !accountSyncAvailable) {
      accountCartReadyRef.current = false;
      setMode("guest");
      setIsHydrating(false);
      if (!accountSyncAvailable) {
        setSyncError("Account cart sync will appear once Supabase is configured.");
      } else {
        setSyncError(null);
      }
      return;
    }

    const owner = readStoredCartOwner();
    const guestItems = readStoredCartItems();
    const mergeGuestItems = owner === "guest" ? guestItems : [];

    void loadAccountCart({ mergeGuestItems });
  }, [accountSyncAvailable, loadAccountCart, supabaseUser]);

  useEffect(() => {
    if (
      mode !== "account" ||
      !supabaseUser ||
      !accountSyncAvailable ||
      !accountCartReadyRef.current
    ) {
      return;
    }

    if (skipNextAccountSyncRef.current) {
      skipNextAccountSyncRef.current = false;
      return;
    }

    let cancelled = false;

    async function syncAccountCart() {
      setIsSyncing(true);
      setSyncError(null);

      try {
        const response = await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: sanitizeCartItems(items) }),
        });
        const payload = (await response.json()) as {
          items?: CartItem[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to save the account cart.");
        }

        if (!cancelled) {
          skipNextAccountSyncRef.current = true;
          setItems(sanitizeCartItems(payload.items ?? items));
        }
      } catch (error) {
        if (!cancelled) {
          accountCartReadyRef.current = false;
          setMode("guest");
          setSyncError(
            error instanceof Error
              ? error.message
              : "Unable to save changes to the account cart.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsSyncing(false);
        }
      }
    }

    void syncAccountCart();

    return () => {
      cancelled = true;
    };
  }, [accountSyncAvailable, items, mode, supabaseUser]);

  const addItem = useCallback((product: Product, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.product_id === product.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = {
          ...next[i],
          quantity: next[i].quantity + qty,
          product,
        };
        return sanitizeCartItems(next);
      }
      return sanitizeCartItems([
        ...prev,
        {
          product_id: product.id,
          shop_id: product.shop_id,
          quantity: qty,
          price_at_add: product.price,
          product,
        },
      ]);
    });
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty < 1) {
      setItems((prev) => prev.filter((x) => x.product_id !== productId));
      return;
    }
    setItems((prev) => sanitizeCartItems(
      prev.map((x) => (x.product_id === productId ? { ...x, quantity: qty } : x)),
    ));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((x) => x.product_id !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const refresh = useCallback(async () => {
    if (!supabaseUser || !accountSyncAvailable) return;
    await loadAccountCart();
  }, [accountSyncAvailable, loadAccountCart, supabaseUser]);

  const subtotal = useMemo(
    () =>
      items.reduce((s, x) => s + x.price_at_add * x.quantity, 0),
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((n, x) => n + x.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQty,
      removeItem,
      clear,
      refresh,
      subtotal,
      itemCount,
      mode,
      isHydrating,
      isSyncing,
      syncError,
      accountSyncAvailable,
    }),
    [
      items,
      addItem,
      updateQty,
      removeItem,
      clear,
      refresh,
      subtotal,
      itemCount,
      mode,
      isHydrating,
      isSyncing,
      syncError,
      accountSyncAvailable,
    ],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

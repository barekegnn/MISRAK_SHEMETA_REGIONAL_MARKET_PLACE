import type { CartItem } from "@/types";

export const CART_STORAGE_KEY = "misrak_cart_v1";
export const CART_OWNER_STORAGE_KEY = "misrak_cart_owner_v1";

export type StoredCartOwner = string | "guest";

export function readStoredCartItems() {
  if (typeof window === "undefined") return [] as CartItem[];

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    return sanitizeCartItems(JSON.parse(raw) as CartItem[]);
  } catch {
    return [];
  }
}

export function writeStoredCartItems(items: CartItem[], owner: StoredCartOwner = "guest") {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(sanitizeCartItems(items)));
    window.localStorage.setItem(CART_OWNER_STORAGE_KEY, owner);
  } catch {
    /* ignore */
  }
}

export function clearStoredCartItems() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    window.localStorage.removeItem(CART_OWNER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function readStoredCartOwner(): StoredCartOwner {
  if (typeof window === "undefined") return "guest";

  try {
    return (window.localStorage.getItem(CART_OWNER_STORAGE_KEY) as StoredCartOwner | null) ?? "guest";
  } catch {
    return "guest";
  }
}

export function mergeCartItems(primary: CartItem[], incoming: CartItem[]) {
  const merged = new Map<string, CartItem>();

  [...primary, ...incoming].forEach((item) => {
    if (!item?.product_id) return;

    const existing = merged.get(item.product_id);
    if (!existing) {
      merged.set(item.product_id, normalizeCartItem(item));
      return;
    }

    merged.set(item.product_id, {
      ...existing,
      shop_id: item.shop_id || existing.shop_id,
      price_at_add: existing.price_at_add || item.price_at_add,
      quantity: existing.quantity + Math.max(1, Math.trunc(item.quantity || 1)),
      product: item.product ?? existing.product,
    });
  });

  return Array.from(merged.values());
}

export function sanitizeCartItems(items: CartItem[]) {
  return (Array.isArray(items) ? items : [])
    .map(normalizeCartItem)
    .filter((item) => item.quantity > 0 && Boolean(item.product_id) && Boolean(item.shop_id));
}

function normalizeCartItem(item: CartItem): CartItem {
  return {
    product_id: String(item.product_id),
    shop_id: String(item.shop_id),
    quantity: Math.max(1, Math.trunc(item.quantity || 1)),
    price_at_add: Number.isFinite(item.price_at_add) ? item.price_at_add : 0,
    product: item.product,
  };
}

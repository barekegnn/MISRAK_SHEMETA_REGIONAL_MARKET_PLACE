"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import type { CartItemRow, DeliveryZone } from "@/types";
import { revalidatePath } from "next/cache";

export async function getCart(): Promise<CartItemRow[]> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: row } = await supabase
    .from("carts")
    .select("items")
    .eq("buyer_id", user.id)
    .maybeSingle();

  return (row?.items as CartItemRow[]) ?? [];
}

async function ensureCart(supabase: Awaited<ReturnType<typeof createServerSupabase>>, buyerId: string) {
  const { data: existing } = await supabase
    .from("carts")
    .select("id")
    .eq("buyer_id", buyerId)
    .maybeSingle();
  if (existing) return;
  await supabase.from("carts").insert({ buyer_id: buyerId, items: [] });
}

export async function addToCart(item: CartItemRow) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("SIGN_IN_REQUIRED");

  await ensureCart(supabase, user.id);
  const { data: row } = await supabase
    .from("carts")
    .select("items")
    .eq("buyer_id", user.id)
    .single();

  const items = (row?.items as CartItemRow[]) ?? [];
  const idx = items.findIndex((i) => i.product_id === item.product_id);
  if (idx >= 0) {
    items[idx] = {
      ...items[idx],
      quantity: items[idx].quantity + item.quantity,
      price_at_add: item.price_at_add,
    };
  } else {
    items.push(item);
  }

  await supabase
    .from("carts")
    .update({ items, updated_at: new Date().toISOString() })
    .eq("buyer_id", user.id);

  revalidatePath("/cart");
  revalidatePath("/products");
}

export async function updateCartItem(productId: string, quantity: number) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("SIGN_IN_REQUIRED");

  const { data: row } = await supabase
    .from("carts")
    .select("items")
    .eq("buyer_id", user.id)
    .single();

  let items = (row?.items as CartItemRow[]) ?? [];
  if (quantity <= 0) {
    items = items.filter((i) => i.product_id !== productId);
  } else {
    items = items.map((i) =>
      i.product_id === productId ? { ...i, quantity } : i
    );
  }

  await supabase
    .from("carts")
    .update({ items, updated_at: new Date().toISOString() })
    .eq("buyer_id", user.id);

  revalidatePath("/cart");
}

export async function removeFromCart(productId: string) {
  await updateCartItem(productId, 0);
}

/** Used when profile zone missing — still allow server reads with passed zone from client state */
export type CartPreview = {
  items: CartItemRow[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  warnings: string[];
};

export async function getCartPreview(deliveryZone: DeliveryZone): Promise<CartPreview> {
  const items = await getCart();
  if (items.length === 0) {
    return { items: [], subtotal: 0, deliveryFee: 0, total: 0, warnings: [] };
  }

  const supabase = await createServerSupabase();
  const warnings: string[] = [];
  let subtotal = 0;
  const { calculateDeliveryFee } = await import("@/lib/logistics/pricing");

  const shopFees = new Map<string, number>();

  for (const line of items) {
    const { data: p } = await supabase
      .from("products")
      .select("price, stock, shop_id, name, shops(city)")
      .eq("id", line.product_id)
      .single();

    if (!p) {
      warnings.push(`Missing product ${line.product_id}`);
      continue;
    }
    const stock = p.stock as number;
    if (stock < line.quantity) {
      warnings.push(`${p.name}: only ${stock} in stock`);
    }
    const price = Number(p.price);
    subtotal += price * line.quantity;

    const shopId = p.shop_id as string;
    const shopRaw = p.shops as unknown;
    const shopRow = Array.isArray(shopRaw) ? shopRaw[0] : shopRaw;
    const city = (shopRow as { city: string } | null)?.city;
    if (city) {
      try {
        const fee = calculateDeliveryFee(
          city as import("@/types").ShopCity,
          deliveryZone
        ).fee;
        shopFees.set(shopId, fee);
      } catch {
        shopFees.set(shopId, 0);
      }
    }
  }

  let deliveryFee = 0;
  for (const v of shopFees.values()) deliveryFee += v;

  return {
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    warnings,
  };
}

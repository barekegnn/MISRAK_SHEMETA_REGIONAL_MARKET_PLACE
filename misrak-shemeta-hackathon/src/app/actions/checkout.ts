"use server";

import { chapaInitialize, normalizeChapaPhone } from "@/lib/chapa/client";
import { calculateDeliveryFee } from "@/lib/logistics/pricing";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { CartItemRow, DeliveryZone, OrderItemRow, ShopCity } from "@/types";
import { revalidatePath } from "next/cache";
import { randomInt } from "crypto";

function genOtp(): string {
  return String(randomInt(100000, 999999));
}

export async function initiateCheckout(params: {
  phone: string;
  deliveryZone: DeliveryZone;
}): Promise<
  | { ok: true; checkoutUrl: string; batchId: string; orderIds: string[] }
  | { ok: false; error: string }
> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "SIGN_IN_REQUIRED" };

  const email =
    user.email?.trim() ||
    `buyer+${user.id.replace(/-/g, "").slice(0, 12)}@misrak-shemeta.local`;

  const { data: profile } = await supabase
    .from("users")
    .select("delivery_zone, full_name")
    .eq("id", user.id)
    .single();

  const zone = params.deliveryZone || (profile?.delivery_zone as DeliveryZone);
  if (!zone) return { ok: false, error: "DELIVERY_ZONE_REQUIRED" };

  const { data: cartRow } = await supabase
    .from("carts")
    .select("items")
    .eq("buyer_id", user.id)
    .maybeSingle();

  const items = (cartRow?.items as CartItemRow[]) ?? [];
  if (!items.length) return { ok: false, error: "EMPTY_CART" };

  const svc = createServiceClient();
  const lineDetails: Array<{
    line: CartItemRow;
    price: number;
    name: string;
    stock: number;
    shop_id: string;
    shop_city: ShopCity;
  }> = [];

  for (const line of items) {
    const { data: p } = await svc
      .from("products")
      .select("id, name, price, stock, shop_id, shops(city)")
      .eq("id", line.product_id)
      .single();
    if (!p)
      return { ok: false, error: `PRODUCT_GONE:${line.product_id}` };
    const stock = p.stock as number;
    if (stock < line.quantity)
      return { ok: false, error: `STOCK:${p.name}` };
    const shopRaw = p.shops as unknown;
    const shopOne = Array.isArray(shopRaw) ? shopRaw[0] : shopRaw;
    const city = (shopOne as { city: ShopCity }).city;
    lineDetails.push({
      line,
      price: Number(p.price),
      name: p.name as string,
      stock,
      shop_id: p.shop_id as string,
      shop_city: city,
    });
  }

  const byShop = new Map<
    string,
    { lines: typeof lineDetails; city: ShopCity }
  >();
  for (const d of lineDetails) {
    const g = byShop.get(d.shop_id);
    if (!g) byShop.set(d.shop_id, { lines: [d], city: d.shop_city });
    else g.lines.push(d);
  }

  const batchId = (await import("crypto")).randomUUID();
  const orderIds: string[] = [];
  let grandSub = 0;
  let grandDel = 0;

  for (const [shopId, grp] of byShop) {
    const fee = calculateDeliveryFee(grp.city, zone).fee;
    let sub = 0;
    const orderItems: OrderItemRow[] = grp.lines.map((d) => {
      sub += d.price * d.line.quantity;
      return {
        product_id: d.line.product_id,
        shop_id: shopId,
        product_name: d.name,
        quantity: d.line.quantity,
        price_at_purchase: d.price,
        shop_city: grp.city,
      };
    });
    grandSub += sub;
    grandDel += fee;
    const total = sub + fee;
    const otp = genOtp();

    const { data: order, error } = await svc
      .from("orders")
      .insert({
        buyer_id: user.id,
        shop_id: shopId,
        items: orderItems,
        subtotal: sub,
        delivery_fee: fee,
        total,
        status: "PENDING",
        otp,
        checkout_batch_id: batchId,
      })
      .select("id")
      .single();

    if (error || !order) {
      return { ok: false, error: error?.message || "ORDER_CREATE_FAILED" };
    }
    orderIds.push(order.id);
  }

  const grandTotal = grandSub + grandDel;
  const amountEtb = Math.max(1, Math.ceil(grandTotal));
  const txRef = `msrm-${batchId}`;
  const fullName = (profile?.full_name as string | null)?.trim() || "Customer";
  const nameParts = fullName.split(/\s+/);
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.slice(1).join(" ") || firstName;
  const phoneNumber = normalizeChapaPhone(params.phone);

  let init: Awaited<ReturnType<typeof chapaInitialize>>;
  try {
    init = await chapaInitialize({
      amountEtb,
      email,
      firstName,
      lastName,
      phoneNumber,
      txRef,
      meta: { batch_id: batchId },
    });
  } catch (e) {
    for (const oid of orderIds) {
      await svc.from("orders").update({ status: "FAILED" }).eq("id", oid);
    }
    const msg = e instanceof Error ? e.message : "Chapa initialize failed";
    await svc.from("payment_logs").insert({
      checkout_batch_id: batchId,
      provider: "CHAPA",
      status: "INIT_FAILED",
      response: { error: msg } as Record<string, unknown>,
    });
    return { ok: false, error: msg };
  }

  await svc
    .from("orders")
    .update({ mpesa_checkout_request_id: txRef })
    .eq("checkout_batch_id", batchId);

  await svc.from("payment_logs").insert({
    checkout_batch_id: batchId,
    provider: "CHAPA",
    status: "INIT_OK",
    request: init.raw,
  });

  revalidatePath("/checkout");
  revalidatePath("/orders");

  return { ok: true, checkoutUrl: init.checkoutUrl, batchId, orderIds };
}

export async function clearCartAfterSuccess() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("carts")
    .update({ items: [], updated_at: new Date().toISOString() })
    .eq("buyer_id", user.id);
  revalidatePath("/cart");
}

export async function getCheckoutBatchStatus(batchId: string): Promise<{
  orderIds: string[];
  statuses: string[];
  allPaid: boolean;
  anyFailed: boolean;
} | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const svc = createServiceClient();
  const { data: rows } = await svc
    .from("orders")
    .select("id, status")
    .eq("checkout_batch_id", batchId)
    .eq("buyer_id", user.id);

  if (!rows?.length) return null;
  const statuses = rows.map((r) => String(r.status));
  return {
    orderIds: rows.map((r) => r.id as string),
    statuses,
    allPaid: statuses.every((s) => s === "PAID_ESCROW" || s === "COMPLETED"),
    anyFailed: statuses.some((s) => s === "FAILED" || s === "LOCKED"),
  };
}

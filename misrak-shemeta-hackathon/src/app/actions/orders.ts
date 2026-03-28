"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export async function markDispatched(orderId: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const svc = createServiceClient();
  const { data: order } = await svc
    .from("orders")
    .select("id, shop_id, status, shops ( owner_id )")
    .eq("id", orderId)
    .single();

  if (!order) throw new Error("NOT_FOUND");
  const shopRaw = order.shops as unknown;
  const shopOne = Array.isArray(shopRaw) ? shopRaw[0] : shopRaw;
  const owner = (shopOne as { owner_id: string } | null)?.owner_id;
  if (!owner) throw new Error("NOT_FOUND");
  if (owner !== user.id) throw new Error("UNAUTHORIZED");
  if (order.status !== "PAID_ESCROW") throw new Error("INVALID_STATE");

  await svc
    .from("orders")
    .update({ status: "DISPATCHED", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  revalidatePath("/merchant/orders");
  revalidatePath("/runner");
  revalidatePath(`/orders/${orderId}`);
}

export async function validateRunnerOtp(orderId: string, otp: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const svc = createServiceClient();
  const { data: me } = await svc
    .from("users")
    .select("role, delivery_zone")
    .eq("id", user.id)
    .single();
  if (me?.role !== "runner") throw new Error("UNAUTHORIZED");

  const { data: order } = await svc
    .from("orders")
    .select("id, status, otp, otp_attempts, subtotal, shop_id, buyer_id, items")
    .eq("id", orderId)
    .single();

  if (!order) throw new Error("NOT_FOUND");

  const { data: buyer } = await svc
    .from("users")
    .select("delivery_zone")
    .eq("id", order.buyer_id as string)
    .single();
  const buyerZone = buyer?.delivery_zone as string | null;
  if (buyerZone !== me.delivery_zone) throw new Error("ZONE_MISMATCH");

  if (order.status === "LOCKED") throw new Error("LOCKED");
  if (order.status !== "DISPATCHED") throw new Error("INVALID_STATE");

  const attempts = (order.otp_attempts as number) ?? 0;
  if (attempts >= 3) {
    await svc
      .from("orders")
      .update({ status: "LOCKED" })
      .eq("id", orderId);
    throw new Error("LOCKED");
  }

  if (String(order.otp) !== String(otp)) {
    const next = attempts + 1;
    const updates: Record<string, unknown> = {
      otp_attempts: next,
      updated_at: new Date().toISOString(),
    };
    if (next >= 3) updates.status = "LOCKED";
    await svc.from("orders").update(updates).eq("id", orderId);
    throw new Error(next >= 3 ? "LOCKED" : "BAD_OTP");
  }

  const subtotal = Number(order.subtotal);
  const shopId = order.shop_id as string;

  const { data: shop } = await svc
    .from("shops")
    .select("balance")
    .eq("id", shopId)
    .single();

  const before = Number(shop?.balance ?? 0);
  const after = before + subtotal;

  await svc
    .from("shops")
    .update({ balance: after })
    .eq("id", shopId);

  await svc.from("shop_transactions").insert({
    shop_id: shopId,
    order_id: orderId,
    amount: subtotal,
    type: "CREDIT",
    balance_before: before,
    balance_after: after,
  });

  await svc
    .from("orders")
    .update({
      status: "COMPLETED",
      runner_id: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  revalidatePath("/runner");
  revalidatePath("/merchant");
  revalidatePath(`/orders/${orderId}`);
}

/** Admin manual status — Requirement 18.6–18.7 */
export async function adminUpdateOrderStatus(
  orderId: string,
  status: string,
  reason: string
) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const svc = createServiceClient();
  const { data: me } = await svc
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") throw new Error("UNAUTHORIZED");

  await svc
    .from("orders")
    .update({ status, admin_note: reason })
    .eq("id", orderId);

  await svc.from("admin_audit_logs").insert({
    admin_id: user.id,
    action: "ORDER_STATUS",
    entity_type: "order",
    entity_id: orderId,
    reason,
    meta: { status },
  });

  revalidatePath("/admin");
}

export async function getOrder(orderId: string) {
  const supabase = await createServerSupabase();
  return supabase
    .from("orders")
    .select("*, shops ( name, phone, city, description )")
    .eq("id", orderId)
    .single();
}

export async function listOrdersForBuyer() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("orders")
    .select(
      "id, status, total, created_at, shop_id, shops ( name, phone, city )"
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listMerchantOrders() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!shop?.id) return [];

  const { data } = await supabase
    .from("orders")
    .select("id, status, total, subtotal, created_at, items, otp, buyer_id")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export type RunnerOrderRow = {
  id: string;
  items: unknown;
  otp_attempts: number;
  buyer_zone: string;
  shop: { name: string; phone: string };
};

export async function listRunnerOrders(): Promise<RunnerOrderRow[]> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: orders } = await supabase
    .from("orders")
    .select("id, items, otp_attempts, status, buyer_id, shops ( name, phone )")
    .eq("status", "DISPATCHED");

  if (!orders?.length) return [];

  const buyerIds = [...new Set(orders.map((o) => o.buyer_id as string))];
  const { data: buyers } = await supabase
    .from("users")
    .select("id, delivery_zone")
    .in("id", buyerIds);

  const zoneByBuyer = new Map(
    buyers?.map((b) => [b.id, b.delivery_zone as string]) ?? []
  );

  const { data: me } = await supabase
    .from("users")
    .select("delivery_zone")
    .eq("id", user.id)
    .single();
  const myZone = me?.delivery_zone as string | undefined;
  if (!myZone) return [];

  return orders
    .filter((o) => zoneByBuyer.get(o.buyer_id as string) === myZone)
    .map((o) => {
      const shRaw = o.shops as unknown;
      const sh = (Array.isArray(shRaw) ? shRaw[0] : shRaw) as {
        name?: string;
        phone?: string;
      } | null;
      return {
        id: o.id as string,
        items: o.items,
        otp_attempts: (o.otp_attempts as number) ?? 0,
        buyer_zone: zoneByBuyer.get(o.buyer_id as string) ?? "",
        shop: {
          name: sh?.name ?? "",
          phone: sh?.phone ?? "",
        },
      };
    });
}

export async function getRunnerSummary() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { completed: 0, volumeEtb: 0 };

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "runner") return { completed: 0, volumeEtb: 0 };

  const svc = createServiceClient();
  const { data: rows } = await svc
    .from("orders")
    .select("total")
    .eq("runner_id", user.id)
    .eq("status", "COMPLETED");

  const completed = rows?.length ?? 0;
  const volumeEtb = rows?.reduce((s, r) => s + Number(r.total), 0) ?? 0;
  return { completed, volumeEtb };
}

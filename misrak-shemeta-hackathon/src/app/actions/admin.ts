"use server";

import { calculateDeliveryFee } from "@/lib/logistics/pricing";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { DeliveryZone, ShopCity } from "@/types";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
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
  return { userId: user.id, svc };
}

export type AdminDashboard = {
  buyers: number;
  sellers: number;
  runners: number;
  products: number;
  ordersByStatus: Record<string, number>;
  revenueCompleted: number;
  escrowHeld: number;
  activity: Array<{
    id: string;
    kind: string;
    label: string;
    at: string;
  }>;
};

export async function getAdminDashboard(): Promise<AdminDashboard> {
  await requireAdmin();
  const svc = createServiceClient();

  const [buyers, sellers, runners, products, orders] = await Promise.all([
    svc.from("users").select("id", { count: "exact", head: true }).eq("role", "buyer"),
    svc.from("users").select("id", { count: "exact", head: true }).eq("role", "seller"),
    svc.from("users").select("id", { count: "exact", head: true }).eq("role", "runner"),
    svc.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    svc
      .from("orders")
      .select("id, status, total, updated_at, created_at"),
  ]);

  const orderRows = orders.data ?? [];
  const ordersByStatus: Record<string, number> = {};
  let revenueCompleted = 0;
  let escrowHeld = 0;

  for (const o of orderRows) {
    const s = o.status as string;
    ordersByStatus[s] = (ordersByStatus[s] ?? 0) + 1;
    const t = Number(o.total);
    if (s === "COMPLETED") revenueCompleted += t;
    if (s === "PAID_ESCROW" || s === "DISPATCHED") escrowHeld += t;
  }

  const activity = orderRows
    .map((o) => ({
      id: o.id as string,
      kind: "order",
      label: `${o.status}: ${String(o.id).slice(0, 8)}…`,
      at: (o.updated_at as string) || (o.created_at as string),
    }))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10);

  return {
    buyers: buyers.count ?? 0,
    sellers: sellers.count ?? 0,
    runners: runners.count ?? 0,
    products: products.count ?? 0,
    ordersByStatus,
    revenueCompleted,
    escrowHeld,
    activity,
  };
}

export async function listAdminUsers() {
  const { svc } = await requireAdmin();
  const { data } = await svc
    .from("users")
    .select("id, email, full_name, role, delivery_zone, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listAdminShops() {
  const { svc } = await requireAdmin();
  const { data } = await svc.from("shops").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function listAdminOrders() {
  const { svc } = await requireAdmin();
  const { data } = await svc
    .from("orders")
    .select("*, shops ( name )")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listPaymentLogs() {
  const { svc } = await requireAdmin();
  const { data } = await svc
    .from("payment_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

/** Requirement 12.5 — reset transactional demo state (keeps auth users & catalog) */
export async function resetDemoEnvironment() {
  const { userId, svc } = await requireAdmin();

  await svc.from("admin_audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await svc.from("shop_transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await svc.from("payment_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await svc.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  await svc
    .from("carts")
    .update({ items: [], updated_at: new Date().toISOString() })
    .neq("buyer_id", "00000000-0000-0000-0000-000000000000");

  const { data: seller } = await svc
    .from("users")
    .select("id")
    .eq("email", "seller@misrak.demo")
    .maybeSingle();
  if (seller?.id) {
    const { data: demoShop } = await svc
      .from("shops")
      .select("id")
      .eq("owner_id", seller.id)
      .maybeSingle();
    if (demoShop?.id)
      await svc.from("shops").update({ balance: 0 }).eq("id", demoShop.id);
  }

  const { data: buyer } = await svc
    .from("users")
    .select("id")
    .eq("email", "buyer@misrak.demo")
    .maybeSingle();
  const { data: shop } = await svc
    .from("shops")
    .select("id")
    .eq("owner_id", seller?.id ?? "")
    .maybeSingle();

  const { data: product } = await svc
    .from("products")
    .select("id, name, price, shop_id, shops ( city )")
    .eq("is_active", true)
    .eq("shop_id", shop?.id ?? "")
    .limit(1)
    .maybeSingle();

  if (buyer?.id && shop?.id && product) {
    const { data: buyerRow } = await svc
      .from("users")
      .select("delivery_zone")
      .eq("id", buyer.id)
      .single();
    const zone = (buyerRow?.delivery_zone as DeliveryZone) ?? "Haramaya_Campus";

    const price = Number(product.price);
    const shopNest = product.shops as unknown;
    const shopOne = Array.isArray(shopNest) ? shopNest[0] : shopNest;
    const city =
      (shopOne as { city?: ShopCity } | null)?.city ?? ("Harar" as ShopCity);
    const items = [
      {
        product_id: product.id as string,
        shop_id: shop.id,
        product_name: product.name as string,
        quantity: 1,
        price_at_purchase: price,
        shop_city: city,
      },
    ];
    const subtotal = price;
    const deliveryFee = calculateDeliveryFee(city, zone).fee;
    const total = subtotal + deliveryFee;

    await svc.from("orders").insert([
      {
        buyer_id: buyer.id,
        shop_id: shop.id,
        items,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        status: "PAID_ESCROW",
        otp: "111111",
      },
      {
        buyer_id: buyer.id,
        shop_id: shop.id,
        items: JSON.parse(JSON.stringify(items)) as typeof items,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        status: "DISPATCHED",
        otp: "222222",
      },
    ]);
  }

  await svc.from("admin_audit_logs").insert({
    admin_id: userId,
    action: "DEMO_RESET",
    entity_type: "platform",
    entity_id: "all",
    reason: "Hackathon demo reset",
  });

  revalidatePath("/admin");
}

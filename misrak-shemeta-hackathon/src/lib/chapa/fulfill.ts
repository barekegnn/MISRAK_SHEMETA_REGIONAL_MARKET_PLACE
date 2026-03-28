import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderItemRow } from "@/types";
import { chapaVerify } from "./client";

type Svc = SupabaseClient;

async function applyPaidOrders(
  svc: Svc,
  orders: Array<{ id: string; items: unknown; status: string }>,
  externalRef: string | null
) {
  for (const o of orders) {
    if (o.status === "PAID_ESCROW") continue;
    const items = o.items as OrderItemRow[];
    for (const li of items) {
      const { data: p } = await svc
        .from("products")
        .select("stock")
        .eq("id", li.product_id)
        .single();
      const stock = (p?.stock as number) ?? 0;
      const next = Math.max(0, stock - li.quantity);
      await svc
        .from("products")
        .update({ stock: next })
        .eq("id", li.product_id);
    }
    await svc
      .from("orders")
      .update({
        status: "PAID_ESCROW",
        mpesa_receipt: externalRef,
        updated_at: new Date().toISOString(),
      })
      .eq("id", o.id);
  }
}

export async function tryFulfillChapaTx(
  svc: Svc,
  txRef: string
): Promise<{ ok: boolean; reason?: string }> {
  const { data: orders } = await svc
    .from("orders")
    .select("id, status, items, checkout_batch_id, total")
    .eq("mpesa_checkout_request_id", txRef);

  if (!orders?.length) {
    return { ok: false, reason: "NO_ORDERS" };
  }

  if (orders.every((o) => o.status === "PAID_ESCROW")) {
    return { ok: true };
  }

  const verified = await chapaVerify(txRef);
  if (!verified.ok) {
    return { ok: false, reason: "VERIFY_FAILED" };
  }

  const expected = orders.reduce((s, o) => s + Number(o.total), 0);
  if (verified.amount != null && expected > 0) {
    const tol = Math.max(2, Math.ceil(expected * 0.02));
    if (Math.abs(verified.amount - expected) > tol) {
      return { ok: false, reason: "AMOUNT_MISMATCH" };
    }
  }

  await applyPaidOrders(svc, orders, verified.reference);

  await svc.from("payment_logs").insert({
    provider: "CHAPA",
    checkout_batch_id: orders[0]?.checkout_batch_id as string,
    status: "VERIFIED",
    response: verified.raw as Record<string, unknown>,
  });

  return { ok: true };
}

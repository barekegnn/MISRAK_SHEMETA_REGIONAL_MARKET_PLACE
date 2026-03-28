import { createServiceClient } from "@/lib/supabase/service";
import type { OrderItemRow } from "@/types";
import { NextResponse } from "next/server";

/** M-PESA STK callback — Requirement 9 */
export async function POST(req: Request) {
  const svc = createServiceClient();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid JSON" });
  }

  const b = body as {
    Body?: {
      stkCallback?: {
        CheckoutRequestID?: string;
        ResultCode?: number;
        ResultDesc?: string;
        CallbackMetadata?: {
          Item?: Array<{ Name: string; Value: string | number }>;
        };
      };
    };
  };

  const cb = b.Body?.stkCallback;
  const checkoutId = cb?.CheckoutRequestID;
  if (!checkoutId) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  await svc.from("payment_logs").insert({
    provider: "MPESA",
    status: "CALLBACK",
    response: b as Record<string, unknown>,
  });

  const { data: orders } = await svc
    .from("orders")
    .select("id, status, items")
    .eq("mpesa_checkout_request_id", checkoutId);

  if (!orders?.length) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  if (orders.every((o) => o.status === "PAID_ESCROW")) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const success = cb.ResultCode === 0;

  let receipt: string | null = null;
  const meta = cb.CallbackMetadata?.Item;
  if (meta) {
    const r = meta.find((i) => i.Name === "MpesaReceiptNumber");
    if (r) receipt = String(r.Value);
  }

  if (!success) {
    for (const o of orders) {
      await svc.from("orders").update({ status: "FAILED" }).eq("id", o.id);
    }
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  for (const o of orders) {
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
        mpesa_receipt: receipt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", o.id);
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}

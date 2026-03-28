import { tryFulfillChapaTx } from "@/lib/chapa/fulfill";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

function extractTxRef(req: Request, body: unknown): string | null {
  const u = new URL(req.url);
  const q = u.searchParams.get("trx_ref") || u.searchParams.get("tx_ref");
  if (q) return q;
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    const tr = b.trx_ref ?? b.tx_ref;
    if (typeof tr === "string") return tr;
  }
  return null;
}

function extractStatus(req: Request, body: unknown): string | null {
  const u = new URL(req.url);
  const q = u.searchParams.get("status");
  if (q) return q;
  if (body && typeof body === "object") {
    const s = (body as Record<string, unknown>).status;
    if (typeof s === "string") return s;
  }
  return null;
}

async function markFailedIfPending(txRef: string) {
  const svc = createServiceClient();
  const { data: orders } = await svc
    .from("orders")
    .select("id, status")
    .eq("mpesa_checkout_request_id", txRef);
  if (!orders?.length) return;
  for (const o of orders) {
    if (o.status === "PENDING" || o.status === "FAILED") {
      await svc.from("orders").update({ status: "FAILED" }).eq("id", o.id);
    }
  }
}

export async function GET(req: Request) {
  const txRef = extractTxRef(req, null);
  const status = extractStatus(req, null);
  return handleChapaCallback(txRef, status, { via: "GET" });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const txRef = extractTxRef(req, body);
  const status = extractStatus(req, body);
  return handleChapaCallback(txRef, status, body);
}

async function handleChapaCallback(
  txRef: string | null,
  status: string | null,
  logPayload: unknown
) {
  const svc = createServiceClient();

  if (!txRef) {
    return NextResponse.json({ ok: true, message: "no tx_ref" });
  }

  await svc.from("payment_logs").insert({
    provider: "CHAPA",
    status: "CALLBACK",
    response: {
      tx_ref: txRef,
      status,
      payload: logPayload,
    } as Record<string, unknown>,
  });

  const st = String(status ?? "").toLowerCase();
  if (st === "failed" || st === "cancelled" || st === "canceled") {
    await markFailedIfPending(txRef);
    return NextResponse.json({ ok: true });
  }

  const result = await tryFulfillChapaTx(svc, txRef);
  if (!result.ok && result.reason === "VERIFY_FAILED" && st === "success") {
    await markFailedIfPending(txRef);
  }

  return NextResponse.json({ ok: true });
}

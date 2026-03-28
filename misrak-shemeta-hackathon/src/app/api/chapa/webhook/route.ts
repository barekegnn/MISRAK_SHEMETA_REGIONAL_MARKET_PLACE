import { tryFulfillChapaTx } from "@/lib/chapa/fulfill";
import { createServiceClient } from "@/lib/supabase/service";
import { createHmac, timingSafeEqual } from "crypto";

function verifySignature(rawBody: string, headers: Headers): boolean {
  const secret = process.env.CHAPA_WEBHOOK_SECRET;
  if (!secret) return true;
  const sig =
    headers.get("x-chapa-signature") || headers.get("chapa-signature");
  if (!sig) return false;
  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return sig === expected;
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers)) {
    return new Response("invalid signature", { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const txRef = body.tx_ref;
  if (typeof txRef !== "string") {
    return new Response("ok", { status: 200 });
  }

  const svc = createServiceClient();
  await svc.from("payment_logs").insert({
    provider: "CHAPA",
    status: "WEBHOOK",
    response: body as Record<string, unknown>,
  });

  const st = String(body.status ?? "").toLowerCase();
  if (st === "success") {
    await tryFulfillChapaTx(svc, txRef);
  }

  return new Response("ok", { status: 200 });
}

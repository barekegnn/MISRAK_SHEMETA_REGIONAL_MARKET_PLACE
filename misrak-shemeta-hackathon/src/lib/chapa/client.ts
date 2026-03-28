const CHAPA_API = "https://api.chapa.co/v1";

function secret(): string {
  const k = process.env.CHAPA_SECRET_KEY;
  if (!k) throw new Error("CHAPA_SECRET_KEY is not set");
  return k;
}

function appBase(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/+$/,
    ""
  );
}

/**
 * Chapa expects local MSISDN style: 10 digits, 09xxxxxxxx or 07xxxxxxxx.
 */
export function normalizeChapaPhone(input: string): string {
  const d = input.replace(/\D/g, "");
  if (d.startsWith("251") && d.length >= 12) {
    return `0${d.slice(3)}`.slice(0, 10);
  }
  if (d.startsWith("0") && d.length === 10) return d;
  if (d.length === 9 && (d.startsWith("9") || d.startsWith("7")))
    return `0${d}`;
  if (d.length >= 10) return d.startsWith("0") ? d.slice(0, 10) : `0${d.slice(-9)}`;
  return d.length === 9 ? `0${d}` : d;
}

export interface ChapaInitializeParams {
  amountEtb: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  /** Unique per payment attempt (we use batch id–scoped ref). */
  txRef: string;
  title?: string;
  description?: string;
  meta?: Record<string, unknown>;
}

export async function chapaInitialize(params: ChapaInitializeParams): Promise<{
  checkoutUrl: string;
  raw: Record<string, unknown>;
}> {
  const callbackUrl =
    process.env.CHAPA_CALLBACK_URL || `${appBase()}/api/chapa/callback`;
  const batchFromTxRef = params.txRef.startsWith("msrm-")
    ? params.txRef.slice("msrm-".length)
    : params.txRef;
  const returnUrl = `${appBase()}/checkout?batch=${encodeURIComponent(batchFromTxRef)}`;

  const body = {
    amount: String(Math.max(1, Math.ceil(params.amountEtb))),
    currency: "ETB",
    email: params.email,
    first_name: params.firstName,
    last_name: params.lastName,
    phone_number: params.phoneNumber,
    tx_ref: params.txRef,
    callback_url: callbackUrl,
    return_url: returnUrl,
    customization: {
      title: params.title ?? "Misrak Shemeta",
      description: params.description ?? "Order payment",
    },
    ...(params.meta ? { meta: params.meta } : {}),
  };

  const res = await fetch(`${CHAPA_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = (await res.json()) as Record<string, unknown>;
  const status = String(raw.status ?? "").toLowerCase();
  const data = raw.data as Record<string, unknown> | undefined;
  const checkoutUrl =
    (data?.checkout_url as string | undefined) ||
    (raw.checkout_url as string | undefined);

  if (!res.ok || status !== "success" || !checkoutUrl) {
    const msg =
      (raw.message as string) || `Chapa initialize failed (${res.status})`;
    throw new Error(msg);
  }

  return { checkoutUrl, raw };
}

export interface ChapaVerifyResult {
  ok: boolean;
  txRef: string | null;
  reference: string | null;
  amount: number | null;
  currency: string | null;
  raw: Record<string, unknown>;
}

export async function chapaVerify(txRef: string): Promise<ChapaVerifyResult> {
  const enc = encodeURIComponent(txRef);
  const res = await fetch(`${CHAPA_API}/transaction/verify/${enc}`, {
    headers: { Authorization: `Bearer ${secret()}` },
  });
  const raw = (await res.json()) as Record<string, unknown>;
  const data = raw.data as Record<string, unknown> | undefined;
  const inner = String(data?.status ?? "").toLowerCase();
  const paid = res.ok && inner === "success";

  const amountRaw = data?.amount;
  const amount =
    typeof amountRaw === "number"
      ? amountRaw
      : amountRaw != null
        ? Number(amountRaw)
        : null;

  return {
    ok: paid && res.ok,
    txRef: (data?.tx_ref as string) ?? txRef,
    reference: (data?.reference as string) ?? null,
    amount,
    currency: data?.currency != null ? String(data.currency) : null,
    raw,
  };
}

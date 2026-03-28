import { randomUUID } from "crypto";

const DEFAULT_BASE = "https://apisandbox.safaricom.et";
const DEFAULT_STK_PATH = "/mpesa/stkpush/v3/processrequest";

function mpesaBaseUrl(): string {
  const raw = (process.env.MPESA_BASE_URL || DEFAULT_BASE).replace(/\/+$/, "");
  return raw;
}

/** Ethiopian Safaricom sandbox / production MSISDN (e.g. 2517xxxxxxxx). */
export function normalizeEthMpesaPhone(input: string): string {
  const d = input.replace(/\D/g, "");
  if (d.startsWith("251")) return d;
  if (d.startsWith("0")) return `251${d.slice(1)}`;
  if (d.length === 9 && (d.startsWith("9") || d.startsWith("7"))) return `251${d}`;
  return d;
}

export async function mpesaGetAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error("M-PESA credentials missing");

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const base = mpesaBaseUrl();
  const res = await fetch(
    `${base}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(data.error || "M-PESA OAuth failed");
  }
  return data.access_token;
}

export function mpesaGeneratePassword(timestamp: string): string {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  if (!shortcode || !passkey) {
    throw new Error("M-PESA shortcode and passkey are required for STK password");
  }
  const raw = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(raw).toString("base64");
}

export interface StkPushParams {
  phone: string;
  /** Amount in ETB (whole units, Ethiopian M-Pesa sandbox). */
  amountEtb: number;
  accountReference: string;
  transactionDesc: string;
}

export async function mpesaStkPush(params: StkPushParams) {
  const token = await mpesaGetAccessToken();
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
  const password = mpesaGeneratePassword(timestamp);
  const shortcode = process.env.MPESA_SHORTCODE!;
  const callbackUrl =
    process.env.MPESA_CALLBACK_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "")}/api/mpesa/callback`;

  const phone = normalizeEthMpesaPhone(params.phone);
  const stkPath =
    process.env.MPESA_STK_PATH?.trim() || DEFAULT_STK_PATH;
  const merchantRequestId = randomUUID();

  const body: Record<string, unknown> = {
    MerchantRequestID: merchantRequestId,
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.max(1, Math.ceil(params.amountEtb)),
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: params.accountReference.slice(0, 12),
    TransactionDesc: params.transactionDesc.slice(0, 100),
  };

  const cashier = process.env.MPESA_INITIATOR_NAME?.trim();
  if (cashier) {
    body.ReferenceData = [{ Key: "CashierName", Value: cashier }];
  }

  const res = await fetch(`${mpesaBaseUrl()}${stkPath.startsWith("/") ? stkPath : `/${stkPath}`}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as {
    CheckoutRequestID?: string;
    MerchantRequestID?: string;
    ResponseCode?: string | number;
    ResponseDescription?: string;
    errorCode?: string;
    errorMessage?: string;
  };
  return data;
}

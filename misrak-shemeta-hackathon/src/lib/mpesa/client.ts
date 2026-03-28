const MPESA_BASE = "https://sandbox.safaricom.co.ke";

export async function mpesaGetAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error("M-PESA credentials missing");

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(
    `${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(data.error || "M-PESA OAuth failed");
  }
  return data.access_token;
}

export function mpesaGeneratePassword(timestamp: string): string {
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  const raw = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(raw).toString("base64");
}

export interface StkPushParams {
  phone: string;
  amountKes: number;
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
    `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`;

  const phone = params.phone.replace(/^0/, "254").replace(/^\+/, "");

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.ceil(params.amountKes),
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: params.accountReference,
    TransactionDesc: params.transactionDesc,
  };

  const res = await fetch(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return data as {
    CheckoutRequestID?: string;
    MerchantRequestID?: string;
    ResponseCode?: string;
    ResponseDescription?: string;
    errorCode?: string;
    errorMessage?: string;
  };
}

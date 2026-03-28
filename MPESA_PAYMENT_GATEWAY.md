# M-Pesa payment gateway — how it is used in this repo

This document describes **what the codebase actually does** with M-Pesa: there are **two different applications** in the monorepo, and they treat M-Pesa differently.

---

## 1. Regional marketplace (`web/`)

### What happens at checkout

- The checkout page lets buyers choose **Chapa** or **M-Pesa** as the payment option (UI copy references KES and “STK sandbox” for M-Pesa).
- Submitting checkout calls `POST /api/checkout`, which validates the provider and runs `createCheckoutOrdersForCurrentUser` in `web/src/lib/data/cart.ts`.

### Important: no call to Safaricom / Daraja here

For **both** `chapa` and `mpesa`, the server **does not** call an external payment API. It:

1. Groups cart lines by shop.
2. Inserts one `orders` row per shop with **`status: "PAID_ESCROW"`** immediately.
3. Sets **`payment_provider`** to `"mpesa"` or `"chapa"` and a generated **`payment_reference`** (for M-Pesa, pattern `MPESA-` + random digits).
4. Inserts related `order_items` rows and clears the buyer’s `cart_items`.

So M-Pesa in `web/` is a **first-class payment label and data field**, paired with **demo / instant “paid escrow”** behavior — useful for end-to-end marketplace flows without live mobile money.

### Files to read

| Area | Path |
|------|------|
| Checkout UI and provider toggle | `web/src/app/checkout/page.tsx` |
| API entry | `web/src/app/api/checkout/route.ts` |
| Order creation (same path for both providers) | `web/src/lib/data/cart.ts` — `createCheckoutOrdersForCurrentUser` |
| Types | `web/src/types/index.ts` — `PaymentProvider` |
| Client-only demo orders (separate from Supabase checkout) | `web/src/lib/demo-payments.ts` |

### Currency note in the UI

The checkout page uses a fixed **ETB → KES** factor for display (`ETB_TO_KES` in `checkout/page.tsx`). That conversion is **for messaging only**; the order amounts stored remain in the marketplace’s ETB model.

---

## 2. Hackathon app (`misrak-shemeta-hackathon/`)

This package contains **realistic M-Pesa API integration pieces** aimed at **Safaricom Ethiopia’s sandbox** (not Kenya’s classic `sandbox.safaricom.co.ke` URL in the client defaults).

### STK Push client

- **Path:** `misrak-shemeta-hackathon/src/lib/mpesa/client.ts`
- **Default base URL:** `https://apisandbox.safaricom.et`
- **Default STK path:** `/mpesa/stkpush/v3/processrequest`
- **Flow implemented:**
  1. **OAuth2 client credentials** → `GET …/oauth/v1/generate?grant_type=client_credentials` with Basic auth from `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET`.
  2. Build **password**: Base64(`shortcode` + `passkey` + **timestamp** in `yyyyMMddHHmmss` form).
  3. **POST** STK body: `CustomerPayBillOnline`, amount (ceil of `amountEtb`), `PartyA` / `PhoneNumber` normalized to **Ethiopia** MSISDN via `normalizeEthMpesaPhone` (e.g. `2517xxxxxxxx`).
- **Callback URL:** `MPESA_CALLBACK_URL` or `{NEXT_PUBLIC_APP_URL}/api/mpesa/callback`.
- Optional `MPESA_INITIATOR_NAME` adds `ReferenceData` → `CashierName`.

Exported functions: `mpesaGetAccessToken`, `mpesaGeneratePassword`, `normalizeEthMpesaPhone`, `mpesaStkPush`.

### Callback handler

- **Path:** `misrak-shemeta-hackathon/src/app/api/mpesa/callback/route.ts`
- Expects the usual **STK callback JSON** with `Body.stkCallback` (`CheckoutRequestID`, `ResultCode`, `CallbackMetadata` including `MpesaReceiptNumber`).
- **Behavior:**
  - Inserts a row into **`payment_logs`** (`provider: "MPESA"`, `status: "CALLBACK"`, full payload).
  - Finds **`orders`** where `mpesa_checkout_request_id` equals `CheckoutRequestID`.
  - On **failure** (`ResultCode !== 0`): sets those orders to **`FAILED`**.
  - On **success**: decrements **product stock** per line item, sets order **`PAID_ESCROW`**, stores **`mpesa_receipt`**.

### How checkout actually works in the hackathon (today)

The server action **`initiateCheckout`** in `misrak-shemeta-hackathon/src/app/actions/checkout.ts` initializes **Chapa** and stores the Chapa transaction reference in **`mpesa_checkout_request_id`** for batch correlation — the column name is historical / shared with M-Pesa’s checkout request id.

**`mpesaStkPush` is not imported or called anywhere else in the hackathon tree** (no checkout path triggers STK). So the **Daraja-style client and callback are implemented**, but **STK initiation is not wired to the live checkout button** in this snapshot of the repo.

### Environment variables (for the hackathon M-Pesa client)

| Variable | Role |
|----------|------|
| `MPESA_BASE_URL` | Override API host (default Ethiopia sandbox) |
| `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` | OAuth |
| `MPESA_SHORTCODE` / `MPESA_PASSKEY` | STK password + `BusinessShortCode` / `PartyB` |
| `MPESA_CALLBACK_URL` | Registered callback (or derived from `NEXT_PUBLIC_APP_URL`) |
| `MPESA_STK_PATH` | Override STK endpoint path |
| `MPESA_INITIATOR_NAME` | Optional cashier metadata |
| `NEXT_PUBLIC_APP_URL` | Used to build default callback URL |

---

## 3. Database columns related to M-Pesa

- **Baseline orders** (e.g. `20260327_core_marketplace_baseline.sql`): `mpesa_checkout_request_id`, `mpesa_receipt` (for linking STK + callback).
- **Account-cart migration** adds on `orders`: `payment_provider`, `payment_reference`, etc., which the **`web`** app uses for Chapa/M-Pesa labeling without requiring STK ids.

---

## 4. Summary

| App | M-Pesa role |
|-----|-------------|
| **`web/`** | **Checkout option**; orders go straight to **PAID_ESCROW** with `payment_provider = "mpesa"`. **No** Safaricom API. |
| **`misrak-shemeta-hackathon/`** | **STK client + `/api/mpesa/callback`** for Ethiopia-style sandbox; **callback** can finalize orders and stock. **`mpesaStkPush` is not called from checkout** in the current code; Chapa checkout reuses `mpesa_checkout_request_id` for its own reference. |

For product or compliance narratives: the **intended** live flow (requirements and design notes in `requirements2.md`, `design2.md`, `tasks2.md`) is **OAuth → STK Push → callback → escrow**, matching the hackathon callback and client — the **marketplace `web` app** currently implements a **simplified demo** of that product shape without the gateway round-trip.

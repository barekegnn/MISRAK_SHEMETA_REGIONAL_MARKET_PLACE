# Design Document — Misrak Shemeta Hackathon Edition

## Overview

Misrak Shemeta is a hackathon-focused, investor-ready marketplace demo for Eastern Ethiopia. The goal is to demonstrate a full trust-enabled commerce flow across four actors (Buyer, Seller, Runner, Admin) in under 5 minutes.

This design intentionally optimizes for:
- rapid implementation in a 6-hour hackathon window,
- high demo reliability,
- clear upgrade path to production architecture.

Core differentiators:
1. Multilingual AI Shop Assistant (Amharic, Afaan Oromo, English),
2. Escrow + OTP trust flow,
3. M-PESA sandbox payment demonstration,
4. installable PWA experience.

## Canonical Stack (Hackathon)

- Frontend: Next.js 15 App Router, Tailwind CSS, Shadcn UI
- App mode: PWA (`next-pwa`)
- Data/Auth/Storage: Supabase (PostgreSQL, Auth, Storage, RLS)
- AI: Google Gemini 1.5 Flash (`@google/generative-ai`)
- Payments: M-PESA Daraja Sandbox (STK Push + callback)
- Deployment: Vercel
- Language: TypeScript (strict mode)

## Architecture

```text
PWA (Next.js 15)
  |- Buyer UI
  |- Seller UI
  |- Runner UI
  |- Admin UI
  |- /demo, /demo/flow, /pitch
  |- Floating AI Assistant
       -> Server Action: queryAssistant()
            -> Supabase product/shop retrieval
            -> language detection
            -> Google Gemini 1.5 Flash

Server Actions + API Routes
  |- shops, products, cart, checkout, orders, assistant
  |- /api/mpesa/callback
  |- /api/admin/reset-demo

External Services
  |- Supabase (DB, Auth, Storage)
  |- Google Gemini API
  |- M-PESA Daraja Sandbox
```

## Design Principles

1. Demo-first, production-safe
2. AI assistant as the "wow" centerpiece
3. Single source of truth in Supabase
4. Minimal integration complexity (direct Gemini call, no middleware)
5. Reliable 4-actor demo loop
6. Multilingual UX by default

## Directory Structure

```text
misrak-shemeta-hackathon/
├── public/
│   ├── manifest.json
│   ├── icons/icon-192.png
│   ├── icons/icon-512.png
│   └── fonts/NotoSansEthiopic.woff2
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── auth/page.tsx
│   │   ├── products/page.tsx
│   │   ├── products/[id]/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── orders/[id]/page.tsx
│   │   ├── merchant/page.tsx
│   │   ├── merchant/products/page.tsx
│   │   ├── merchant/products/new/page.tsx
│   │   ├── merchant/orders/page.tsx
│   │   ├── runner/page.tsx
│   │   ├── admin/page.tsx
│   │   ├── demo/page.tsx
│   │   ├── demo/flow/page.tsx
│   │   ├── pitch/page.tsx
│   │   └── api/
│   │       ├── mpesa/callback/route.ts
│   │       └── admin/reset-demo/route.ts
│   ├── actions/
│   │   ├── shops.ts
│   │   ├── products.ts
│   │   ├── cart.ts
│   │   ├── checkout.ts
│   │   ├── orders.ts
│   │   └── assistant.ts
│   ├── components/
│   │   ├── layout/
│   │   ├── products/
│   │   ├── assistant/
│   │   ├── merchant/
│   │   └── onboarding/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── gemini/
│   │   ├── mpesa/
│   │   ├── logistics/
│   │   └── i18n/
│   ├── locales/
│   │   ├── en.json
│   │   ├── am.json
│   │   └── om.json
│   └── types/index.ts
├── scripts/seed.ts
├── supabase/migrations/
│   ├── 001_schema.sql
│   ├── 002_rls.sql
│   ├── 003_functions.sql
│   └── 004_seed.sql
└── .env.local
```

## Data Model and RLS

Hackathon canonical schema is the one in `requirements2.md`:
- `users`
- `shops`
- `products`
- `orders`
- `carts`
- `payment_logs`
- `shop_transactions`

RLS must be enabled on all core tables, with:
- public read for active products/shops,
- owner writes for own shop/product,
- buyer read for own orders/cart,
- seller read for own-shop orders.

## AI Assistant Design (Gemini)

### Flow

1. Buyer submits question in chat.
2. `queryAssistant(question, deliveryZone)` runs server-side.
3. Fetch active products joined with shop metadata from Supabase.
4. Detect language:
   - Ethiopic Unicode -> `am`
   - Oromo word patterns -> `om`
   - fallback -> `en`
5. Build prompt context with:
   - product name, price, stock, description, image,
   - shop name/city/phone,
   - computed delivery fee/time to buyer zone.
6. Call Gemini 1.5 Flash with instruction to answer in detected language.
7. Return:
   - conversational answer,
   - enriched product cards (image, price, phone, link, delivery fee),
   - related shop cards.

### Contract

```typescript
type Language = 'am' | 'om' | 'en';

interface AssistantResponse {
  answer: string;
  language: Language;
  products: Array<{
    id: string;
    name: string;
    price: number;
    image_url: string;
    shop_name: string;
    shop_phone: string;
    shop_city: 'Harar' | 'Dire_Dawa';
    view_url: string;
    delivery_fee?: number;
  }>;
  shops: Array<{
    id: string;
    name: string;
    city: 'Harar' | 'Dire_Dawa';
    phone: string;
    description: string | null;
  }>;
}
```

### Reliability Notes

- Use direct DB query for hackathon speed/reliability.
- Maintain only last 10 messages in session state.
- Timebox assistant response to 5 seconds target for 95th percentile.
- On Gemini error/rate-limit, return localized fallback message.

## Payment and Escrow Design (M-PESA)

### Checkout

1. Buyer confirms cart and phone number.
2. `initiateCheckout()` creates `PENDING` order and OTP.
3. Convert ETB to KES using fixed demo rate from requirements.
4. Call Daraja STK Push.
5. Save `CheckoutRequestID` on order.
6. Client shows waiting state and polls order status.

### Callback

`POST /api/mpesa/callback`:
- verifies payload structure,
- performs idempotency check by `CheckoutRequestID`,
- on success:
  - set order `PAID_ESCROW`,
  - decrement stock atomically,
  - append payment log,
- on failure:
  - set order `FAILED`,
  - append payment log.

### Order Completion

- Seller marks `DISPATCHED`.
- Runner submits OTP.
- On valid OTP:
  - set `COMPLETED`,
  - increment seller balance (subtotal only),
  - create `shop_transactions` entry.
- Lock after 3 failed OTP attempts.

## Order State Machine (Hackathon)

Allowed states:
- `PENDING`
- `PAID_ESCROW`
- `DISPATCHED`
- `COMPLETED`
- `FAILED`
- `LOCKED`

Allowed transitions:
- `PENDING -> PAID_ESCROW`
- `PENDING -> FAILED`
- `PAID_ESCROW -> DISPATCHED`
- `DISPATCHED -> COMPLETED`
- `DISPATCHED -> LOCKED` (3 failed OTP attempts)

## Eastern Triangle Pricing Engine

Canonical pricing matrix follows `requirements2.md` (expanded zones including Aweday). Implement as a pure utility in `src/lib/logistics/pricing.ts`.

Function:

```typescript
function calculateDeliveryFee(shopCity: 'Harar' | 'Dire_Dawa', deliveryZone: DeliveryZone): {
  fee: number;
  estimatedTime: string;
}
```

## 4-Actor Demo Design

### `/demo` page
- Four one-click role buttons:
  - Admin
  - Seller
  - Runner
  - Buyer
- Auto-sign in and redirect to role dashboard.
- Show 4-actor flow diagram.

### `/demo/flow` page
5-step timeline:
1. Admin overview
2. Seller dispatch
3. Buyer AI + payment
4. Runner OTP completion
5. Admin refreshed metrics

Each step has a "Switch to this role" link/button.

## UI and Branding

- Primary `#4F46E5` (indigo)
- Accent `#F59E0B` (gold)
- "Hackathon Demo" test-mode banner on all pages
- Floating "Powered by AI" badge on assistant trigger
- Noto Sans Ethiopic for Amharic readability

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini
GEMINI_API_KEY=

# M-PESA
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=174379
MPESA_PASSKEY=
MPESA_CALLBACK_URL=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_DEMO_MODE=true
```

## Non-Goals (Hackathon)

- Semantic vector search
- Complex event buses/workflow engines
- Multi-region infra hardening
- Full production compliance workflows

These remain post-hackathon upgrade items and should not block demo delivery.


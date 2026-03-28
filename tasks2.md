# Implementation Plan — Misrak Shemeta Hackathon Edition

## Overview

This is a 6-hour hackathon build plan. Every task is ordered by dependency and optimized for maximum demo impact. The goal is a working, investor-ready PWA with a multilingual RAG Shop Assistant, M-PESA test payments, and a polished UI — built in one session.

**Stack**: Next.js 15 · Supabase (PostgreSQL) · Google Gemini 1.5 Flash · M-PESA Daraja API · Tailwind CSS · Shadcn UI · next-pwa

**Build Order**: Infrastructure → Auth → Products → RAG Assistant → Payments → Polish

---

## Tasks

- [ ] 1. Project Setup and Infrastructure (Hour 1 — 60 min)
  - [ ] 1.1 Initialize Next.js 15 PWA project
    - Run `npx create-next-app@latest misrak-shemeta-hackathon --typescript --tailwind --app`
    - Install: `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`, `@google/generative-ai`, `next-pwa`, `framer-motion`, `@tanstack/react-query`, `lucide-react`
    - Install Shadcn UI: `npx shadcn@latest init` — add button, card, input, badge, dialog, sheet, skeleton, toast, avatar
    - Configure `next.config.js` with `next-pwa` plugin, disable PWA in development
    - _Requirements: 1.1, 1.4_

  - [ ] 1.2 Create Web App Manifest and PWA assets
    - Create `public/manifest.json` with name "Misrak Shemeta", short_name "ሚሳ ሸመታ", theme_color "#4F46E5", display "standalone"
    - Add 192x192 and 512x512 PNG icons with the brand logo
    - Add `<link rel="manifest">` and `<meta name="theme-color">` to `app/layout.tsx`
    - Register Service Worker via next-pwa for offline caching
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 1.3 Set up Supabase project and database schema
    - Create Supabase project, run `001_schema.sql` migration
    - Create tables: `users`, `shops`, `products`, `orders`, `carts`, `payment_logs`, `shop_transactions`
    - Run `002_rls.sql` — enable Row Level Security with all policies
    - Run `003_functions.sql` — add helper functions
    - Create indexes on `products.shop_id`, `products.category`, `orders.buyer_id`, `orders.status`
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

    > **Note**: Skip embedding tables for the hackathon.
    > Skip vector extension and similarity search functions.
    > These are the production upgrade path — not needed for the direct Gemini approach.

  - [ ] 1.4 Configure environment variables and Supabase clients
    - Create `.env.local` with all required keys:
      ```
      NEXT_PUBLIC_SUPABASE_URL=
      NEXT_PUBLIC_SUPABASE_ANON_KEY=
      SUPABASE_SERVICE_ROLE_KEY=
      GEMINI_API_KEY=
      MPESA_CONSUMER_KEY=
      MPESA_CONSUMER_SECRET=
      MPESA_SHORTCODE=174379
      MPESA_PASSKEY=
      MPESA_CALLBACK_URL=
      NEXT_PUBLIC_APP_URL=
      NEXT_PUBLIC_DEMO_MODE=true
      ```
    - Create `src/lib/supabase/client.ts` for browser client
    - Create `src/lib/supabase/server.ts` for server-side client with service role key
    - Create `src/lib/supabase/types.ts` with TypeScript types matching the schema
    - _Requirements: 9.10_

  - [ ] 1.5 Set up Gemini client
    - Install `@google/generative-ai` package
    - Create `src/lib/gemini/client.ts` — initialize Gemini client with API key
    - Add `GEMINI_API_KEY` to `.env.local`
    - Test with a simple generation call to verify the key works
    - _Requirements: 6.5_

    > **Note**: No external automation tools needed for the hackathon.
    > The AI assistant queries Supabase directly and calls Gemini in one Server Action.
    > Semantic vector search is the production upgrade path — not needed for the demo.

  - [ ] 1.6 Seed demo data
    - Create `scripts/seed.ts` with 3 shops and 15 products (realistic Eastern Ethiopia data)
    - Shops: "Harar Book Hub" (Harar), "DDU Electronics" (Dire_Dawa), "Haramaya Essentials" (Harar)
    - Products: 5 textbooks, 4 electronics, 3 clothing, 3 stationery — each with 50+ word description, ETB price, stock, image URL
    - Run seed and verify all 18 records appear in Supabase and are queryable
    - _Requirements: 12.1, 12.2_

- [ ] 2. Authentication and User Profiles (Hour 1–2 — 30 min)
  - [ ] 2.1 Implement Supabase Auth
    - Create `src/lib/auth/provider.tsx` — AuthProvider context wrapping the app
    - Implement email/password sign-up and sign-in
    - Implement Google OAuth with `supabase.auth.signInWithOAuth({ provider: 'google' })`
    - Create `src/app/auth/page.tsx` — sign-in/sign-up page with brand logo and language switcher
    - Handle auth state changes with `supabase.auth.onAuthStateChange()`
    - _Requirements: 2.1, 2.2, 2.5_

  - [ ] 2.2 Build campus location onboarding
    - Create `src/components/onboarding/CampusSelector.tsx` — modal shown on first sign-in
    - Display three options: Haramaya Main Campus, Harar Campus, DDU
    - On selection, upsert to Supabase `users` table with `delivery_zone` and `language`
    - _Requirements: 2.3, 2.4_

  - [ ] 2.3 Build navigation with user context
    - Create `src/components/layout/Header.tsx` with: 🌅 logo, language switcher, user avatar, cart badge
    - Create `src/components/layout/BottomNav.tsx` for mobile: Home, Browse, Cart, Orders, Profile
    - Display "🧪 Hackathon Demo" banner at top of every page
    - _Requirements: 13.2, 13.6, 13.8_

- [ ] 3. Shop and Product Management (Hour 2 — 45 min)
  - [ ] 3.1 Implement shop registration Server Action
    - Create `src/app/actions/shops.ts` with `registerShop()` Server Action
    - Validate all fields, insert into Supabase `shops` table
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

  - [ ] 3.2 Implement product CRUD Server Actions
    - Create `src/app/actions/products.ts` with `createProduct()`, `updateProduct()`, `deleteProduct()`, `getProductsByShop()`
    - `createProduct()`: validate, upload images to Supabase Storage, insert to `products`
    - `updateProduct()`: verify ownership, update record
    - `deleteProduct()`: set `is_active = false`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

  - [ ] 3.3 Build product form and merchant dashboard
    - Create `src/components/merchant/ProductForm.tsx` with all fields and image upload with preview
    - Create `src/app/merchant/page.tsx` — balance card, pending orders, product count
    - Create `src/app/merchant/products/page.tsx` — product table with edit/delete
    - _Requirements: 4.7, 4.8_

- [ ] 4. Product Catalog and Discovery (Hour 2–3 — 30 min)
  - [ ] 4.1 Build product catalog page
    - Create `src/app/products/page.tsx` — responsive grid with React Query (60s stale time)
    - Implement skeleton loading (8 cards), fade-in animation with Framer Motion
    - Display live platform stats banner: X products, Y shops, Z buyers
    - _Requirements: 5.1, 5.2, 13.3, 13.7, 16.5, 16.7_

  - [ ] 4.2 Build ProductCard and product detail page
    - Create `src/components/products/ProductCard.tsx` — image, name, price, shop, stock badge, Add to Cart
    - Create `src/app/products/[id]/page.tsx` — image carousel, full description, shop info card with phone, delivery fee
    - _Requirements: 5.2, 5.5, 5.6, 5.7, 5.8_

  - [ ] 4.3 Build search and filter panel
    - Create `src/components/products/FilterPanel.tsx` — category chips, city filter, price range slider
    - Keyword search with 300ms debounce, AND logic for multiple filters
    - _Requirements: 5.3, 5.4_

- [ ] 5. Multilingual AI Shop Assistant (Hour 3–4 — 60 min) ⭐ CORE FEATURE
  - [ ] 5.1 Build the queryAssistant Server Action
    - Create `src/app/actions/assistant.ts` with `queryAssistant()` Server Action
    - Fetch all active products + shops from Supabase with a single JOIN query (direct, no middleware)
    - Implement `detectLanguage()`: Ethiopic Unicode → Amharic, Oromo patterns → Afaan Oromo, else English
    - Build context string from all products (name, price, description, images, shop name, phone, delivery fee)
    - Call Google Gemini 1.5 Flash with system prompt instructing response in detected language
    - Extract mentioned products from response → build rich product cards with images + delivery fees
    - Return `{ answer, language, products[], shops[] }`
    - Handle errors with graceful fallback message in detected language
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.9_

  - [ ] 5.2 Build the Shop Assistant chat UI
    - Create `src/components/assistant/ShopAssistant.tsx` — floating 💬 button, slide-up chat panel
    - Welcome message in buyer's preferred language on open
    - Message input with send button, typing indicator (animated dots)
    - Maintain last 10 messages in session state
    - "Powered by AI 🤖" badge on the floating button
    - _Requirements: 6.1, 6.2, 6.10, 6.11, 13.4_

  - [ ] 5.3 Build rich response renderer
    - Create `src/components/assistant/RichResponse.tsx`
    - Render AI text with Noto Sans Ethiopic font for Amharic
    - For each product: inline card with image thumbnail, name, price, shop name, phone (clickable tel: link), delivery fee, "View Product →" link
    - For each shop: info card with name, city, phone, description
    - _Requirements: 6.6, 6.7, 6.8_

  - [ ] 5.4 Test all three languages end-to-end
    - Test Amharic: "ምን ዓይነት ኮምፒዩተር አለ?" → verify Amharic response with product images + shop phone
    - Test Afaan Oromo: "Meeshaalee barnoota meeqa qabdu?" → verify Oromo response
    - Test English: "What's the cheapest textbook in Harar?" → verify English response
    - Verify all three return product images, prices, and shop contact info
    - _Requirements: 6.3, 6.4_

  - [ ] 5.5 Build demo mode for the assistant
    - Create `src/app/demo/page.tsx` — 4-actor role selector (Admin, Seller, Runner, Buyer)
    - Buyer button: auto-signs in as demo buyer, opens assistant pre-populated with "ምን ዓይነት መጻሕፍት አለ?"
    - Add 3 suggested question chips in all three languages below the input
    - _Requirements: 12.3, 12.4, 19.2, 19.3_

- [ ] 6. Shopping Cart (Hour 4 — 20 min)
  - [ ] 6.1 Implement cart Server Actions and cart page
    - Create `src/app/actions/cart.ts` with `addToCart()`, `updateCartItem()`, `removeFromCart()`, `getCart()`
    - Persist cart in Supabase `carts` table, optimistic updates with React Query
    - Create `src/app/cart/page.tsx` — items, quantity controls, delivery fee breakdown, total, checkout button
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 7. M-PESA Payment Integration (Hour 4–5 — 60 min) ⭐ INVESTOR WOW FACTOR
  - [ ] 7.1 Set up M-PESA Daraja API client
    - Create `src/lib/mpesa/client.ts` with `getAccessToken()`, `stkPush()`, `generatePassword()`
    - Sandbox base URL: `https://sandbox.safaricom.co.ke`
    - All credentials from environment variables
    - _Requirements: 9.1, 9.2, 9.10_

  - [ ] 7.2 Implement checkout Server Action and checkout page
    - Create `src/app/actions/checkout.ts` with `initiateCheckout()` — creates order, generates OTP, calls STK Push
    - Create `src/app/checkout/page.tsx` — order summary, ETB→KES conversion, phone input, "Pay with M-PESA 📱" button
    - Show "Waiting for M-PESA confirmation..." spinner after STK Push
    - Display "🧪 Test Mode — No real money charged" banner
    - _Requirements: 9.3, 9.8, 10.1, 10.2_

  - [ ] 7.3 Implement M-PESA callback endpoint
    - Create `src/app/api/mpesa/callback/route.ts` POST handler
    - Idempotency check: if order already `PAID_ESCROW`, return 200 without processing
    - On success: update order to `PAID_ESCROW`, decrement stock, log to `payment_logs`
    - On failure: update order to `FAILED`, log error
    - _Requirements: 9.4, 9.5, 9.6, 9.7, 9.9_

  - [ ] 7.4 Build order confirmation screen
    - Create `src/app/orders/[id]/page.tsx` — order ID, status badge, items, total, OTP (large font)
    - Display status timeline: PENDING → PAID_ESCROW → DISPATCHED → COMPLETED
    - Display shop contact info for delivery coordination
    - _Requirements: 9.5, 10.2, 10.7_

- [ ] 8. Escrow and OTP Flow (Hour 5 — 20 min)
  - [ ] 8.1 Implement OTP validation and shop order management
    - Create `validateOTP()` Server Action — check OTP, increment attempts, lock after 3 failures
    - On success: update order to `COMPLETED`, increment shop balance via Supabase transaction
    - Create `src/app/merchant/orders/page.tsx` — order list with "Mark as Dispatched" button
    - _Requirements: 10.3, 10.4, 10.5, 10.6_

- [ ] 9. Investor Demo Polish (Hour 5–6 — 60 min) ⭐ CRITICAL FOR PITCH
  - [ ] 9.1 Build the investor pitch page
    - Create `src/app/pitch/page.tsx` — full-screen slides with keyboard navigation
    - Slide 1: Problem — "Shops are invisible. Buyers travel hours. Sellers can't scale. Runners have no structured work. And when people do trade — payments get scammed, goods don't arrive. There is no trust."
    - Slide 2: Solution — Misrak Shemeta: the trust layer that connects buyers, sellers, and runners across Eastern Ethiopia with escrow-protected payments and a 24/7 AI assistant
    - Slide 3: Market Size — "3M+ people across Harar, Dire Dawa, Haramaya, Aweday and surrounding areas"
    - Slide 4: Tech Stack — Supabase, Google Gemini 1.5 Flash, M-PESA, Next.js PWA
    - Slide 5: Live Traction — real-time stats from Supabase
    - Slide 6: Team + Contact
    - _Requirements: 13.5_

  - [ ] 9.2 Build platform stats banner and language switcher
    - Create `src/components/layout/StatsBanner.tsx` — animated counters for products, shops, buyers
    - Create `src/components/layout/LanguageSwitcher.tsx` — 🇬🇧 EN / አማ / OM
    - Create translation files: `src/locales/en.json`, `src/locales/am.json`, `src/locales/om.json`
    - _Requirements: 13.3, 13.6_

  - [ ] 9.3 Final UI polish
    - Apply premium color scheme: indigo (#4F46E5) primary, gold (#F59E0B) accent
    - Add Noto Sans Ethiopic font for proper Amharic rendering
    - Verify all pages work on 375px mobile and 1440px desktop
    - Run `npm run build` — fix all TypeScript errors before the hackathon
    - _Requirements: 13.1, 13.7, 16.1_

  - [ ] 9.4 Create demo reset script
    - Create `src/app/api/admin/reset-demo/route.ts` — re-seeds all demo data and resets demo cart
    - Add "Reset Demo" button at `/admin`
    - _Requirements: 12.5_

- [ ] 10. Testing and Hackathon Readiness (Hour 6 — 30 min)
  - [ ] 10.1 End-to-end demo flow test
    - Test: sign up → campus selection → browse catalog → ask AI in all 3 languages → add to cart → M-PESA → OTP
    - Verify RAG returns product images, prices, and shop phone numbers in all three languages
    - Verify M-PESA test payment completes and order status updates correctly
    - Verify PWA installs on Android Chrome and iOS Safari

  - [ ] 10.2 Performance and reliability check
    - Run Lighthouse audit — target 80+ performance score
    - Verify catalog loads under 2 seconds, RAG responds under 5 seconds
    - Verify offline mode shows cached products
    - Add error boundaries to all major components

  - [ ] 10.3 Rehearse the 4-actor demo script
    - Open `/demo` — shows 4 role buttons (Admin, Seller, Runner, Buyer)
    - **Tab 1 — Admin**: Click Admin → show live stats dashboard, total revenue, escrow held, activity feed
    - **Tab 2 — Seller**: Click Seller → show shop dashboard, click "Mark as Dispatched" on pre-seeded PAID_ESCROW order
    - **Tab 3 — Buyer**: Click Buyer → AI assistant opens, ask "ምን ዓይነት መጻሕፍት አለ?" in Amharic → show product image + price + shop phone → add to cart → M-PESA checkout → show STK Push screen
    - **Tab 4 — Runner**: Click Runner → show dispatched order, submit OTP → order flips to COMPLETED → switch back to Seller tab to show balance updated
    - **Tab 1 — Admin**: Refresh admin dashboard → show revenue increased, order count updated
    - Open `/pitch` for investor slides
    - Practice full 4-actor loop 2–3 times — target under 5 minutes total

- [ ] 11. Runner Flow (Hour 5 — 20 min)
  - [ ] 11.1 Build Runner dashboard
    - Create `src/app/runner/page.tsx` — list of DISPATCHED orders in runner's zone
    - Each order card: order ID, buyer delivery zone, product names, seller shop name + phone
    - OTP input form with submit button and attempt counter
    - Auto-refresh every 10 seconds using React Query refetchInterval
    - Completed deliveries count and summary
    - _Requirements: 17.1, 17.2, 17.3, 17.8, 17.9_

  - [ ] 11.2 Implement OTP validation Server Action for Runner
    - Create `validateOTP()` in `src/app/actions/orders.ts`
    - Check OTP matches order record, increment `otp_attempts`
    - Lock order after 3 failed attempts
    - On success: update order to `COMPLETED`, increment seller balance via Supabase transaction
    - Return clear success/error response to Runner UI
    - _Requirements: 17.4, 17.5, 17.6, 17.7_

- [ ] 12. Super Admin Dashboard (Hour 5–6 — 30 min)
  - [ ] 12.1 Build Admin dashboard with live stats
    - Create `src/app/admin/page.tsx` with live Supabase count queries
    - Stats cards: total buyers, sellers, runners, products, orders by status
    - Platform revenue (sum of COMPLETED totals) and escrow held (PAID_ESCROW + DISPATCHED)
    - Real-time activity feed: last 10 events (new orders, payments, completions)
    - _Requirements: 18.1, 18.2, 18.3_

  - [ ] 12.2 Build Admin user and order management tables
    - User management table: all buyers, sellers, runners with role badges
    - Shop management table: shop name, balance, product count, status
    - Order management table: all orders with manual status update button
    - Payment logs table: all M-PESA transactions with status
    - _Requirements: 18.4, 18.5, 18.6, 18.7, 18.8_

- [ ] 13. Pre-Seeded Demo Accounts and 4-Actor Demo Page (Hour 6 — 20 min)
  - [ ] 13.1 Seed all four demo accounts
    - Add to `scripts/seed.ts`: create 4 Supabase Auth users with fixed credentials
    - `admin@misrak.demo` / `demo1234` — role: admin
    - `seller@misrak.demo` / `demo1234` — role: seller, linked to "Harar Book Hub"
    - `runner@misrak.demo` / `demo1234` — role: runner, zone: Harar_City
    - `buyer@misrak.demo` / `demo1234` — role: buyer, delivery_zone: Haramaya_Campus, language: am
    - Pre-create one order in PAID_ESCROW (for Seller to dispatch) and one in DISPATCHED (for Runner to complete)
    - _Requirements: 19.1, 19.5, 19.6_

  - [ ] 13.2 Build the `/demo` role-selection page
    - Create `src/app/demo/page.tsx` with 4 large role buttons
    - 🛡️ Admin, 🏪 Seller, 🚴 Runner, 🛍️ Buyer — each auto-signs in and redirects
    - Display 4-actor flow diagram showing how roles connect
    - No password entry needed — one click per role
    - _Requirements: 19.2, 19.3, 19.4_

  - [ ] 13.3 Build the `/demo/flow` guided demo page
    - Create `src/app/demo/flow/page.tsx` — visual 5-step timeline
    - Step 1: Admin stats → Step 2: Seller dispatches → Step 3: Buyer pays → Step 4: Runner confirms → Step 5: Admin sees revenue
    - Each step has "Switch to this role →" button opening correct dashboard in new tab
    - Estimated time per step (30 seconds each)
    - "Demo Complete ✅" screen after Step 5
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

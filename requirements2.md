# Requirements Document — Misrak Shemeta Hackathon Edition

## Introduction

Misrak Shemeta is a PWA marketplace for Eastern Ethiopia that solves three interconnected problems at once — and the foundation holding all of them together is **trust**:

- **For Buyers**: Shops in Harar, Dire Dawa, Haramaya, and Aweday are invisible online. Buyers must physically travel to find products, compare prices, or contact sellers. And when they do buy, there's no protection — payments get scammed, goods don't arrive, and there's no recourse. Misrak Shemeta lets any buyer browse every shop in the region from their phone, and protects every payment with a built-in **Escrow system** — funds are held safely until the buyer confirms delivery with an OTP.

- **For Sellers**: Local shop owners can only reach walk-in customers. Their sales are limited by physical location and opening hours. And buyers hesitate to pay upfront without trust. Misrak Shemeta gives every seller a digital storefront visible to thousands of buyers across the region, with an AI assistant that answers buyer questions 24/7 — even while the seller sleeps — and an escrow system that guarantees sellers get paid when they deliver.

- **For Runners**: Delivery work in the region is informal and unstructured. Misrak Shemeta creates a formal delivery job layer — Bajaj drivers and couriers get consistent, trackable delivery work with OTP-confirmed completion and earnings tracking.

The **Escrow + OTP system** is the trust infrastructure that makes all three sides work: buyers pay safely, sellers deliver confidently, and runners complete verifiably. This trust layer does not exist anywhere in Eastern Ethiopia today.

The platform serves everyone — university students, residents, professionals, and businesses — across Harar, Dire Dawa, Haramaya, Aweday, and surrounding areas.

The system showcases three breakthrough innovations for Eastern Ethiopia's commerce ecosystem:

1. **Multilingual AI Shop Assistant** — An AI assistant that answers detailed questions about shops and products in Amharic, Afaan Oromo, and English, powered by Gemini 1.5 Flash with direct Supabase product retrieval.
2. **M-PESA Payment Integration (Test Mode)** — Demonstrating real African fintech payment infrastructure, signaling a pan-African payment vision.
3. **PWA-first Architecture** — Installable, offline-capable, works on any device without an app store — perfect for low-bandwidth environments across the region.

The platform connects buyers anywhere in the Eastern Ethiopia region with sellers in Harar and Dire Dawa, enabling safe, AI-assisted commerce with escrow-protected payments.

> **Hackathon Goal**: Build a working, impressive, investor-ready demo in 6 hours that proves the concept, showcases the AI differentiator, and tells a compelling story about Eastern Ethiopia's untapped commerce potential.

---

## Glossary

- **PWA**: Progressive Web App — installable web application with offline support and native-like experience
- **RAG**: Retrieval-Augmented Generation — AI technique that retrieves relevant data before generating a response
- **Supabase**: Open-source Firebase alternative with PostgreSQL and real-time capabilities
- **Shop_Assistant**: The multilingual AI chatbot embedded in the marketplace, powered by Gemini 1.5 Flash
- **Semantic_Search**: Finding relevant results based on meaning rather than exact keyword match
- **Shop**: A vendor account with products, location, contact info, and owner details
- **Product**: An item listed for sale with name, description, price, images, and stock
- **Buyer**: Any person who browses and purchases products — students, residents, professionals, or businesses in the Eastern Ethiopia region
- **Seller**: A person or business who registers a shop and lists products for sale
- **Delivery_Zone**: The buyer's selected area for delivery — includes campuses, city neighborhoods, and towns across the Eastern Ethiopia region
- **Escrow**: Platform-held payment released only after delivery confirmation
- **OTP**: 6-digit one-time password used to confirm delivery and release escrow funds
- **Delivery_Route**: A logistics path between seller city and buyer delivery zone with fixed fee
- **Eastern_Triangle**: The geographic commerce network: Harar ↔ Haramaya ↔ Dire Dawa
- **Language_Detection**: Automatic identification of user's language (Amharic, Afaan Oromo, English)
- **Rich_Response**: An AI response that includes text, product images, price, and shop contact info
- **Demo_Mode**: A pre-seeded data state that makes the hackathon demo reliable and impressive

---

## Requirements

### Requirement 1: PWA Foundation and Installability

**User Story:** As a buyer or investor viewing the demo, I want to install the app on my phone directly from the browser, so that I can see it works like a native app without an app store.

#### Acceptance Criteria

1. THE PWA SHALL include a valid `manifest.json` with app name "Misrak Shemeta", short name "ሚሳ ሸመታ", icons (192x192 and 512x512), theme color, and `display: standalone`
2. THE PWA SHALL register a Service Worker that caches the shell, home page, and product catalog for offline access
3. WHEN a user visits the PWA on mobile Chrome or Safari, THE PWA SHALL display an "Add to Home Screen" prompt
4. THE PWA SHALL load the home page within 3 seconds on a 3G connection
5. WHEN the device is offline, THE PWA SHALL display cached product listings with an offline indicator banner
6. THE PWA SHALL use a responsive layout that works on 375px (iPhone SE) through 1440px (desktop) viewports
7. THE PWA SHALL display a splash screen with the Misrak Shemeta logo and 🌅 brand emoji on launch

---

### Requirement 2: Buyer Authentication (Supabase Auth)

**User Story:** As a buyer, I want to sign in quickly using my email or Google account, so that I can access the marketplace without creating a separate account.

#### Acceptance Criteria

1. THE Platform SHALL provide email/password sign-up and sign-in using Supabase Auth
2. THE Platform SHALL provide Google OAuth sign-in as a one-tap option
3. WHEN a buyer signs in for the first time, THE Platform SHALL prompt them to select their delivery zone from the available options in the Eastern Ethiopia region
4. THE Platform SHALL store the buyer's delivery zone, preferred language, and display name in the Supabase `users` table
5. WHEN a buyer returns, THE Platform SHALL restore their session automatically without re-authentication
6. THE Platform SHALL display the buyer's first name in the navigation bar after sign-in
7. WHEN authentication fails, THE Platform SHALL display a clear, friendly error message in the buyer's preferred language

---

### Requirement 3: Seller Authentication and Shop Registration

**User Story:** As a seller, I want to register my shop with my contact details and location, so that buyers can find me and the AI assistant can answer questions about my shop.

#### Acceptance Criteria

1. THE Platform SHALL allow sellers to register using email/password via Supabase Auth
2. WHEN a seller registers, THE Platform SHALL collect: shop name, owner full name, city (Harar or Dire_Dawa), contact phone number (Ethiopian format), and a short shop description
3. THE Platform SHALL create a record in the Supabase `shops` table with a unique `shop_id`, `owner_id`, `name`, `city`, `phone`, `description`, `created_at`, and `is_active` fields
4. WHEN a shop is created, THE Platform SHALL make the shop's data immediately available to the AI assistant via the product catalog query
5. THE Platform SHALL display the seller's dashboard immediately after registration
6. THE Platform SHALL validate the phone number format and reject invalid entries with a clear error message

---

### Requirement 4: Product Listing Management

**User Story:** As a seller, I want to create detailed product listings with images, so that buyers can find my products through search and the AI assistant can answer questions about them.

#### Acceptance Criteria

1. WHEN a seller creates a product, THE Platform SHALL require: product name, description (minimum 20 characters), price in ETB, stock quantity, category, and at least one image
2. THE Platform SHALL upload product images to Supabase Storage under the path `/products/{shop_id}/{product_id}/`
3. THE Platform SHALL store product metadata in the Supabase `products` table with fields: `product_id`, `shop_id`, `name`, `description`, `price`, `stock`, `category`, `images` (array of URLs), `created_at`, `is_active`
4. WHEN a product is created or updated, THE Platform SHALL make the product immediately available to the AI assistant via the product catalog query
5. THE Platform SHALL support product categories: Textbooks, Electronics, Clothing, Food & Beverages, Stationery, Accessories, Home & Living, Other
6. WHEN a seller deletes a product, THE Platform SHALL mark it as `is_active = false` so it is excluded from AI assistant responses
7. THE Platform SHALL display a product management table showing all products with edit and delete actions
8. THE Platform SHALL validate that price is a positive number and stock is a non-negative integer

---

### Requirement 5: Product Discovery and Catalog

**User Story:** As a buyer, I want to browse and search products from all shops, so that I can find what I need quickly.

#### Acceptance Criteria

1. THE Platform SHALL display a product catalog grid showing all active products from all shops
2. EACH product card SHALL display: product image, name, price in ETB, shop name, shop city, and stock status
3. THE Platform SHALL support filtering products by: category, city (Harar / Dire_Dawa), and price range
4. THE Platform SHALL support keyword search across product name and description (case-insensitive)
5. WHEN a buyer clicks a product, THE Platform SHALL display a product detail page with: all images (carousel), full description, price, stock, shop name, shop city, shop phone number, and an "Add to Cart" button
6. THE Platform SHALL display a "Low Stock" badge when stock is 5 or fewer units
7. THE Platform SHALL display an "Out of Stock" badge and disable the "Add to Cart" button when stock is 0
8. THE Platform SHALL show the estimated delivery fee on the product detail page based on the buyer's delivery zone

---

### Requirement 6: Multilingual RAG-Based Shop Assistant — Core Feature

**User Story:** As a buyer, I want to ask questions about products and shops in my own language (Amharic, Afaan Oromo, or English), so that I can get detailed, accurate answers without browsing manually.

#### Acceptance Criteria

1. THE Shop_Assistant SHALL be accessible via a floating chat button (💬) visible on all pages of the PWA
2. WHEN a buyer opens the Shop_Assistant, THE Platform SHALL display a welcoming message in the buyer's preferred language
3. THE Shop_Assistant SHALL automatically detect the language of the buyer's question (Amharic, Afaan Oromo, or English) using the first message content
4. THE Shop_Assistant SHALL respond in the same language as the buyer's question, regardless of the language stored in the database
5. WHEN a buyer asks a question, THE Platform SHALL:
   a. Fetch all active products and shops from Supabase using a direct database query
   b. Detect the language of the question (Amharic via Ethiopic Unicode, Afaan Oromo via pattern matching, English as default)
   c. Construct a context-rich prompt including all product details, shop details, prices, images, and contact info
   d. Call Google Gemini 1.5 Flash with the prompt and buyer's question, instructing response in the detected language
   e. Return a rich, conversational response in the detected language with product cards
6. THE Shop_Assistant response SHALL include, when relevant:
   - Product name, price in ETB, and stock availability
   - Product image (displayed inline in the chat as a thumbnail)
   - Shop name, city, and contact phone number
   - Estimated delivery fee to the buyer's delivery zone
   - A direct "View Product" link that opens the product detail page
7. THE Shop_Assistant SHALL handle questions about:
   - Product availability ("Do you have calculus textbooks?")
   - Price inquiries ("What's the cheapest laptop in Harar?")
   - Shop discovery ("Which shops are in Dire Dawa?")
   - Contact information ("How do I contact the electronics shop?")
   - Delivery information ("How long does delivery to Haramaya take?")
   - Comparisons ("Compare the two cheapest phones available")
8. WHEN no relevant products or shops are found, THE Shop_Assistant SHALL respond with a friendly "not found" message in the buyer's language and suggest browsing the catalog
9. THE Shop_Assistant SHALL respond within 5 seconds for 95% of queries
10. THE Shop_Assistant SHALL maintain a conversation history of the last 10 messages within a session
11. THE Shop_Assistant SHALL display a typing indicator while generating a response
12. WHEN a new product is added or updated, THE Platform SHALL make it available to the AI assistant immediately (no sync delay — direct database query)

---

### Requirement 7: AI Shop Assistant Implementation

**User Story:** As a developer, I want a simple, reliable AI assistant implementation that works without external automation tools, so that the hackathon demo is stable and fast to build.

#### Acceptance Criteria

1. THE Platform SHALL implement the `queryAssistant()` Server Action that fetches all active products and shops from Supabase in a single JOIN query
2. THE `queryAssistant()` function SHALL detect the buyer's language from the question text:
   - Ethiopic Unicode characters (U+1200–U+137F) → Amharic
   - Common Afaan Oromo word patterns → Afaan Oromo
   - Default → English
3. THE `queryAssistant()` function SHALL build a context string containing all product names, prices, descriptions, images, shop names, phones, and delivery fees
4. THE `queryAssistant()` function SHALL call Google Gemini 1.5 Flash with the context and question, instructing it to respond in the detected language
5. THE `queryAssistant()` function SHALL extract product mentions from the Gemini 1.5 Flash response and return enriched product cards
6. THE Gemini 1.5 Flash system prompt SHALL instruct the model to always include product price, shop name, shop phone, and delivery fee when recommending products
7. THE Platform SHALL handle Google Gemini API errors gracefully with a fallback message in the detected language

> **Production Upgrade Path**: When the catalog exceeds ~200 products, replace the full-catalog query with semantic vector search. The `queryAssistant()` function signature stays identical — only the retrieval step changes.

---

### Requirement 8: Shopping Cart

**User Story:** As a buyer, I want to add products to a cart and see the total cost including delivery, so that I can review my order before paying.

#### Acceptance Criteria

1. THE Platform SHALL maintain a cart in Supabase `carts` table linked to the buyer's `user_id`
2. WHEN a buyer adds a product, THE Platform SHALL store `product_id`, `quantity`, `price_at_add`, and `shop_id`
3. THE Platform SHALL display the cart with: product image, name, quantity controls, unit price, and line total
4. THE Platform SHALL calculate and display the delivery fee based on the Eastern Triangle pricing matrix
5. THE Platform SHALL display the order total as: subtotal + delivery fee
6. WHEN a product goes out of stock while in the cart, THE Platform SHALL display a warning and disable checkout for that item
7. THE Platform SHALL persist the cart across sessions (not cleared on page refresh)

---

### Requirement 9: M-PESA Payment Integration (Test Mode)

**User Story:** As a buyer, I want to pay for my order using M-PESA, so that I can use a widely-adopted East African mobile money platform.

#### Acceptance Criteria

1. THE Platform SHALL integrate with the M-PESA Daraja API in Sandbox (test) mode
2. THE Platform SHALL use the STK Push (Lipa Na M-PESA Online) flow to initiate payment
3. WHEN a buyer initiates checkout, THE Platform SHALL:
   a. Display a phone number input pre-filled with the buyer's registered phone
   b. Show the total amount in KES (converted from ETB at a fixed demo rate of 1 ETB = 0.65 KES)
   c. Trigger an STK Push to the buyer's phone number via the Daraja API
   d. Display a "Waiting for payment confirmation..." screen with a spinner
4. THE Platform SHALL expose a `/api/mpesa/callback` endpoint to receive payment confirmation from M-PESA
5. WHEN the M-PESA callback confirms payment, THE Platform SHALL:
   a. Update the order status to `PAID_ESCROW` in Supabase
   b. Decrement product stock quantities
   c. Display a payment success screen with order ID and OTP
6. WHEN the M-PESA callback reports failure, THE Platform SHALL display a clear error message and allow retry
7. THE Platform SHALL implement idempotency: if the same `CheckoutRequestID` is received twice, THE Platform SHALL return success without creating a duplicate order
8. THE Platform SHALL display a "🧪 Test Mode — No real money charged" banner during the demo
9. THE Platform SHALL log all M-PESA API requests and responses to the Supabase `payment_logs` table
10. THE Platform SHALL use environment variables for all M-PESA credentials: `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_URL`

---

### Requirement 10: Escrow and OTP Delivery Confirmation

**User Story:** As a buyer, I want my payment held safely until I confirm delivery, so that I'm protected from fraud.

#### Acceptance Criteria

1. WHEN an order is created, THE Platform SHALL generate a unique 6-digit OTP and store it with the order
2. THE Platform SHALL display the OTP to the buyer on the order confirmation screen
3. WHEN the seller marks an order as dispatched, THE Platform SHALL update the order status to `DISPATCHED`
4. WHEN the buyer provides the OTP to the delivery runner, THE Platform SHALL validate it and update the order status to `COMPLETED`
5. WHEN an order is `COMPLETED`, THE Platform SHALL increment the seller's balance by the order subtotal (excluding delivery fee)
6. THE Platform SHALL allow a maximum of 3 OTP attempts before locking the order for admin review
7. THE Platform SHALL display the order status timeline: PENDING → PAID_ESCROW → DISPATCHED → COMPLETED

---

### Requirement 11: Eastern Triangle Delivery Pricing

**User Story:** As a buyer, I want to know the exact delivery fee before I pay, so that I can make an informed decision.

#### Acceptance Criteria

1. THE Platform SHALL implement the Eastern Triangle pricing matrix covering all delivery zones:
   - Harar → Harar City / Harar Campus: **40 ETB** (30–60 min)
   - Dire_Dawa → Dire Dawa City / DDU: **40 ETB** (30–60 min)
   - Harar → Aweday Town: **60 ETB** (1–2 hours)
   - Dire_Dawa → Aweday Town: **80 ETB** (1–2 hours)
   - Harar → Haramaya Town / Haramaya Campus: **100 ETB** (3–4 hours)
   - Dire_Dawa → Haramaya Town / Haramaya Campus: **100 ETB** (3–4 hours)
   - Harar → Dire Dawa City / DDU: **180 ETB** (5–6 hours)
   - Dire_Dawa → Harar City / Harar Campus: **180 ETB** (5–6 hours)
2. THE Platform SHALL display both the delivery fee and estimated delivery time on the product detail page and checkout screen
3. THE Platform SHALL calculate the delivery fee based on the buyer's registered delivery zone and the shop's city

---

### Requirement 12: Demo Data Seeding (Hackathon Critical)

**User Story:** As a hackathon presenter, I want the app pre-loaded with realistic, impressive demo data, so that the AI assistant can answer questions confidently during the live demo.

#### Acceptance Criteria

1. THE Platform SHALL include a seed script that populates the following demo data:
   - **3 shops**: "Harar Book Hub" (Harar), "DDU Electronics" (Dire_Dawa), "Haramaya Essentials" (Harar)
   - **15 products** across all shops covering: textbooks, laptops, phones, stationery, clothing, home items
   - Each product SHALL have a realistic name, description (50+ words), price, stock, and at least one image URL
   - Each shop SHALL have a realistic phone number, description, and owner name
2. THE seed script SHALL run successfully and all seeded products and shops SHALL be immediately queryable by the AI assistant
3. THE Platform SHALL include a `/demo` route that auto-signs in as a demo buyer and opens the Shop Assistant with a pre-typed question in Amharic: "ምን ዓይነት ምርቶች አለ?"
4. THE demo buyer SHALL be pre-configured with `delivery_zone = Haramaya_Town` and `language = am`
5. THE Platform SHALL include a "Reset Demo" button in the admin panel that re-seeds all data

---

### Requirement 13: Investor Demo Mode UI

**User Story:** As a presenter at the hackathon, I want the UI to look polished, modern, and impressive on a projector, so that investors take the product seriously.

#### Acceptance Criteria

1. THE Platform SHALL use a premium color scheme: deep indigo (#4F46E5) primary, gold (#F59E0B) accent, white background
2. THE Platform SHALL display the 🌅 brand emoji and "Misrak Shemeta" wordmark prominently in the header
3. THE Platform SHALL include a live "Platform Stats" banner showing: total products, total shops, total buyers (from Supabase count queries)
4. THE Platform SHALL display a "Powered by AI 🤖" badge on the Shop Assistant button
5. THE Platform SHALL include a `/pitch` route that displays a full-screen investor pitch slide with: problem statement, solution, market size, tech stack, and team
6. THE Platform SHALL display a language switcher (🇬🇧 EN / አማ / OM) in the header that changes the UI language
7. THE Platform SHALL animate the product catalog with smooth fade-in transitions on load
8. THE Platform SHALL display a "🧪 Hackathon Demo" banner at the top of every page

---

### Requirement 14: Supabase Database Schema

**User Story:** As a developer, I want a clean, well-structured database schema, so that the application is maintainable and the RAG pipeline works efficiently.

#### Acceptance Criteria

1. THE Supabase database SHALL contain the following core tables:
   ```
   users          — id, email, full_name, role, delivery_zone, language, phone, created_at
   shops          — id, owner_id, name, city, phone, description, balance, is_active, created_at
   products       — id, shop_id, name, description, price, stock, category, images[], is_active, created_at
   orders         — id, buyer_id, shop_id, items[], subtotal, delivery_fee, total, status, otp, otp_attempts, created_at
   carts          — id, buyer_id, items[], updated_at
   payment_logs   — id, order_id, provider, request, response, status, created_at
   shop_transactions — id, shop_id, order_id, amount, type, balance_before, balance_after, created_at
   ```
2. THE database SHALL enable Row Level Security (RLS) on all tables
3. THE `products` table RLS policy SHALL allow: public read of active products, seller write of their own products only
4. THE `orders` table RLS policy SHALL allow: buyers to read their own orders, sellers to read orders containing their products
5. THE database SHALL have indexes on: `products.shop_id`, `products.category`, `orders.buyer_id`, `orders.status`

---

### Requirement 15: Google Gemini Integration

**User Story:** As a developer, I want a simple, direct Google Gemini integration for the AI assistant, so that the hackathon build is fast and reliable with no external automation dependencies.

#### Acceptance Criteria

1. THE Platform SHALL use the Google Generative AI SDK (`@google/generative-ai` package) to call Gemini 1.5 Flash directly from a Next.js Server Action
2. THE Platform SHALL store the Gemini API key in the `GEMINI_API_KEY` environment variable
3. THE `queryAssistant()` Server Action SHALL be the single integration point between the UI and Google Gemini
4. THE Platform SHALL handle Google Gemini API rate limits and errors with a user-friendly fallback message

> **Production Upgrade Path**: Replace the direct Supabase query in `queryAssistant()` with semantic vector search for scale. The function signature and UI remain unchanged.

---

### Requirement 16: Performance and Reliability

**User Story:** As a presenter, I want the app to be fast and reliable during the live demo, so that technical issues don't undermine the pitch.

#### Acceptance Criteria

1. THE Platform SHALL achieve a Lighthouse Performance score of 80+ on mobile
2. THE Platform SHALL load the product catalog in under 2 seconds on a 4G connection
3. THE Shop_Assistant SHALL respond within 5 seconds for 95% of queries
4. THE Platform SHALL implement optimistic UI updates for cart operations (no loading spinner for add-to-cart)
5. THE Platform SHALL cache Supabase query results using React Query with a 60-second stale time
6. THE Platform SHALL implement error boundaries on all major components to prevent full-page crashes
7. THE Platform SHALL display skeleton loading states for the product catalog and Shop Assistant

---

## Notes

### Tech Stack Summary
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), Tailwind CSS, Shadcn UI |
| PWA | next-pwa, Service Worker, Web App Manifest |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + Google OAuth) |
| Storage | Supabase Storage (product images) |
| AI Chat | Google Gemini 1.5 Flash (free tier, direct) |
| Payments | M-PESA Daraja API (Sandbox/Test mode) |
| Deployment | Vercel (Next.js) |

> **Production Upgrade Path** (post-hackathon):
> - Add semantic vector search for scale as the catalog grows
> - Add automated sync when products change
> - The `queryAssistant()` interface stays identical — only the retrieval layer changes

### Delivery Zones (Expanded from campuses to full region)
- **Harar City** — Harar urban area
- **Harar Campus** — Haramaya University Harar Campus
- **Aweday Town** — Aweday town, between Haramaya and Harar
- **Dire Dawa City** — Dire Dawa urban area
- **DDU** — Dire Dawa University campus
- **Haramaya Town** — Haramaya town center
- **Haramaya Campus** — Haramaya University Main Campus

### Hackathon Priorities (6-Hour Build Order)
1. **Hour 1**: Supabase schema + seed data + Gemini client setup
2. **Hour 2**: Auth + shop/product CRUD + image upload
3. **Hour 3**: Product catalog PWA + cart
4. **Hour 4**: RAG Shop Assistant (the wow factor)
5. **Hour 5**: M-PESA STK Push + escrow flow
6. **Hour 6**: Polish UI + demo mode + pitch slide + testing

### Key Differentiators for Investors
- **Trust infrastructure** — Escrow + OTP delivery confirmation: the trust layer that doesn't exist anywhere in Eastern Ethiopia today
- **Buyers** — Browse any shop in Harar, Dire Dawa, Haramaya, Aweday from their phone without physically being there; pay safely knowing funds are held until delivery
- **Sellers** — Scale from walk-in customers only to thousands of digital buyers; get paid reliably through escrow when they deliver
- **AI Assistant 24/7** — The Shop Assistant serves buyers while sellers sleep, answering product questions in Amharic, Afaan Oromo, and English
- **Runners** — Creates structured delivery job opportunities for Bajaj drivers and couriers across the region
- **Only marketplace in Eastern Ethiopia** with multilingual AI assistant
- **Gemini 1.5 Flash powered** — production-grade AI with multilingual reasoning
- **M-PESA** — signals pan-African payment vision beyond Ethiopia
- **PWA** — no app store friction, works on any device, installable
- **Three languages** — Amharic, Afaan Oromo, English — true linguistic inclusion
- **4-actor ecosystem** — Admin, Seller, Runner, Buyer — a complete platform, not just an app

---

## Additional Requirements for Full 4-Actor Demo

### Requirement 17: Runner Flow

**User Story:** As a delivery runner, I want to see my assigned deliveries and confirm delivery using OTP, so that the buyer's payment is released to the seller.

#### Acceptance Criteria

1. THE Platform SHALL provide a dedicated Runner dashboard at `/runner`
2. WHEN a Runner signs in, THE Platform SHALL display all orders with status `DISPATCHED` assigned to their delivery zone
3. EACH order card SHALL display: order ID, buyer delivery zone, product names, seller shop name, seller phone number, and OTP submission form
4. WHEN a Runner submits the correct OTP, THE Platform SHALL update the order status to `COMPLETED` using a Supabase transaction
5. WHEN the order status changes to `COMPLETED`, THE Platform SHALL increment the seller's balance atomically
6. WHEN a Runner submits an incorrect OTP, THE Platform SHALL display an error and increment the attempt counter
7. WHEN OTP attempts reach 3, THE Platform SHALL lock the order and display a "Contact Admin" message
8. THE Runner dashboard SHALL auto-refresh every 10 seconds to show new dispatched orders
9. THE Platform SHALL display the Runner's completed delivery count and earnings summary on their dashboard

---

### Requirement 18: Super Admin Dashboard

**User Story:** As a super admin, I want a real-time overview of the entire platform, so that I can monitor health, manage users, and demonstrate platform control to investors.

#### Acceptance Criteria

1. THE Platform SHALL provide a Super Admin dashboard at `/admin` protected by admin credentials
2. THE Admin dashboard SHALL display live platform statistics:
   - Total buyers, sellers, runners registered
   - Total orders by status (PENDING, PAID_ESCROW, DISPATCHED, COMPLETED)
   - Total platform revenue (sum of completed order totals)
   - Total escrow held (sum of PAID_ESCROW + DISPATCHED order totals)
   - Total products listed across all shops
3. THE Admin dashboard SHALL display a real-time activity feed showing the last 10 events (new orders, payments, completions)
4. THE Admin dashboard SHALL display a user management table with ability to view all buyers, sellers, and runners
5. THE Admin dashboard SHALL display all shops with their balance, product count, and status
6. THE Admin dashboard SHALL display all orders with ability to manually update status (for dispute resolution)
7. WHEN an admin manually updates an order status, THE Platform SHALL log the action with admin ID, reason, and timestamp
8. THE Admin dashboard SHALL display payment logs showing all M-PESA transactions with status

---

### Requirement 19: Pre-Seeded Demo Accounts (Hackathon Critical)

**User Story:** As a hackathon presenter, I want pre-configured demo accounts for all four actors, so that I can switch between roles instantly during the live demo without logging in.

#### Acceptance Criteria

1. THE Platform SHALL seed the following demo accounts in Supabase Auth:
   - **Super Admin**: `admin@misrak.demo` / `demo1234` — role: `admin`
   - **Seller**: `seller@misrak.demo` / `demo1234` — role: `seller`, shop: "Harar Book Hub"
   - **Runner**: `runner@misrak.demo` / `demo1234` — role: `runner`, zone: Harar_City
   - **Buyer**: `buyer@misrak.demo` / `demo1234` — role: `buyer`, delivery_zone: Haramaya_Campus, language: `am`
2. THE Platform SHALL provide a `/demo` page with four large role-selection buttons:
   - 🛡️ Admin — signs in as admin and opens `/admin`
   - 🏪 Seller — signs in as seller and opens `/seller`
   - 🚴 Runner — signs in as runner and opens `/runner`
   - 🛍️ Buyer — signs in as buyer and opens `/` with AI assistant pre-opened
3. EACH role button SHALL sign in automatically without requiring password entry during the demo
4. THE `/demo` page SHALL display the 4-actor flow diagram showing how each role connects
5. THE Platform SHALL pre-create one order in `DISPATCHED` status so the Runner can immediately demonstrate OTP completion
6. THE Platform SHALL pre-create one order in `PAID_ESCROW` status so the Seller can immediately demonstrate dispatching

---

### Requirement 20: 4-Actor Demo Flow

**User Story:** As a hackathon presenter, I want a guided demo flow that walks evaluators through the complete marketplace lifecycle using all four actors, so that investors understand the full value proposition in under 5 minutes.

#### Acceptance Criteria

1. THE Platform SHALL include a `/demo/flow` page that displays the 4-actor story as a visual timeline:
   - Step 1 (Admin): Platform overview with live stats
   - Step 2 (Seller): Product listing and incoming order notification
   - Step 3 (Buyer): AI assistant query → cart → M-PESA payment
   - Step 4 (Runner): OTP delivery confirmation → seller balance update
   - Step 5 (Admin): Revenue updated, full cycle complete
2. EACH step SHALL have a "Switch to this role →" button that opens the correct dashboard in a new tab
3. THE demo flow page SHALL display estimated time for each step (30 seconds each)
4. THE Platform SHALL show a "Demo Complete ✅" screen after Step 5 with a summary of what was demonstrated

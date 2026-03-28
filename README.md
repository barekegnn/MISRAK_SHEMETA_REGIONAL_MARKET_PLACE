# Misrak Shemeta Regional Marketplace

Next.js (App Router) PWA marketplace frontend: Amazon-style chrome, multilingual UI, mock catalog, cart, AI assistant shell, and role dashboards.

## App location

The web app lives in **`web/`** (created as a subfolder because npm requires a lowercase package name).

```bash
cd web
cp .env.example .env.local   # add Supabase keys when ready
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Implemented (frontend)

- Layout: hackathon banner, dark **Deliver to** top bar, search-first header, category rail, mobile bottom nav, floating **Misrak AI** assistant (mock `queryAssistant` server action).
- Pages: home, product grid + filters + PDP buy box, cart (localStorage), checkout stub, auth UI (Supabase when env set), orders placeholder, `/demo`, `/demo/flow`, `/pitch`, `/admin`, `/merchant/*`, `/runner`.
- Data: **mock products** in `web/src/lib/mock/catalog.ts` until Supabase is connected.

## Next steps

- Add `public/icons/icon-192.png` and `icon-512.png` for full PWA install.
- Wire Supabase auth, `products`/`carts`/`orders`, Storage uploads, M-PESA callback, and real `queryAssistant` with OpenAI.

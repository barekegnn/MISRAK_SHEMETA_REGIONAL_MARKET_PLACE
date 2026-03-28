-- ============================================================================
-- Misrak Shemeta — apply ALL migrations to a NEW Supabase project (order fixed)
--
-- Fix for: "Could not find the table 'public.products' in the schema cache"
--   → The API is connected, but Postgres has no app tables yet.
--
-- How to run:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Paste this entire file → Run
--   3. Locally: cd misrak-shemeta-hackathon && npm run seed
--
-- Safe on empty projects only (re-run may error if types/tables already exist).
-- ============================================================================

-- --- 001_schema.sql ---
-- Misrak Shemeta Hackathon — core schema (aligns with requirements2.md)

-- Delivery zones (Requirement 11 + glossary)
CREATE TYPE public.delivery_zone AS ENUM (
  'Harar_City',
  'Harar_Campus',
  'Aweday_Town',
  'Dire_Dawa_City',
  'DDU',
  'Haramaya_Town',
  'Haramaya_Campus'
);

CREATE TYPE public.shop_city AS ENUM ('Harar', 'Dire_Dawa');

CREATE TYPE public.user_role AS ENUM ('buyer', 'seller', 'runner', 'admin');

CREATE TYPE public.language_code AS ENUM ('en', 'am', 'om');

CREATE TYPE public.order_status AS ENUM (
  'PENDING',
  'PAID_ESCROW',
  'DISPATCHED',
  'COMPLETED',
  'FAILED',
  'LOCKED'
);

CREATE TYPE public.product_category AS ENUM (
  'Textbooks',
  'Electronics',
  'Clothing',
  'Food & Beverages',
  'Stationery',
  'Accessories',
  'Home & Living',
  'Other'
);

-- Profiles synced with auth.users
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'buyer',
  delivery_zone public.delivery_zone,
  language public.language_code NOT NULL DEFAULT 'en',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  owner_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city public.shop_city NOT NULL,
  phone TEXT NOT NULL,
  description TEXT,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  shop_id UUID NOT NULL REFERENCES public.shops (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category public.product_category NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  buyer_id UUID NOT NULL REFERENCES public.users (id),
  shop_id UUID NOT NULL REFERENCES public.shops (id),
  items JSONB NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  delivery_fee NUMERIC(12, 2) NOT NULL,
  total NUMERIC(12, 2) NOT NULL,
  status public.order_status NOT NULL DEFAULT 'PENDING',
  otp TEXT NOT NULL,
  otp_attempts INTEGER NOT NULL DEFAULT 0,
  checkout_batch_id UUID,
  mpesa_checkout_request_id TEXT,
  mpesa_receipt TEXT,
  runner_id UUID REFERENCES public.users (id),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  buyer_id UUID NOT NULL UNIQUE REFERENCES public.users (id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  order_id UUID REFERENCES public.orders (id) ON DELETE SET NULL,
  checkout_batch_id UUID,
  provider TEXT NOT NULL DEFAULT 'MPESA',
  request JSONB,
  response JSONB,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.shop_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  shop_id UUID NOT NULL REFERENCES public.shops (id),
  order_id UUID REFERENCES public.orders (id),
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
  balance_before NUMERIC(12, 2),
  balance_after NUMERIC(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  admin_id UUID NOT NULL REFERENCES public.users (id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  reason TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX products_shop_id_idx ON public.products (shop_id);
CREATE INDEX products_category_idx ON public.products (category);
CREATE INDEX products_active_idx ON public.products (is_active);
CREATE INDEX orders_buyer_idx ON public.orders (buyer_id);
CREATE INDEX orders_shop_idx ON public.orders (shop_id);
CREATE INDEX orders_status_idx ON public.orders (status);
CREATE INDEX orders_batch_idx ON public.orders (checkout_batch_id);
CREATE INDEX shops_owner_idx ON public.shops (owner_id);

-- New signup → public.users row
CREATE OR REPLACE FUNCTION public.handle_auth_user ()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(COALESCE(NEW.email, 'user'), '@', 1)),
    'buyer'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_auth_user ();

-- --- 002_rls.sql ---
-- Row Level Security (Requirement 14)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users: own row
CREATE POLICY users_select_own ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY users_update_own ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Shops: public read active; owner full access
CREATE POLICY shops_public_read ON public.shops FOR SELECT
  USING (is_active = TRUE OR owner_id = auth.uid());

CREATE POLICY shops_owner_write ON public.shops FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Products: public read active; seller writes own shop's products
CREATE POLICY products_public_read ON public.products FOR SELECT
  USING (
    is_active = TRUE
    OR shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

CREATE POLICY products_owner_write ON public.products FOR INSERT
  WITH CHECK (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

CREATE POLICY products_owner_update ON public.products FOR UPDATE
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

CREATE POLICY products_owner_delete ON public.products FOR DELETE
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

-- Orders: buyer sees own; seller sees orders for their shop
CREATE POLICY orders_buyer_read ON public.orders FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY orders_seller_read ON public.orders FOR SELECT
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

CREATE POLICY orders_buyer_insert ON public.orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY orders_buyer_update ON public.orders FOR UPDATE
  USING (buyer_id = auth.uid());

CREATE POLICY orders_seller_update ON public.orders FOR UPDATE
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

-- Runner: read dispatched orders in same delivery zone as buyer
CREATE POLICY orders_runner_select ON public.orders FOR SELECT
  USING (
    status = 'DISPATCHED'
    AND EXISTS (
      SELECT 1
      FROM public.users ru
      JOIN public.users bu ON bu.id = buyer_id
      WHERE ru.id = auth.uid()
        AND ru.role = 'runner'
        AND ru.delivery_zone IS NOT NULL
        AND bu.delivery_zone = ru.delivery_zone
    )
  );

CREATE POLICY orders_runner_update ON public.orders FOR UPDATE
  USING (
    status IN ('DISPATCHED', 'LOCKED')
    AND EXISTS (
      SELECT 1
      FROM public.users ru
      JOIN public.users bu ON bu.id = buyer_id
      WHERE ru.id = auth.uid()
        AND ru.role = 'runner'
        AND ru.delivery_zone IS NOT NULL
        AND bu.delivery_zone = ru.delivery_zone
    )
  );

-- Carts: buyer only
CREATE POLICY carts_own ON public.carts FOR ALL
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

-- Server-led tables: block direct client access (service role bypasses RLS)
CREATE POLICY payment_logs_deny ON public.payment_logs FOR ALL USING (FALSE);
CREATE POLICY shop_tx_deny ON public.shop_transactions FOR ALL USING (FALSE);
CREATE POLICY admin_audit_deny ON public.admin_audit_logs FOR ALL USING (FALSE);

-- --- 003_functions.sql ---
-- Helper: touch updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at ()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at ();

CREATE TRIGGER shops_updated_at BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at ();

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at ();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at ();

-- --- 004_storage.sql ---
-- Product images bucket (Requirement 4) — public read; uploads via service role in app

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "products_public_read" ON storage.objects;
CREATE POLICY "products_public_read" ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- --- 005_extend_shop_cities.sql ---
ALTER TYPE public.shop_city ADD VALUE IF NOT EXISTS 'Aweday';
ALTER TYPE public.shop_city ADD VALUE IF NOT EXISTS 'Jigjiga';

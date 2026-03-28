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

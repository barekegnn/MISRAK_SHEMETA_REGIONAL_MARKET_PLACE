-- Core marketplace schema for the Next.js web app (buyer / seller / runner / admin dashboards).
-- Runs before 20260328_* migrations. Auth → public.users sync is added in 20260328_role_dashboard_operations.sql.

create extension if not exists pgcrypto;

-- Delivery zones (Requirement 11 + glossary)
create type public.delivery_zone as enum (
  'Harar_City',
  'Harar_Campus',
  'Aweday_Town',
  'Dire_Dawa_City',
  'DDU',
  'Haramaya_Town',
  'Haramaya_Campus'
);

create type public.shop_city as enum ('Harar', 'Dire_Dawa', 'Haramaya', 'Jijiga');

create type public.user_role as enum ('buyer', 'seller', 'runner', 'admin');

create type public.language_code as enum ('en', 'am', 'om');

create type public.order_status as enum (
  'PENDING',
  'PAID_ESCROW',
  'DISPATCHED',
  'COMPLETED',
  'FAILED',
  'LOCKED'
);

create type public.product_category as enum (
  'Textbooks',
  'Electronics',
  'Clothing',
  'Food & Beverages',
  'Stationery',
  'Accessories',
  'Home & Living',
  'Other'
);

-- Profiles (synced from auth.users via trigger in a later migration)
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.user_role not null default 'buyer',
  delivery_zone public.delivery_zone,
  language public.language_code not null default 'en',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  city public.shop_city not null,
  phone text not null,
  description text,
  balance numeric(12, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null,
  description text not null,
  price numeric(12, 2) not null check (price > 0),
  stock integer not null default 0 check (stock >= 0),
  category public.product_category not null,
  images text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.users (id),
  shop_id uuid not null references public.shops (id),
  items jsonb not null,
  subtotal numeric(12, 2) not null,
  delivery_fee numeric(12, 2) not null,
  total numeric(12, 2) not null,
  status public.order_status not null default 'PENDING',
  otp text not null,
  otp_attempts integer not null default 0,
  checkout_batch_id uuid,
  mpesa_checkout_request_id text,
  mpesa_receipt text,
  runner_id uuid references public.users (id),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete set null,
  checkout_batch_id uuid,
  provider text not null default 'MPESA',
  request jsonb,
  response jsonb,
  status text,
  created_at timestamptz not null default now()
);

create table public.shop_transactions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id),
  order_id uuid references public.orders (id),
  amount numeric(12, 2) not null,
  type text not null check (type in ('CREDIT', 'DEBIT')),
  balance_before numeric(12, 2),
  balance_after numeric(12, 2),
  created_at timestamptz not null default now()
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.users (id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  reason text,
  meta jsonb default '{}',
  created_at timestamptz not null default now()
);

create index products_shop_id_idx on public.products (shop_id);
create index products_category_idx on public.products (category);
create index products_active_idx on public.products (is_active);
create index orders_buyer_idx on public.orders (buyer_id);
create index orders_shop_idx on public.orders (shop_id);
create index orders_status_idx on public.orders (status);
create index orders_batch_idx on public.orders (checkout_batch_id);
create index shops_owner_idx on public.shops (owner_id);

-- Row level security (baseline; extended in 20260328_* migrations)
alter table public.users enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.payment_logs enable row level security;
alter table public.shop_transactions enable row level security;
alter table public.admin_audit_logs enable row level security;

create policy users_select_own on public.users
  for select using (auth.uid() = id);

create policy users_update_own on public.users
  for update using (auth.uid() = id);

create policy shops_public_read on public.shops
  for select using (is_active = true or owner_id = auth.uid());

create policy shops_owner_write on public.shops
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy products_public_read on public.products
  for select using (
    is_active = true
    or shop_id in (select id from public.shops where owner_id = auth.uid())
  );

create policy products_owner_write on public.products
  for insert
  with check (
    shop_id in (select id from public.shops where owner_id = auth.uid())
  );

create policy products_owner_update on public.products
  for update
  using (
    shop_id in (select id from public.shops where owner_id = auth.uid())
  );

create policy products_owner_delete on public.products
  for delete
  using (
    shop_id in (select id from public.shops where owner_id = auth.uid())
  );

create policy orders_buyer_read on public.orders
  for select using (buyer_id = auth.uid());

create policy orders_seller_read on public.orders
  for select using (
    shop_id in (select id from public.shops where owner_id = auth.uid())
  );

create policy orders_buyer_insert on public.orders
  for insert
  with check (buyer_id = auth.uid());

create policy orders_buyer_update on public.orders
  for update
  using (buyer_id = auth.uid());

create policy orders_seller_update on public.orders
  for update
  using (
    shop_id in (select id from public.shops where owner_id = auth.uid())
  );

create policy orders_runner_select on public.orders
  for select
  using (
    status = 'DISPATCHED'
    and exists (
      select 1
      from public.users ru
      join public.users bu on bu.id = buyer_id
      where ru.id = auth.uid()
        and ru.role = 'runner'
        and ru.delivery_zone is not null
        and bu.delivery_zone = ru.delivery_zone
    )
  );

create policy orders_runner_update on public.orders
  for update
  using (
    status in ('DISPATCHED', 'LOCKED')
    and exists (
      select 1
      from public.users ru
      join public.users bu on bu.id = buyer_id
      where ru.id = auth.uid()
        and ru.role = 'runner'
        and ru.delivery_zone is not null
        and bu.delivery_zone = ru.delivery_zone
    )
  );

create policy payment_logs_deny on public.payment_logs
  for all using (false);

create policy shop_tx_deny on public.shop_transactions
  for all using (false);

create policy admin_audit_deny on public.admin_audit_logs
  for all using (false);

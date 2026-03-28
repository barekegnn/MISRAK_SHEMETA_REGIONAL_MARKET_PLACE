create extension if not exists pgcrypto;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null,
  shop_id text not null,
  quantity integer not null check (quantity > 0),
  price_at_add numeric(12, 2) not null default 0 check (price_at_add >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null,
  shop_id text not null,
  quantity integer not null check (quantity > 0),
  price_at_purchase numeric(12, 2) not null default 0 check (price_at_purchase >= 0),
  product_name text,
  shop_name text,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists cart_items_user_id_idx on public.cart_items (user_id);
create index if not exists cart_items_product_id_idx on public.cart_items (product_id);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_buyer_id_idx on public.order_items (buyer_id);

drop trigger if exists cart_items_set_updated_at on public.cart_items;
create trigger cart_items_set_updated_at
before update on public.cart_items
for each row
execute procedure public.set_updated_at_timestamp();

do $$
begin
  if to_regclass('public.orders') is not null then
    alter table public.orders add column if not exists total_amount numeric(12, 2);
    alter table public.orders add column if not exists customer_name text;
    alter table public.orders add column if not exists customer_phone text;
    alter table public.orders add column if not exists customer_email text;
    alter table public.orders add column if not exists delivery_otp text;
    alter table public.orders add column if not exists payment_provider text;
    alter table public.orders add column if not exists payment_reference text;
    alter table public.orders add column if not exists seller_id uuid references auth.users (id);
    alter table public.orders add column if not exists runner_id uuid references auth.users (id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.orders') is not null then
    update public.orders
    set
      total_amount = coalesce(total_amount, total),
      delivery_otp = coalesce(delivery_otp, otp)
    where total_amount is null or delivery_otp is null;
  end if;
exception
  when undefined_column then
    null;
end
$$;

alter table public.cart_items enable row level security;
alter table public.order_items enable row level security;

do $$
begin
  if to_regclass('public.orders') is not null then
    alter table public.orders enable row level security;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cart_items'
      and policyname = 'cart_items_select_own'
  ) then
    create policy cart_items_select_own
      on public.cart_items
      for select
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cart_items'
      and policyname = 'cart_items_insert_own'
  ) then
    create policy cart_items_insert_own
      on public.cart_items
      for insert
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cart_items'
      and policyname = 'cart_items_update_own'
  ) then
    create policy cart_items_update_own
      on public.cart_items
      for update
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cart_items'
      and policyname = 'cart_items_delete_own'
  ) then
    create policy cart_items_delete_own
      on public.cart_items
      for delete
      using (user_id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'order_items'
      and policyname = 'order_items_select_related'
  ) then
    create policy order_items_select_related
      on public.order_items
      for select
      using (
        buyer_id = auth.uid()
        or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'buyer') = 'admin'
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'order_items'
      and policyname = 'order_items_insert_own'
  ) then
    create policy order_items_insert_own
      on public.order_items
      for insert
      with check (
        buyer_id = auth.uid()
        or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'buyer') = 'admin'
      );
  end if;
end
$$;

do $$
begin
  if to_regclass('public.orders') is not null then
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'orders'
        and policyname = 'orders_checkout_select_related'
    ) then
      create policy orders_checkout_select_related
        on public.orders
        for select
        using (
          buyer_id = auth.uid()
          or seller_id = auth.uid()
          or runner_id = auth.uid()
          or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'buyer') = 'admin'
        );
    end if;

    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'orders'
        and policyname = 'orders_checkout_insert_buyer'
    ) then
      create policy orders_checkout_insert_buyer
        on public.orders
        for insert
        with check (
          buyer_id = auth.uid()
          or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'buyer') = 'admin'
        );
    end if;

    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'orders'
        and policyname = 'orders_checkout_update_related'
    ) then
      create policy orders_checkout_update_related
        on public.orders
        for update
        using (
          buyer_id = auth.uid()
          or seller_id = auth.uid()
          or runner_id = auth.uid()
          or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'buyer') = 'admin'
        )
        with check (
          buyer_id = auth.uid()
          or seller_id = auth.uid()
          or runner_id = auth.uid()
          or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'buyer') = 'admin'
        );
    end if;
  end if;
end
$$;

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.orders') is not null then
    alter table public.orders add column if not exists delivery_zone public.delivery_zone;
    alter table public.orders add column if not exists admin_note text;
  end if;
end
$$;

create or replace function public.sync_public_user_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role public.user_role;
  next_zone public.delivery_zone;
  next_language public.language_code;
  stored_role public.user_role;
begin
  select role into stored_role
  from public.users
  where id = new.id;

  if tg_op = 'INSERT' then
    next_role :=
      case
        when coalesce(new.raw_app_meta_data ->> 'role', new.raw_user_meta_data ->> 'role', 'buyer')
          in ('buyer', 'seller', 'runner', 'admin')
          then coalesce(new.raw_app_meta_data ->> 'role', new.raw_user_meta_data ->> 'role', 'buyer')::public.user_role
        else 'buyer'::public.user_role
      end;
  else
    next_role := coalesce(stored_role, 'buyer'::public.user_role);
  end if;

  next_zone :=
    case
      when new.raw_user_meta_data ->> 'delivery_zone' in (
        'Harar_City',
        'Harar_Campus',
        'Aweday_Town',
        'Dire_Dawa_City',
        'DDU',
        'Haramaya_Town',
        'Haramaya_Campus'
      )
        then (new.raw_user_meta_data ->> 'delivery_zone')::public.delivery_zone
      else null
    end;

  next_language :=
    case
      when coalesce(new.raw_user_meta_data ->> 'language', 'en') in ('en', 'am', 'om')
        then (new.raw_user_meta_data ->> 'language')::public.language_code
      else 'en'::public.language_code
    end;

  insert into public.users (
    id,
    email,
    full_name,
    role,
    delivery_zone,
    language,
    phone
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    next_role,
    next_zone,
    next_language,
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    delivery_zone = excluded.delivery_zone,
    language = excluded.language,
    phone = excluded.phone,
    updated_at = now();

  return new;
exception
  when undefined_table then
    return new;
end;
$$;

create or replace function public.protect_self_profile_role_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and old.role is distinct from new.role then
    raise exception 'Role changes are managed by platform staff.';
  end if;

  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users
  where id = auth.uid()
  limit 1;
$$;

create or replace function public.current_user_delivery_zone()
returns public.delivery_zone
language sql
stable
security definer
set search_path = public
as $$
  select delivery_zone
  from public.users
  where id = auth.uid()
  limit 1;
$$;

drop trigger if exists on_auth_user_synced on auth.users;
create trigger on_auth_user_synced
after insert or update on auth.users
for each row
execute procedure public.sync_public_user_from_auth();

drop trigger if exists users_protect_role_update on public.users;
create trigger users_protect_role_update
before update on public.users
for each row
execute procedure public.protect_self_profile_role_update();

do $$
begin
  if to_regclass('public.users') is not null then
    update public.users as profile
    set
      email = coalesce(auth_user.email, profile.email),
      full_name = coalesce(
        auth_user.raw_user_meta_data ->> 'full_name',
        profile.full_name,
        split_part(coalesce(auth_user.email, 'user'), '@', 1)
      ),
      role = profile.role,
      delivery_zone = (
        case
          when auth_user.raw_user_meta_data ->> 'delivery_zone' in (
            'Harar_City',
            'Harar_Campus',
            'Aweday_Town',
            'Dire_Dawa_City',
            'DDU',
            'Haramaya_Town',
            'Haramaya_Campus'
          )
            then (auth_user.raw_user_meta_data ->> 'delivery_zone')::public.delivery_zone
          else profile.delivery_zone
        end
      ),
      language = (
        case
          when coalesce(auth_user.raw_user_meta_data ->> 'language', profile.language::text, 'en')
            in ('en', 'am', 'om')
            then coalesce(auth_user.raw_user_meta_data ->> 'language', profile.language::text, 'en')::public.language_code
          else 'en'::public.language_code
        end
      ),
      phone = coalesce(nullif(auth_user.raw_user_meta_data ->> 'phone', ''), profile.phone),
      updated_at = now()
    from auth.users as auth_user
    where auth_user.id = profile.id;
  end if;
exception
  when undefined_table then
    null;
end;
$$;

do $$
begin
  if to_regclass('public.orders') is not null and to_regclass('public.users') is not null then
    update public.orders as orders
    set delivery_zone = buyers.delivery_zone
    from public.users as buyers
    where buyers.id = orders.buyer_id
      and orders.delivery_zone is null
      and buyers.delivery_zone is not null;
  end if;
exception
  when undefined_column then
    null;
end;
$$;

do $$
begin
  if to_regclass('public.orders') is not null and to_regclass('public.shops') is not null then
    update public.orders as orders
    set seller_id = shops.owner_id
    from public.shops as shops
    where shops.id = orders.shop_id
      and orders.seller_id is null;
  end if;
exception
  when undefined_column then
    null;
end;
$$;

do $$
begin
  if to_regclass('public.users') is not null and not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'users_admin_select_all'
  ) then
    create policy users_admin_select_all
      on public.users
      for select
      using (public.current_user_role() = 'admin');
  end if;
end
$$;

do $$
begin
  if to_regclass('public.shops') is not null and not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shops'
      and policyname = 'shops_admin_select_all'
  ) then
    create policy shops_admin_select_all
      on public.shops
      for select
      using (public.current_user_role() = 'admin');
  end if;

  if to_regclass('public.shops') is not null and not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shops'
      and policyname = 'shops_admin_update_all'
  ) then
    create policy shops_admin_update_all
      on public.shops
      for update
      using (public.current_user_role() = 'admin')
      with check (public.current_user_role() = 'admin');
  end if;
end
$$;

do $$
begin
  if to_regclass('public.products') is not null and not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'products_admin_select_all'
  ) then
    create policy products_admin_select_all
      on public.products
      for select
      using (public.current_user_role() = 'admin');
  end if;

  if to_regclass('public.products') is not null and not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'products_admin_update_all'
  ) then
    create policy products_admin_update_all
      on public.products
      for update
      using (public.current_user_role() = 'admin')
      with check (public.current_user_role() = 'admin');
  end if;
end
$$;

do $$
begin
  if to_regclass('public.orders') is not null and not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'orders'
      and policyname = 'orders_runner_zone_select'
  ) then
    create policy orders_runner_zone_select
      on public.orders
      for select
      using (
        public.current_user_role() = 'runner'
        and (
          runner_id = auth.uid()
          or (
            runner_id is null
            and status = 'DISPATCHED'
            and delivery_zone is not null
            and public.current_user_delivery_zone() = delivery_zone
          )
        )
      );
  end if;

  if to_regclass('public.orders') is not null and not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'orders'
      and policyname = 'orders_runner_zone_update'
  ) then
    create policy orders_runner_zone_update
      on public.orders
      for update
      using (
        public.current_user_role() = 'runner'
        and (
          runner_id = auth.uid()
          or (
            runner_id is null
            and status = 'DISPATCHED'
            and delivery_zone is not null
            and public.current_user_delivery_zone() = delivery_zone
          )
        )
      )
      with check (
        public.current_user_role() = 'runner'
        and (
          runner_id = auth.uid()
          or (
            runner_id is null
            and delivery_zone is not null
            and public.current_user_delivery_zone() = delivery_zone
          )
        )
      );
  end if;
end
$$;

do $$
begin
  if to_regclass('public.order_items') is not null and not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'order_items'
      and policyname = 'order_items_select_operations_related'
  ) then
    create policy order_items_select_operations_related
      on public.order_items
      for select
      using (
        exists (
          select 1
          from public.orders as orders
          where orders.id::text = order_items.order_id
            and (
              orders.seller_id = auth.uid()
              or orders.runner_id = auth.uid()
              or (
                public.current_user_role() = 'runner'
                and orders.status = 'DISPATCHED'
                and orders.delivery_zone is not null
                and public.current_user_delivery_zone() = orders.delivery_zone
              )
              or public.current_user_role() = 'admin'
            )
        )
      );
  end if;
end
$$;

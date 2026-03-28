-- Ensure auth → public.users sync never writes a null delivery_zone when the column is NOT NULL
-- (metadata missing, OAuth, or unknown zone values used to set next_zone to null and break sign-up).

create or replace function public.sync_public_user_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role public.user_role;
  zone_from_meta public.delivery_zone;
  existing_zone public.delivery_zone;
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

  zone_from_meta :=
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

  select delivery_zone into existing_zone
  from public.users
  where id = new.id;

  next_zone := coalesce(zone_from_meta, existing_zone, 'Haramaya_Campus'::public.delivery_zone);

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

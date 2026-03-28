-- Admins can update any user row (role, zone, etc.). Self-service role lock remains in protect_self_profile_role_update.
-- Promote platform admin email (applies when the account already exists in auth.users).

do $$
begin
  if to_regclass('public.users') is not null and not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'users_admin_update_all'
  ) then
    create policy users_admin_update_all
      on public.users
      for update
      using (public.current_user_role() = 'admin')
      with check (public.current_user_role() = 'admin');
  end if;
end
$$;

do $$
declare
  target_id uuid;
begin
  select id
  into target_id
  from auth.users
  where lower(email) = lower('abdimujahid391@gmail.com')
  limit 1;

  if target_id is not null then
    update public.users
    set
      role = 'admin'::public.user_role,
      updated_at = now()
    where id = target_id;

    update auth.users
    set
      raw_user_meta_data =
        coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin'),
      raw_app_meta_data =
        coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin'),
      updated_at = now()
    where id = target_id;
  end if;
end
$$;

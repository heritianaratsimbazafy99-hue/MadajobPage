create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

create or replace function public.is_recruiter()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'recruteur'
      and is_active = true
  );
$$;

revoke all on function public.is_recruiter() from public;
grant execute on function public.is_recruiter() to anon, authenticated, service_role;

create or replace function public.current_user_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_user_org_id() from public;
grant execute on function public.current_user_org_id() to anon, authenticated, service_role;

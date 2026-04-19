create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'app_role'
  ) then
    create type public.app_role as enum ('candidat', 'recruteur', 'admin');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'job_status'
  ) then
    create type public.job_status as enum ('draft', 'published', 'closed', 'archived');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'application_status'
  ) then
    create type public.application_status as enum (
      'submitted',
      'screening',
      'interview',
      'shortlist',
      'hired',
      'rejected'
    );
  end if;
end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  kind text not null default 'client',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role public.app_role not null default 'candidat',
  organization_id uuid references public.organizations(id) on delete set null,
  phone text,
  avatar_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  headline text,
  city text,
  country text default 'Madagascar',
  bio text,
  experience_years integer,
  current_position text,
  desired_position text,
  skills_text text,
  cv_text text,
  profile_completion integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  slug text not null unique,
  department text,
  sector text,
  location text,
  work_mode text,
  contract_type text,
  summary text not null,
  responsibilities text,
  requirements text,
  benefits text,
  status public.job_status not null default 'draft',
  is_featured boolean not null default false,
  published_at timestamptz,
  closing_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null default 'cv',
  bucket_id text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_post_id uuid not null references public.job_posts(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  cv_document_id uuid references public.candidate_documents(id) on delete set null,
  cover_letter text,
  status public.application_status not null default 'submitted',
  recruiter_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_post_id, candidate_id)
);

create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  visibility text not null default 'internal',
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_organizations on public.organizations;
create trigger set_updated_at_organizations
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_candidate_profiles on public.candidate_profiles;
create trigger set_updated_at_candidate_profiles
before update on public.candidate_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_job_posts on public.job_posts;
create trigger set_updated_at_job_posts
before update on public.job_posts
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_applications on public.applications;
create trigger set_updated_at_applications
before update on public.applications
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'candidat')
  )
  on conflict (id) do nothing;

  if coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'candidat') = 'candidat' then
    insert into public.candidate_profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

create or replace function public.is_recruiter()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'recruteur'
      and is_active = true
  );
$$;

create or replace function public.current_user_org_id()
returns uuid
language sql
stable
as $$
  select organization_id
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

insert into public.organizations (name, slug, kind)
values ('Madajob', 'madajob', 'internal')
on conflict (slug) do nothing;

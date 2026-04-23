create table if not exists public.application_interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  scheduled_by uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  format text not null default 'video'
    check (format in ('phone', 'video', 'onsite', 'other')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null default 'Indian/Antananarivo',
  location text,
  meeting_url text,
  notes text,
  interviewer_name text not null,
  interviewer_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists application_interviews_application_idx
  on public.application_interviews(application_id, starts_at desc);

create index if not exists application_interviews_status_idx
  on public.application_interviews(status, starts_at desc);

drop trigger if exists set_application_interviews_updated_at on public.application_interviews;
create trigger set_application_interviews_updated_at
before update on public.application_interviews
for each row
execute function public.set_updated_at();

alter table public.application_interviews enable row level security;

drop policy if exists "application interviews read" on public.application_interviews;
create policy "application interviews read"
on public.application_interviews
for select
to authenticated
using (
  public.is_admin()
  or (
    public.is_recruiter()
    and exists (
      select 1
      from public.applications a
      join public.job_posts jp on jp.id = a.job_post_id
      where a.id = application_id
        and jp.organization_id = public.current_user_org_id()
    )
  )
  or exists (
    select 1
    from public.applications a
    where a.id = application_id
      and a.candidate_id = auth.uid()
  )
);

drop policy if exists "application interviews insert" on public.application_interviews;
create policy "application interviews insert"
on public.application_interviews
for insert
to authenticated
with check (
  public.is_admin()
  or (
    public.is_recruiter()
    and scheduled_by = auth.uid()
    and exists (
      select 1
      from public.applications a
      join public.job_posts jp on jp.id = a.job_post_id
      where a.id = application_id
        and jp.organization_id = public.current_user_org_id()
    )
  )
);

drop policy if exists "application interviews update" on public.application_interviews;
create policy "application interviews update"
on public.application_interviews
for update
to authenticated
using (
  public.is_admin()
  or (
    public.is_recruiter()
    and exists (
      select 1
      from public.applications a
      join public.job_posts jp on jp.id = a.job_post_id
      where a.id = application_id
        and jp.organization_id = public.current_user_org_id()
    )
  )
)
with check (
  public.is_admin()
  or (
    public.is_recruiter()
    and exists (
      select 1
      from public.applications a
      join public.job_posts jp on jp.id = a.job_post_id
      where a.id = application_id
        and jp.organization_id = public.current_user_org_id()
    )
  )
);

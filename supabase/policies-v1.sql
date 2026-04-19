alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.job_posts enable row level security;
alter table public.candidate_documents enable row level security;
alter table public.applications enable row level security;
alter table public.application_status_history enable row level security;
alter table public.internal_notes enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "organizations admin read" on public.organizations;
create policy "organizations admin read"
on public.organizations
for select
to authenticated
using (public.is_admin());

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "candidate profile self read" on public.candidate_profiles;
create policy "candidate profile self read"
on public.candidate_profiles
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "candidate profile self update" on public.candidate_profiles;
create policy "candidate profile self update"
on public.candidate_profiles
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "public read published jobs" on public.job_posts;
create policy "public read published jobs"
on public.job_posts
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "recruiter admin read own jobs" on public.job_posts;
create policy "recruiter admin read own jobs"
on public.job_posts
for select
to authenticated
using (
  public.is_admin()
  or (
    public.is_recruiter()
    and organization_id = public.current_user_org_id()
  )
);

drop policy if exists "recruiter admin insert jobs" on public.job_posts;
create policy "recruiter admin insert jobs"
on public.job_posts
for insert
to authenticated
with check (
  public.is_admin()
  or (
    public.is_recruiter()
    and organization_id = public.current_user_org_id()
    and created_by = auth.uid()
  )
);

drop policy if exists "recruiter admin update jobs" on public.job_posts;
create policy "recruiter admin update jobs"
on public.job_posts
for update
to authenticated
using (
  public.is_admin()
  or (
    public.is_recruiter()
    and organization_id = public.current_user_org_id()
  )
)
with check (
  public.is_admin()
  or (
    public.is_recruiter()
    and organization_id = public.current_user_org_id()
  )
);

drop policy if exists "admin delete jobs" on public.job_posts;
create policy "admin delete jobs"
on public.job_posts
for delete
to authenticated
using (public.is_admin());

drop policy if exists "candidate documents self read" on public.candidate_documents;
create policy "candidate documents self read"
on public.candidate_documents
for select
to authenticated
using (candidate_id = auth.uid() or public.is_admin());

drop policy if exists "candidate documents self insert" on public.candidate_documents;
create policy "candidate documents self insert"
on public.candidate_documents
for insert
to authenticated
with check (candidate_id = auth.uid() or public.is_admin());

drop policy if exists "candidate documents self update" on public.candidate_documents;
create policy "candidate documents self update"
on public.candidate_documents
for update
to authenticated
using (candidate_id = auth.uid() or public.is_admin())
with check (candidate_id = auth.uid() or public.is_admin());

drop policy if exists "candidate apply and admin read applications" on public.applications;
create policy "candidate apply and admin read applications"
on public.applications
for select
to authenticated
using (
  candidate_id = auth.uid()
  or public.is_admin()
  or (
    public.is_recruiter()
    and exists (
      select 1
      from public.job_posts jp
      where jp.id = job_post_id
        and jp.organization_id = public.current_user_org_id()
    )
  )
);

drop policy if exists "candidate create application" on public.applications;
create policy "candidate create application"
on public.applications
for insert
to authenticated
with check (candidate_id = auth.uid());

drop policy if exists "candidate admin update own applications" on public.applications;
create policy "candidate admin update own applications"
on public.applications
for update
to authenticated
using (
  candidate_id = auth.uid()
  or public.is_admin()
  or (
    public.is_recruiter()
    and exists (
      select 1
      from public.job_posts jp
      where jp.id = job_post_id
        and jp.organization_id = public.current_user_org_id()
    )
  )
)
with check (
  candidate_id = auth.uid()
  or public.is_admin()
  or (
    public.is_recruiter()
    and exists (
      select 1
      from public.job_posts jp
      where jp.id = job_post_id
        and jp.organization_id = public.current_user_org_id()
    )
  )
);

drop policy if exists "internal status history read" on public.application_status_history;
create policy "internal status history read"
on public.application_status_history
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
);

drop policy if exists "internal status history insert" on public.application_status_history;
create policy "internal status history insert"
on public.application_status_history
for insert
to authenticated
with check (
  public.is_admin()
  or (
    public.is_recruiter()
    and changed_by = auth.uid()
    and exists (
      select 1
      from public.applications a
      join public.job_posts jp on jp.id = a.job_post_id
      where a.id = application_id
        and jp.organization_id = public.current_user_org_id()
    )
  )
);

drop policy if exists "internal notes read" on public.internal_notes;
create policy "internal notes read"
on public.internal_notes
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
);

drop policy if exists "internal notes insert" on public.internal_notes;
create policy "internal notes insert"
on public.internal_notes
for insert
to authenticated
with check (
  public.is_admin()
  or (
    public.is_recruiter()
    and author_id = auth.uid()
    and exists (
      select 1
      from public.applications a
      join public.job_posts jp on jp.id = a.job_post_id
      where a.id = application_id
        and jp.organization_id = public.current_user_org_id()
    )
  )
);

drop policy if exists "admin read audit events" on public.audit_events;
create policy "admin read audit events"
on public.audit_events
for select
to authenticated
using (public.is_admin());

drop policy if exists "admin insert audit events" on public.audit_events;
create policy "admin insert audit events"
on public.audit_events
for insert
to authenticated
with check (public.is_admin());

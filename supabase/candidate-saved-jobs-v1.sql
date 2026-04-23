create table if not exists public.candidate_saved_jobs (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  job_post_id uuid not null references public.job_posts(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (candidate_id, job_post_id)
);

create index if not exists candidate_saved_jobs_candidate_created_idx
on public.candidate_saved_jobs (candidate_id, created_at desc);

create index if not exists candidate_saved_jobs_job_idx
on public.candidate_saved_jobs (job_post_id);

alter table public.candidate_saved_jobs enable row level security;

drop policy if exists "candidate saved jobs self read" on public.candidate_saved_jobs;
create policy "candidate saved jobs self read"
on public.candidate_saved_jobs
for select
to authenticated
using (candidate_id = auth.uid() or public.is_admin());

drop policy if exists "candidate saved jobs self insert" on public.candidate_saved_jobs;
create policy "candidate saved jobs self insert"
on public.candidate_saved_jobs
for insert
to authenticated
with check (candidate_id = auth.uid());

drop policy if exists "candidate saved jobs self delete" on public.candidate_saved_jobs;
create policy "candidate saved jobs self delete"
on public.candidate_saved_jobs
for delete
to authenticated
using (candidate_id = auth.uid() or public.is_admin());

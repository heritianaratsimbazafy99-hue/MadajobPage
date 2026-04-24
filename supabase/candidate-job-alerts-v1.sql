create table if not exists public.candidate_job_alerts (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  job_post_id uuid not null references public.job_posts(id) on delete cascade,
  match_score integer not null default 0 check (match_score between 0 and 100),
  match_level text not null default 'faible',
  match_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (candidate_id, job_post_id)
);

create index if not exists candidate_job_alerts_candidate_created_idx
  on public.candidate_job_alerts(candidate_id, created_at desc);

create index if not exists candidate_job_alerts_job_created_idx
  on public.candidate_job_alerts(job_post_id, created_at desc);

alter table public.candidate_job_alerts enable row level security;

drop policy if exists "candidate job alerts self read" on public.candidate_job_alerts;
create policy "candidate job alerts self read"
on public.candidate_job_alerts
for select
to authenticated
using (candidate_id = auth.uid());

drop policy if exists "candidate job alerts self update" on public.candidate_job_alerts;
create policy "candidate job alerts self update"
on public.candidate_job_alerts
for update
to authenticated
using (candidate_id = auth.uid())
with check (candidate_id = auth.uid());

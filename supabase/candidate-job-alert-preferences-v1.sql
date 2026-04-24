alter table public.candidate_profiles
  add column if not exists job_alerts_enabled boolean not null default true;

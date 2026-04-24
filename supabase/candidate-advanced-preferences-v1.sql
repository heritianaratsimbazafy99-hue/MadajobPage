alter table public.candidate_profiles
  add column if not exists desired_sectors text[] not null default '{}'::text[],
  add column if not exists desired_locations text[] not null default '{}'::text[],
  add column if not exists desired_experience_level text;

alter table public.candidate_profiles
  drop constraint if exists candidate_profiles_desired_sectors_limit_check,
  add constraint candidate_profiles_desired_sectors_limit_check
    check (coalesce(array_length(desired_sectors, 1), 0) <= 8);

alter table public.candidate_profiles
  drop constraint if exists candidate_profiles_desired_locations_limit_check,
  add constraint candidate_profiles_desired_locations_limit_check
    check (coalesce(array_length(desired_locations, 1), 0) <= 8);

alter table public.candidate_profiles
  drop constraint if exists candidate_profiles_desired_experience_level_check,
  add constraint candidate_profiles_desired_experience_level_check
    check (
      desired_experience_level is null
      or desired_experience_level in ('Junior', 'Intermediaire', 'Senior', 'Lead / Management')
    );

create index if not exists candidate_profiles_desired_sectors_gin_idx
  on public.candidate_profiles using gin (desired_sectors);

create index if not exists candidate_profiles_desired_locations_gin_idx
  on public.candidate_profiles using gin (desired_locations);

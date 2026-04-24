alter table public.candidate_profiles
  add column if not exists desired_contract_type text,
  add column if not exists desired_work_mode text,
  add column if not exists desired_salary_min numeric(12, 2),
  add column if not exists desired_salary_currency text not null default 'MGA';

alter table public.candidate_profiles
  drop constraint if exists candidate_profiles_desired_salary_min_check,
  add constraint candidate_profiles_desired_salary_min_check
    check (desired_salary_min is null or desired_salary_min >= 0);

alter table public.candidate_profiles
  drop constraint if exists candidate_profiles_desired_salary_currency_check,
  add constraint candidate_profiles_desired_salary_currency_check
    check (desired_salary_currency in ('MGA', 'EUR', 'USD'));

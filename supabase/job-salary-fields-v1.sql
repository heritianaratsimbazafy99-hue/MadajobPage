alter table public.job_posts
  add column if not exists salary_min numeric(12, 2),
  add column if not exists salary_max numeric(12, 2),
  add column if not exists salary_currency text not null default 'MGA',
  add column if not exists salary_period text not null default 'month',
  add column if not exists salary_is_visible boolean not null default false;

alter table public.job_posts
  drop constraint if exists job_posts_salary_range_check,
  add constraint job_posts_salary_range_check
    check (
      salary_min is null
      or salary_max is null
      or salary_min <= salary_max
    );

alter table public.job_posts
  drop constraint if exists job_posts_salary_period_check,
  add constraint job_posts_salary_period_check
    check (salary_period in ('month', 'year', 'day', 'hour'));

alter table public.job_posts
  drop constraint if exists job_posts_salary_currency_check,
  add constraint job_posts_salary_currency_check
    check (salary_currency in ('MGA', 'EUR', 'USD'));

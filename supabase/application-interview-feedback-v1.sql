create table if not exists public.application_interview_feedback (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.application_interviews(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  summary text not null,
  strengths text not null,
  concerns text not null,
  recommendation text not null
    check (recommendation in ('strong_yes', 'yes', 'mixed', 'no')),
  proposed_decision text not null
    check (proposed_decision in ('advance', 'hold', 'reject', 'hire')),
  next_action text not null
    check (
      next_action in (
        'schedule_next_interview',
        'team_debrief',
        'collect_references',
        'send_offer',
        'reject_candidate',
        'keep_warm'
      )
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (interview_id)
);

create index if not exists application_interview_feedback_application_idx
  on public.application_interview_feedback(application_id, updated_at desc);

create index if not exists application_interview_feedback_decision_idx
  on public.application_interview_feedback(recommendation, proposed_decision);

drop trigger if exists set_application_interview_feedback_updated_at
  on public.application_interview_feedback;
create trigger set_application_interview_feedback_updated_at
before update on public.application_interview_feedback
for each row
execute function public.set_updated_at();

alter table public.application_interview_feedback enable row level security;

drop policy if exists "application interview feedback read"
  on public.application_interview_feedback;
create policy "application interview feedback read"
on public.application_interview_feedback
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

drop policy if exists "application interview feedback insert"
  on public.application_interview_feedback;
create policy "application interview feedback insert"
on public.application_interview_feedback
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

drop policy if exists "application interview feedback update"
  on public.application_interview_feedback;
create policy "application interview feedback update"
on public.application_interview_feedback
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

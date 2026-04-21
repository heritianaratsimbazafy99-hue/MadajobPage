create table if not exists public.transactional_emails (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  recipient_name text,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  template_key text not null,
  subject text not null,
  preview_text text not null,
  link_href text,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'sent', 'failed', 'skipped')),
  provider text,
  provider_message_id text,
  attempts_count integer not null default 0,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactional_emails_created_idx
  on public.transactional_emails(created_at desc);

create index if not exists transactional_emails_status_created_idx
  on public.transactional_emails(status, created_at desc);

create index if not exists transactional_emails_recipient_idx
  on public.transactional_emails(recipient_email, created_at desc);

alter table public.transactional_emails enable row level security;

drop policy if exists "admin read transactional emails" on public.transactional_emails;
create policy "admin read transactional emails"
on public.transactional_emails
for select
to authenticated
using (public.is_admin());

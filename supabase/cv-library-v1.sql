create table if not exists public.cv_library_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  source_label text,
  candidate_name text,
  candidate_email text,
  candidate_phone text,
  bucket_id text not null default 'cv-library',
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  parsing_status text not null default 'pending',
  parsing_error text,
  parsed_text text,
  ai_summary jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}'::text[],
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cv_library_documents_parsing_status_check
    check (parsing_status in ('pending', 'parsed', 'empty', 'unsupported', 'failed'))
);

create index if not exists cv_library_documents_org_created_idx
  on public.cv_library_documents(organization_id, created_at desc);

create index if not exists cv_library_documents_uploaded_by_created_idx
  on public.cv_library_documents(uploaded_by, created_at desc);

create index if not exists cv_library_documents_parsing_status_idx
  on public.cv_library_documents(parsing_status);

drop trigger if exists set_updated_at_cv_library_documents on public.cv_library_documents;
create trigger set_updated_at_cv_library_documents
before update on public.cv_library_documents
for each row execute function public.set_updated_at();

alter table public.cv_library_documents enable row level security;

drop policy if exists "cv library read" on public.cv_library_documents;
create policy "cv library read"
on public.cv_library_documents
for select
to authenticated
using (
  public.is_admin()
  or (
    public.is_recruiter()
    and (
      uploaded_by = auth.uid()
      or organization_id = public.current_user_org_id()
    )
  )
);

drop policy if exists "cv library insert" on public.cv_library_documents;
create policy "cv library insert"
on public.cv_library_documents
for insert
to authenticated
with check (
  public.is_admin()
  or (
    public.is_recruiter()
    and uploaded_by = auth.uid()
    and (
      (
        public.current_user_org_id() is not null
        and organization_id = public.current_user_org_id()
      )
      or (
        public.current_user_org_id() is null
        and organization_id is null
      )
    )
  )
);

drop policy if exists "cv library update" on public.cv_library_documents;
create policy "cv library update"
on public.cv_library_documents
for update
to authenticated
using (
  public.is_admin()
  or (
    public.is_recruiter()
    and (
      uploaded_by = auth.uid()
      or organization_id = public.current_user_org_id()
    )
  )
)
with check (
  public.is_admin()
  or (
    public.is_recruiter()
    and (
      (
        public.current_user_org_id() is not null
        and organization_id = public.current_user_org_id()
      )
      or (
        public.current_user_org_id() is null
        and organization_id is null
        and uploaded_by = auth.uid()
      )
    )
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cv-library',
  'cv-library',
  false,
  10485760,
  array[
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cv library storage read" on storage.objects;
create policy "cv library storage read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'cv-library'
  and (
    public.is_admin()
    or (
      public.is_recruiter()
      and (
        (storage.foldername(name))[1] = public.current_user_org_id()::text
        or (storage.foldername(name))[1] = auth.uid()::text
      )
    )
  )
);

drop policy if exists "cv library storage insert" on storage.objects;
create policy "cv library storage insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cv-library'
  and (
    public.is_admin()
    or (
      public.is_recruiter()
      and (
        (storage.foldername(name))[1] = public.current_user_org_id()::text
        or (storage.foldername(name))[1] = auth.uid()::text
      )
    )
  )
);

drop policy if exists "cv library storage update" on storage.objects;
create policy "cv library storage update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'cv-library'
  and (
    public.is_admin()
    or (
      public.is_recruiter()
      and (
        (storage.foldername(name))[1] = public.current_user_org_id()::text
        or (storage.foldername(name))[1] = auth.uid()::text
      )
    )
  )
)
with check (
  bucket_id = 'cv-library'
  and (
    public.is_admin()
    or (
      public.is_recruiter()
      and (
        (storage.foldername(name))[1] = public.current_user_org_id()::text
        or (storage.foldername(name))[1] = auth.uid()::text
      )
    )
  )
);

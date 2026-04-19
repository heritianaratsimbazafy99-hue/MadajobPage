alter table storage.objects enable row level security;

drop policy if exists "candidate cv own read" on storage.objects;
create policy "candidate cv own read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'candidate-cv'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or public.is_admin()
  )
);

drop policy if exists "candidate cv own insert" on storage.objects;
create policy "candidate cv own insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'candidate-cv'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or public.is_admin()
  )
);

drop policy if exists "candidate cv own update" on storage.objects;
create policy "candidate cv own update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'candidate-cv'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or public.is_admin()
  )
)
with check (
  bucket_id = 'candidate-cv'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or public.is_admin()
  )
);

drop policy if exists "candidate documents own read" on storage.objects;
create policy "candidate documents own read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'candidate-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or public.is_admin()
  )
);

drop policy if exists "candidate documents own insert" on storage.objects;
create policy "candidate documents own insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'candidate-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or public.is_admin()
  )
);

drop policy if exists "candidate documents own update" on storage.objects;
create policy "candidate documents own update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'candidate-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or public.is_admin()
  )
)
with check (
  bucket_id = 'candidate-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or public.is_admin()
  )
);

drop policy if exists "admin manage brand assets" on storage.objects;
create policy "admin manage brand assets"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'brand-assets'
  and public.is_admin()
)
with check (
  bucket_id = 'brand-assets'
  and public.is_admin()
);

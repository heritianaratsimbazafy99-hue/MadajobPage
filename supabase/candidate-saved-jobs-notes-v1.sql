drop policy if exists "candidate saved jobs self update" on public.candidate_saved_jobs;
create policy "candidate saved jobs self update"
on public.candidate_saved_jobs
for update
to authenticated
using (candidate_id = auth.uid() or public.is_admin())
with check (candidate_id = auth.uid() or public.is_admin());

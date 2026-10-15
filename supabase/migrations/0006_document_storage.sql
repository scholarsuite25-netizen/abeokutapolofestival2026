-- 0006_document_storage.sql
-- Private document vault bucket for committee documents.
-- Path convention: <committee_id>/<uuid>-<filename>
-- Access: officers of that committee (and super_admin) only; no public bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'committee-documents',
  'committee-documents',
  false,
  10485760, -- 10 MB
  array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/png','image/jpeg','text/plain','application/zip']
)
on conflict (id) do nothing;

-- storage.foldername(name)[1] is the committee_id folder.
drop policy if exists "committee documents officer read" on storage.objects;
create policy "committee documents officer read"
  on storage.objects for select
  using (
    bucket_id = 'committee-documents'
    and (case when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$' then public.is_committee_officer(((storage.foldername(name))[1])::uuid) else false end)
  );

drop policy if exists "committee documents officer insert" on storage.objects;
create policy "committee documents officer insert"
  on storage.objects for insert
  with check (
    bucket_id = 'committee-documents'
    and (case when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$' then public.is_committee_officer(((storage.foldername(name))[1])::uuid) else false end)
  );

drop policy if exists "committee documents officer update" on storage.objects;
create policy "committee documents officer update"
  on storage.objects for update
  using (
    bucket_id = 'committee-documents'
    and (case when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$' then public.is_committee_officer(((storage.foldername(name))[1])::uuid) else false end)
  );

drop policy if exists "committee documents officer delete" on storage.objects;
create policy "committee documents officer delete"
  on storage.objects for delete
  using (
    bucket_id = 'committee-documents'
    and (case when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$' then public.is_committee_officer(((storage.foldername(name))[1])::uuid) else false end)
  );

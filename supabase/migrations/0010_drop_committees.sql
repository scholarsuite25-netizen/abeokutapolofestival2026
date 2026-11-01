-- 0010_drop_committees.sql
-- Purges all legacy committee tables, storage policies, and helper functions as requested.

-- Drop storage policies on committee-documents
drop policy if exists "committee documents select" on storage.objects;
drop policy if exists "committee documents member insert" on storage.objects;
drop policy if exists "committee documents officer insert" on storage.objects;
drop policy if exists "committee documents officer update" on storage.objects;
drop policy if exists "committee documents officer delete" on storage.objects;

-- Delete storage bucket if exists
delete from storage.buckets where id = 'committee-documents';

-- Drop committee tables in reverse dependency order
drop table if exists public.committee_activity_logs cascade;
drop table if exists public.committee_announcements cascade;
drop table if exists public.committee_documents cascade;
drop table if exists public.committee_decisions cascade;
drop table if exists public.committee_meetings cascade;
drop table if exists public.committee_tasks cascade;
drop table if exists public.committee_memberships cascade;
drop table if exists public.committee_positions cascade;
drop table if exists public.committee_responsibilities cascade;
drop table if exists public.committees cascade;

-- Drop committee helper functions
drop function if exists public.is_committee_member(uuid) cascade;
drop function if exists public.is_committee_officer(uuid) cascade;


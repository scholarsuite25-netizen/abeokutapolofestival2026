-- 0015_executive_rls_sync.sql
-- Synchronizes Row Level Security (RLS) policies for President and General Secretary roles
-- across registrations, credentials, check_in_events, and offline_commitments.

-- ── 1. Update Registrations Policies ──────────────────────────────────────────
drop policy if exists registrations_own_read on public.registrations;
create policy registrations_own_read
  on public.registrations
  for select
  using (
    user_id = public.current_user_id() or
    public.current_app_role() in ('super_admin', 'president', 'general_secretary', 'accreditation_officer')
  );

drop policy if exists registrations_executive_manage on public.registrations;
create policy registrations_executive_manage
  on public.registrations
  for update
  using (
    public.current_app_role() in ('super_admin', 'president', 'general_secretary')
  )
  with check (
    public.current_app_role() in ('super_admin', 'president', 'general_secretary')
  );

-- ── 2. Update Credentials Policies ────────────────────────────────────────────
drop policy if exists credentials_own_read on public.credentials;
create policy credentials_own_read
  on public.credentials
  for select
  using (
    exists (
      select 1 from public.registrations r
      where r.id = credentials.registration_id
        and r.user_id = public.current_user_id()
    ) or
    public.current_app_role() in ('super_admin', 'president', 'general_secretary', 'accreditation_officer', 'security_checkin_officer')
  );

drop policy if exists credentials_executive_manage on public.credentials;
create policy credentials_executive_manage
  on public.credentials
  for update
  using (
    public.current_app_role() in ('super_admin', 'president', 'general_secretary')
  )
  with check (
    public.current_app_role() in ('super_admin', 'president', 'general_secretary')
  );

-- ── 3. Update Check-In Events Read Policy ─────────────────────────────────────
drop policy if exists check_in_events_read on public.check_in_events;
create policy check_in_events_read
  on public.check_in_events
  for select
  using (
    public.current_app_role() in ('super_admin', 'president', 'general_secretary', 'accreditation_officer', 'security_checkin_officer')
  );

-- ── 4. Update Offline Commitments Policies ────────────────────────────────────
drop policy if exists offline_commitments_executive_read on public.offline_commitments;
create policy offline_commitments_executive_read
  on public.offline_commitments
  for select
  using (
    public.current_app_role() in ('super_admin', 'president', 'general_secretary')
  );

drop policy if exists offline_commitments_executive_manage on public.offline_commitments;
create policy offline_commitments_executive_manage
  on public.offline_commitments
  for all
  using (
    public.current_app_role() in ('super_admin', 'president', 'general_secretary')
  );


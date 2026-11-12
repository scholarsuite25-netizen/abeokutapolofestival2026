-- ============================================================================
-- 2026 ABEOKUTA POLO FESTIVAL - ALL MIGRATIONS CONSOLIDATED
-- Run this in the Supabase Dashboard -> SQL Editor
-- ============================================================================

-- ============================================================================
-- FILE: 0001_foundations.sql
-- ============================================================================

-- 0001_foundations.sql
-- 2026 Abeokuta Polo Festival — core foundations
-- Reference: ARCHITECTURE_PLAN.md §6, docs/SUPABASE_DATA_MODEL.md
-- RULE: every application table is RLS-protected (default-deny). No exceptions.

-- ── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;   -- gen_random_uuid(), digest()
create extension if not exists citext;     -- case-insensitive e-mail/text

-- ── Helpers ─────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Reads the caller's role from the authenticated JWT's `app_metadata.role`
-- (written by Supabase Auth when a role grant is issued). Falls back to
-- 'public' for anon. RLS policies compose on top of this.
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role', ''),
    'public'
  );
$$;

create or replace function public.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid();
$$;

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'festival_edition_status') then
    create type public.festival_edition_status as enum ('planning', 'published', 'live', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum (
      'guest',
      'committee_member',
      'committee_officer',
      'accreditation_officer',
      'finance_officer',
      'media_officer',
      'sponsorship_officer',
      'security_checkin_officer',
      'super_admin'
    );
  end if;
end $$;

-- ── Festival editions ───────────────────────────────────────────────────────
create table public.festival_editions (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  year          integer not null,
  starts_on     date,
  ends_on       date,
  status        public.festival_edition_status not null default 'planning',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Profiles (auth user → app identity) ─────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         citext,
  full_name     text,
  phone         text,
  -- Denormalised for cheap RLS: superseded by user_role_assignments in Phase 2.
  role          public.app_role,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Audit log (append-only, defence layer 6) ────────────────────────────────
create table public.audit_logs (
  id            bigint generated always as identity primary key,
  actor_id      uuid,
  action        text not null,           -- e.g. permission.changed, credential.override
  resource_type text,
  resource_id   text,
  details       jsonb not null default '{}'::jsonb,
  ip            inet,
  created_at    timestamptz not null default now()
);

comment on table public.audit_logs is
  'Append-only forensics. Every permission change, credential override, export and financial read writes a row.';

-- ── updated_at triggers ─────────────────────────────────────────────────────
create trigger festival_editions_set_updated_at
  before update on public.festival_editions
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── Row Level Security (default-deny floor) ─────────────────────────────────
alter table public.festival_editions enable row level security;
alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;

-- Published editions are public knowledge; drafts are not.
create policy festival_editions_public_read
  on public.festival_editions
  for select
  using (status in ('published', 'live'));

-- Owners read/update their own profile row; nothing else.
create policy profiles_own_read
  on public.profiles
  for select
  using (id = public.current_user_id());

create policy profiles_own_update
  on public.profiles
  for update
  using (id = public.current_user_id())
  with check (id = public.current_user_id());

-- audit_logs: no client policies at all → deny by default.
-- Insertion happens only through SECURITY DEFINER functions / service role.


-- ============================================================================
-- FILE: 0002_edition_and_audit_helpers.sql
-- ============================================================================

-- 0002_edition_and_audit_helpers.sql
-- 2026 Abeokuta Polo Festival — edition bootstrap + audit writer
-- NOTE: the super_admin grant for the nominated operator is issued MANUALLY
-- in a later migration (ARCHITECTURE_PLAN.md §7.5 step 1) — never by seed.

-- ── Append-only audit writer (SECURITY DEFINER) ─────────────────────────────
create or replace function public.write_audit(
  p_action        text,
  p_resource_type text default null,
  p_resource_id   text default null,
  p_details       jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  insert into public.audit_logs (actor_id, action, resource_type, resource_id, details)
  values (public.current_user_id(), p_action, p_resource_type, p_resource_id, p_details)
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.write_audit(text, text, text, jsonb) from public, anon;
-- Authenticated users may write audit rows; actor_id is always their own uid
-- (never spoofable). Actions log committee work, overrides and exports.
grant execute on function public.write_audit(text, text, text, jsonb) to authenticated, service_role;

-- Clients may read only their own audit rows (e.g. "your pass was revoked at X").
drop policy if exists audit_logs_own_read on public.audit_logs;
create policy audit_logs_own_read
  on public.audit_logs
  for select
  using (actor_id = public.current_user_id());

-- ── Seed the current festival edition (idempotent) ──────────────────────────
insert into public.festival_editions (name, slug, year, starts_on, ends_on, status)
values (
  '2026 Abeokuta Polo Festival — The Blueprint',
  '2026',
  2026,
  null,  -- exact dates: published by the Tournament Committee via CMS approval (D-09)
  null,
  'planning'
)
on conflict (slug) do nothing;


-- ============================================================================
-- FILE: 0003_identity_and_grants.sql
-- ============================================================================

-- 0003_identity_and_grants.sql
-- Identity, role catalog and scoped grants.
-- Authority for meaning: lib/permissions/matrix.ts (mirrored here for RLS).
-- ARCHITECTURE_PLAN.md §7.2/§7.5, docs/SUPABASE_DATA_MODEL.md §1.

-- ── Permission catalog ──────────────────────────────────────────────────────
create table public.permissions (
  code        text primary key,
  description text not null default ''
);

-- ── Role catalog ────────────────────────────────────────────────────────────
create table public.roles (
  key         text primary key,
  description text not null default ''
);

-- ── Role → permission grants (documentation + admin UI source) ──────────────
create table public.role_permissions (
  role_key        text not null references public.roles (key) on delete cascade,
  permission_code text not null references public.permissions (code) on delete cascade,
  primary key (role_key, permission_code)
);

-- ── Scoped, expiring grants (defence layer: authoritative app check) ────────
create table public.user_role_assignments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  role_key        text not null references public.roles (key),
  edition_id      uuid references public.festival_editions (id) on delete cascade,
  -- committee_id added in 0004 once `committees` exists
  permission_code text references public.permissions (code) on delete cascade,
  granted_by      uuid references auth.users (id),
  granted_at      timestamptz not null default now(),
  granted_reason  text,
  expires_at      timestamptz,
  revoked_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.user_role_assignments is
  'Scope-aware grants. effective = role/permission AND (edition AND committee AND not expired AND not revoked).';

create index user_role_assignments_user_idx on public.user_role_assignments (user_id)
  where revoked_at is null;

create trigger user_role_assignments_set_updated_at
  before update on public.user_role_assignments
  for each row execute function public.set_updated_at();

-- ── Seed catalogs (mirrors lib/permissions/matrix.ts) ───────────────────────
insert into public.permissions (code, description) values
  ('content.read', 'Read published festival content'),
  ('content.manage', 'Manage draft content'),
  ('registration.read_own', 'Read own registration'),
  ('registration.manage', 'Approve or edit registrations (accreditation)'),
  ('roster.read', 'Read assigned committee roster (approved fields only)'),
  ('roster.read_all', 'Read all committee rosters'),
  ('tasks.read', 'Read assigned committee tasks'),
  ('tasks.manage', 'Create and manage committee tasks'),
  ('minutes.read', 'Read committee minutes (granted)'),
  ('minutes.read_all', 'Read all committee minutes'),
  ('finance.read', 'Read offline finance ledger (finance_officer only)'),
  ('sponsorship.read_public', 'Read published sponsorship offers'),
  ('sponsorship.manage', 'Manage sponsorship pipeline and agreements'),
  ('directory.read_own', 'Read own directory entry'),
  ('credential.issue', 'Issue and revoke access credentials'),
  ('credential.validate', 'Validate credentials at the gate'),
  ('credential.override', 'Audited manual override at the gate'),
  ('cms.publish', 'Publish CMS content (with approver)'),
  ('grants.manage', 'Grant or revoke roles (super_admin only)'),
  ('export.bulk', 'Bulk export (writes audit row)')
on conflict (code) do nothing;

insert into public.roles (key, description) values
  ('guest', 'Registered attendee — own records only'),
  ('committee_member', 'Member of one or more committees'),
  ('committee_officer', 'Officer of one or more committees'),
  ('accreditation_officer', 'Registration approvals, credential issuance'),
  ('finance_officer', 'Offline ledger and budgets'),
  ('media_officer', 'CMS and media library'),
  ('sponsorship_officer', 'Sponsor pipeline and agreements'),
  ('security_checkin_officer', 'Gate validation and overrides'),
  ('super_admin', 'All permissions, audited')
on conflict (key) do nothing;

-- Mirror of matrix.ts role grants (matrix.ts stays authoritative in the app).
insert into public.role_permissions (role_key, permission_code)
select r.key, p.code
from (values
  ('guest', array['content.read','registration.read_own','directory.read_own','sponsorship.read_public']),
  ('committee_member', array['content.read','registration.read_own','directory.read_own','roster.read','tasks.read']),
  ('committee_officer', array['content.read','registration.read_own','directory.read_own','roster.read','tasks.read','tasks.manage','minutes.read','sponsorship.read_public']),
  ('accreditation_officer', array['content.read','registration.manage','roster.read','credential.issue','credential.override','export.bulk']),
  ('finance_officer', array['content.read','finance.read','export.bulk']),
  ('media_officer', array['content.read','content.manage','cms.publish','export.bulk']),
  ('sponsorship_officer', array['content.read','sponsorship.manage','roster.read','directory.read_own','export.bulk']),
  ('security_checkin_officer', array['content.read','credential.validate','credential.override','directory.read_own'])
) as t(role_key, codes)
cross join lateral unnest(t.codes) as u(perm_code)
join public.roles r on r.key = t.role_key
join public.permissions p on p.code = u.perm_code
on conflict do nothing;

insert into public.role_permissions (role_key, permission_code)
select 'super_admin', p.code from public.permissions p
on conflict do nothing;

-- ── Create a profile row for every auth user ────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_role_assignments enable row level security;

drop policy if exists permissions_read_all on public.permissions;
create policy permissions_read_all on public.permissions for select using (true);

drop policy if exists roles_read_all on public.roles;
create policy roles_read_all on public.roles for select using (true);

drop policy if exists role_permissions_read_all on public.role_permissions;
create policy role_permissions_read_all on public.role_permissions for select using (true);

-- Users may read their own active grants (to explain "why can/can't I…").
drop policy if exists user_role_assignments_own_read on public.user_role_assignments;
create policy user_role_assignments_own_read on public.user_role_assignments
  for select using (user_id = public.current_user_id());


-- ============================================================================
-- FILE: 0004_committees.sql
-- ============================================================================

-- 0004_committees.sql
-- Committee workspaces, people and memberships (Phase 2 — private governance).
-- Content-integrity: committee rosters and names are PRIVATE — never in public
-- payloads, metadata, sitemap or OG images (STITCH plan §8).
-- Seed data is provisional; no auth users are created for named members.

-- ── Committees (edition-scoped workspaces) ──────────────────────────────────
create table public.committees (
  id          uuid primary key default gen_random_uuid(),
  edition_id  uuid not null references public.festival_editions (id) on delete cascade,
  slug        text not null,
  name        text not null,
  -- 'proposed' until leadership approves responsibilities (D-07)
  status      text not null default 'proposed' check (status in ('proposed', 'active', 'archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (edition_id, slug)
);

create trigger committees_set_updated_at
  before update on public.committees
  for each row execute function public.set_updated_at();

-- ── Responsibilities (labelled "Proposed — pending approval") ───────────────
create table public.committee_responsibilities (
  id           uuid primary key default gen_random_uuid(),
  committee_id uuid not null references public.committees (id) on delete cascade,
  title        text not null,
  body         text,
  status       text not null default 'proposed' check (status in ('proposed', 'approved')),
  created_at   timestamptz not null default now()
);

-- ── Positions ───────────────────────────────────────────────────────────────
create table public.committee_positions (
  id           uuid primary key default gen_random_uuid(),
  committee_id uuid not null references public.committees (id) on delete cascade,
  title        text not null,
  sort_order   integer not null default 0
);

-- ── Person records (identity ambiguity preserved — never auto-merged) ───────
create table public.person_records (
  id              uuid primary key default gen_random_uuid(),
  edition_id      uuid references public.festival_editions (id) on delete cascade,
  source_spelling text not null,
  email           citext,
  phone           text,
  notes           text,
  profile_id      uuid references auth.users (id) on delete set null,
  verified_status text not null default 'unverified'
                  check (verified_status in ('unverified', 'provisional', 'verified', 'rejected')),
  verified_by     uuid references auth.users (id),
  verified_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.person_records is
  'Imported/provisional contacts. Source spelling kept verbatim; profile linkage is manual and audited. Never auto-merge name variants.';

create index person_records_profile_idx on public.person_records (profile_id);
create index person_records_status_idx on public.person_records (verified_status);

create trigger person_records_set_updated_at
  before update on public.person_records
  for each row execute function public.set_updated_at();

-- ── Memberships ─────────────────────────────────────────────────────────────
create table public.committee_memberships (
  id              uuid primary key default gen_random_uuid(),
  committee_id    uuid not null references public.committees (id) on delete cascade,
  person_id       uuid not null references public.person_records (id) on delete cascade,
  position_id     uuid references public.committee_positions (id) on delete set null,
  role_key        text not null default 'committee_member' references public.roles (key),
  verified_status text not null default 'provisional'
                  check (verified_status in ('provisional', 'verified', 'rejected')),
  starts_on       date,
  ends_on         date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (committee_id, person_id)
);

create trigger committee_memberships_set_updated_at
  before update on public.committee_memberships
  for each row execute function public.set_updated_at();

-- Scope column for grants, now that committees exist.
alter table public.user_role_assignments
  add column committee_id uuid references public.committees (id) on delete cascade;

create index user_role_assignments_committee_idx on public.user_role_assignments (committee_id)
  where revoked_at is null;

-- ── Grant helpers (SECURITY DEFINER; RLS floor) ─────────────────────────────
create or replace function public.current_edition_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.festival_editions where slug = '2026' limit 1;
$$;

create or replace function public.has_role(p_role text, p_committee uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_role_assignments a
    where a.user_id = public.current_user_id()
      and a.role_key = p_role
      and a.revoked_at is null
      and (a.expires_at is null or a.expires_at > now())
      and (a.edition_id is null or a.edition_id = public.current_edition_id())
      and (p_committee is null or a.committee_id is null or a.committee_id = p_committee)
  )
  or exists (
    select 1 from public.profiles p
    where p.id = public.current_user_id() and p.role::text = p_role
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('super_admin');
$$;

create or replace function public.is_committee_member(p_committee uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
      or public.has_role('committee_member', p_committee)
      or public.has_role('committee_officer', p_committee);
$$;

create or replace function public.is_committee_officer(p_committee uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin() or public.has_role('committee_officer', p_committee);
$$;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.committees enable row level security;
alter table public.committee_responsibilities enable row level security;
alter table public.committee_positions enable row level security;
alter table public.person_records enable row level security;
alter table public.committee_memberships enable row level security;

-- Committees: readable by members and admins only (names are private).
drop policy if exists committees_member_read on public.committees;
create policy committees_member_read on public.committees
  for select using (
    public.is_super_admin()
    or public.is_committee_member(id)
    or exists (
      select 1 from public.committee_memberships m
      where m.committee_id = committees.id
        and m.person_id in (select id from public.person_records where profile_id = public.current_user_id())
    )
  );

drop policy if exists committees_admin_write on public.committees;
create policy committees_admin_write on public.committees
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists responsibilities_member_read on public.committee_responsibilities;
create policy responsibilities_member_read on public.committee_responsibilities
  for select using (public.is_committee_member(committee_id));

drop policy if exists responsibilities_officer_write on public.committee_responsibilities;
create policy responsibilities_officer_write on public.committee_responsibilities
  for all using (public.is_committee_officer(committee_id))
  with check (public.is_committee_officer(committee_id));

drop policy if exists positions_member_read on public.committee_positions;
create policy positions_member_read on public.committee_positions
  for select using (public.is_committee_member(committee_id));

drop policy if exists positions_officer_write on public.committee_positions;
create policy positions_officer_write on public.committee_positions
  for all using (public.is_committee_officer(committee_id))
  with check (public.is_committee_officer(committee_id));

drop policy if exists person_records_own_read on public.person_records;
create policy person_records_own_read on public.person_records
  for select using (profile_id = public.current_user_id());

drop policy if exists person_records_committee_read on public.person_records;
create policy person_records_committee_read on public.person_records
  for select using (
    public.is_super_admin()
    or public.has_role('accreditation_officer')
    or exists (
      select 1 from public.committee_memberships m
      where m.person_id = person_records.id
        and public.is_committee_member(m.committee_id)
    )
  );

drop policy if exists person_records_admin_write on public.person_records;
create policy person_records_admin_write on public.person_records
  for all using (public.is_super_admin() or public.has_role('accreditation_officer'))
  with check (public.is_super_admin() or public.has_role('accreditation_officer'));

drop policy if exists memberships_member_read on public.committee_memberships;
create policy memberships_member_read on public.committee_memberships
  for select using (
    public.is_super_admin()
    or public.is_committee_member(committee_id)
    or person_id in (select id from public.person_records where profile_id = public.current_user_id())
  );

drop policy if exists memberships_officer_write on public.committee_memberships;
create policy memberships_officer_write on public.committee_memberships
  for all using (public.is_committee_officer(committee_id))
  with check (public.is_committee_officer(committee_id));

drop policy if exists user_role_assignments_admin_write on public.user_role_assignments;
create policy user_role_assignments_admin_write on public.user_role_assignments
  for all using (public.is_super_admin())
  with check (public.is_super_admin());


-- ============================================================================
-- FILE: 0005_committee_work.sql
-- ============================================================================

-- 0005_committee_work.sql
-- Committee operating surface: tasks, meetings, minutes, decisions, documents,
-- announcements, activity log (Phase 2).
-- Sensitivity rule (ARCHITECTURE_PLAN.md §7.4): minutes/documents are NOT
-- readable by plain membership — officers, super_admin, or an explicit grant.

create or replace function public.has_permission(p_code text, p_committee uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    -- direct permission grant
    select 1 from public.user_role_assignments a
    where a.user_id = public.current_user_id()
      and a.permission_code = p_code
      and a.revoked_at is null
      and (a.expires_at is null or a.expires_at > now())
      and (p_committee is null or a.committee_id is null or a.committee_id = p_committee)
  )
  or exists (
    -- permission via assigned role
    select 1
    from public.user_role_assignments a
    join public.role_permissions rp on rp.role_key = a.role_key and rp.permission_code = p_code
    where a.user_id = public.current_user_id()
      and a.revoked_at is null
      and (a.expires_at is null or a.expires_at > now())
      and (p_committee is null or a.committee_id is null or a.committee_id = p_committee)
  )
  or exists (
    -- bootstrap fallback via profiles.role
    select 1
    from public.profiles p
    join public.role_permissions rp on rp.role_key = p.role::text and rp.permission_code = p_code
    where p.id = public.current_user_id()
  );
$$;

-- ── Tasks ───────────────────────────────────────────────────────────────────
create table public.committee_tasks (
  id           uuid primary key default gen_random_uuid(),
  committee_id uuid not null references public.committees (id) on delete cascade,
  edition_id   uuid not null references public.festival_editions (id) on delete cascade,
  title        text not null,
  body         text,
  status       text not null default 'not_started'
               check (status in ('not_started', 'in_progress', 'awaiting_approval', 'completed', 'blocked', 'cancelled')),
  priority     text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  due_on       date,
  created_by   uuid references auth.users (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger committee_tasks_set_updated_at
  before update on public.committee_tasks
  for each row execute function public.set_updated_at();

create table public.task_assignments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.committee_tasks (id) on delete cascade,
  person_id  uuid not null references public.person_records (id) on delete cascade,
  assigned_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (task_id, person_id)
);

-- ── Meetings ────────────────────────────────────────────────────────────────
create table public.committee_meetings (
  id           uuid primary key default gen_random_uuid(),
  committee_id uuid not null references public.committees (id) on delete cascade,
  title        text not null,
  agenda       text,
  starts_at    timestamptz,
  ends_at      timestamptz,
  location     text,
  status       text not null default 'scheduled'
               check (status in ('scheduled', 'held', 'cancelled')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger committee_meetings_set_updated_at
  before update on public.committee_meetings
  for each row execute function public.set_updated_at();

create table public.meeting_minutes (
  id         uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.committee_meetings (id) on delete cascade,
  body       text not null,
  author_id  uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger meeting_minutes_set_updated_at
  before update on public.meeting_minutes
  for each row execute function public.set_updated_at();

-- ── Decisions ───────────────────────────────────────────────────────────────
create table public.committee_decisions (
  id           uuid primary key default gen_random_uuid(),
  committee_id uuid not null references public.committees (id) on delete cascade,
  title        text not null,
  body         text,
  decision_on  date,
  status       text not null default 'proposed'
               check (status in ('proposed', 'approved', 'rejected', 'superseded')),
  created_by   uuid references auth.users (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger committee_decisions_set_updated_at
  before update on public.committee_decisions
  for each row execute function public.set_updated_at();

-- ── Documents (private vault; signed URLs at the app layer) ─────────────────
create table public.committee_documents (
  id           uuid primary key default gen_random_uuid(),
  committee_id uuid not null references public.committees (id) on delete cascade,
  title        text not null,
  storage_path text not null,
  mime_type    text,
  size_bytes   bigint,
  uploaded_by  uuid references auth.users (id),
  created_at   timestamptz not null default now()
);

comment on table public.committee_documents is
  'Private document vault. No public bucket; access via short-lived signed URLs after permission check.';

-- ── Announcements ───────────────────────────────────────────────────────────
create table public.committee_announcements (
  id           uuid primary key default gen_random_uuid(),
  committee_id uuid not null references public.committees (id) on delete cascade,
  title        text not null,
  body         text not null,
  published_at timestamptz,
  created_by   uuid references auth.users (id),
  created_at   timestamptz not null default now()
);

-- ── Activity log (committee-local forensics) ────────────────────────────────
create table public.committee_activity_logs (
  id           bigint generated always as identity primary key,
  committee_id uuid not null references public.committees (id) on delete cascade,
  actor_id     uuid references auth.users (id),
  action       text not null,
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.committee_tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.committee_meetings enable row level security;
alter table public.meeting_minutes enable row level security;
alter table public.committee_decisions enable row level security;
alter table public.committee_documents enable row level security;
alter table public.committee_announcements enable row level security;
alter table public.committee_activity_logs enable row level security;

drop policy if exists tasks_member_read on public.committee_tasks;
create policy tasks_member_read on public.committee_tasks
  for select using (public.is_committee_member(committee_id));

drop policy if exists tasks_officer_write on public.committee_tasks;
create policy tasks_officer_write on public.committee_tasks
  for all using (public.is_committee_officer(committee_id))
  with check (public.is_committee_officer(committee_id));

drop policy if exists task_assignments_member_read on public.task_assignments;
create policy task_assignments_member_read on public.task_assignments
  for select using (
    public.is_committee_member(
      (select committee_id from public.committee_tasks where id = task_id)
    )
  );

drop policy if exists task_assignments_officer_write on public.task_assignments;
create policy task_assignments_officer_write on public.task_assignments
  for all using (
    public.is_committee_officer(
      (select committee_id from public.committee_tasks where id = task_id)
    )
  )
  with check (
    public.is_committee_officer(
      (select committee_id from public.committee_tasks where id = task_id)
    )
  );

drop policy if exists meetings_member_read on public.committee_meetings;
create policy meetings_member_read on public.committee_meetings
  for select using (public.is_committee_member(committee_id));

drop policy if exists meetings_officer_write on public.committee_meetings;
create policy meetings_officer_write on public.committee_meetings
  for all using (public.is_committee_officer(committee_id))
  with check (public.is_committee_officer(committee_id));

-- Minutes: explicit-grant sensitivity.
drop policy if exists minutes_officer_read on public.meeting_minutes;
create policy minutes_officer_read on public.meeting_minutes
  for select using (
    public.is_super_admin()
    or public.is_committee_officer(
      (select committee_id from public.committee_meetings where id = meeting_id)
    )
    or public.has_permission(
      'minutes.read',
      (select committee_id from public.committee_meetings where id = meeting_id)
    )
  );

drop policy if exists minutes_officer_write on public.meeting_minutes;
create policy minutes_officer_write on public.meeting_minutes
  for all using (
    public.is_committee_officer(
      (select committee_id from public.committee_meetings where id = meeting_id)
    )
  )
  with check (
    public.is_committee_officer(
      (select committee_id from public.committee_meetings where id = meeting_id)
    )
  );

drop policy if exists decisions_member_read on public.committee_decisions;
create policy decisions_member_read on public.committee_decisions
  for select using (public.is_committee_member(committee_id));

drop policy if exists decisions_officer_write on public.committee_decisions;
create policy decisions_officer_write on public.committee_decisions
  for all using (public.is_committee_officer(committee_id))
  with check (public.is_committee_officer(committee_id));

-- Documents: explicit-grant sensitivity (same rule as minutes).
drop policy if exists documents_officer_read on public.committee_documents;
create policy documents_officer_read on public.committee_documents
  for select using (
    public.is_super_admin()
    or public.is_committee_officer(committee_id)
    or public.has_permission('minutes.read', committee_id)
  );

drop policy if exists documents_officer_write on public.committee_documents;
create policy documents_officer_write on public.committee_documents
  for all using (public.is_committee_officer(committee_id))
  with check (public.is_committee_officer(committee_id));

drop policy if exists announcements_member_read on public.committee_announcements;
create policy announcements_member_read on public.committee_announcements
  for select using (public.is_committee_member(committee_id));

drop policy if exists announcements_officer_write on public.committee_announcements;
create policy announcements_officer_write on public.committee_announcements
  for all using (public.is_committee_officer(committee_id))
  with check (public.is_committee_officer(committee_id));

drop policy if exists activity_log_member_read on public.committee_activity_logs;
create policy activity_log_member_read on public.committee_activity_logs
  for select using (public.is_committee_member(committee_id));

drop policy if exists activity_log_officer_insert on public.committee_activity_logs;
create policy activity_log_officer_insert on public.committee_activity_logs
  for insert with check (public.is_committee_member(committee_id));


-- ============================================================================
-- FILE: 0006_document_storage.sql
-- ============================================================================

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


-- ============================================================================
-- FILE: 0007_registrations_and_credentials.sql
-- ============================================================================

-- 0007_registrations_and_credentials.sql
-- 2026 Abeokuta Polo Festival — Guest Registrations & QR Accreditation
-- Reference: ARCHITECTURE_PLAN.md §7.1 - §7.3, §8

-- ── 1. Guest Registrations ──────────────────────────────────────────────────
create table public.registrations (
  id              uuid primary key default gen_random_uuid(),
  edition_id      uuid references public.festival_editions(id),
  user_id         uuid references auth.users(id) on delete set null,
  first_name      text not null,
  last_name       text not null,
  email           citext not null,
  phone           text not null,
  category        text not null default 'General Public Admission',
  group_size      integer not null default 1,
  status          text not null default 'confirmed',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── 2. Accredited Credentials (HMAC-SHA256 Token Hashes) ────────────────────
create table public.credentials (
  id                  uuid primary key default gen_random_uuid(),
  registration_id     uuid references public.registrations(id) on delete cascade,
  holder_name         text not null,
  token_hash          text not null unique,
  pass_code           text not null unique, -- readable reference e.g. ABK-2026-X7K9
  pass_type           text not null default 'general', -- general, patron, committee, media
  zone_access         text[] not null default array['general_lawn'],
  status              text not null default 'active', -- active, revoked, expired
  check_in_count      integer not null default 0,
  first_checked_in_at timestamptz,
  last_checked_in_at  timestamptz,
  last_check_in_gate  text,
  revoked_reason      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── 3. Check-In Gate Events ─────────────────────────────────────────────────
create table public.check_in_events (
  id                  bigint generated always as identity primary key,
  credential_id       uuid references public.credentials(id) on delete cascade,
  gate                text not null, -- Gate 1 (Royal), Gate 2 (General), Gate 3 (Media/VIP)
  officer_id          uuid references auth.users(id) on delete set null,
  result              text not null, -- admitted, duplicate, revoked, invalid_zone
  details             jsonb not null default '{}'::jsonb,
  scanned_at          timestamptz not null default now()
);

-- ── 4. Indexes for Rapid Scanning ───────────────────────────────────────────
create index if not exists idx_credentials_token_hash on public.credentials (token_hash);
create index if not exists idx_credentials_pass_code on public.credentials (pass_code);
create index if not exists idx_registrations_email on public.registrations (email);
create index if not exists idx_check_in_events_scanned_at on public.check_in_events (scanned_at desc);

-- ── 5. Updated At Triggers ──────────────────────────────────────────────────
drop trigger if exists registrations_set_updated_at on public.registrations;
create trigger registrations_set_updated_at
  before update on public.registrations
  for each row execute function public.set_updated_at();

drop trigger if exists credentials_set_updated_at on public.credentials;
create trigger credentials_set_updated_at
  before update on public.credentials
  for each row execute function public.set_updated_at();

-- ── 6. Row Level Security (Mandatory Floor) ─────────────────────────────────
alter table public.registrations enable row level security;
alter table public.credentials enable row level security;
alter table public.check_in_events enable row level security;

-- Policies: Registrations
drop policy if exists registrations_public_insert on public.registrations;
create policy registrations_public_insert
  on public.registrations
  for insert
  with check (true);

drop policy if exists registrations_own_read on public.registrations;
create policy registrations_own_read
  on public.registrations
  for select
  using (
    user_id = public.current_user_id() or
    public.current_app_role() in ('super_admin', 'accreditation_officer')
  );

-- Policies: Credentials
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
    public.current_app_role() in ('super_admin', 'accreditation_officer', 'security_checkin_officer')
  );

drop policy if exists credentials_officer_update on public.credentials;
create policy credentials_officer_update
  on public.credentials
  for update
  using (public.current_app_role() in ('super_admin', 'security_checkin_officer', 'accreditation_officer'))
  with check (public.current_app_role() in ('super_admin', 'security_checkin_officer', 'accreditation_officer'));

-- Policies: Check-in Events
drop policy if exists check_in_events_officer_insert on public.check_in_events;
create policy check_in_events_officer_insert
  on public.check_in_events
  for insert
  with check (public.current_app_role() in ('super_admin', 'security_checkin_officer'));

drop policy if exists check_in_events_admin_read on public.check_in_events;
create policy check_in_events_admin_read
  on public.check_in_events
  for select
  using (public.current_app_role() in ('super_admin', 'security_checkin_officer', 'accreditation_officer'));

-- ── 7. Atomic Gate Check-in RPC Function ────────────────────────────────────
create or replace function public.process_gate_scan(
  p_pass_identifier  text, -- pass_code or token_hash
  p_gate             text,
  p_officer_id       uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cred public.credentials%rowtype;
  v_result text;
  v_status text;
  v_message text;
begin
  -- 1. Find credential by token_hash or pass_code
  select * into v_cred
  from public.credentials
  where token_hash = p_pass_identifier or pass_code = upper(trim(p_pass_identifier));

  if not found then
    return jsonb_build_object(
      'status', 'invalid',
      'result', 'rejected',
      'message', 'Credential not found or invalid format.'
    );
  end if;

  -- 2. Check revocation status
  if v_cred.status = 'revoked' then
    insert into public.check_in_events (credential_id, gate, officer_id, result, details)
    values (v_cred.id, p_gate, p_officer_id, 'revoked', jsonb_build_object('reason', v_cred.revoked_reason));

    return jsonb_build_object(
      'status', 'revoked',
      'result', 'rejected',
      'message', coalesce(v_cred.revoked_reason, 'This pass has been officially revoked by security protocol.')
    );
  end if;

  -- 3. Check duplicate / already admitted
  if v_cred.check_in_count > 0 then
    insert into public.check_in_events (credential_id, gate, officer_id, result, details)
    values (v_cred.id, p_gate, p_officer_id, 'duplicate', jsonb_build_object(
      'first_checked_in_at', v_cred.first_checked_in_at,
      'last_gate', v_cred.last_check_in_gate
    ));

    return jsonb_build_object(
      'status', 'duplicate',
      'result', 'already_admitted',
      'holder_name', v_cred.holder_name,
      'pass_type', v_cred.pass_type,
      'first_checked_in_at', v_cred.first_checked_in_at,
      'last_gate', v_cred.last_check_in_gate,
      'message', 'Warning: Pass already scanned and admitted.'
    );
  end if;

  -- 4. Valid First Check-in: Atomically admit
  update public.credentials
  set
    check_in_count = check_in_count + 1,
    first_checked_in_at = coalesce(first_checked_in_at, now()),
    last_checked_in_at = now(),
    last_check_in_gate = p_gate
  where id = v_cred.id;

  insert into public.check_in_events (credential_id, gate, officer_id, result, details)
  values (v_cred.id, p_gate, p_officer_id, 'admitted', jsonb_build_object('gate', p_gate));

  return jsonb_build_object(
    'status', 'valid',
    'result', 'admitted',
    'holder_name', v_cred.holder_name,
    'pass_type', v_cred.pass_type,
    'zone_access', to_jsonb(v_cred.zone_access),
    'admitted_at', now(),
    'message', 'Access Granted. Welcome to the 2026 Abeokuta Polo Festival.'
  );
end;
$$;


-- ============================================================================
-- FILE: 0008_offline_commitments.sql
-- ============================================================================

-- 0008_offline_commitments.sql
-- 2026 Abeokuta Polo Festival — Offline Finance Commitment Ledger (D-14)
-- AND registration approval default (D-01: entry = registration → approval → credential).
-- Reference: ARCHITECTURE_PLAN.md §7, docs/FESTIVAL_CONTENT_AND_SPONSORSHIP.md

-- ── 1. Registration default becomes approval-gated ──────────────────────────
alter table public.registrations alter column status set default 'pending_approval';

-- ── 2. Offline Commitments Ledger (finance role only) ────────────────────────
create table public.offline_commitments (
  id               uuid primary key default gen_random_uuid(),
  edition_id       uuid references public.festival_editions(id),
  sponsor_name     text not null,
  tier             text not null,
  proposed_amount  bigint not null default 0 check (proposed_amount >= 0),
  confirmed_amount bigint not null default 0 check (confirmed_amount >= 0),
  status           text not null default 'pledged'
                     check (status in ('pledged', 'mou_signed', 'bank_wire_confirmed', 'fulfilled')),
  channel          text not null default 'Bank Wire Transfer',
  reference_code   text,
  recorded_by      uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_offline_commitments_status on public.offline_commitments (status);

drop trigger if exists offline_commitments_set_updated_at on public.offline_commitments;
create trigger offline_commitments_set_updated_at
  before update on public.offline_commitments
  for each row execute function public.set_updated_at();

-- ── 3. Row Level Security ───────────────────────────────────────────────────
alter table public.offline_commitments enable row level security;

-- Readable only by finance_officer / super_admin (D-14: finance-role-only ledger).
drop policy if exists offline_commitments_read on public.offline_commitments;
create policy offline_commitments_read
  on public.offline_commitments
  for select
  using (public.current_app_role() in ('super_admin', 'finance_officer'));

-- Writable only by finance_officer / super_admin.
drop policy if exists offline_commitments_write on public.offline_commitments;
create policy offline_commitments_write
  on public.offline_commitments
  for all
  using (public.current_app_role() in ('super_admin', 'finance_officer'))
  with check (public.current_app_role() in ('super_admin', 'finance_officer'));

-- ── 4. Credentials: store issued_at so signed pass tokens can be re-derived ──
alter table public.credentials add column if not exists issued_at timestamptz;


-- ============================================================================
-- FILE: 0009_guest_affiliation_and_daily_checkin.sql
-- ============================================================================

-- 0009_guest_affiliation_and_daily_checkin.sql
-- 2026 Abeokuta Polo Festival — Guest of / Corporate Affiliation & 3-Day Daily Check-in

-- ── 1. Enhance Registrations Table with Guest Affiliation ─────────────────────
alter table public.registrations
  add column if not exists affiliation_type text not null default 'individual',
  add column if not exists host_name text,
  add column if not exists organization text;

-- ── 2. Enhance Credentials Table with Affiliation & 3-Day Attendance ───────────
alter table public.credentials
  add column if not exists affiliation_type text not null default 'individual',
  add column if not exists host_name text,
  add column if not exists organization text,
  add column if not exists day1_checked_in_at timestamptz,
  add column if not exists day2_checked_in_at timestamptz,
  add column if not exists day3_checked_in_at timestamptz;

-- ── 3. Check-In Gate Events with Event Day ─────────────────────────────────────
alter table public.check_in_events
  add column if not exists event_day integer not null default 1;

-- ── 4. Atomic Daily Gate Check-in RPC Function ────────────────────────────────
create or replace function public.process_gate_scan(
  p_pass_identifier  text,
  p_gate             text,
  p_officer_id       uuid default null,
  p_event_day        integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cred public.credentials%rowtype;
  v_day_already_checked_in boolean := false;
  v_day_checked_at timestamptz;
begin
  -- 1. Locate credential by token hash or pass code
  select * into v_cred
  from public.credentials
  where token_hash = p_pass_identifier or pass_code = upper(trim(p_pass_identifier));

  if not found then
    return jsonb_build_object(
      'status', 'invalid',
      'result', 'rejected',
      'message', 'Credential not found or invalid pass code format.'
    );
  end if;

  -- 2. Check revocation status
  if v_cred.status = 'revoked' then
    insert into public.check_in_events (credential_id, gate, officer_id, result, details, event_day)
    values (v_cred.id, p_gate, p_officer_id, 'revoked', jsonb_build_object('reason', v_cred.revoked_reason), p_event_day);

    return jsonb_build_object(
      'status', 'revoked',
      'result', 'rejected',
      'message', coalesce(v_cred.revoked_reason, 'This pass has been officially revoked by security protocol.')
    );
  end if;

  -- 3. Check duplicate admission for the specified tournament day (Day 1, Day 2, or Day 3)
  if p_event_day = 1 and v_cred.day1_checked_in_at is not null then
    v_day_already_checked_in := true;
    v_day_checked_at := v_cred.day1_checked_in_at;
  elsif p_event_day = 2 and v_cred.day2_checked_in_at is not null then
    v_day_already_checked_in := true;
    v_day_checked_at := v_cred.day2_checked_in_at;
  elsif p_event_day = 3 and v_cred.day3_checked_in_at is not null then
    v_day_already_checked_in := true;
    v_day_checked_at := v_cred.day3_checked_in_at;
  end if;

  if v_day_already_checked_in then
    insert into public.check_in_events (credential_id, gate, officer_id, result, details, event_day)
    values (v_cred.id, p_gate, p_officer_id, 'duplicate', jsonb_build_object(
      'event_day', p_event_day,
      'admitted_at', v_day_checked_at,
      'gate', v_cred.last_check_in_gate
    ), p_event_day);

    return jsonb_build_object(
      'status', 'duplicate',
      'result', 'already_admitted',
      'holder_name', v_cred.holder_name,
      'pass_type', v_cred.pass_type,
      'affiliation_type', v_cred.affiliation_type,
      'host_name', v_cred.host_name,
      'organization', v_cred.organization,
      'event_day', p_event_day,
      'day1_checked_in', (v_cred.day1_checked_in_at is not null),
      'day2_checked_in', (v_cred.day2_checked_in_at is not null),
      'day3_checked_in', (v_cred.day3_checked_in_at is not null),
      'first_checked_in_at', v_day_checked_at,
      'last_gate', v_cred.last_check_in_gate,
      'message', format('Notice: Pass was already admitted on Day %s at %s.', p_event_day, to_char(v_day_checked_at, 'HH24:MI'))
    );
  end if;

  -- 4. Valid check-in for this event day: Update day status atomically
  if p_event_day = 1 then
    update public.credentials
    set
      day1_checked_in_at = now(),
      check_in_count = check_in_count + 1,
      first_checked_in_at = coalesce(first_checked_in_at, now()),
      last_checked_in_at = now(),
      last_check_in_gate = p_gate
    where id = v_cred.id;
  elsif p_event_day = 2 then
    update public.credentials
    set
      day2_checked_in_at = now(),
      check_in_count = check_in_count + 1,
      first_checked_in_at = coalesce(first_checked_in_at, now()),
      last_checked_in_at = now(),
      last_check_in_gate = p_gate
    where id = v_cred.id;
  else
    update public.credentials
    set
      day3_checked_in_at = now(),
      check_in_count = check_in_count + 1,
      first_checked_in_at = coalesce(first_checked_in_at, now()),
      last_checked_in_at = now(),
      last_check_in_gate = p_gate
    where id = v_cred.id;
  end if;

  insert into public.check_in_events (credential_id, gate, officer_id, result, details, event_day)
  values (v_cred.id, p_gate, p_officer_id, 'admitted', jsonb_build_object(
    'gate', p_gate,
    'event_day', p_event_day
  ), p_event_day);

  return jsonb_build_object(
    'status', 'valid',
    'result', 'admitted',
    'holder_name', v_cred.holder_name,
    'pass_type', v_cred.pass_type,
    'affiliation_type', v_cred.affiliation_type,
    'host_name', v_cred.host_name,
    'organization', v_cred.organization,
    'zone_access', to_jsonb(v_cred.zone_access),
    'event_day', p_event_day,
    'day1_checked_in', (p_event_day = 1 or v_cred.day1_checked_in_at is not null),
    'day2_checked_in', (p_event_day = 2 or v_cred.day2_checked_in_at is not null),
    'day3_checked_in', (p_event_day = 3 or v_cred.day3_checked_in_at is not null),
    'admitted_at', now(),
    'message', format('Access Granted for Day %s. Welcome to 2026 Abeokuta Polo Festival.', p_event_day)
  );
end;
$$;



-- ============================================================================
-- FILE: 0010_drop_committees.sql
-- ============================================================================

-- 0010_drop_committees.sql
-- Purges all legacy committee tables, storage policies, and helper functions as requested.

-- Drop storage policies on committee-documents
drop policy if exists "committee documents select" on storage.objects;
drop policy if exists "committee documents member insert" on storage.objects;
drop policy if exists "committee documents officer insert" on storage.objects;
drop policy if exists "committee documents officer update" on storage.objects;
drop policy if exists "committee documents officer delete" on storage.objects;

-- Delete storage bucket if exists (wrapped in exception block for Supabase Storage trigger compatibility)
do $$
begin
  delete from storage.buckets where id = 'committee-documents';
exception when others then
  null;
end $$;

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



-- ============================================================================
-- FILE: 0011_ticket_admission_rules.sql
-- ============================================================================

-- 0011_ticket_admission_rules.sql
-- Abeokuta Polo Festival 2026: Day 1 Free, Day 2 & Day 3 Through Ticket

alter table public.registrations
  add column if not exists has_day2_ticket boolean not null default false,
  add column if not exists has_day3_ticket boolean not null default false,
  add column if not exists day2_ticket_ref text,
  add column if not exists day3_ticket_ref text;

alter table public.credentials
  add column if not exists has_day2_ticket boolean not null default false,
  add column if not exists has_day3_ticket boolean not null default false,
  add column if not exists day2_ticket_ref text,
  add column if not exists day3_ticket_ref text,
  add column if not exists day1_status text not null default 'free_admitted',
  add column if not exists day2_status text not null default 'ticket_required',
  add column if not exists day3_status text not null default 'ticket_required';



-- ============================================================================
-- FILE: 0012_day3_payment_claims.sql
-- ============================================================================

-- 0012_day3_payment_claims.sql
-- Single-use ledger for verified Paystack references (Day 3 VVIP).
-- A reference may be turned into passes exactly once: the primary key makes a
-- second claim fail with a unique violation (23505).
-- Written and read only by the server with the service-role key.

create table if not exists public.day3_payment_claims (
  reference        text primary key,
  email            citext not null,
  amount_ngn       integer not null check (amount_ngn > 0),
  quantity         integer not null check (quantity between 1 and 20),
  registration_id  uuid references public.registrations(id) on delete set null,
  claimed_at       timestamptz not null default now()
);

create index if not exists idx_day3_payment_claims_email
  on public.day3_payment_claims (email);

-- RLS is enabled with NO policies: anon and authenticated users can do nothing.
-- The service role bypasses RLS, which is the only path that writes here.
alter table public.day3_payment_claims enable row level security;

revoke all on public.day3_payment_claims from anon, authenticated;


-- ============================================================================
-- FILE: 0013_wema_bank_transfers.sql
-- ============================================================================

-- 0013_wema_bank_transfers.sql
-- Direct Bank Wire Transfer to Club Account (WEMA BANK: 0126769779)
-- Abeokuta Polo Festival 2026

alter table public.registrations
  add column if not exists bank_transfer_ref text,
  add column if not exists payment_method text default 'free';

alter table public.credentials
  add column if not exists bank_transfer_ref text;

create index if not exists idx_registrations_bank_transfer_ref
  on public.registrations (bank_transfer_ref);


-- Anti-Fraud Guard: Gate Scanner Turnstile Verification Protocol
create or replace function public.process_gate_scan(
  p_pass_identifier  text,
  p_gate             text,
  p_officer_id       uuid default null,
  p_event_day        integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cred public.credentials%rowtype;
  v_day_already_checked_in boolean := false;
  v_day_checked_at timestamptz;
begin
  -- 1. Locate credential by token hash or pass code
  select * into v_cred
  from public.credentials
  where token_hash = p_pass_identifier or pass_code = upper(trim(p_pass_identifier));

  if not found then
    return jsonb_build_object(
      'status', 'invalid',
      'result', 'rejected',
      'message', 'Credential not found or invalid pass code format.'
    );
  end if;

  -- 2. Anti-Fraud Guard: Strictly check for unverified payment
  if v_cred.status = 'pending_verification' or v_cred.status = 'pending_bank_verification' or v_cred.status = 'pending_approval' then
    insert into public.check_in_events (credential_id, gate, officer_id, result, details, event_day)
    values (v_cred.id, p_gate, p_officer_id, 'unverified', jsonb_build_object('status', v_cred.status), p_event_day);

    return jsonb_build_object(
      'status', 'unverified',
      'result', 'rejected',
      'holder_name', v_cred.holder_name,
      'pass_type', v_cred.pass_type,
      'affiliation_type', v_cred.affiliation_type,
      'host_name', v_cred.host_name,
      'organization', v_cred.organization,
      'message', 'PAYMENT UNVERIFIED — ADMISSION DENIED. Please proceed to Secretariat accreditation desk.'
    );
  end if;

  -- 3. Check revocation status
  if v_cred.status = 'revoked' then
    insert into public.check_in_events (credential_id, gate, officer_id, result, details, event_day)
    values (v_cred.id, p_gate, p_officer_id, 'revoked', jsonb_build_object('reason', v_cred.revoked_reason), p_event_day);

    return jsonb_build_object(
      'status', 'revoked',
      'result', 'rejected',
      'message', coalesce(v_cred.revoked_reason, 'This pass has been officially revoked by security protocol.')
    );
  end if;

  -- 4. Check duplicate admission for the specified tournament day
  if p_event_day = 1 and v_cred.day1_checked_in_at is not null then
    v_day_already_checked_in := true;
    v_day_checked_at := v_cred.day1_checked_in_at;
  elsif p_event_day = 2 and v_cred.day2_checked_in_at is not null then
    v_day_already_checked_in := true;
    v_day_checked_at := v_cred.day2_checked_in_at;
  elsif p_event_day = 3 and v_cred.day3_checked_in_at is not null then
    v_day_already_checked_in := true;
    v_day_checked_at := v_cred.day3_checked_in_at;
  end if;

  if v_day_already_checked_in then
    insert into public.check_in_events (credential_id, gate, officer_id, result, details, event_day)
    values (v_cred.id, p_gate, p_officer_id, 'duplicate', jsonb_build_object(
      'event_day', p_event_day,
      'admitted_at', v_day_checked_at,
      'gate', v_cred.last_check_in_gate
    ), p_event_day);

    return jsonb_build_object(
      'status', 'duplicate',
      'result', 'already_admitted',
      'holder_name', v_cred.holder_name,
      'pass_type', v_cred.pass_type,
      'affiliation_type', v_cred.affiliation_type,
      'host_name', v_cred.host_name,
      'organization', v_cred.organization,
      'event_day', p_event_day,
      'day1_checked_in', (v_cred.day1_checked_in_at is not null),
      'day2_checked_in', (v_cred.day2_checked_in_at is not null),
      'day3_checked_in', (v_cred.day3_checked_in_at is not null),
      'first_checked_in_at', v_day_checked_at,
      'last_gate', v_cred.last_check_in_gate,
      'message', format('Notice: Pass was already admitted on Day %s at %s.', p_event_day, to_char(v_day_checked_at, 'HH24:MI'))
    );
  end if;

  -- 5. Valid check-in for this event day
  if p_event_day = 1 then
    update public.credentials
    set
      day1_checked_in_at = now(),
      check_in_count = check_in_count + 1,
      first_checked_in_at = coalesce(first_checked_in_at, now()),
      last_checked_in_at = now(),
      last_check_in_gate = p_gate
    where id = v_cred.id;
  elsif p_event_day = 2 then
    update public.credentials
    set
      day2_checked_in_at = now(),
      check_in_count = check_in_count + 1,
      first_checked_in_at = coalesce(first_checked_in_at, now()),
      last_checked_in_at = now(),
      last_check_in_gate = p_gate
    where id = v_cred.id;
  elsif p_event_day = 3 then
    update public.credentials
    set
      day3_checked_in_at = now(),
      check_in_count = check_in_count + 1,
      first_checked_in_at = coalesce(first_checked_in_at, now()),
      last_checked_in_at = now(),
      last_check_in_gate = p_gate
    where id = v_cred.id;
  end if;

  insert into public.check_in_events (credential_id, gate, officer_id, result, details, event_day)
  values (v_cred.id, p_gate, p_officer_id, 'admitted', jsonb_build_object(
    'event_day', p_event_day,
    'pass_type', v_cred.pass_type,
    'affiliation_type', v_cred.affiliation_type
  ), p_event_day);

  return jsonb_build_object(
    'status', 'valid',
    'result', 'admitted',
    'holder_name', v_cred.holder_name,
    'pass_type', v_cred.pass_type,
    'affiliation_type', v_cred.affiliation_type,
    'host_name', v_cred.host_name,
    'organization', v_cred.organization,
    'event_day', p_event_day,
    'day1_checked_in', (p_event_day = 1 or v_cred.day1_checked_in_at is not null),
    'day2_checked_in', (p_event_day = 2 or v_cred.day2_checked_in_at is not null),
    'day3_checked_in', (p_event_day = 3 or v_cred.day3_checked_in_at is not null),
    'admitted_at', to_char(now(), 'HH24:MI:SS'),
    'first_checked_in_at', coalesce(v_cred.first_checked_in_at, now()),
    'gate', p_gate,
    'message', format('Day %s Admission Confirmed. Welcome!', p_event_day)
  );
end;
$$;


-- ============================================================================
-- FILE: 0014_president_and_general_secretary_roles.sql
-- ============================================================================

-- 0014_president_and_general_secretary_roles.sql
-- Introduction of President and General Secretary executive roles,
-- and the exclusive admin.manage permission for Super Admin.

-- 1. Insert admin.manage permission
insert into public.permissions (code, description) values
  ('admin.manage', 'Exclusive super admin right to create, edit, or remove administrators')
on conflict (code) do update set description = excluded.description;

-- 2. Insert president and general_secretary roles
insert into public.roles (key, description) values
  ('president', 'Club President - Full operational access excluding admin management'),
  ('general_secretary', 'General Secretary - Full operational access excluding admin management')
on conflict (key) do update set description = excluded.description;

-- 3. Insert role_permissions for president, general_secretary, and super_admin
insert into public.role_permissions (role_key, permission_code)
select 'super_admin', 'admin.manage'
on conflict do nothing;

insert into public.role_permissions (role_key, permission_code)
select t.role_key, p.code
from (values
  ('president', array[
    'content.read',
    'content.manage',
    'registration.read_own',
    'registration.manage',
    'roster.read',
    'roster.read_all',
    'finance.read',
    'sponsorship.read_public',
    'sponsorship.manage',
    'directory.read_own',
    'credential.issue',
    'credential.validate',
    'credential.override',
    'cms.publish',
    'export.bulk'
  ]),
  ('general_secretary', array[
    'content.read',
    'content.manage',
    'registration.read_own',
    'registration.manage',
    'roster.read',
    'roster.read_all',
    'finance.read',
    'sponsorship.read_public',
    'sponsorship.manage',
    'directory.read_own',
    'credential.issue',
    'credential.validate',
    'credential.override',
    'cms.publish',
    'export.bulk'
  ])
) as t(role_key, codes)
cross join unnest(t.codes) as p(code)
on conflict do nothing;


-- ============================================================================
-- FILE: 0015_executive_rls_sync.sql
-- ============================================================================

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



-- ============================================================================
-- FILE: 0016_table_packages_and_affiliates.sql
-- ============================================================================

-- 0016_table_packages_and_affiliates.sql
-- Abeokuta Polo Festival 2026: Day 3 Exclusive Table Packages & International Affiliate Centre

-- ── 1. Table Bookings ────────────────────────────────────────────────────────
create table if not exists public.table_bookings (
  id                  uuid primary key default gen_random_uuid(),
  edition_id          uuid references public.festival_editions(id),
  package_id          text not null, -- kings_table, royal_table, queens_table, premium_table
  package_name        text not null,
  table_serial        text not null, -- e.g. "Kings Table 02"
  buyer_name          text not null,
  buyer_email         citext not null,
  buyer_phone         text not null,
  amount_ngn          integer not null default 100, -- Testing fee charged
  official_value_ngn  bigint not null default 5000000, -- Official prestige value
  payment_method      text not null default 'paystack', -- 'paystack' | 'bank_transfer'
  payment_ref         text,
  bank_transfer_ref   text,
  status              text not null default 'confirmed', -- 'confirmed' | 'pending_bank_verification'
  affiliate_code      text,
  attendees           jsonb not null default '[]'::jsonb, -- 10 attendees [{ seat: 1, name: "..." }, ...]
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_table_bookings_email on public.table_bookings (buyer_email);
create index if not exists idx_table_bookings_serial on public.table_bookings (table_serial);
create index if not exists idx_table_bookings_affiliate on public.table_bookings (affiliate_code);

-- ── 2. Affiliates Registry ──────────────────────────────────────────────────
create table if not exists public.affiliates (
  id                  uuid primary key default gen_random_uuid(),
  affiliate_code      text not null unique, -- e.g. "AFF-POLO-8472"
  full_name           text not null,
  email               citext not null unique,
  phone               text not null,
  country             text not null default 'Nigeria',
  payout_channel      text not null default 'nuban', -- 'nuban' | 'wire_iban' | 'paypal'
  payout_details      jsonb not null default '{}'::jsonb,
  clicks_count        integer not null default 0,
  status              text not null default 'active',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_affiliates_code on public.affiliates (affiliate_code);
create index if not exists idx_affiliates_email on public.affiliates (email);

-- ── 3. Affiliate Referrals Ledger ───────────────────────────────────────────
create table if not exists public.affiliate_referrals (
  id                      uuid primary key default gen_random_uuid(),
  affiliate_code          text not null references public.affiliates(affiliate_code) on delete cascade,
  item_type               text not null default 'table', -- 'table' | 'ticket'
  category                text not null, -- e.g. "The Kings Table" or "Day 3 Individual VVIP"
  order_ref               text not null,
  buyer_name              text not null,
  sale_amount_ngn         integer not null default 100,
  official_value_ngn      bigint not null default 10000000,
  commission_rate         numeric(4,2) not null default 0.10,
  commission_amount_ngn   numeric(12,2) not null,
  status                  text not null default 'confirmed', -- 'confirmed' | 'pending_verification' | 'paid'
  created_at              timestamptz not null default now()
);

create index if not exists idx_affiliate_referrals_code on public.affiliate_referrals (affiliate_code);

-- ── 4. Credentials Device-Locking Columns ────────────────────────────────────
alter table public.credentials add column if not exists bound_device_id text;
alter table public.credentials add column if not exists is_locked_to_device boolean default false;
alter table public.credentials add column if not exists claimed_at timestamptz;
create index if not exists idx_credentials_bound_device on public.credentials (bound_device_id);

-- ── 5. RLS Configuration ────────────────────────────────────────────────────
alter table public.table_bookings enable row level security;
alter table public.affiliates enable row level security;
alter table public.affiliate_referrals enable row level security;

-- Public can insert bookings and registrations; service role has full access
drop policy if exists table_bookings_insert_policy on public.table_bookings;
create policy table_bookings_insert_policy on public.table_bookings for insert with check (true);

drop policy if exists table_bookings_select_policy on public.table_bookings;
create policy table_bookings_select_policy on public.table_bookings for select using (true);

drop policy if exists affiliates_insert_policy on public.affiliates;
create policy affiliates_insert_policy on public.affiliates for insert with check (true);

drop policy if exists affiliates_select_policy on public.affiliates;
create policy affiliates_select_policy on public.affiliates for select using (true);

drop policy if exists affiliate_referrals_select_policy on public.affiliate_referrals;
create policy affiliate_referrals_select_policy on public.affiliate_referrals for select using (true);

drop policy if exists affiliate_referrals_insert_policy on public.affiliate_referrals;
create policy affiliate_referrals_insert_policy on public.affiliate_referrals for insert with check (true);


-- ============================================================================
-- FILE: 0017_durable_rate_limits.sql
-- ============================================================================

-- 0017_durable_rate_limits.sql
-- Abeokuta Polo Festival 2026: durable, database-backed rate limiting for the
-- credential verification oracle (review findings L1 + L2).

-- ── 1. Rate limit windows ────────────────────────────────────────────────────
create table if not exists public.rate_limit_windows (
  bucket        text primary key,
  window_start  timestamptz not null default now(),
  count         integer not null default 0,
  updated_at    timestamptz not null default now()
);

-- RLS floor: enabled with zero policies -> anon/authenticated can read or
-- write nothing; only the service role (which bypasses RLS) may touch rows.
alter table public.rate_limit_windows enable row level security;

revoke all on public.rate_limit_windows from anon, authenticated;

-- ── 2. Atomic consume RPC ─────────────────────────────────────────────────────
drop function if exists public.consume_rate_limit(text, integer, integer);

create function public.consume_rate_limit(
  p_bucket text,
  p_window_seconds integer,
  p_max_attempts integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_window timestamptz;
begin
  if p_bucket is null or p_bucket = '' then
    return false;
  end if;
  if p_window_seconds is null or p_window_seconds <= 0 then
    return false;
  end if;
  if p_max_attempts is null or p_max_attempts <= 0 then
    return false;
  end if;

  delete from public.rate_limit_windows
  where updated_at < now() - interval '2 days';

  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_windows (bucket, window_start, "count", updated_at)
  values (p_bucket, v_window, 1, now())
  on conflict (bucket) do update set
    "count" = case
      when public.rate_limit_windows.window_start = excluded.window_start
        then public.rate_limit_windows."count" + 1
      else 1
    end,
    window_start = excluded.window_start,
    updated_at = now()
  returning "count" into v_count;

  return v_count <= p_max_attempts;
end;
$$;

-- The RPC itself is callable only by the service role (admin client).
-- NOTE: PostgreSQL grants EXECUTE to PUBLIC by default on new functions, so
-- revoking from anon/authenticated alone is a no-op — PUBLIC must go too.
revoke execute on function public.consume_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant  execute on function public.consume_rate_limit(text, integer, integer)
  to service_role;





-- ============================================================================
-- FILE: 0018_booking_integrity_and_fail_closed_defaults.sql
-- ============================================================================

-- 0018_booking_integrity_and_fail_closed_defaults.sql
-- Abeokuta Polo Festival 2026: booking integrity and fail-closed defaults.
--
-- Audit findings addressed:
--   1. A table serial could be sold twice. `table_bookings` only had a plain
--      index on table_serial, so two guests could reserve "Kings Table 01"
--      and both would receive passes for the same table.
--   2. One bank transfer could pay for several bookings, because
--      bank_transfer_ref was not unique.
--   3. The column defaults failed OPEN: `amount_ngn` defaulted to 100 (the
--      retired test fee) and `status` defaulted to 'confirmed' — so any insert
--      that omitted them looked like a paid, confirmed booking.
--
-- The unique indexes are the race-proof backstop: the application check in
-- submitTableRegistration gives the guest a friendly message, and these
-- indexes guarantee that two simultaneous bookings can never both win.

-- ── 1. A table serial may only be sold once ─────────────────────────────────
create unique index if not exists idx_table_bookings_package_serial_unique
  on public.table_bookings (package_id, table_serial);

-- ── 2. A bank transfer reference may only pay for one booking ───────────────
create unique index if not exists idx_table_bookings_transfer_ref_unique
  on public.table_bookings (bank_transfer_ref)
  where bank_transfer_ref is not null;

-- ── 3. Fail-closed defaults ────────────────────────────────────────────────
-- No implicit test-fee amount: the amount must always be stated explicitly.
alter table public.table_bookings alter column amount_ngn drop default;
alter table public.table_bookings alter column official_value_ngn drop default;

-- No implicit 'confirmed': an unspecified status is an UNPAID booking.
alter table public.table_bookings
  alter column status set default 'pending_bank_verification';

-- A booked amount can never be negative.
alter table public.table_bookings
  drop constraint if exists table_bookings_amount_non_negative;
alter table public.table_bookings
  add constraint table_bookings_amount_non_negative check (amount_ngn >= 0);


-- ============================================================================
-- FILE: 0019_operational_schema.sql
-- ============================================================================

-- 0019_operational_schema.sql
-- Abeokuta Polo Festival 2026: the complete operational schema.
--
-- This migration gives every category of the operation a first-class table:
-- event configuration, attendees, hospitality, money, invitations, gate
-- operations, communications, site governance, and trust & safety.
--
-- House rules applied to every table:
--   * RLS is enabled with NO policies, and anon/authenticated are revoked —
--     only the service role (the server) may read or write. This is the same
--     floor used by 0012 (payment claims) and 0017 (rate-limit windows).
--   * created_at / updated_at are always present.
--   * Foreign keys point at the canonical table so the ledger cannot drift.
--
-- It also creates the `invitations` table, which the complimentary-invitation
-- module has always expected (it was silently falling back to `credentials`
-- because the table had never been created by any migration).

-- ═══════════════════════════════════════════════════════════════════════════
-- A. EVENT CONFIGURATION (reference data the app can read)
-- ═══════════════════════════════════════════════════════════════════════════

-- The three festival days.
create table if not exists public.festival_days (
  id             uuid primary key default gen_random_uuid(),
  edition_id     uuid references public.festival_editions(id) on delete cascade,
  day_number     integer not null check (day_number between 1 and 3),
  date           date not null,
  label          text not null,
  gates_open     text,
  status         text not null default 'scheduled', -- scheduled | open | closed
  created_at     timestamptz not null default now(),
  unique (edition_id, day_number)
);

-- The physical gates.
create table if not exists public.gates (
  id             uuid primary key default gen_random_uuid(),
  edition_id     uuid references public.festival_editions(id) on delete cascade,
  code           text not null unique,     -- Gate 1 | Gate 2 | Gate 3
  name           text not null,
  description    text,
  zone           text,                      -- royal | general | media
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- The five official hospitality packages (currently hard-coded in config).
create table if not exists public.hospitality_packages (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique, -- kings_table | royal_table | ...
  name               text not null,
  tagline            text,
  capacity           integer not null check (capacity > 0),
  price_ngn          integer not null check (price_ngn >= 0),
  official_value_ngn integer not null check (official_value_ngn >= 0),
  table_count        integer not null default 1,
  enclosure          text,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Price history: every price ever charged, with the reason it changed.
create table if not exists public.price_list (
  id             uuid primary key default gen_random_uuid(),
  edition_id     uuid references public.festival_editions(id) on delete cascade,
  item_type      text not null,             -- package | day3_pass | regular_section
  item_code      text not null,
  amount_ngn     integer not null check (amount_ngn >= 0),
  effective_from timestamptz not null default now(),
  effective_to   timestamptz,
  note           text,
  changed_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- Affiliate commission tiers (currently hard-coded in config).
create table if not exists public.affiliate_commission_tiers (
  id                  uuid primary key default gen_random_uuid(),
  category_name       text not null unique,
  package_code        text,
  package_value_ngn   integer not null check (package_value_ngn >= 0),
  commission_ngn      integer not null check (commission_ngn >= 0),
  commission_rate     numeric(5,4) not null default 0.1000,
  description         text,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- B. ATTENDEES & CREDENTIALS
-- ═══════════════════════════════════════════════════════════════════════════

-- Every device a credential has been seen on (anti-forwarding evidence).
create table if not exists public.attendee_devices (
  id             uuid primary key default gen_random_uuid(),
  credential_id  uuid references public.credentials(id) on delete cascade,
  registration_id uuid references public.registrations(id) on delete set null,
  device_id      text not null,
  is_primary     boolean not null default false,
  first_seen_at  timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),
  ip_address     text,
  user_agent     text
);
create index if not exists idx_attendee_devices_credential on public.attendee_devices (credential_id);
create index if not exists idx_attendee_devices_device on public.attendee_devices (device_id);

-- Secretariat notes about a guest (kept off the guest-facing record).
create table if not exists public.attendee_notes (
  id             uuid primary key default gen_random_uuid(),
  registration_id uuid references public.registrations(id) on delete cascade,
  note           text not null,
  author_id      uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_attendee_notes_registration on public.attendee_notes (registration_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- C. HOSPITALITY & TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- A short-lived hold on a table while a guest completes the booking form.
create table if not exists public.table_holds (
  id             uuid primary key default gen_random_uuid(),
  package_code   text not null,
  table_serial   text not null,
  session_key    text not null,
  buyer_email    citext,
  expires_at     timestamptz not null,
  released_at    timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists idx_table_holds_serial on public.table_holds (package_code, table_serial);
create index if not exists idx_table_holds_expiry on public.table_holds (expires_at);

-- Seat-level ledger for a table booking.
create table if not exists public.table_seats (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid references public.table_bookings(id) on delete cascade,
  seat_number    integer not null check (seat_number > 0),
  guest_name     text,
  credential_id  uuid references public.credentials(id) on delete set null,
  is_host        boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (booking_id, seat_number)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- D. PAYMENTS & FINANCE
-- ═══════════════════════════════════════════════════════════════════════════

-- One unified money ledger for every naira that moves.
create table if not exists public.payment_ledger (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique,      -- WEMA ref or Paystack reference
  source         text not null,             -- paystack | bank_transfer | cash
  amount_ngn     integer not null check (amount_ngn > 0),
  quantity       integer not null default 1 check (quantity > 0),
  status         text not null default 'pending', -- pending | verified | failed | refunded
  method         text,
  buyer_name     text,
  buyer_email    citext,
  buyer_phone    text,
  registration_id uuid references public.registrations(id) on delete set null,
  booking_id     uuid references public.table_bookings(id) on delete set null,
  verified_by    uuid references auth.users(id) on delete set null,
  verified_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_payment_ledger_status on public.payment_ledger (status);
create index if not exists idx_payment_ledger_email on public.payment_ledger (buyer_email);
create index if not exists idx_payment_ledger_created on public.payment_ledger (created_at desc);

-- The receipt a guest submits after paying by bank transfer.
create table if not exists public.bank_transfer_receipts (
  id             uuid primary key default gen_random_uuid(),
  ledger_id      uuid references public.payment_ledger(id) on delete cascade,
  reference_code text not null,
  amount_ngn     integer check (amount_ngn >= 0),
  submitted_via  text,                      -- whatsapp | email | desk
  receipt_note   text,
  received_at    timestamptz default now(),
  verified_by    uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_bank_transfer_receipts_ref on public.bank_transfer_receipts (reference_code);

-- Refunds and chargebacks.
create table if not exists public.refunds (
  id             uuid primary key default gen_random_uuid(),
  ledger_id      uuid references public.payment_ledger(id) on delete cascade,
  amount_ngn     integer not null check (amount_ngn > 0),
  reason         text not null,
  approved_by    uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- Commission owed to affiliate partners, and the payouts made.
create table if not exists public.affiliate_payouts (
  id             uuid primary key default gen_random_uuid(),
  affiliate_code text not null,
  period_start   date not null,
  period_end     date not null,
  gross_ngn      integer not null default 0 check (gross_ngn >= 0),
  commission_ngn integer not null default 0 check (commission_ngn >= 0),
  status         text not null default 'accrued', -- accrued | approved | paid | void
  payout_ref     text,
  paid_at        timestamptz,
  approved_by    uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_affiliate_payouts_code on public.affiliate_payouts (affiliate_code);

-- Payments received against a recorded commitment/sponsorship.
create table if not exists public.commitment_payments (
  id             uuid primary key default gen_random_uuid(),
  commitment_id  uuid references public.offline_commitments(id) on delete cascade,
  amount_ngn     integer not null check (amount_ngn > 0),
  channel        text,
  reference_code text,
  paid_at        timestamptz not null default now(),
  recorded_by    uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_commitment_payments_commitment on public.commitment_payments (commitment_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- E. INVITATIONS (the table the module always expected)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.invitations (
  id                 uuid primary key default gen_random_uuid(),
  invitation_code    text not null unique,
  first_name         text,
  surname            text,
  designation        text,
  category           text not null,
  is_custom_category boolean not null default false,
  security_seal      text,
  qr_payload         text,
  qr_token           text,
  bound_device_id    text,
  is_locked_to_device boolean not null default false,
  claimed_at         timestamptz,
  status             text not null default 'active',  -- active | revoked
  created_at         timestamptz not null default now(),
  updated_at         timestamptz
);
create index if not exists idx_invitations_category on public.invitations (category);
create index if not exists idx_invitations_status on public.invitations (status);

-- Every action taken on an invitation (issued, viewed, shared, unlocked).
create table if not exists public.invitation_audit (
  id             uuid primary key default gen_random_uuid(),
  invitation_id  uuid references public.invitations(id) on delete cascade,
  action         text not null,             -- issued | shared | unlocked | revoked | viewed
  actor_id       uuid references auth.users(id) on delete set null,
  details        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists idx_invitation_audit_invitation on public.invitation_audit (invitation_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- F. GATE OPERATIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Manual overrides at the gate (forced admission, device reset, duplicate waiver).
create table if not exists public.gate_incidents (
  id             uuid primary key default gen_random_uuid(),
  credential_id  uuid references public.credentials(id) on delete set null,
  pass_code_seen text,
  gate           text,
  officer_id     uuid references auth.users(id) on delete set null,
  incident_type  text not null,   -- manual_admission | duplicate_override | device_reset | credential_revoked
  reason         text not null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_gate_incidents_created on public.gate_incidents (created_at desc);

-- The fleet of scanner devices in the field.
create table if not exists public.scanner_devices (
  id             uuid primary key default gen_random_uuid(),
  officer_id     uuid references auth.users(id) on delete set null,
  device_label   text,
  app_version    text,
  last_seen_at   timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

-- Every refused admission attempt (for appeal handling and pattern spotting).
create table if not exists public.denied_admissions (
  id             uuid primary key default gen_random_uuid(),
  credential_id  uuid references public.credentials(id) on delete set null,
  pass_code_seen text,
  gate           text,
  officer_id     uuid references auth.users(id) on delete set null,
  reason         text not null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_denied_admissions_created on public.denied_admissions (created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- G. COMMUNICATIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Delivery record for every email and WhatsApp message the system sends.
create table if not exists public.notification_log (
  id             uuid primary key default gen_random_uuid(),
  channel        text not null,        -- email | whatsapp | sms
  recipient      text not null,
  template       text,
  subject        text,
  status         text not null default 'sent', -- sent | failed | skipped
  provider       text,                  -- resend | emailbump | whatsapp
  provider_id    text,
  error          text,
  registration_id uuid references public.registrations(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_notification_log_recipient on public.notification_log (recipient);
create index if not exists idx_notification_log_created on public.notification_log (created_at desc);

-- Reminders sent to guests, and whether they were delivered.
create table if not exists public.reminder_log (
  id             uuid primary key default gen_random_uuid(),
  registration_id uuid references public.registrations(id) on delete cascade,
  channel        text not null,
  cadence        text not null,        -- weekly | daily
  status         text not null default 'sent', -- sent | failed | skipped
  error          text,
  sent_at        timestamptz not null default now(),
  created_at     timestamptz not null default now()
);
create index if not exists idx_reminder_log_registration on public.reminder_log (registration_id);

-- Editable message copy (so wording can change without a code deploy).
create table if not exists public.message_templates (
  id             uuid primary key default gen_random_uuid(),
  template_key   text not null unique,
  channel        text not null,
  subject        text,
  body           text not null,
  is_active      boolean not null default true,
  updated_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- H. SITE GOVERNANCE
-- ═══════════════════════════════════════════════════════════════════════════

-- Governed switches. Admin-only, audited, expiring — the professional
-- replacement for the retired in-code testing-fee controller.
create table if not exists public.feature_flags (
  id             uuid primary key default gen_random_uuid(),
  flag_key       text not null unique,
  description    text,
  is_enabled     boolean not null default false,
  rollout_percentage integer not null default 100 check (rollout_percentage between 0 and 100),
  applies_to     text,
  expires_at     timestamptz,
  updated_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- The change history of every switch (who flipped it, when, why).
create table if not exists public.feature_flag_history (
  id             uuid primary key default gen_random_uuid(),
  flag_key       text not null,
  old_value      jsonb,
  new_value      jsonb,
  reason         text,
  changed_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_feature_flag_history_key on public.feature_flag_history (flag_key);

-- Site-wide settings (registration open/closed, capacity, contact details).
create table if not exists public.site_settings (
  key            text primary key,
  value          jsonb not null,
  description    text,
  updated_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- On-site banners and announcements.
create table if not exists public.announcements (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  body           text,
  placement      text not null default 'site', -- site | register | tables | dashboard
  tone           text not null default 'info', -- info | warning | success | danger
  is_active      boolean not null default true,
  starts_at      timestamptz,
  ends_at        timestamptz,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- I. TRUST, SAFETY & AUDIT
-- ═══════════════════════════════════════════════════════════════════════════

-- Suspicious activity raised by the guards (double booking, duplicate
-- registration, reference reuse, rate-limit trips, …).
create table if not exists public.fraud_alerts (
  id             uuid primary key default gen_random_uuid(),
  severity       text not null default 'medium', -- low | medium | high | critical
  category       text not null,
  subject_type   text,
  subject_id     text,
  details        jsonb not null default '{}'::jsonb,
  status         text not null default 'open',   -- open | investigating | dismissed | confirmed
  resolved_by    uuid references auth.users(id) on delete set null,
  resolved_at    timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists idx_fraud_alerts_status on public.fraud_alerts (status);
create index if not exists idx_fraud_alerts_created on public.fraud_alerts (created_at desc);

-- Security-relevant events: sign-ins, refusals, throttling.
create table if not exists public.security_events (
  id             uuid primary key default gen_random_uuid(),
  event_type     text not null,   -- login_success | login_failed | permission_denied | rate_limited
  actor_id       uuid references auth.users(id) on delete set null,
  ip_address     text,
  user_agent     text,
  details        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists idx_security_events_type on public.security_events (event_type);
create index if not exists idx_security_events_created on public.security_events (created_at desc);

-- Every export of guest data (who downloaded what, and how many rows).
create table if not exists public.report_exports (
  id             uuid primary key default gen_random_uuid(),
  report_id      text not null,
  requested_by   uuid references auth.users(id) on delete set null,
  format         text not null default 'csv',
  row_count      integer,
  filters        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists idx_report_exports_created on public.report_exports (created_at desc);

-- Requests raised by guests at the desk.
create table if not exists public.help_requests (
  id             uuid primary key default gen_random_uuid(),
  raised_by      text,
  contact        text,
  category       text not null default 'general',
  subject        text,
  body           text,
  status         text not null default 'open', -- open | in_progress | resolved | closed
  assigned_to    uuid references auth.users(id) on delete set null,
  resolved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_help_requests_status on public.help_requests (status);

-- ═══════════════════════════════════════════════════════════════════════════
-- J. REFERENCE DATA (seed)
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.festival_days (edition_id, day_number, date, label, gates_open, status)
select e.id, d.day_number, d.date::date, d.label, d.gates_open, d.status
from (values
  (1, '2026-12-18', 'Day 1 · Friday 18 December 2026', '10:00'),
  (2, '2026-12-19', 'Day 2 · Saturday 19 December 2026', '10:00'),
  (3, '2026-12-20', 'Day 3 · Grand Finale, Sunday 20 December 2026', '12:00')
) as d(day_number, date, label, gates_open, status)
cross join lateral (
  select id from public.festival_editions where slug = '2026' limit 1
) e
where exists (select 1 from public.festival_editions where slug = '2026')
on conflict do nothing;

insert into public.gates (edition_id, code, name, description, zone)
select e.id, g.code, g.name, g.description, g.zone
from (values
  ('Gate 1', 'Royal & VIP Boulevard', 'Royal patrons, VIPs and club dignitaries', 'royal'),
  ('Gate 2', 'General Turnstiles', 'General admission for Day 1 and Day 2 guests', 'general'),
  ('Gate 3', 'Media & Hospitality East', 'Press, media and hospitality access', 'media')
) as g(code, name, description, zone)
cross join lateral (
  select id from public.festival_editions where slug = '2026' limit 1
) e
where exists (select 1 from public.festival_editions where slug = '2026')
on conflict (code) do nothing;

insert into public.hospitality_packages
  (code, name, tagline, capacity, price_ngn, official_value_ngn, table_count, enclosure)
values
  ('kings_table', 'The Kings Table', 'Ultra-Exclusive VIP Experience', 10, 5000000, 5000000, 5, 'Kings Arena & Royal and Kings Hospitality Lounge'),
  ('royal_table', 'The Royal Table', 'Luxury Hospitality Experience', 8, 3000000, 3000000, 10, 'Royal Pavilion'),
  ('queens_table', 'The Queens Table', 'Signature Ladies Experience', 6, 2000000, 2000000, 10, 'Queens Lounge'),
  ('premium_table', 'The Premium Table', 'Premium Festival Experience', 5, 500000, 500000, 20, 'Clubhouse Terrace'),
  ('individual_vip', 'The Regular Section', 'General Festival Experience', 1, 50000, 50000, 200, 'Festival Viewing Area & Designated Public Seating')
on conflict (code) do nothing;

insert into public.affiliate_commission_tiers
  (category_name, package_code, package_value_ngn, commission_ngn, commission_rate, description)
values
  ('The Kings Table (10 Guests)', 'kings_table', 5000000, 500000, 0.1000, 'Ultra-Exclusive VIP Experience within the Kings Arena (10 Guests, 10 VIP parking vehicles).'),
  ('The Royal Table (8 Guests)', 'royal_table', 3000000, 300000, 0.1000, 'Luxury Hospitality Experience within the VVIP Hospitality Section (8 Guests, 5 VIP parking vehicles).'),
  ('The Queens Table (6 Guests)', 'queens_table', 2000000, 200000, 0.1000, 'Signature Ladies Experience within the Queens Lounge (6 Guests).'),
  ('The Premium Table (5 Guests)', 'premium_table', 500000, 50000, 0.1000, 'Premium Festival Experience within reserved seating and food & beverage package (5 Guests).'),
  ('The Regular Section (Day 3 Individual Pass)', 'individual_vip', 50000, 5000, 0.1000, 'General Festival Experience — ₦50,000 Per Person admission to the festival viewing area.')
on conflict (category_name) do nothing;

insert into public.price_list (edition_id, item_type, item_code, amount_ngn, note)
select e.id, 'package', p.item_code, p.amount_ngn, 'Official brochure pricing — pilot testing fee permanently concluded'
from (values
  ('kings_table', 5000000),
  ('royal_table', 3000000),
  ('queens_table', 2000000),
  ('premium_table', 500000),
  ('individual_vip', 50000)
) as p(item_code, amount_ngn)
cross join lateral (select id from public.festival_editions where slug = '2026' limit 1) e
where exists (select 1 from public.festival_editions where slug = '2026')
  and not exists (
    select 1 from public.price_list pl
    where pl.item_code = p.item_code and pl.item_type = 'package' and pl.effective_to is null
  );

insert into public.feature_flags (flag_key, description, is_enabled, rollout_percentage, applies_to)
values
  ('online_card_payments', 'Enable online card checkout (Paystack). Off until the club activates the card account.', false, 100, 'register,tables'),
  ('bank_transfer_payments', 'Enable direct bank transfer checkout for Day 3.', true, 100, 'register,tables'),
  ('invitation_issuance', 'Allow the Secretariat to issue complimentary VIP invitations.', true, 100, 'abawole'),
  ('public_registration', 'Allow the public to register for Day 1 and Day 2.', true, 100, 'register'),
  ('table_availability', 'Show live table availability on the VIP Tables page.', true, 100, 'tables')
on conflict (flag_key) do nothing;

insert into public.site_settings (key, value, description)
values
  ('registration_open', 'true'::jsonb, 'Whether the public registration form accepts new guests.'),
  ('ground_capacity', '3000'::jsonb, 'Maximum guests across all three days.'),
  ('secretariat_phone', '"+234 818 188 8884"'::jsonb, 'Secretariat WhatsApp number shown to guests.'),
  ('secretariat_email', '"abeokutapolo@gmail.com"'::jsonb, 'Secretariat email address.'),
  ('bank_account', '{"bank_name":"WEMA BANK","account_name":"ABEOKUTA POLO CLUB","account_number":"0126769779"}'::jsonb, 'Official club bank details for Day 3 payments.')
on conflict (key) do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
-- K. THE HOUSE RULE: server-only access for every new table
-- ═══════════════════════════════════════════════════════════════════════════
-- RLS is enabled with NO policies and anon/authenticated are revoked, so the
-- browser can never read or write these tables — only the server (service role).

alter table public.festival_days enable row level security;
revoke all on public.festival_days from anon, authenticated;

alter table public.gates enable row level security;
revoke all on public.gates from anon, authenticated;

alter table public.hospitality_packages enable row level security;
revoke all on public.hospitality_packages from anon, authenticated;

alter table public.price_list enable row level security;
revoke all on public.price_list from anon, authenticated;

alter table public.affiliate_commission_tiers enable row level security;
revoke all on public.affiliate_commission_tiers from anon, authenticated;

alter table public.attendee_devices enable row level security;
revoke all on public.attendee_devices from anon, authenticated;

alter table public.attendee_notes enable row level security;
revoke all on public.attendee_notes from anon, authenticated;

alter table public.table_holds enable row level security;
revoke all on public.table_holds from anon, authenticated;

alter table public.table_seats enable row level security;
revoke all on public.table_seats from anon, authenticated;

alter table public.payment_ledger enable row level security;
revoke all on public.payment_ledger from anon, authenticated;

alter table public.bank_transfer_receipts enable row level security;
revoke all on public.bank_transfer_receipts from anon, authenticated;

alter table public.refunds enable row level security;
revoke all on public.refunds from anon, authenticated;

alter table public.affiliate_payouts enable row level security;
revoke all on public.affiliate_payouts from anon, authenticated;

alter table public.commitment_payments enable row level security;
revoke all on public.commitment_payments from anon, authenticated;

alter table public.invitations enable row level security;
revoke all on public.invitations from anon, authenticated;

alter table public.invitation_audit enable row level security;
revoke all on public.invitation_audit from anon, authenticated;

alter table public.gate_incidents enable row level security;
revoke all on public.gate_incidents from anon, authenticated;

alter table public.scanner_devices enable row level security;
revoke all on public.scanner_devices from anon, authenticated;

alter table public.denied_admissions enable row level security;
revoke all on public.denied_admissions from anon, authenticated;

alter table public.notification_log enable row level security;
revoke all on public.notification_log from anon, authenticated;

alter table public.reminder_log enable row level security;
revoke all on public.reminder_log from anon, authenticated;

alter table public.message_templates enable row level security;
revoke all on public.message_templates from anon, authenticated;

alter table public.feature_flags enable row level security;
revoke all on public.feature_flags from anon, authenticated;

alter table public.feature_flag_history enable row level security;
revoke all on public.feature_flag_history from anon, authenticated;

alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;

alter table public.announcements enable row level security;
revoke all on public.announcements from anon, authenticated;

alter table public.fraud_alerts enable row level security;
revoke all on public.fraud_alerts from anon, authenticated;

alter table public.security_events enable row level security;
revoke all on public.security_events from anon, authenticated;

alter table public.report_exports enable row level security;
revoke all on public.report_exports from anon, authenticated;

alter table public.help_requests enable row level security;
revoke all on public.help_requests from anon, authenticated;

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



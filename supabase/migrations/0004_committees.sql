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

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

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
cross join lateral unnest(t.codes) as code
join public.roles r on r.key = t.role_key
join public.permissions p on p.code = code
on conflict do nothing;

insert into public.role_permissions (role_key, permission_code)
select 'super_admin', code from public.permissions
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

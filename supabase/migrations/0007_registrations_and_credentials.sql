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

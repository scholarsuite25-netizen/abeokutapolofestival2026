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


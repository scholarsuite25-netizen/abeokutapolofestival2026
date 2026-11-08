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

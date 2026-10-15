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

-- 0017_durable_rate_limits.sql
-- Abeokuta Polo Festival 2026: durable, database-backed rate limiting for the
-- credential verification oracle (review findings L1 + L2).
--
-- The verify endpoint previously kept its bucket in process memory, which
-- resets on every serverless invocation / redeploy and is per-instance, so an
-- attacker could evade throttling simply by spreading requests. This migration
-- adds an atomic upsert-increment counter in Postgres, reachable only from the
-- service-role client (RLS enabled with NO policies), via a SECURITY DEFINER
-- RPC so a single round trip consumes one attempt.

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
-- Returns true when the attempt is WITHIN the allowance, false when the bucket
-- for this fixed window is already exhausted. Window-aligned so concurrent
-- requests share one counter, and old windows reset naturally.
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

  -- Prune stale rows so the table cannot grow unbounded.
  delete from public.rate_limit_windows
  where updated_at < now() - interval '2 days';

  -- Fixed (aligned) window: all requests in the same N-second slice share a row.
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

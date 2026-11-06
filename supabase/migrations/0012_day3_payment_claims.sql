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

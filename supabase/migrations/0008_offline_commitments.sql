-- 0008_offline_commitments.sql
-- 2026 Abeokuta Polo Festival — Offline Finance Commitment Ledger (D-14)
-- AND registration approval default (D-01: entry = registration → approval → credential).
-- Reference: ARCHITECTURE_PLAN.md §7, docs/FESTIVAL_CONTENT_AND_SPONSORSHIP.md

-- ── 1. Registration default becomes approval-gated ──────────────────────────
alter table public.registrations alter column status set default 'pending_approval';

-- ── 2. Offline Commitments Ledger (finance role only) ────────────────────────
create table public.offline_commitments (
  id               uuid primary key default gen_random_uuid(),
  edition_id       uuid references public.festival_editions(id),
  sponsor_name     text not null,
  tier             text not null,
  proposed_amount  bigint not null default 0 check (proposed_amount >= 0),
  confirmed_amount bigint not null default 0 check (confirmed_amount >= 0),
  status           text not null default 'pledged'
                     check (status in ('pledged', 'mou_signed', 'bank_wire_confirmed', 'fulfilled')),
  channel          text not null default 'Bank Wire Transfer',
  reference_code   text,
  recorded_by      uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_offline_commitments_status on public.offline_commitments (status);

drop trigger if exists offline_commitments_set_updated_at on public.offline_commitments;
create trigger offline_commitments_set_updated_at
  before update on public.offline_commitments
  for each row execute function public.set_updated_at();

-- ── 3. Row Level Security ───────────────────────────────────────────────────
alter table public.offline_commitments enable row level security;

-- Readable only by finance_officer / super_admin (D-14: finance-role-only ledger).
drop policy if exists offline_commitments_read on public.offline_commitments;
create policy offline_commitments_read
  on public.offline_commitments
  for select
  using (public.current_app_role() in ('super_admin', 'finance_officer'));

-- Writable only by finance_officer / super_admin.
drop policy if exists offline_commitments_write on public.offline_commitments;
create policy offline_commitments_write
  on public.offline_commitments
  for all
  using (public.current_app_role() in ('super_admin', 'finance_officer'))
  with check (public.current_app_role() in ('super_admin', 'finance_officer'));

-- ── 4. Credentials: store issued_at so signed pass tokens can be re-derived ──
alter table public.credentials add column if not exists issued_at timestamptz;

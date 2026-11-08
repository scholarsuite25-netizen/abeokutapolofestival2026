-- 0016_table_packages_and_affiliates.sql
-- Abeokuta Polo Festival 2026: Day 3 Exclusive Table Packages & International Affiliate Centre

-- ── 1. Table Bookings ────────────────────────────────────────────────────────
create table if not exists public.table_bookings (
  id                  uuid primary key default gen_random_uuid(),
  edition_id          uuid references public.festival_editions(id),
  package_id          text not null, -- kings_table, royal_table, queens_table, premium_table
  package_name        text not null,
  table_serial        text not null, -- e.g. "Kings Table 02"
  buyer_name          text not null,
  buyer_email         citext not null,
  buyer_phone         text not null,
  amount_ngn          integer not null default 100, -- Testing fee charged
  official_value_ngn  bigint not null default 10000000, -- Official prestige value
  payment_method      text not null default 'paystack', -- 'paystack' | 'bank_transfer'
  payment_ref         text,
  bank_transfer_ref   text,
  status              text not null default 'confirmed', -- 'confirmed' | 'pending_bank_verification'
  affiliate_code      text,
  attendees           jsonb not null default '[]'::jsonb, -- 10 attendees [{ seat: 1, name: "..." }, ...]
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_table_bookings_email on public.table_bookings (buyer_email);
create index if not exists idx_table_bookings_serial on public.table_bookings (table_serial);
create index if not exists idx_table_bookings_affiliate on public.table_bookings (affiliate_code);

-- ── 2. Affiliates Registry ──────────────────────────────────────────────────
create table if not exists public.affiliates (
  id                  uuid primary key default gen_random_uuid(),
  affiliate_code      text not null unique, -- e.g. "AFF-POLO-8472"
  full_name           text not null,
  email               citext not null unique,
  phone               text not null,
  country             text not null default 'Nigeria',
  payout_channel      text not null default 'nuban', -- 'nuban' | 'wire_iban' | 'paypal'
  payout_details      jsonb not null default '{}'::jsonb,
  clicks_count        integer not null default 0,
  status              text not null default 'active',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_affiliates_code on public.affiliates (affiliate_code);
create index if not exists idx_affiliates_email on public.affiliates (email);

-- ── 3. Affiliate Referrals Ledger ───────────────────────────────────────────
create table if not exists public.affiliate_referrals (
  id                      uuid primary key default gen_random_uuid(),
  affiliate_code          text not null references public.affiliates(affiliate_code) on delete cascade,
  item_type               text not null default 'table', -- 'table' | 'ticket'
  category                text not null, -- e.g. "The Kings Table" or "Day 3 Individual VVIP"
  order_ref               text not null,
  buyer_name              text not null,
  sale_amount_ngn         integer not null default 100,
  official_value_ngn      bigint not null default 10000000,
  commission_rate         numeric(4,2) not null default 0.10,
  commission_amount_ngn   numeric(12,2) not null,
  status                  text not null default 'confirmed', -- 'confirmed' | 'pending_verification' | 'paid'
  created_at              timestamptz not null default now()
);

create index if not exists idx_affiliate_referrals_code on public.affiliate_referrals (affiliate_code);

-- ── 4. RLS Configuration ────────────────────────────────────────────────────
alter table public.table_bookings enable row level security;
alter table public.affiliates enable row level security;
alter table public.affiliate_referrals enable row level security;

-- Public can insert bookings and registrations; service role has full access
drop policy if exists table_bookings_insert_policy on public.table_bookings;
create policy table_bookings_insert_policy on public.table_bookings for insert with check (true);

drop policy if exists table_bookings_select_policy on public.table_bookings;
create policy table_bookings_select_policy on public.table_bookings for select using (true);

drop policy if exists affiliates_insert_policy on public.affiliates;
create policy affiliates_insert_policy on public.affiliates for insert with check (true);

drop policy if exists affiliates_select_policy on public.affiliates;
create policy affiliates_select_policy on public.affiliates for select using (true);

drop policy if exists affiliate_referrals_select_policy on public.affiliate_referrals;
create policy affiliate_referrals_select_policy on public.affiliate_referrals for select using (true);

drop policy if exists affiliate_referrals_insert_policy on public.affiliate_referrals;
create policy affiliate_referrals_insert_policy on public.affiliate_referrals for insert with check (true);

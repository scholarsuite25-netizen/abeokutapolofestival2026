-- 0018_booking_integrity_and_fail_closed_defaults.sql
-- Abeokuta Polo Festival 2026: booking integrity and fail-closed defaults.
--
-- Audit findings addressed:
--   1. A table serial could be sold twice. `table_bookings` only had a plain
--      index on table_serial, so two guests could reserve "Kings Table 01"
--      and both would receive passes for the same table.
--   2. One bank transfer could pay for several bookings, because
--      bank_transfer_ref was not unique.
--   3. The column defaults failed OPEN: `amount_ngn` defaulted to 100 (the
--      retired test fee) and `status` defaulted to 'confirmed' — so any insert
--      that omitted them looked like a paid, confirmed booking.
--
-- The unique indexes are the race-proof backstop: the application check in
-- submitTableRegistration gives the guest a friendly message, and these
-- indexes guarantee that two simultaneous bookings can never both win.

-- ── 1. A table serial may only be sold once ─────────────────────────────────
create unique index if not exists idx_table_bookings_package_serial_unique
  on public.table_bookings (package_id, table_serial);

-- ── 2. A bank transfer reference may only pay for one booking ───────────────
create unique index if not exists idx_table_bookings_transfer_ref_unique
  on public.table_bookings (bank_transfer_ref)
  where bank_transfer_ref is not null;

-- ── 3. Fail-closed defaults ────────────────────────────────────────────────
-- No implicit test-fee amount: the amount must always be stated explicitly.
alter table public.table_bookings alter column amount_ngn drop default;
alter table public.table_bookings alter column official_value_ngn drop default;

-- No implicit 'confirmed': an unspecified status is an UNPAID booking.
alter table public.table_bookings
  alter column status set default 'pending_bank_verification';

-- A booked amount can never be negative.
alter table public.table_bookings
  drop constraint if exists table_bookings_amount_non_negative;
alter table public.table_bookings
  add constraint table_bookings_amount_non_negative check (amount_ngn >= 0);

-- 0019_operational_schema.sql
-- Abeokuta Polo Festival 2026: the complete operational schema.
--
-- This migration gives every category of the operation a first-class table:
-- event configuration, attendees, hospitality, money, invitations, gate
-- operations, communications, site governance, and trust & safety.
--
-- House rules applied to every table:
--   * RLS is enabled with NO policies, and anon/authenticated are revoked —
--     only the service role (the server) may read or write. This is the same
--     floor used by 0012 (payment claims) and 0017 (rate-limit windows).
--   * created_at / updated_at are always present.
--   * Foreign keys point at the canonical table so the ledger cannot drift.
--
-- It also creates the `invitations` table, which the complimentary-invitation
-- module has always expected (it was silently falling back to `credentials`
-- because the table had never been created by any migration).

-- ═══════════════════════════════════════════════════════════════════════════
-- A. EVENT CONFIGURATION (reference data the app can read)
-- ═══════════════════════════════════════════════════════════════════════════

-- The three festival days.
create table if not exists public.festival_days (
  id             uuid primary key default gen_random_uuid(),
  edition_id     uuid references public.festival_editions(id) on delete cascade,
  day_number     integer not null check (day_number between 1 and 3),
  date           date not null,
  label          text not null,
  gates_open     text,
  status         text not null default 'scheduled', -- scheduled | open | closed
  created_at     timestamptz not null default now(),
  unique (edition_id, day_number)
);

-- The physical gates.
create table if not exists public.gates (
  id             uuid primary key default gen_random_uuid(),
  edition_id     uuid references public.festival_editions(id) on delete cascade,
  code           text not null unique,     -- Gate 1 | Gate 2 | Gate 3
  name           text not null,
  description    text,
  zone           text,                      -- royal | general | media
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- The five official hospitality packages (currently hard-coded in config).
create table if not exists public.hospitality_packages (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique, -- kings_table | royal_table | ...
  name               text not null,
  tagline            text,
  capacity           integer not null check (capacity > 0),
  price_ngn          integer not null check (price_ngn >= 0),
  official_value_ngn integer not null check (official_value_ngn >= 0),
  table_count        integer not null default 1,
  enclosure          text,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Price history: every price ever charged, with the reason it changed.
create table if not exists public.price_list (
  id             uuid primary key default gen_random_uuid(),
  edition_id     uuid references public.festival_editions(id) on delete cascade,
  item_type      text not null,             -- package | day3_pass | regular_section
  item_code      text not null,
  amount_ngn     integer not null check (amount_ngn >= 0),
  effective_from timestamptz not null default now(),
  effective_to   timestamptz,
  note           text,
  changed_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- Affiliate commission tiers (currently hard-coded in config).
create table if not exists public.affiliate_commission_tiers (
  id                  uuid primary key default gen_random_uuid(),
  category_name       text not null unique,
  package_code        text,
  package_value_ngn   integer not null check (package_value_ngn >= 0),
  commission_ngn      integer not null check (commission_ngn >= 0),
  commission_rate     numeric(5,4) not null default 0.1000,
  description         text,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- B. ATTENDEES & CREDENTIALS
-- ═══════════════════════════════════════════════════════════════════════════

-- Every device a credential has been seen on (anti-forwarding evidence).
create table if not exists public.attendee_devices (
  id             uuid primary key default gen_random_uuid(),
  credential_id  uuid references public.credentials(id) on delete cascade,
  registration_id uuid references public.registrations(id) on delete set null,
  device_id      text not null,
  is_primary     boolean not null default false,
  first_seen_at  timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),
  ip_address     text,
  user_agent     text
);
create index if not exists idx_attendee_devices_credential on public.attendee_devices (credential_id);
create index if not exists idx_attendee_devices_device on public.attendee_devices (device_id);

-- Secretariat notes about a guest (kept off the guest-facing record).
create table if not exists public.attendee_notes (
  id             uuid primary key default gen_random_uuid(),
  registration_id uuid references public.registrations(id) on delete cascade,
  note           text not null,
  author_id      uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_attendee_notes_registration on public.attendee_notes (registration_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- C. HOSPITALITY & TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- A short-lived hold on a table while a guest completes the booking form.
create table if not exists public.table_holds (
  id             uuid primary key default gen_random_uuid(),
  package_code   text not null,
  table_serial   text not null,
  session_key    text not null,
  buyer_email    citext,
  expires_at     timestamptz not null,
  released_at    timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists idx_table_holds_serial on public.table_holds (package_code, table_serial);
create index if not exists idx_table_holds_expiry on public.table_holds (expires_at);

-- Seat-level ledger for a table booking.
create table if not exists public.table_seats (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid references public.table_bookings(id) on delete cascade,
  seat_number    integer not null check (seat_number > 0),
  guest_name     text,
  credential_id  uuid references public.credentials(id) on delete set null,
  is_host        boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (booking_id, seat_number)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- D. PAYMENTS & FINANCE
-- ═══════════════════════════════════════════════════════════════════════════

-- One unified money ledger for every naira that moves.
create table if not exists public.payment_ledger (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique,      -- WEMA ref or Paystack reference
  source         text not null,             -- paystack | bank_transfer | cash
  amount_ngn     integer not null check (amount_ngn > 0),
  quantity       integer not null default 1 check (quantity > 0),
  status         text not null default 'pending', -- pending | verified | failed | refunded
  method         text,
  buyer_name     text,
  buyer_email    citext,
  buyer_phone    text,
  registration_id uuid references public.registrations(id) on delete set null,
  booking_id     uuid references public.table_bookings(id) on delete set null,
  verified_by    uuid references auth.users(id) on delete set null,
  verified_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_payment_ledger_status on public.payment_ledger (status);
create index if not exists idx_payment_ledger_email on public.payment_ledger (buyer_email);
create index if not exists idx_payment_ledger_created on public.payment_ledger (created_at desc);

-- The receipt a guest submits after paying by bank transfer.
create table if not exists public.bank_transfer_receipts (
  id             uuid primary key default gen_random_uuid(),
  ledger_id      uuid references public.payment_ledger(id) on delete cascade,
  reference_code text not null,
  amount_ngn     integer check (amount_ngn >= 0),
  submitted_via  text,                      -- whatsapp | email | desk
  receipt_note   text,
  received_at    timestamptz default now(),
  verified_by    uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_bank_transfer_receipts_ref on public.bank_transfer_receipts (reference_code);

-- Refunds and chargebacks.
create table if not exists public.refunds (
  id             uuid primary key default gen_random_uuid(),
  ledger_id      uuid references public.payment_ledger(id) on delete cascade,
  amount_ngn     integer not null check (amount_ngn > 0),
  reason         text not null,
  approved_by    uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- Commission owed to affiliate partners, and the payouts made.
create table if not exists public.affiliate_payouts (
  id             uuid primary key default gen_random_uuid(),
  affiliate_code text not null,
  period_start   date not null,
  period_end     date not null,
  gross_ngn      integer not null default 0 check (gross_ngn >= 0),
  commission_ngn integer not null default 0 check (commission_ngn >= 0),
  status         text not null default 'accrued', -- accrued | approved | paid | void
  payout_ref     text,
  paid_at        timestamptz,
  approved_by    uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_affiliate_payouts_code on public.affiliate_payouts (affiliate_code);

-- Payments received against a recorded commitment/sponsorship.
create table if not exists public.commitment_payments (
  id             uuid primary key default gen_random_uuid(),
  commitment_id  uuid references public.offline_commitments(id) on delete cascade,
  amount_ngn     integer not null check (amount_ngn > 0),
  channel        text,
  reference_code text,
  paid_at        timestamptz not null default now(),
  recorded_by    uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_commitment_payments_commitment on public.commitment_payments (commitment_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- E. INVITATIONS (the table the module always expected)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.invitations (
  id                 uuid primary key default gen_random_uuid(),
  invitation_code    text not null unique,
  first_name         text,
  surname            text,
  designation        text,
  category           text not null,
  is_custom_category boolean not null default false,
  security_seal      text,
  qr_payload         text,
  qr_token           text,
  bound_device_id    text,
  is_locked_to_device boolean not null default false,
  claimed_at         timestamptz,
  status             text not null default 'active',  -- active | revoked
  created_at         timestamptz not null default now(),
  updated_at         timestamptz
);
create index if not exists idx_invitations_category on public.invitations (category);
create index if not exists idx_invitations_status on public.invitations (status);

-- Every action taken on an invitation (issued, viewed, shared, unlocked).
create table if not exists public.invitation_audit (
  id             uuid primary key default gen_random_uuid(),
  invitation_id  uuid references public.invitations(id) on delete cascade,
  action         text not null,             -- issued | shared | unlocked | revoked | viewed
  actor_id       uuid references auth.users(id) on delete set null,
  details        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists idx_invitation_audit_invitation on public.invitation_audit (invitation_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- F. GATE OPERATIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Manual overrides at the gate (forced admission, device reset, duplicate waiver).
create table if not exists public.gate_incidents (
  id             uuid primary key default gen_random_uuid(),
  credential_id  uuid references public.credentials(id) on delete set null,
  pass_code_seen text,
  gate           text,
  officer_id     uuid references auth.users(id) on delete set null,
  incident_type  text not null,   -- manual_admission | duplicate_override | device_reset | credential_revoked
  reason         text not null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_gate_incidents_created on public.gate_incidents (created_at desc);

-- The fleet of scanner devices in the field.
create table if not exists public.scanner_devices (
  id             uuid primary key default gen_random_uuid(),
  officer_id     uuid references auth.users(id) on delete set null,
  device_label   text,
  app_version    text,
  last_seen_at   timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

-- Every refused admission attempt (for appeal handling and pattern spotting).
create table if not exists public.denied_admissions (
  id             uuid primary key default gen_random_uuid(),
  credential_id  uuid references public.credentials(id) on delete set null,
  pass_code_seen text,
  gate           text,
  officer_id     uuid references auth.users(id) on delete set null,
  reason         text not null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_denied_admissions_created on public.denied_admissions (created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- G. COMMUNICATIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Delivery record for every email and WhatsApp message the system sends.
create table if not exists public.notification_log (
  id             uuid primary key default gen_random_uuid(),
  channel        text not null,        -- email | whatsapp | sms
  recipient      text not null,
  template       text,
  subject        text,
  status         text not null default 'sent', -- sent | failed | skipped
  provider       text,                  -- resend | emailbump | whatsapp
  provider_id    text,
  error          text,
  registration_id uuid references public.registrations(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_notification_log_recipient on public.notification_log (recipient);
create index if not exists idx_notification_log_created on public.notification_log (created_at desc);

-- Reminders sent to guests, and whether they were delivered.
create table if not exists public.reminder_log (
  id             uuid primary key default gen_random_uuid(),
  registration_id uuid references public.registrations(id) on delete cascade,
  channel        text not null,
  cadence        text not null,        -- weekly | daily
  status         text not null default 'sent', -- sent | failed | skipped
  error          text,
  sent_at        timestamptz not null default now(),
  created_at     timestamptz not null default now()
);
create index if not exists idx_reminder_log_registration on public.reminder_log (registration_id);

-- Editable message copy (so wording can change without a code deploy).
create table if not exists public.message_templates (
  id             uuid primary key default gen_random_uuid(),
  template_key   text not null unique,
  channel        text not null,
  subject        text,
  body           text not null,
  is_active      boolean not null default true,
  updated_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- H. SITE GOVERNANCE
-- ═══════════════════════════════════════════════════════════════════════════

-- Governed switches. Admin-only, audited, expiring — the professional
-- replacement for the retired in-code testing-fee controller.
create table if not exists public.feature_flags (
  id             uuid primary key default gen_random_uuid(),
  flag_key       text not null unique,
  description    text,
  is_enabled     boolean not null default false,
  rollout_percentage integer not null default 100 check (rollout_percentage between 0 and 100),
  applies_to     text,
  expires_at     timestamptz,
  updated_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- The change history of every switch (who flipped it, when, why).
create table if not exists public.feature_flag_history (
  id             uuid primary key default gen_random_uuid(),
  flag_key       text not null,
  old_value      jsonb,
  new_value      jsonb,
  reason         text,
  changed_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_feature_flag_history_key on public.feature_flag_history (flag_key);

-- Site-wide settings (registration open/closed, capacity, contact details).
create table if not exists public.site_settings (
  key            text primary key,
  value          jsonb not null,
  description    text,
  updated_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- On-site banners and announcements.
create table if not exists public.announcements (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  body           text,
  placement      text not null default 'site', -- site | register | tables | dashboard
  tone           text not null default 'info', -- info | warning | success | danger
  is_active      boolean not null default true,
  starts_at      timestamptz,
  ends_at        timestamptz,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- I. TRUST, SAFETY & AUDIT
-- ═══════════════════════════════════════════════════════════════════════════

-- Suspicious activity raised by the guards (double booking, duplicate
-- registration, reference reuse, rate-limit trips, …).
create table if not exists public.fraud_alerts (
  id             uuid primary key default gen_random_uuid(),
  severity       text not null default 'medium', -- low | medium | high | critical
  category       text not null,
  subject_type   text,
  subject_id     text,
  details        jsonb not null default '{}'::jsonb,
  status         text not null default 'open',   -- open | investigating | dismissed | confirmed
  resolved_by    uuid references auth.users(id) on delete set null,
  resolved_at    timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists idx_fraud_alerts_status on public.fraud_alerts (status);
create index if not exists idx_fraud_alerts_created on public.fraud_alerts (created_at desc);

-- Security-relevant events: sign-ins, refusals, throttling.
create table if not exists public.security_events (
  id             uuid primary key default gen_random_uuid(),
  event_type     text not null,   -- login_success | login_failed | permission_denied | rate_limited
  actor_id       uuid references auth.users(id) on delete set null,
  ip_address     text,
  user_agent     text,
  details        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists idx_security_events_type on public.security_events (event_type);
create index if not exists idx_security_events_created on public.security_events (created_at desc);

-- Every export of guest data (who downloaded what, and how many rows).
create table if not exists public.report_exports (
  id             uuid primary key default gen_random_uuid(),
  report_id      text not null,
  requested_by   uuid references auth.users(id) on delete set null,
  format         text not null default 'csv',
  row_count      integer,
  filters        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists idx_report_exports_created on public.report_exports (created_at desc);

-- Requests raised by guests at the desk.
create table if not exists public.help_requests (
  id             uuid primary key default gen_random_uuid(),
  raised_by      text,
  contact        text,
  category       text not null default 'general',
  subject        text,
  body           text,
  status         text not null default 'open', -- open | in_progress | resolved | closed
  assigned_to    uuid references auth.users(id) on delete set null,
  resolved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_help_requests_status on public.help_requests (status);

-- ═══════════════════════════════════════════════════════════════════════════
-- J. REFERENCE DATA (seed)
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.festival_days (edition_id, day_number, date, label, gates_open, status)
select e.id, d.day_number, d.date::date, d.label, d.gates_open, d.status
from (values
  (1, '2026-12-18', 'Day 1 · Friday 18 December 2026', '10:00', 'scheduled'),
  (2, '2026-12-19', 'Day 2 · Saturday 19 December 2026', '10:00', 'scheduled'),
  (3, '2026-12-20', 'Day 3 · Grand Finale, Sunday 20 December 2026', '12:00', 'scheduled')
) as d(day_number, date, label, gates_open, status)
cross join lateral (
  select id from public.festival_editions where slug = '2026' limit 1
) e
where exists (select 1 from public.festival_editions where slug = '2026')
on conflict do nothing;

insert into public.gates (edition_id, code, name, description, zone)
select e.id, g.code, g.name, g.description, g.zone
from (values
  ('Gate 1', 'Royal & VIP Boulevard', 'Royal patrons, VIPs and club dignitaries', 'royal'),
  ('Gate 2', 'General Turnstiles', 'General admission for Day 1 and Day 2 guests', 'general'),
  ('Gate 3', 'Media & Hospitality East', 'Press, media and hospitality access', 'media')
) as g(code, name, description, zone)
cross join lateral (
  select id from public.festival_editions where slug = '2026' limit 1
) e
where exists (select 1 from public.festival_editions where slug = '2026')
on conflict (code) do nothing;

insert into public.hospitality_packages
  (code, name, tagline, capacity, price_ngn, official_value_ngn, table_count, enclosure)
values
  ('kings_table', 'The Kings Table', 'Ultra-Exclusive VIP Experience', 10, 5000000, 5000000, 5, 'Kings Arena & Royal and Kings Hospitality Lounge'),
  ('royal_table', 'The Royal Table', 'Luxury Hospitality Experience', 8, 3000000, 3000000, 10, 'Royal Pavilion'),
  ('queens_table', 'The Queens Table', 'Signature Ladies Experience', 6, 2000000, 2000000, 10, 'Queens Lounge'),
  ('premium_table', 'The Premium Table', 'Premium Festival Experience', 5, 500000, 500000, 20, 'Clubhouse Terrace'),
  ('individual_vip', 'The Regular Section', 'General Festival Experience', 1, 50000, 50000, 200, 'Festival Viewing Area & Designated Public Seating')
on conflict (code) do nothing;

insert into public.affiliate_commission_tiers
  (category_name, package_code, package_value_ngn, commission_ngn, commission_rate, description)
values
  ('The Kings Table (10 Guests)', 'kings_table', 5000000, 500000, 0.1000, 'Ultra-Exclusive VIP Experience within the Kings Arena (10 Guests, 10 VIP parking vehicles).'),
  ('The Royal Table (8 Guests)', 'royal_table', 3000000, 300000, 0.1000, 'Luxury Hospitality Experience within the VVIP Hospitality Section (8 Guests, 5 VIP parking vehicles).'),
  ('The Queens Table (6 Guests)', 'queens_table', 2000000, 200000, 0.1000, 'Signature Ladies Experience within the Queens Lounge (6 Guests).'),
  ('The Premium Table (5 Guests)', 'premium_table', 500000, 50000, 0.1000, 'Premium Festival Experience within reserved seating and food & beverage package (5 Guests).'),
  ('The Regular Section (Day 3 Individual Pass)', 'individual_vip', 50000, 5000, 0.1000, 'General Festival Experience — ₦50,000 Per Person admission to the festival viewing area.')
on conflict (category_name) do nothing;

insert into public.price_list (edition_id, item_type, item_code, amount_ngn, note)
select e.id, 'package', p.item_code, p.amount_ngn, 'Official brochure pricing — pilot testing fee permanently concluded'
from (values
  ('kings_table', 5000000),
  ('royal_table', 3000000),
  ('queens_table', 2000000),
  ('premium_table', 500000),
  ('individual_vip', 50000)
) as p(item_code, amount_ngn)
cross join lateral (select id from public.festival_editions where slug = '2026' limit 1) e
where exists (select 1 from public.festival_editions where slug = '2026')
  and not exists (
    select 1 from public.price_list pl
    where pl.item_code = p.item_code and pl.item_type = 'package' and pl.effective_to is null
  );

insert into public.feature_flags (flag_key, description, is_enabled, rollout_percentage, applies_to)
values
  ('online_card_payments', 'Enable online card checkout (Paystack). Off until the club activates the card account.', false, 100, 'register,tables'),
  ('bank_transfer_payments', 'Enable direct bank transfer checkout for Day 3.', true, 100, 'register,tables'),
  ('invitation_issuance', 'Allow the Secretariat to issue complimentary VIP invitations.', true, 100, 'abawole'),
  ('public_registration', 'Allow the public to register for Day 1 and Day 2.', true, 100, 'register'),
  ('table_availability', 'Show live table availability on the VIP Tables page.', true, 100, 'tables')
on conflict (flag_key) do nothing;

insert into public.site_settings (key, value, description)
values
  ('registration_open', 'true'::jsonb, 'Whether the public registration form accepts new guests.'),
  ('ground_capacity', '3000'::jsonb, 'Maximum guests across all three days.'),
  ('secretariat_phone', '"+234 818 188 8884"'::jsonb, 'Secretariat WhatsApp number shown to guests.'),
  ('secretariat_email', '"abeokutapolo@gmail.com"'::jsonb, 'Secretariat email address.'),
  ('bank_account', '{"bank_name":"WEMA BANK","account_name":"ABEOKUTA POLO CLUB","account_number":"0126769779"}'::jsonb, 'Official club bank details for Day 3 payments.')
on conflict (key) do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
-- K. THE HOUSE RULE: server-only access for every new table
-- ═══════════════════════════════════════════════════════════════════════════
-- RLS is enabled with NO policies and anon/authenticated are revoked, so the
-- browser can never read or write these tables — only the server (service role).

alter table public.festival_days enable row level security;
revoke all on public.festival_days from anon, authenticated;

alter table public.gates enable row level security;
revoke all on public.gates from anon, authenticated;

alter table public.hospitality_packages enable row level security;
revoke all on public.hospitality_packages from anon, authenticated;

alter table public.price_list enable row level security;
revoke all on public.price_list from anon, authenticated;

alter table public.affiliate_commission_tiers enable row level security;
revoke all on public.affiliate_commission_tiers from anon, authenticated;

alter table public.attendee_devices enable row level security;
revoke all on public.attendee_devices from anon, authenticated;

alter table public.attendee_notes enable row level security;
revoke all on public.attendee_notes from anon, authenticated;

alter table public.table_holds enable row level security;
revoke all on public.table_holds from anon, authenticated;

alter table public.table_seats enable row level security;
revoke all on public.table_seats from anon, authenticated;

alter table public.payment_ledger enable row level security;
revoke all on public.payment_ledger from anon, authenticated;

alter table public.bank_transfer_receipts enable row level security;
revoke all on public.bank_transfer_receipts from anon, authenticated;

alter table public.refunds enable row level security;
revoke all on public.refunds from anon, authenticated;

alter table public.affiliate_payouts enable row level security;
revoke all on public.affiliate_payouts from anon, authenticated;

alter table public.commitment_payments enable row level security;
revoke all on public.commitment_payments from anon, authenticated;

alter table public.invitations enable row level security;
revoke all on public.invitations from anon, authenticated;

alter table public.invitation_audit enable row level security;
revoke all on public.invitation_audit from anon, authenticated;

alter table public.gate_incidents enable row level security;
revoke all on public.gate_incidents from anon, authenticated;

alter table public.scanner_devices enable row level security;
revoke all on public.scanner_devices from anon, authenticated;

alter table public.denied_admissions enable row level security;
revoke all on public.denied_admissions from anon, authenticated;

alter table public.notification_log enable row level security;
revoke all on public.notification_log from anon, authenticated;

alter table public.reminder_log enable row level security;
revoke all on public.reminder_log from anon, authenticated;

alter table public.message_templates enable row level security;
revoke all on public.message_templates from anon, authenticated;

alter table public.feature_flags enable row level security;
revoke all on public.feature_flags from anon, authenticated;

alter table public.feature_flag_history enable row level security;
revoke all on public.feature_flag_history from anon, authenticated;

alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;

alter table public.announcements enable row level security;
revoke all on public.announcements from anon, authenticated;

alter table public.fraud_alerts enable row level security;
revoke all on public.fraud_alerts from anon, authenticated;

alter table public.security_events enable row level security;
revoke all on public.security_events from anon, authenticated;

alter table public.report_exports enable row level security;
revoke all on public.report_exports from anon, authenticated;

alter table public.help_requests enable row level security;
revoke all on public.help_requests from anon, authenticated;

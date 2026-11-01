-- 0011_ticket_admission_rules.sql
-- Abeokuta Polo Festival 2026: Day 1 Free, Day 2 & Day 3 Through Ticket

alter table public.registrations
  add column if not exists has_day2_ticket boolean not null default false,
  add column if not exists has_day3_ticket boolean not null default false,
  add column if not exists day2_ticket_ref text,
  add column if not exists day3_ticket_ref text;

alter table public.credentials
  add column if not exists has_day2_ticket boolean not null default false,
  add column if not exists has_day3_ticket boolean not null default false,
  add column if not exists day2_ticket_ref text,
  add column if not exists day3_ticket_ref text,
  add column if not exists day1_status text not null default 'free_admitted',
  add column if not exists day2_status text not null default 'ticket_required',
  add column if not exists day3_status text not null default 'ticket_required';


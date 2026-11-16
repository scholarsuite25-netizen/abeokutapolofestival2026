# Current Project State — read this first

This file exists so any agent (OpenCode, Antigravity, Claude, etc.) starts with the **real state of this project**
instead of guessing. Read `AGENTS.md` next for coding and quota rules.

> **If the user says "continue what Antigravity was building", they mean continue THIS festival project.**
> Antigravity is the IDE/agent used earlier; its chat history is not visible to you. Do not talk about Antigravity
> the company or the product — work on the repository in front of you.

## What this project is

**Abeokuta Polo Festival 2026 — "The Blueprint"** — the official festival registration and gate-access platform.

- Stack: Next.js 16 (App Router, Turbopack), TypeScript, Tailwind, Supabase (Postgres + Auth + RLS), Vercel.
- Live: **https://www.abeokutapolofestival2026.org.ng**
- Event dates: **18–20 December 2026**, Abeokuta, Ogun State. Day 3 = Royal Cup Grand Finale.
- Repository: `scholarsuite25-netizen/abeokutapolofestival2026` (public).

## The product rules that must never be broken

1. **Day 1 & Day 2 are free.** Registration on `/register` issues passes that open freely on any device — no device lock.
2. **Day 3 is paid and locked.** Individual VVIP/IVP passes and VIP table passes are device-bound (anti-forwarding) and
   issued only from `/tables`, never from `/register`. `/register` must refuse a Day 3 purchase and point to
   `/tables` (the error message keeps the words "VIP Table" and "/tables" — tests assert both).
3. **Bank transfers stay provisional.** Unverified bank transfers get a watermarked **Provisional Claim Slip** and are
   denied at the turnstile until Secretariat Accounts reconciliation.
4. **Naming:** the Day 3 page is called **"Day 3 Registration"** in navigation and page references. Product names
   ("VIP Table Package", prices ₦500K–₦5M) keep their wording.
5. **Navigation order:** 1st CTA "Register for Day 1 & 2 Events - Free", 2nd "Register for Day 3 Events - VVIP".

## Routes

| Path | Purpose |
|---|---|
| `/` | Public homepage |
| `/register` | Day 1 & 2 free registration (auto-redirects to the ID pass) |
| `/tables` | Day 3 Registration — VVIP passes and VIP table packages |
| `/tables/invitation` | Complimentary Day 3 invitation-code redemption |
| `/pass/[code]` | Digital ID pass (Day 1/2 free-open; Day 3 device-locked) |
| `/pass/lookup` | Pass recovery |
| `/scan` | Gate scanner PWA (staff sign-in only) |
| `/abawole` | Operations console (role-gated) |
| `/admin` | Admin entry |

## Current health (as of 16 November 2026)

- `npm test` → **525 passed**, 3 skipped (41 files). `npm run typecheck` clean. `npm run lint` → 0 errors
  (172 warnings is the long-standing baseline).
- Production deploy on Vercel is **Ready**.
- Live verification in this session: 19/19 routes 200, 0 console errors, nav contained at 38 viewport widths,
  Day 1/2 pass opens freely, Day 3 pass is device-locked, gate account is least-privilege (scanner only).

## Recent work (newest first)

1. `99a743e` — secret-leak guard test (`tests/unit/secret-leak-guard.test.ts`) + local router documentation.
2. `c7aaaaf` / `ac7d306` — CSP fix so the Google Map loads on `/visit` (both `maps.google.com` and `www.google.com`).
3. `1f74c6b` — Initial Caps navigation styling + test 10 (free-model work).
4. `15f9ed9` — zero-cost agent routing playbook, quota discipline rules, lean tasking template.
5. `97a8e93`, `d4458d1` — "VIP Tables" → "Day 3 Registration" rename and nav containment fix.
6. `3b54009` — day-aware pass lock: Day 1/2 open freely, Day 3 stays locked.
7. `74c27cc` — registration auto-leads to the ID pass page, no code entry.

## Open handover items (not code)

- Rotate staff passwords in person; sign out all sessions.
- Confirm Supabase PITR/backups are enabled.
- Decide whether Paystack live cards are enabled for launch.
- Optional: enable Supabase phone/SMS sign-in in the dashboard (currently disabled).
- Verify remote DB schema through the Supabase SQL Editor (this machine cannot reach the DB directly — IPv6 only).

## Agent setup on this machine

- **Free model router**: `http://127.0.0.1:8080` (Gemini + Groq + OpenRouter free models, auto-failover, cache).
  OpenCode uses it via provider `local-router` (default model `local-router/gpt-oss-120b`).
- **Antigravity account quota** is weekly and locked until **23 November 2026**; its IDE picker is plan-gated.
- Rules for all agents: `AGENTS.md` (quota discipline, verification, paywall rules).
- Playbook: `docs/AGENT_ROUTING_PLAYBOOK.md`.

## How to continue work

1. Read this file, then `AGENTS.md`.
2. `git status` (must be clean) and `git log --oneline -5` to confirm you are at the tip.
3. For any change: run the affected test file first, then `npm test` once at the end.
4. Verify live behaviour, not just tests (see AGENTS.md: "Anti-Mock Fallacy Guard").
5. Commit with a conventional message and push; Vercel deploys `main` to production.

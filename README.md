# Abeokuta Polo Festival 2026 — The Blueprint

Registration, QR passes, gate check-in and admin tools for the 2026 Abeokuta Polo Festival
(18–20 December 2026, Abeokuta Polo Club, Ogun State).

**Stack:** Next.js 16 (App Router) · React 19 · Supabase (auth, Postgres, row-level security) · Tailwind 4 · shadcn/ui · Vitest · Playwright.

## Getting started

```bash
npm ci
cp .env.example .env.local      # fill in values; blank = not set
npm run dev                     # http://localhost:3000
npm run check                   # lint + typecheck + unit tests
```

Database: run `supabase/migrations/*.sql` in order, or paste `supabase/APPLY_ALL_MIGRATIONS.sql`
into the Supabase SQL editor (regenerate it with `node scripts/combine_migrations.mjs`).

## How admission works

| Day | Entry |
|---|---|
| Day 1 (Fri 18 Dec) | Free — register |
| Day 2 (Sat 19 Dec) | Free — register |
| Day 3 (Sun 20 Dec) | **VVIP pass**: ₦50,000 through Paystack, **or** a Special Invitation Code |

Every attendee registers and receives a signed QR pass. Hospitality, chalets and sponsorship are
**not** paid online; they are enquiries settled offline.

### Day 3 VVIP payment (server-authoritative)

1. `/register` → `POST /api/paystack/initialize` fixes the price and quantity on the server and
   returns a Paystack checkout URL. Reference format: `ABK-VVIP-…`.
2. Paystack returns the guest to `/register`. **The URL proves nothing.**
3. `submitRegistration` (`app/(public)/register/actions.ts`) calls `verifyDay3Payment`
   (`lib/paystack/verify.ts`), which asks Paystack and requires: our reference prefix, status
   `success`, currency NGN, amount ≥ one pass, and payer email = registrant email. The number of
   passes issued is the number **paid for**.
4. `claimPaymentReference` (`lib/paystack/claims.ts`) records the reference in
   `day3_payment_claims` so it can never be used twice.
5. Only then are passes issued. Any failure (including Paystack being unreachable) refuses.

Invitation codes come only from the server variable `VVIP_INVITATION_CODES` and issue one pass each.

Simulated payments exist **only** when `NODE_ENV` is not `production` and `PAYSTACK_SECRET_KEY` is
blank — so local development works without a Paystack account, and production never fakes a payment.

## Environment

See `.env.example`. Before launch you need at least: Supabase keys, `QR_SIGNING_SECRET`,
`PAYSTACK_SECRET_KEY`, `VVIP_INVITATION_CODES`, an email provider key, and `CRON_SECRET`.
Rotate any credential that ever appeared in `stitch_abeokuta_polo_festival_platform/the_blueprint.txt`.

## Where things are

- `app/(public)`, `(guest)`, `(admin)`, `(ops)` — public site, guest wallet, admin, gate scanner
- `app/api/paystack/*` — Day 3 checkout start and read-only status check
- `lib/paystack`, `lib/invitations`, `lib/config/checkout-config.ts` — Day 3 payment rules
- `supabase/migrations` — schema (every table has RLS enabled; checked by tests)
- `ARCHITECTURE_PLAN.md` — decisions (see D-01, D-16), roles, RLS strategy, roadmap
- `docs/` — original specification kit

## Tests

`npm test` runs the unit suite, including regression tests for the payment and invitation bypasses
(`tests/unit/day3-payment-security.test.ts`) and a guard that keeps payment code confined to the
Day 3 flow (`tests/unit/no-payments-guard.test.ts`). `npm run test:e2e` runs Playwright.

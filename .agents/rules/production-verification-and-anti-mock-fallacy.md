# Rule: Production Verification & Anti-Mock Fallacy Guard

## Invariant 1: Never Equate "npm test" or "next build" with Real-World Success
- Unit tests run in isolated environments with mocked databases and dummy secrets.
- `next build` only validates TypeScript types and static page generation.
- Never declare a feature, fix, or workflow functional solely because unit tests pass or the compiler succeeds.

## Invariant 2: Mandatory Live Schema & Environment Drift Verification
- When interacting with external databases (Supabase, Postgres, Firebase):
  1. Inspect the real remote schema cache before writing or modifying queries.
  2. Implement adaptive schema pruning for inserts/queries to survive unmigrated remote schemas.
  3. Never catch database insert/update errors silently (`try { ... } catch {}`). Always log with descriptive context (`console.error`).
- When interacting with third-party APIs (Paystack, WhatsApp, Email, Stripe):
  1. Verify whether required production environment variables exist on the live target.
  2. Implement explicit fallback branches that guide the user gracefully if credentials are absent.

## Invariant 3: Mandatory Real-Browser (E2E) Verification
- For every user-facing form, payment flow, or access card workflow:
  1. Navigate to the live deployment (or running dev server) using browser/DevTools automation.
  2. Fill and submit the actual form.
  3. Verify that the UI state updates (DOM reflects success, components render, no blank screens).
  4. Verify that generated URLs (e.g. `/pass/[code]`) load without 404 or 500 errors.

## Invariant 4: Truth in Gate Paywalls & Pass Watermarking
- Passes pending verification (e.g., bank transfer awaiting bursary audit) must NEVER be issued with active VIP styling or gate clearance.
- Always watermark pending passes with prominent high-contrast warnings (`⚠️ PROVISIONAL CLAIM SLIP · NOT VALID FOR GATE ENTRY`).
- Gate turnstiles and scanners must strictly reject pending passes with 403 status.


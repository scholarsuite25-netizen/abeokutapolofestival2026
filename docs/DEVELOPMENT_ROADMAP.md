# Delivery Roadmap and Acceptance Criteria

## Phase 0 — Discovery and approval
Read specs, inspect repository/site where possible, inventory ambiguities, produce `ARCHITECTURE_PLAN.md` with sitemap, ERD, RLS matrix, design tokens, risks and questions. **Stop for approval.**

## Phase 1 — Foundation
Initialize Next.js/TypeScript/Tailwind/shadcn; linting, formatting, tests, CI, Supabase client/server separation, migrations, auth and base permissions. **Accept:** build/test pass; secrets are server-only; sample RLS deny tests pass.

## Phase 2 — Private governance
Seven committees, provisional membership import, verified identity linking, scoped role grants, tasks, meetings, minutes, decisions, private files and readiness dashboard. **Accept:** public and guest users cannot retrieve roster/files; cross-committee leakage tests pass.

## Phase 3 — Public website and CMS
Brand system, public pages, editable approved programme, galleries, news, SEO, mobile UX. **Accept:** content workflow; no private data in anonymous responses; accessibility checks.

## Phase 4 — Guests and invitations
Registration, RSVP, groups, approvals, guest dashboard, invitation templates, delivery status. **Accept:** own-record access only, reliable status changes and idempotent sending.

## Phase 5 — QR accreditation
Issue/revoke credentials, access-zone entitlements, check-in scanning, audit trail, duplicate prevention. **Accept:** forged/revoked/replayed credentials denied; scan races handled.

## Phase 6 — Sponsorship, hospitality and payments
Package inventory, CRM, proposals, benefits, patrons/chalets/tickets, payment gateway and webhook verification. **Accept:** no overselling; verified payment state; private financial records.

## Phase 7 — Analytics and operational polish
Reports, exports, notifications, audit and error monitoring, performance/accessibility/security reviews. **Accept:** scoped exports, observability, documented recovery.

## Phase 8 — Launch readiness
Staging-to-production deployment, environment configuration, content review, admin training, backup plan, incident runbook and smoke tests. **Accept:** deployment checklist signed off and no unresolved critical defects.

## Cross-cutting rules
- Commit small testable increments; summarize changed files, migrations and tests each phase.
- Never claim an unconfigured email/WhatsApp/payment provider works.
- Seed data is provisional and must be reviewable before publication.
- Keep public marketing pages separate from protected admin/guest data.
- Do not proceed from planning to implementation without explicit approval.

# Master Build Prompt — Version 2.1

## ROLE / ACTION
**BUILD** a secure, production-ready, international-standard festival information and management platform. Act as lead software architect, full-stack engineer, database and security engineer, event operations consultant and creative director. First **ANALYZE** the existing app and specifications, then **ARCHITECT**, **DESIGN**, **IMPLEMENT**, **TEST** and **DEPLOY** in controlled phases.

## Context
- 2026 Abeokuta Polo Festival, second edition
- Brand: **The Blueprint — Where Heritage Meets Excellence**
- 18–20 December 2026, Abeokuta Polo Club, Kobape, Ogun State, Nigeria
- Ogun State Government partnership
- Existing reference: https://abekutapoloeventaccess.vercel.app/register
- Primary source: supplied festival sponsorship proposal; see `FESTIVAL_CONTENT_AND_SPONSORSHIP.md`.
- Internal committee structure and roster: `COMMITTEE_STRUCTURE_AND_MEMBERS.md`.

Inspect the existing site if accessible, report precisely what was and was not inspected, and never claim access to its source code unless supplied. Draw functional inspiration from leading event platforms such as Cvent, Bizzabo, Whova and Eventbrite; do not copy their proprietary assets or code.

## Technology
Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase PostgreSQL/Auth/Storage/Realtime (where appropriate), Row Level Security, GitHub and Vercel. Use secure server actions/API routes, transactional email, optional WhatsApp integration, QR admission validation, PDF/CSV/Excel exports, and a Nigerian payment gateway selected and configured with user approval. All integrations must disclose missing credentials and sandbox-vs-live status.

## Product surfaces
### A. Public festival marketing website
Luxury responsive homepage, festival overview/history, event activities and three-day programme, polo matches, Royal Cup, Polo Queens, All-Stars, Kings Procession, cultural experiences, bonfire/fireworks, sponsor displays, sponsorship enquiry, tickets and hospitality, press/news, media gallery, FAQs, venue/directions, contact, SEO, accessibility and share metadata. Use only approved published content.

### B. Super Admin command centre
Multi-edition festival settings; dashboard KPIs; role and permission assignment; committee oversight; guests/registrations; invitations and access; tickets and orders; sponsor CRM; finance visibility; content approval; notifications; system logs, audit history and reports. Permission changes must be enforced server-side and in the database.

### C. Private committee governance
Seven distinct committee workspaces with member rosters, responsibilities, task assignments, status/deadlines, meeting agendas/minutes, decision registers, document management, correspondence, approvals, readiness tracking and reports. Corporate Secretariat coordinates approved cross-committee reporting. Preserve member identity ambiguities for verification. Committee names, roster, notes and internal documents are **private** and must never be in public website data or public APIs.

### D. Guest experience
Individual/group registration, guest categories, invite-only flows when applicable, RSVP, approval, guest dashboard, personalized digital programme, invitation, secure QR/access credential, allowed event/zone entitlements, notifications and attendance history. Guests see only their own authorized data.

### E. Invitation and accreditation
Bulk and individual personalized invitations; templates; status; secure random non-guessable credential or signed token with server-side lookup; revocation/reissue; event and zone permissions; scan/check-in and duplicate-entry prevention; audited manual override; offline-first approach only with defined conflict-resolution and security controls.

### F. Programme CMS
Manage festival days, event descriptions, draft schedule, teams, players, venues, media, sponsors, programme PDF, publish/approval workflows and versioning. **Do not fabricate unconfirmed timings or participants.**

### G. Sponsorship and commercial
Seven configurable sponsorship tiers, property-level exclusivity, lead pipeline, enquiries, proposals, agreements, slot availability, benefit fulfilment, VIP allocation, payments and sponsor reporting. Public content shows only approved package and partner information; private negotiations, documents and budgets remain restricted.

### H. Ticketing/hospitality
General/VIP tickets, Royal Patrons' Circle, chalets, booths and complimentary passes; inventory, capacity, reservations, payment orders, server-verified webhooks, receipts, refunds/status and QR issuance only after valid authorization/payment. Avoid exposing secrets or trusting browser redirects for payments.

### I. Content and analytics
Admin-editable pages, images, videos, announcements, news, galleries, banners and SEO. Role-specific analytics for registration, RSVP, attendance, revenue, sponsor pipeline, committee readiness, ticket inventory and media campaigns. Export CSV/Excel/PDF subject to permission checks.

## Design
Premium heritage green and ivory, restrained gold, editorial typography, authentic Nigerian polo/cultural visuals, luxurious but fast-loading marketing pages. Dashboards should be clean, accessible, efficient, responsive and usable on mobile. Build an original design, not a generic template.

## Security and data governance
Supabase RLS for all sensitive tables; private storage buckets; short-lived signed URLs; least-privilege authorization; identity verification before account activation; audit logs; rate limiting; input validation; webhook verification; secure secrets; retention and privacy controls with consideration of Nigeria's data protection requirements. Do not automatically publish internal membership or guest personal data. Separate committee roster imports from authenticated user creation. Support one verified person in multiple committees, preserving per-committee appointments and historical records.

## Definition of done
Real database-backed functionality, migrations, seeds clearly marked provisional, tests (unit/integration/e2e as appropriate), documented environment variables, deployable configuration, graceful error handling, responsive/accessibility checks, role-specific permission tests, and explicit reporting of incomplete work. No mockups presented as finished integrations.

## Initial deliverable
Read every `.md` specification. Inspect repository and existing public site if possible. Write `ARCHITECTURE_PLAN.md` with requirements and assumptions, public/private sitemap, architecture, ERD and RLS strategy, roles/permissions matrix, committee workflows, design system, prioritized backlog, test strategy, security risks and unanswered decisions. **Do not begin full implementation until user approves the architecture plan.**

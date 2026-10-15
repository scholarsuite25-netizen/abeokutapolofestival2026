# ARCHITECTURE_PLAN.md — The Blueprint · 2026 Abeokuta Polo Festival

**Status:** PHASE 0 APPROVED (v1.1) — **no website payments** (client decision 14 Oct 2026); implementation authorised from Phase 1.
**Author role:** Lead Architect / Full-Stack / Supabase / UI-UX / Security
**Date:** 14 October 2026
**Authority model:** `MASTER_BUILD_PROMPT.md` + security/data docs = functional & privacy authority · Stitch exports = visual authority · `DESIGN.md` = written design spec · conflicts are logged in §12.

---

## 1. What I inspected (and what I did not)

### 1.1 Inspected — specifications
The specification package was **not** present as an unpacked `/docs` folder. It was found inside
`C:\Users\Registrar\Music\Abeokuta_Polo_Festival_2026_Stitch_Design_and_Build_Kit.zip` and extracted
**unchanged** into `./docs/` in this project folder (original zip untouched):

| File | Read |
|---|---|
| `docs/README.md` | ✔ |
| `docs/MASTER_BUILD_PROMPT.md` | ✔ |
| `docs/FESTIVAL_CONTENT_AND_SPONSORSHIP.md` | ✔ |
| `docs/COMMITTEE_STRUCTURE_AND_MEMBERS.md` | ✔ |
| `docs/ACCESS_CONTROL_AND_PRIVACY.md` | ✔ |
| `docs/SUPABASE_DATA_MODEL.md` | ✔ |
| `docs/DEVELOPMENT_ROADMAP.md` | ✔ |
| `docs/DESIGN.md` | ✔ |
| `docs/STITCH_MASTER_DESIGN_PROMPT.md` | ✔ |
| `docs/STITCH_TO_BUILD_WORKFLOW.md` | ✔ |
| `docs/PROMPT_01_OPENCODE.md` / `PROMPT_01_ANTIGRAVITY.md` | ✔ |

Also read: `stitch_abeokuta_polo_festival_platform/the_blueprint_sponsor_deck.md`,
`extracted_text_from_https_2026abeokutapolofestival_app.vercel.app_en.md`,
`the_blueprint.txt` (⚠ credential file — see §13).

### 1.2 Inspected — design exports
Two Stitch batches, **14 screens** total (all `code.html` + `screen.png`) and **3 design-system documents**.
Full inventory and screen-by-screen anatomy: `STITCH_INTEGRATION_PLAN.md` §1–§3.

- `Design/stitch_abeokuta_polo_festival_platform/` → **anchor set (5 screens + `heritage_excellence/DESIGN.md`)**
- `stitch_abeokuta_polo_festival_platform/` → **public marketing set (9 screens + 2 earlier `DESIGN.md` variants)**

### 1.3 Not inspected / cannot verify
- **No source code exists for this project.** The folder contains only `docs/` and the Stitch exports; `git` is initialised at the OS profile root with **zero commits**. There is no `package.json`, no `app/`, no schema, no tests.
- **`https://abekutapoloeventaccess.vercel.app/register`** — not fetched in this session; treat as unverified reference only.
- **`https://2026abeokutapolofestival_app.vercel.app`** — only a **text scrape** exists locally; implementation, backend and ownership are unknown. It declares *"This website does not take payments"* and *"Registration is free"* — now **aligned** with the confirmed product scope (see §12, D-01 CLOSED).
- **The Blueprint Sponsor Deck PDF** itself — not opened; I used the derived fact file `FESTIVAL_CONTENT_AND_SPONSORSHIP.md` as the source of truth for commercial values.
- **Supabase project** referenced in `the_blueprint.txt` — not contacted (no migrations, no schema inspection performed).

---

## 2. Requirements matrix

### 2.1 Business facts (source: `FESTIVAL_CONTENT_AND_SPONSORSHIP.md` / `README.md`)
| Item | Value | Confidence |
|---|---|---|
| Event | Second Abeokuta Polo Festival | Confirmed |
| Theme | **The Blueprint — Where Heritage Meets Excellence** | Confirmed |
| Dates | 18–20 December 2026 (date range only) | Confirmed |
| Venue | Abeokuta Polo Club, Kobape, Ogun State | Confirmed |
| Partner | Ogun State Government | Confirmed |
| Hour-by-hour programme | **Does not exist** | Must never be fabricated |
| Sponsorship tiers | 7 proposed tiers, ₦2.5m–₦75m | **Proposed**, editable until approved |
| **Attendance** | **Free** — entry requires prior registration + accredited credential | **Confirmed (client, 14 Oct 2026)** |
| Deck hospitality values | GA ₦5,000 · VIP ₦50,000 · Patrons ₦500k · Chalet ₦1.5m | Reference only — never collected online, never shown on public hospitality pages |
| Indicative budget | ₦300m | **Private module only** |
| Committee 7 (Welfare/Entertainment/Hospitality) | Responsibilities *proposed*, membership *not provided* | Pending approval |

### 2.2 Required systems → architectural owner

| # | Required system | Primary surfaces | Backend owner |
|---|---|---|---|
| 1 | Premium public festival website | `(public)` route group | CMS tables + published RLS view |
| 2 | Super Admin dashboard | `/admin/*` | scoped roles + admin RPCs |
| 3 | Seven private committee dashboards | `/committee/[slug]/*` | committee-scoped RLS |
| 4 | Committee membership & task management | `/committee/*`, `/admin/committees/*` | `committee_*` tables + membership RPC |
| 5 | Guest registration & dashboards | `/register`, `/dashboard/*` | `registrations`, `guest_profiles` (own-row RLS) |
| 6 | Digital invitations & secure QR passes | `/dashboard/pass`, `/admin/invitations`, `/scan` | token-hash credentials + signed validation RPC |
| 7 | Event programme & content management | `/programme`, `/admin/programme`, `/admin/media` | `programme_versions` + approval workflow |
| 8 | Sponsorship management | `/sponsorship`, `/admin/sponsorship` | package slot ledger + CRM tables |
| 9 | Access allocation & hospitality (**no payments**) | `/hospitality`, `/register`, `/admin/allocations`, `/admin/finance` | `pass_types` capacity + approval-based allocations + offline finance ledger |
| 10 | Access control & check-in | `/scan` (mobile PWA) | atomic check-in RPC + offline queue |
| 11 | Reports, analytics, notifications | `/admin/reports`, `/admin/notifications` | permission-scoped views + `notification_deliveries` |

---

## 3. System architecture

### 3.1 Topology
```
Browser (public / guest / admin / committee / scanner)
   │  HTTPS
   ▼
Next.js App Router on Vercel
   ├── Server Components ──── Supabase JS (anon key, user session cookie) ──► Postgres + RLS
   ├── Server Actions ─────── zod validation → permission check → RLS-enforced query
   ├── Route Handlers
   │     ├── /api/webhooks/email       (delivery events; signature verify, idempotent)
   │     ├── /api/credentials/verify   (public, rate-limited, token-hash lookup)
   │     └── /api/cron/*               (CRON_SECRET guarded)
   └── lib/supabase/admin.ts  (service role — `server-only`, never imported by client)
```

### 3.2 Non-negotiable technical rules
1. **Three Supabase clients only:** `browser.ts` (anon + session), `server.ts` (anon + user session, for Server Components/Actions), `admin.ts` (service role, `import 'server-only'`, wrapped by an explicit re-authorization helper).
2. **No service-role key, DB password, encryption secret or Gmail app password in any client bundle, `NEXT_PUBLIC_*` var, migration file, seed file or repo.**
3. **Route hiding is not authorization.** Every protected route: middleware (UX redirect) → Server Component `requirePermission()` → RLS (enforcement floor).
4. **All mutations go through Server Actions or route handlers** with zod input validation; no direct client `update()` on sensitive tables without RLS proof.
5. **Public and private data are physically separated**: published content served from `WHERE status = 'published' AND festival_edition_id = active_edition()`; committee/finance/guest tables are never selected in `(public)` route groups.
6. **Mock data lives only in `lib/fixtures/` and is labelled `SAMPLE`;** fixtures are never imported by a page that also queries production tables.
7. **No payment subsystem exists.** Attendance is free: no checkout, gateway, order, refund or payment webhook anywhere in the codebase. Commercial interest routes to WhatsApp/phone/e-mail enquiry using the official contact addresses; any money that changes hands is settled **offline** and recorded by hand in the finance-role ledger (`offline_commitments`).

---

## 4. Sitemap

### 4.1 Public (`app/(public)`) — anonymous, cached
```
/                       Home (Stitch: the_blueprint_2026 + home_redesign)
/about                  Heritage, five pillars, festival story
/programme              3-day programme (day tabs, TBC times)
/programme/[slug]       Signature experience detail (Royal Cup, Polo Queens, All-Stars,
                        Kings Procession, Bonfire & Fireworks, VIP Pavilion)
/experiences            Culture, hospitality, celebration
/royal-cup              Royal Cup feature page
/hospitality            Chalets, VIP, Patrons' Circle — invitation tiers, "Enquire by
                        WhatsApp / Call" (no prices, no booking cart)
/sponsorship            Packages + enquiry form
/partners               Approved partner logos only (empty until approved)
/gallery                Media gallery
/news                   News & announcements
/publications           Gazette / publications hub
/press                  Press & media credentials
/faq · /visit · /contact
/privacy · /terms · /accessibility
/register               Free registration → accreditation (pre-registration mandatory for entry)
/rsvp/[token]           Tokenised RSVP / invitation landing (public, rate-limited)
/sign-in · /forgot-password · /verify-email · /auth/callback
```

### 4.2 Guest (`app/(guest)/`) — `role: guest`, own-row only
```
/dashboard                      Overview: RSVP state, pass preview, notices
/dashboard/invitations          Invitations & RSVP history
/dashboard/pass                 Digital pass + QR (server-rendered credential)
/dashboard/programme            Personalised programme
/dashboard/notifications        Notices
/dashboard/profile              Own profile & group members
```

### 4.3 Super Admin (`app/(admin)/`) — `role: super_admin` + granular grants
```
/admin                    KPI command centre (Stitch: super_admin_command_centre)
/admin/committees         Committee directory (7) + readiness matrix
/admin/committees/[id]    Committee detail (read-through to workspace)
/admin/members            Person records, appointments, verification queue
/admin/tasks              Cross-committee task oversight
/admin/meetings           Meetings & minutes (Secretariat coordination)
/admin/guests             Guests, groups, approvals
/admin/invitations        Invitation campaigns, issuance, revocation
/admin/access             Credentials, entitlements, check-in monitor, overrides
/admin/programme          Programme CMS (days, events, versions, approval)
/admin/sponsors           Sponsor CRM: pipeline, agreements, slots, benefits
/admin/allocations        Pass types, capacity, complimentary allocations, approvals
/admin/hospitality        Chalets, booths, comps — enquiries & allocations (no payments)
/admin/finance            Offline ledger: budgets, sponsor/patron settlements  ← finance-role only
/admin/media              Media library, galleries, press assets
/admin/content            Pages, banners, announcements, SEO
/admin/notifications      Composer + delivery log
/admin/reports            Analytics + CSV/Excel/PDF export
/admin/users              Accounts, role & permission grants (super_admin only)
/admin/audit              Audit log viewer
/admin/settings           Editions, venues, config
```

### 4.4 Committee (`app/(committee)/`) — membership-scoped
```
/committee                        My committees switcher + readiness
/committee/[slug]                 Overview (Stitch: private_committee_management_workspace)
/committee/[slug]/tasks           Task board (Board / List / Gantt)
/committee/[slug]/members         Roster (approved fields only)
/committee/[slug]/meetings        Meetings, agendas, minutes
/committee/[slug]/decisions       Decision register
/committee/[slug]/documents       Private document vault (signed URLs)
/committee/[slug]/reports         Committee reports & readiness
/committee/[slug]/announcements   Internal correspondence
```
Same shell, data filtered by membership. **Finance committee adds a finance-scoped panel;
other committees receive no financial rows (RLS denies, not UI-hides).**

### 4.5 Operational
```
/scan                   Mobile-first check-in PWA (Secure/Check-in Officer)
/scan/history           Device scan log + offline sync queue
```

---

## 5. Proposed folder architecture

```
.
├── app/
│   ├── (public)/                    # anonymous marketing
│   │   ├── layout.tsx               # PublicHeader + Footer
│   │   ├── page.tsx
│   │   ├── about/ programme/ programme/[slug]/ experiences/ royal-cup/
│   │   ├── hospitality/ sponsorship/ partners/ gallery/ news/
│   │   ├── publications/ press/ faq/ visit/ contact/
│   │   ├── privacy/ terms/ accessibility/
│   │   └── register/ rsvp/[token]/
│   ├── (auth)/ sign-in/ forgot-password/ verify-email/ auth/callback/
│   ├── (guest)/ dashboard/**        # layout: guest shell, requireRole('guest')
│   ├── (admin)/ admin/**            # layout: AdminShell, requirePermission()
│   ├── (committee)/ committee/[slug]/**
│   ├── (ops)/ scan/**               # PWA check-in
│   ├── api/
│   │   ├── webhooks/email/route.ts
│   │   ├── credentials/verify/route.ts
│   │   └── cron/[job]/route.ts
│   ├── error.tsx · loading.tsx · not-found.tsx · global-error.tsx
│   └── layout.tsx · sitemap.ts · robots.ts · opengraph-image*
├── components/
│   ├── ui/                          # shadcn/ui primitives (generated)
│   ├── design/                      # token-driven primitives (see STITCH plan §5)
│   │   ├── public/                  # PublicHeader, FestivalHero, ProgrammeTimeline…
│   │   ├── admin/                   # AdminShell, MetricCard, ReadinessMatrix…
│   │   ├── committee/               # TaskBoard, MeetingCard, DocumentVault…
│   │   ├── guest/                   # GuestPassCard, QRPass, EntitlementList…
│   │   └── ops/                     # ScanResult, ScannerViewport, OfflineQueue…
│   └── shared/                      # DataTable, FilterBar, StatusBadge, states
├── lib/
│   ├── supabase/                    # browser.ts · server.ts · admin.ts · types.ts
│   ├── auth/                        # session.ts · require.ts · guards.ts
│   ├── permissions/                 # matrix.ts (single source of truth) · check.ts
│   ├── validators/                  # zod schemas per domain
│   ├── allocations/                 # pass types, capacity checks, approval rules
│   ├── enquiry/                     # WhatsApp / phone / e-mail enquiry builders
│   ├── qr/                          # token issue/verify (HMAC, hash-at-rest)
│   ├── export/                      # csv/xlsx/pdf builders (permission-checked)
│   ├── fixtures/                    # SAMPLE-only mock data (dev)
│   └── utils.ts
├── supabase/
│   ├── migrations/                  # 0001… ordered, reviewed
│   ├── seed.sql                     # provisional, clearly marked
│   ├── policies/                    # RLS policy sources
│   └── tests/                       # RLS deny/allow test harness
├── tests/                           # unit (vitest) + e2e (playwright)
├── public/
│   ├── assets/stitch/               # downloaded, approved Stitch imagery (no private data)
│   └── fonts/                       # only if self-hosted & licensed
├── docs/                            # specification package (read-only source)
├── design/stitch/                   # ← canonical location for Stitch exports (see §11)
├── ARCHITECTURE_PLAN.md
├── STITCH_INTEGRATION_PLAN.md
├── .env.example                     # names only, never values
└── package.json · next.config.ts · tailwind.config.ts · components.json
```

Route groups `(public)/(guest)/(admin)/(committee)/(ops)` change **no** URLs — the paths in §4 remain exactly as `DESIGN.md` §4 specifies.

---

## 6. Supabase integration strategy

### 6.1 Databases / schemas
Single Postgres project, **logical schemas** to keep privilege boundaries obvious:

| Schema | Contents | Accessible to |
|---|---|---|
| `public` | RLS-protected application tables (all listed in `SUPABASE_DATA_MODEL.md`) | anon / authenticated via policies |
| `auth`, `storage` | Supabase managed | managed |
| `realtime` | channels for committee activity + admin audit feed | authenticated, channel-auth'd |

> Alternative considered: separate `app_private` schema for finance — rejected for now to limit migration complexity; equivalent protection is achieved with column/table-level RLS + role grants. Revisit if audit requires it.

### 6.2 Entity groups (mapped from `SUPABASE_DATA_MODEL.md`)
1. **Identity/access:** `profiles`, `person_records`, `roles`, `permissions`, `role_permissions`, `user_role_assignments`, `audit_logs`
2. **Festival:** `festival_editions`, `venues`, `festival_events`, `event_schedules`, `event_participants`, `programme_versions`, `publication_approvals`
3. **Governance:** `committees`, `committee_responsibilities`, `committee_positions`, `committee_memberships`, `committee_tasks`, `task_assignments`, `committee_meetings`, `meeting_attendees`, `meeting_minutes`, `committee_decisions`, `committee_documents`, `committee_reports`, `committee_announcements`, `committee_activity_logs`
4. **Registration/invitation/access:** `guest_profiles`, `registrations`, `registration_groups`, `invitations`, `invitation_recipients`, `access_credentials`, `access_zones`, `credential_entitlements`, `checkin_records`, `notification_deliveries`
5. **Commercial (no payments):** `sponsors`, `sponsorship_packages`, `sponsorship_properties`, `sponsorship_package_slots` (allocation ledger), `sponsorship_enquiries`, `sponsorship_agreements`, `sponsorship_benefits`, `benefit_fulfilments`, `pass_types` (capacity + entitlements, **no price column**), `registration_allocations`, `tickets` (credential lifecycle only), `hospitality_enquiries`, `offline_commitments` (finance-only), `vendors`
6. **CMS:** `cms_pages`, `news_articles`, `media_assets`, `announcements`, `seo_metadata`, `content_revisions`

### 6.3 Critical modelling decisions
- **`person_records` ≠ `profiles`.** Roster entries are provisional, source-spelled, *unverified*. `person_records.display_name_source` stores `"Sheriff Adams"`, `"Dr. Sheriff Adams"`, `"Sheriff Adams Abdulrahman"` as **three separate rows**. Linking to an authenticated `profiles` row happens only through an explicit, audited **verification claim**. No name-based auto-merge, ever.
- **`committee_memberships` is a true M:N** with `person_id`, `committee_id`, `position_id`, `verified_status`, `starts_on`, `ends_on`, `is_current` — one person, multiple committees, historical rows preserved (`Mr. S.B Omotoso` → Secretariat + Media/ICT).
- **`festival_edition_id` on every edition-scoped table**; every RLS policy includes the edition predicate to prevent cross-edition leakage.
- **Credentials store `token_hash` (HMAC-SHA256/argon2), never the raw token**; the raw token exists only in the issued pass/URL.
- **No payments:** attendance is free. `pass_types` carries capacity + entitlements but **no price field**; `registration_allocations` decrements available capacity inside a transaction-safe RPC with `SELECT … FOR UPDATE` (no overselling of *slots*). Any offline settlement (sponsorship 50%-on-signing/balance, patron or chalet by transfer) is recorded **by hand** in `offline_commitments` with `finance_officer`/`super_admin` RLS only — never written from a public or guest surface.
- **Check-in:** single `rpc check_in_credential(credential_id, device_id, scanned_at)` → `SECURITY DEFINER`, `ISOLATION LEVEL` handled inside, unique partial index prevents duplicate active check-ins, all writes to `checkin_records` with `unique(credential_id, event_slot)`.
- **Sponsor slots:** `sponsorship_package_slots` with `UNIQUE(package_id, slot_no)` + `CHECK (status)`; reservation via `rpc reserve_slot()` to avoid overselling.
- **Timestamps/audit:** `created_at/updated_at` triggers, `created_by/updated_by` from `auth.uid()`, soft-delete (`deleted_at`) on content tables only; hard-append audit.
- **Provisional seeding:** every seed row carries `is_provisional = true` and `source = 'stitch-demo'` where it came from a design mock.

### 6.4 Indexes (minimum)
`registrations(edition_id, status)`, `guest_profiles(edition_id, lower(email))`,
`committee_memberships(committee_id) WHERE is_current`, `committee_tasks(committee_id, status, due_on)`,
`access_credentials(token_hash) UNIQUE`, `checkin_records(credential_id)`,
`registration_allocations(edition_id, status)`, `offline_commitments(edition_id, reference) UNIQUE`,
`audit_logs(edition_id, created_at DESC)`, `news_articles(status, published_at DESC)`.

### 6.5 Migration & seed approach
1. `0001_extensions_and_functions` (pgcrypto, helper predicates)
2. `0002_identity_and_rbac`
3. `0003_festival_core`
4. `0004_governance`
5. `0005_registration_invitation_access`
6. `0006_commercial`
7. `0007_cms`
8. `0008_storage_buckets_and_policies`
9. `0009_rls_enable_and_policies` (every table: `ENABLE ROW LEVEL SECURITY`, policies added explicitly, **no permissive defaults**)
10. `0010_rpcs_and_indexes`
11. `seed.sql` — provisional content, **no auth users, no passwords for named committee members**

Rollback: each migration has a matching `*.down.sql`; `supabase db reset` for local; production rollback via forward-fix only (documented).

### 6.6 Storage buckets
| Bucket | Visibility | Use |
|---|---|---|
| `public-site` | public read | approved marketing imagery, sponsor logos (approved only) |
| `media-library` | public read after approval | gallery assets |
| `committee-documents` | **private**, signed URL ≤ 10 min | minutes, rosters, internal files |
| `sponsor-documents` | **private**, signed URL | agreements, proposals |
| `guest-passes` | **private**, signed URL | rendered pass PDFs |
| `finance-documents` | **private**, signed URL, finance-role | budgets, statements |

No public committee bucket exists — by design.

### 6.7 RLS strategy (summary; full matrix in §8)
- `ALTER TABLE … ENABLE ROW LEVEL SECURITY;` + `FORCE` where applicable; **default deny**.
- Predicate helpers defined once, `SECURITY DEFINER`, `SET search_path = ''`, `STABLE`:
  `app_is_super_admin()`, `app_has_permission(perm text, edition uuid, committee uuid)`,
  `app_is_committee_member(committee uuid)`, `app_is_committee_officer(committee uuid)`,
  `app_current_edition()`, `app_own_guest_id()`.
- Anonymous policies exist **only** on published CMS/programme/sponsor-package tables.
- Every policy named (`policy_<table>_<verb>_<audience>`) and covered by an automated deny/allow test.

---

## 7. Roles and permissions implementation plan

### 7.1 Roles (from `ACCESS_CONTROL_AND_PRIVACY.md`)
`super_admin`, `festival_leadership`, `secretariat_admin`, `committee_chair`, `committee_secretary`,
`committee_member`, `accreditation_officer`, `security_checkin_officer`, `finance_officer`,
`sponsorship_officer`, `media_editor`, `guest`, `sponsor_representative`, `vendor_representative`.

Roles are **scope carriers**, not the permission. Real authorisation is **permission + scope**.

### 7.2 Permission model
```
permissions(code, description, risk_level)            -- e.g. 'committee.tasks.write'
role_permissions(role_id, permission_code)
user_role_assignments(user_id, permission_code | role_id,
                      edition_id, committee_id?, resource_type?, resource_id?,
                      granted_by, granted_at, expires_at)
```
Scopes compose: `effective = permission ∧ (edition ∧ committee? ∧ resource?)`.
A user may hold `committee_member` in *Tournament* and `finance_officer` in *Finance* simultaneously.

### 7.3 Enforcement layers (defence in depth)
| Layer | Location | Purpose |
|---|---|---|
| 1. Navigation/UX | `components/*/nav-config.ts` | hide what you cannot use |
| 2. Route guard | `middleware.ts` + `app/(x)/layout.tsx` `requireRole()` | fast redirect, no data render |
| 3. Server action guard | `lib/auth/require.ts → requirePermission(code, scope)` | **authoritative app check** |
| 4. Query | every query scoped by `festival_edition_id` + guard-derived filters | least data |
| 5. **RLS** | Postgres policies | **enforcement floor** |
| 6. Audit | `audit_logs` on permission changes, pass overrides, exports, allocations, financial reads | forensics |

### 7.4 Permission matrix (authoritative, condensed — full table in implementation `lib/permissions/matrix.ts`)

| Resource / action | Public | Guest | Committee member | Committee officer | Officer grants (accreditation / finance / media / sponsorship) | Super Admin |
|---|---|---|---|---|---|---|
| Published festival content | R | R | R | R | — | **M** |
| Own registration / pass | — | **Own** | Own | Own | — | **M** (audited) |
| Committee roster | — | — | Assigned committee, approved fields | Assigned committee | — | **All** |
| Committee tasks | — | — | Assigned/authorised | Assigned committee | — | **All** |
| Minutes / internal files | — | — | Explicit grants only | Committee, policy-bound | — | All (audited) |
| Financial records | — | — | — (default) | — | `finance_officer` only | Authorized global |
| Sponsorship leads & contracts | Public offers only | — | — (default) | — | `sponsorship_officer` | **All** |
| Guest / stakeholder directory | — | Own only | — (default) | Need-to-know assignment | — | Controlled |
| Invite issuance & QR validation | — | Own pass only | — (default) | Explicit grant | `accreditation_officer`, `security_checkin_officer` | **M** |
| CMS publication | R | R | — (default) | — | `media_editor` (+ approver) | **M** |
| Role / permission grants | — | — | — | — | — | **Only** |

**Key rules:** financial rows are absent (not hidden) for non-finance roles; committee roster never appears in public payloads; bulk export requires `*.export` permission and writes an audit row.

### 7.5 Bootstrap & account lifecycle
1. Migration creates `super_admin` grant **manually** (SQL, not seed) for the operator you nominate.
2. Committee rosters are imported as `person_records` + `committee_memberships(verified_status='provisional')` — **no auth users created**.
3. Invitation → email verification → `profiles` created → officer manually **claims/links** the `person_record` (audited).
4. `hybrid` committee access stays **default-deny read** until you confirm the policy (see §12, D-02).
5. Every grant/revoke writes `audit_logs(action='permission.changed')`.

---

## 8. Guest / invitation / QR flow

```
Public /register ─► zod validate ─► guest_profile + registration (status=pending)
        │                                │
        ├─ (invite-only) ─► invitation issued by Contacts & Mobilisation / admin
        ▼                                ▼
approval (officer) ─► registration=approved ─► access_credentials issued
        │                                        token = base58(256-bit random)
        │                                        store token_hash + entitlements
        ▼                                        ▼
email/WhatsApp dispatch ─► /rsvp/[token] or sign-in ─► /dashboard/pass (QR)
                                                                   │
Gate: /scan ─► rate-limited POST /api/credentials/verify ─► RPC ─► checkin_records
        │              invalid / expired / revoked / already-used / zone-denied / offline
        └─ offline: signed scan queue on device → conflict resolution on reconnect
```

- QR payload = **short opaque credential id**, not personal data; all detail resolved server-side.
- Revocation/reissue is a state change on `access_credentials`, immediate (no caching of validity).
- Duplicate prevention = DB unique constraint + race-safe RPC, not UI logic.
- Pass rendering shows a **human-readable fallback code** (per `DESIGN.md` §3).

## 9. Sponsorship & free-entry allocation flow

**Attendance is free. Entry is not automatic — it follows the accreditation protocol.**

```
A. ATTENDEE (free)
/register ─► zod ─► guest_profile + registration (status=pending) + allocation request (pass_type)
        ├─ capacity check (transaction-safe RPC) ─► waitlist if full
        └─ invite-only pass types ─► requires invitation/RSVP token
                 ▼
approval (accreditation officer) ─► registration=approved ─► access_credentials issued
                 ▼
WhatsApp/e-mail dispatch ─► /rsvp/[token] or sign-in ─► /dashboard/pass (QR)
                 ▼
Gate /scan ─► protocol checks: credential ✔ · zone ✔ · date ✔ · not revoked ✔ · not already used ✔
                 ▼
wristband issued → entry permitted        (offline scan queue + conflict rules)

B. HOSPITALITY / PATRONS / BOOTHS  (no prices, no cart)
/hospitality ─► tier + entitlements displayed ─► "Register interest" (form) and/or
        "Enquire on WhatsApp: +234 818 188 8884 · Call 0803 681 8916 · abeokutapolo@gmail.com"
        ─► hospitality_enquiries ─► officer follows up → allocation (comp) or offline settlement

C. SPONSORSHIP  (proposed figures stay public, labelled)
/sponsorship ─► 7 tiers + signature properties with "Proposed — subject to approval" badge
        ─► enquiry (zod, honeypot, rate-limit) ─► sponsorship_enquiries ─► officer pipeline
        ─► sponsorship_agreements (signed offline) ─► offline_commitments (finance ledger)

D. OFFLINE MONEY (never collected by the website)
offline transfer/cheque/cash ─► finance_officer records it manually in offline_commitments
        ─► audit_logs(action='finance.commitment.recorded') ─► reports (finance scope only)
```

**Removed permanently:** `payments`, `payment_events`, `ticket_orders`, `ticket_products`,
`/api/webhooks/payments`, `lib/payments/*`, gateway keys, checkout/refund/receipt code.

**Public money rule:** the **only** monetary values rendered on a public page are the sponsorship
tier/property figures on `/sponsorship`, always badged *Proposed — subject to approval*. Every other
screen states *Attendance is free — registration required*.

## 10. Committee workflow design

| Concern | Design |
|---|---|
| Seven workspaces | One shell `app/(committee)/committee/[slug]`, `slug ∈ {corporate-secretariat, operations-logistics, finance-business-development, media-ict, tournament, contacts-mobilisation, welfare-hospitality}` |
| Membership | Row-per-appointment; overlapping allowed; officer flags per membership |
| Tasks | `committee_tasks` + `task_assignments`; statuses **Not Started, In Progress, Awaiting Approval, Completed, Blocked, Cancelled** (per `STITCH_MASTER_DESIGN_PROMPT` §12); owner, due date, priority, evidence attachment |
| Meetings | meetings → agenda items → attendees → minutes (draft → approved) |
| Decisions | `committee_decisions` with decision text, owner, due, status; Corporate Secretariat holds the **cross-committee read view** |
| Documents | private bucket, per-document ACL (`committee_documents.access_scope`), signed URL ≤ 10 min, download audited |
| Reports | readiness % per committee (mirrors Stitch "Committee Readiness & Milestone Matrix") |
| Activity | `committee_activity_logs` + realtime channel (member-scoped) |

**Identity ambiguity preservation** (non-negotiable): no auto-merge of `Sheriff Adams` variants,
`Bada Ishaq`/`Ishaq Bada`; only General Morakinyo carries an inferred title (`chairman`, Finance).

---

## 11. Design system, accessibility, performance

Canonical tokens: **`docs/DESIGN.md` §2 semantics** ← merged with **Stitch `heritage_excellence/DESIGN.md` values** (visual authority). Full merge table in `STITCH_INTEGRATION_PLAN.md` §4.

- **Type:** Playfair Display (display) + Plus Jakarta Sans (UI/body) via `next/font` (self-hosted, zero layout shift). *(Divergence from `DESIGN.md`'s Inter/Cormorant suggestion — logged as D-05.)*
- **Colour:** `--forest #123D32`, `--forest-deep #0C241E`, `--forest-interactive #1E5545`, `--ivory #F8F5EC`, `--paper #FFFFFF`, `--sage #E8EEE8`, `--gold #C6A66B`, `--ink #242424`, `--muted #737873`, `--success/--warning/--danger` semantic set. Gold is **accent only**, never body text.
- **Dual atmosphere:** public = dark heritage green editorial; admin/committee = light sage/ivory data surfaces (Stitch "Bifurcated Atmosphere").
- **Accessibility:** WCAG 2.2 AA — contrast verified for every token pair, visible focus ring (gold 2px on green, green 2px on ivory), labels + `aria-describedby` errors, 44px touch targets, `prefers-reduced-motion`, keyboard-operable tabs/board/modals, mandatory loading/empty/error/expired/revoked/offline/duplicate states.
- **Responsive checkpoints:** 390 / 768 / 1100 / 1440 (+ intermediate), matching Stitch breakpoints (4-col / 8-col / 12-col).
- **Performance:** `next/image` with local assets, route-level `loading.tsx`, fonts subset, no Tailwind CDN, bundle budget per route, LCP < 2.5s on 4G.
- **SEO:** metadata API, OG images per route, `sitemap.ts`, `robots.ts`, JSON-LD `SportsEvent`.

## 12. Conflicts, assumptions and decisions requiring your approval

### 12.1 Decisions (D)
| ID | Decision | Resolution | Status |
|---|---|---|---|
| **D-01** | **Payments in scope?** | **CLOSED — NO.** Attendance is free; entry via registration → approval → QR credential → gate protocol. All commercial enquiries by WhatsApp/phone/e-mail to the official addresses. No checkout, gateway, order or refund code will ever exist. | ✅ **Decided 14 Oct 2026** |
| **D-03** | **Payment gateway** | **CLOSED — dropped** (Paystack/Flutterwave not required, no keys provisioned). | ✅ **Decided 14 Oct 2026** |
| **D-13** | Sponsorship figures public? | **KEEP** the 7 proposed tiers (₦75m → ₦2.5m) and signature-property values on `/sponsorship`, badged *"Proposed — subject to approval"*, alongside WhatsApp/Call CTA. | ✅ **Decided** |
| **D-14** | Offline finance ledger | **KEEP** — private `offline_commitments` ledger, `finance_officer` + `super_admin` RLS only (budgets + sponsor/patron settlements). | ✅ **Decided** |
| **D-15** | Hospitality pricing on public pages | **NO prices** on `/hospitality` — invitation/allocated tiers + "Enquire by WhatsApp / Call". Deck values remain internal reference only. | ✅ **Decided** |
| **D-02** | **Hybrid committee access** — spec calls it "provisional recommendation pending confirmation". | Ship default-deny + officer-grants; flip to hybrid read once you confirm. | ⏳ default applied |
| **D-04** | **i18n** — live site is `/en/*`. | Ship single-locale `en` at `/` (no prefix); keep `next-intl` wiring ready if you want `/en` + future locales. | ⏳ default applied |
| **D-05** | **Fonts** — Stitch renders Playfair Display + Plus Jakarta Sans; `DESIGN.md` suggests Cormorant/Inter. | Adopt the Stitch pairing (visual authority). | ⏳ default applied |
| **D-06** | **Stitch AI imagery** — all photos are hot-linked `lh3.googleusercontent.com/aida-public/...` AI-generated assets. | Download & self-host as interim; **confirm you have rights to publish them**; replace with authentic club photography over time. | ⏳ default applied |
| **D-07** | **Committee 7 membership** — not provided; responsibilities "proposed". | Create the workspace, leave roster empty, label responsibilities "Proposed — pending approval". | ⏳ default applied |
| **D-08** | **Named chairperson** — only General Morakinyo confirmed. | Store title only where supplied; no inferred titles. | ⏳ default applied |
| **D-09** | **Programme times** — Stitch shows exact clock times & named teams/players. | Render `Time to be confirmed` until the Tournament Committee publishes via CMS approval workflow. | ⏳ default applied |
| **D-10** | **Stitch nav vs spec IA** — two different nav models (see `STITCH_INTEGRATION_PLAN` §5). | Merge into one canonical public nav (proposal in that doc). | ⏳ default applied |
| **D-11** | **Countdown timer** — `DESIGN.md` says no countdown on the live site; Stitch prompt suggests one. | Countdown to festival dates only; no session-level countdowns. | ⏳ default applied |
| **D-12** | **Offline scanning** — required by spec, costly. | Ship online-first with a signed offline queue + conflict rules; full offline mode in Phase 5b. | ⏳ default applied |

> ⏳ = my recommendation adopted as the working default because it does not change scope or cost;
> shout if you want any of them reversed before Phase 5.

### 12.2 Assumptions (A)
- A-01 One Supabase project per environment (dev/staging/prod) or one project with separate schemas — **assumed separate projects** for prod isolation.
- A-02 Vercel is the host; GitHub is the remote (no repo exists yet — must be created).
- A-03 Email via a transactional provider (Resend/Postmark) rather than raw Gmail SMTP; the Gmail app password in the repo is legacy.
- A-04 Single active edition (`2026`) at launch, schema ready for multi-edition.
- A-05 Registration is per-person with optional group linking; no team/roster registration for players in v1.
- A-06 Analytics = in-house dashboards on Supabase views (no third-party analytics with personal data).
- A-07 `npm`/`pnpm` as package manager (pnpm preferred).

### 12.3 Open questions beyond the docs
1. Who is the **Super Admin** account holder, and which e-mail domain will own admin accounts?
2. Is the Abeokuta Polo Club **domain** secured? Which origin will Vercel serve?
3. Do you already have a **GitHub organisation/repo** for this project?
4. Will **press/RAW asset downloads** (Stitch shows FTP-style access) be real, or a credential-request form only?
5. Should **sponsors/vendor reps** get portal logins in v1, or is sponsor service handled by officers?
6. Are **WhatsApp** notifications required for launch (Business API onboarding takes time) or email-only first?
7. Do you have **authentic photography/logo assets** to replace the Stitch placeholders?
8. Preferred **PDF** stack for passes/receipts (`@react-pdf/renderer` vs server-side Chromium).

---

## 13. ⚠ Security findings (immediate)

1. **Live credentials are stored in plaintext in this workspace** — `stitch_abeokuta_polo_festival_platform/the_blueprint.txt` contains a Supabase **service-role key**, **database password**, **anon key**, a **Gmail app password**, `CREDENTIAL_ENCRYPTION_SECRET`, `CRON_SECRET` and `WORKER_AUTH_SECRET`.
   - **Recommendation: rotate all of them now** (Supabase: rotate service-role via dashboard → API keys; DB password via Database settings; Gmail app password → revoke). I have deliberately not repeated the values in this document.
   - The file must be **excluded from the repo** (`.gitignore`) and removed from any history once a repo exists.
   - Consider the service-role key **compromised** until rotated.
2. `.env.example` will contain **names only**; real values live in Vercel env + local `.env.local` (git-ignored).
3. Rate limiting on `/register`, `/rsvp/[token]`, `/api/credentials/verify`, auth endpoints (Upstash/via Vercel middleware).
4. Webhook signature verification + idempotency keys on **inbound e-mail/delivery events**; no secrets in client components (enforced with `server-only` and a lint rule). **No payment webhooks exist — by design.**
5. Audit logging for: permission changes, credential issue/revoke/override, financial reads, bulk exports.
6. NDPA (Nigeria Data Protection Act) review before launch: consent text on registration, retention policy, export/erasure workflow.
7. No committee name/roster in public JSON, metadata, sitemap, OG images or error pages (tested in Phase 2 acceptance).

---

## 14. Prioritised backlog & roadmap

Mapped 1:1 to `DEVELOPMENT_ROADMAP.md`; each phase has an explicit stop-for-approval gate.

| Phase | Scope | Acceptance (from spec + additions) | Gate |
|---|---|---|---|
| **0 — Discovery & plan** | This document + `STITCH_INTEGRATION_PLAN.md` | Plan approved; D-01/D-03/D-13/D-14/D-15 decided | ✅ **COMPLETE** |
| **1 — Foundation** | Next.js/TS/Tailwind/shadcn, lint+format+test+CI, Supabase client/server split, first migrations, auth, base RBAC | `pnpm build && pnpm test` green; secrets server-only; sample RLS deny tests pass | ✔ |
| **2 — Private governance** | 7 committees, provisional roster import, verification linking, scoped grants, tasks/meetings/minutes/decisions/documents, readiness dashboard | Public & guest sessions **cannot** retrieve roster/files; cross-committee leak tests pass | ✔ |
| **3 — Public site + CMS** | Tokens → components → 14 Stitch screens converted → CMS + approval workflow, galleries, news, SEO | No private data in anonymous responses; a11y + 390/768/1440 visual QA | ✔ |
| **4 — Guests & invitations** | Registration, RSVP, groups, approvals, guest dashboard, invitation templates + delivery status | Own-record-only access; idempotent sending | ✔ |
| **5 — QR accreditation** | Issue/revoke, zone entitlements, scan UI, audit, duplicate prevention, offline queue | Forged/revoked/replayed denied; scan race handled | ✔ |
| **6 — Sponsorship, hospitality & offline finance operations** | Package/allocation ledger, CRM, benefits, Patrons/chalets/complimentary approvals, WhatsApp/call enquiry pipelines, offline commitment ledger | No overselling of allocated slots; all money offline & finance-scoped; public pages payment-free | ✔ |
| **7 — Analytics & polish** | Reports/exports, notifications, monitoring, perf/a11y/security review | Scoped exports; observability; documented recovery | ✔ |
| **8 — Launch readiness** | Staging→prod, env config, content review, admin training, backup/runbook, smoke tests | Signed deployment checklist, no open critical defects | ✔ |

**Testing strategy:** vitest units (permissions, QR, allocation/capacity, slot ledger) · integration tests against a local Supabase with **two authenticated clients (allowed vs denied)** for every RLS policy · Playwright e2e for the 4 journeys (visitor→register, guest→pass→scan, committee→task, admin→approve) · a11y via `@axe-core/playwright` · **a payment-absence test** (grep-level CI guard asserting no `payments`/`checkout`/gateway symbols) · `pnpm lint && pnpm typecheck` in CI.

---

## 15. Missing credentials, dependencies & blockers

| Item | Status | Needed by | Owner |
|---|---|---|---|
| Supabase project (dev) | ⚠ credentials exist but are **compromised in plaintext — rotate** | Phase 1 | You |
| Supabase project (prod) | ❌ not created | Phase 8 | You |
| GitHub repo | ❌ not created (git has no commits) | Phase 1 | You |
| Vercel project + team | ❌ unknown | Phase 1 | You |
| Production domain | ❌ unknown | Phase 8 | You |
| Email provider API key | ❌ not provisioned | Phase 4 | You |
| WhatsApp enquiry channel (`wa.me` links to official numbers +234 818 188 8884 / 0803 681 8916 / abeokutapolo@gmail.com) | ✔ usable immediately | Phase 3 | — |
| WhatsApp Business API (outbound notifications) | ❌ optional, not provisioned | Phase 7 | You |
| ~~Payment gateway account~~ | 🚫 **not required — no payments** | — | — |
| Approved logo / photography pack | ❌ not supplied | Phase 3 | You (D-06) |
| Confirmed programme & fixtures | ❌ does not exist | Phase 3 content | Tournament Cmte |
| Committee 7 roster + chair | ❌ not supplied | Phase 2 | Leadership (D-07) |
| Confirmed sponsorship approvals | ❌ all values "proposed" | Phase 6 | Leadership |
| NDPA legal review | ❌ outstanding | Phase 8 | Legal |

---

## 16. Phase 0 exit criteria

1. ✅ Plan approved (`ARCHITECTURE_PLAN.md` + `STITCH_INTEGRATION_PLAN.md`).
2. ✅ **D-01 / D-03 closed — no website payments**; D-13 sponsorship figures public-as-proposed, D-14 offline finance ledger kept, D-15 no hospitality prices.
3. ⏳ **Rotate the leaked credentials** in `stitch_abeokuta_polo_festival_platform/the_blueprint.txt` (service-role key, DB password, Gmail app password) — still outstanding and blocking production use.
4. ⏳ Confirm **Super Admin identity**, GitHub repo and Vercel team (dev work proceeds locally meanwhile).

**Implementation is authorised from Phase 1.** Remaining ⏳ items block only deployment, not local development.

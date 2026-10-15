# STITCH_INTEGRATION_PLAN.md — Google Stitch → Next.js conversion plan

**Status:** APPROVED (v1.1) — companion to `ARCHITECTURE_PLAN.md`. Revised for the no-payments
decision (D-01/D-03); implementation authorised from Phase 1.
**Scope of this document:** inventory of every approved Stitch export, technical anatomy of those
exports, the screen→route→component mapping, the gap list, the token merge, and the conversion workflow.
**No design file has been modified, moved or deleted.**

---

## 1. Design asset inventory

Two Stitch batches exist in this workspace. **Both are treated as approved visual authority.**

### Batch A — `Design/stitch_abeokuta_polo_festival_platform/` (the 5 anchor screens)
| # | Screen folder | Artefacts | Type |
|---|---|---|---|
| A1 | `the_blueprint_2026_abeokuta_polo_festival` | `code.html` 55 KB · `screen.png` 457 KB | Public homepage (anchor) |
| A2 | `festival_programme_3_day_tournament_schedule` | `code.html` 57 KB · `screen.png` 466 KB | Public programme (anchor) |
| A3 | `super_admin_command_centre_abeokuta_polo_2026` | `code.html` 50 KB · `screen.png` 412 KB | Super Admin (anchor) |
| A4 | `private_committee_management_workspace` | `code.html` 37 KB · `screen.png` 470 KB | Committee workspace (anchor) |
| A5 | `personalized_guest_dashboard_digital_qr_pass` | `code.html` 30 KB · `screen.png` 628 KB | Guest dashboard + QR pass (anchor) |
| A6 | `heritage_excellence/DESIGN.md` | 14 KB token + component spec | **Approved design system (primary)** |

### Batch B — `stitch_abeokuta_polo_festival_platform/` (public marketing family)
| # | Screen folder | `code.html` | Type |
|---|---|---|---|
| B1 | `abeokuta_polo_festival_2026_home_redesign` | 52 KB | Homepage variant 2 |
| B2 | `abeokuta_polo_festival_2026_official_programme_match_schedule` | 67 KB | Programme variant 2 |
| B3 | `abeokuta_polo_festival_2026_the_royal_cup_feature` | 59 KB | Royal Cup feature |
| B4 | `abeokuta_polo_festival_2026_hospitality_chalets_vip_experiences` | 56 KB | Hospitality / VIP |
| B5 | `abeokuta_polo_festival_2026_partnerships_sponsorships` | 75 KB | Sponsorship |
| B6 | `abeokuta_polo_festival_2026_media_gallery_press_hub` | 69 KB | Gallery + press hub |
| B7 | `abeokuta_polo_festival_2026_publications_tournament_gazette` | 57 KB | Publications |
| B8 | `abeokuta_polo_festival_2026_registration_digital_pass_wallet` | 54 KB | Registration + pass wallet |
| B9 | `heritage_equestrian_grandeur_1/DESIGN.md` | 12.5 KB | Earlier design-system variant |
| B10 | `heritage_equestrian_grandeur_2/DESIGN.md` | 13.7 KB | Earlier design-system variant |

Each screen folder also contains a full-height `screen.png` reference render (use for visual QA baselines).

**Assets:** every screen hot-links imagery from `https://lh3.googleusercontent.com/aida-public/...`
(Stitch AI-generated). There are **no local image files, no SVG icon sprites, no CSS files, no JS files**
in the exports. See §7 for the asset plan.

---

## 2. Technical anatomy of the exports (what must change)

| Aspect | As exported | Required in Next.js |
|---|---|---|
| Styling | `<script src="https://cdn.tailwindcss.com">` (runtime CDN, JIT in browser) | Compiled Tailwind v3/v4 in `tailwind.config` + `globals.css` — **CDN removed** |
| Fonts | Google Fonts `<link>`: **Playfair Display** + **Plus Jakarta Sans** + **Material Symbols Outlined** | `next/font/google` self-hosted, `display: swap`, subset |
| Icons | Material Symbols ligature text (`shield_person`, `qr_code_scanner`, `arrow_forward`…) | **Lucide React** (per `DESIGN.md` §6) + a documented ligature→Lucide map; keep Material Symbols only where Lucide has no equivalent |
| Images | Hot-linked `lh3.googleusercontent.com` AI assets | Downloaded → `public/assets/stitch/` → `next/image` (interim) → Supabase Storage/CMS (final) |
| Interactivity | Inline `<script>`: mobile menu, day tabs, board/list/gantt toggle, modals, accordions, form steps | React state / `useState` + shadcn `Tabs`, `Dialog`, `Accordion`, `Sheet` |
| Data | Hard-coded copy (numbers, names, teams, ₦ amounts) | Server Components reading Supabase; all demo values go to `lib/fixtures/*` flagged `SAMPLE` |
| Layout | Single `body`, no route shells | `layout.tsx` route groups: `PublicShell`, `AdminShell`, `CommitteeShell`, `GuestShell`, `ScanShell` |
| Encoding | Mojibake in several files (`Lead West Africa�?Ts…`, `SoirǸe`, `CanapǸs`) | Correct to proper UTF-8 typographic characters during conversion |
| Accessibility | No `lang`, few landmarks, icon-text as raw ligature strings, non-semantic divs | `<header>/<nav>/<main>/<footer>`, labelled controls, focus rings, `aria-*`, skip-link |
| Responsive | Tailwind defaults only | Explicit verification at 390 / 768 / 1100 / 1440 (Stitch uses 4-col / 8-col / 12-col rules) |

**Rule (from your brief):** these are *visual prototypes*. They contain no working logic. Every
"Generate Pass", "Export Roster", "Authorize & Sign Pass" button becomes a real, permission-checked
Server Action — not a decorative element.

---

## 3. Screen-by-screen analysis and route mapping

### 3.1 Batch A — anchor screens

#### A1 `the_blueprint_2026_abeokuta_polo_festival` → `/`
**Structure:** dual nav (`Overview · Programme · Royal Cup · Hospitality & VIP · Sponsorship` +
internal `Committee Portal · Admin Command · Guest Pass / QR · Register Now`) → cinematic hero
("THE BLUEPRINT / An Epoch of Royal Sport & Pan-African Splendour") → *Signature Highlights*
(Royal Cup · Polo Queens Invitational · Kings Procession & Durbar · All-Stars International ·
Twilight Fireworks & Gala) → *VIP Hospitality & Royal Enclosures* (Chukka Terrace · Royal Patrons
Circle · Presidents Lounge) → *Heritage In Motion* (archive strip) → partner strip (Ogun State
Govt) → final CTA → **shared footer** ("Festival Architecture / Executive Protocols" link columns).
**Extract:** `PublicHeader`, `FestivalHero`, `SignatureExperienceCard`, `EnclosureCard`,
`HeritageStrip`, `PartnerLogoRow`, `CtaBanner`, `PublicFooter`.

#### A2 `festival_programme_3_day_tournament_schedule` → `/programme`
**Structure:** hero → **3 day cards** (Day 1/2/3 with jump links) → toolbar (`Download PDF
Programme (V2.4)`, Google/Apple/Outlook calendar export) → **day timeline** of rich event cards
(time · duration · category chip · location · body · team blocks · "Add to Cal" / secondary CTA) →
ground masterplan → *Festival Architecture* / *Executive Protocols* link grids → venue block.
**Extract:** `ProgrammeHero`, `DayTabBar`, `ProgrammeTimeline`, `ProgrammeEventCard`,
`MatchTeamBlock`, `CalendarExportMenu`, `GroundPlanPanel`.

#### A3 `super_admin_command_centre_abeokuta_polo_2026` → `/admin`
**Structure:** shared **Operations Console shell** (left rail: Committee Portal, Pass
Accreditation, Match Scoring & Chukkers, VIP Pavilions, Public Showcase, Guest Pass/QR + session
status strip) → page header with 2 actions (`Issue VIP Royal Pass`, `Export Roster (CSV)`) →
**4 KPI cards** (Guest Accreditations 8,420/12k · Sponsorship Capital · Royal & VIP Patrons ·
Scanned & Authenticated) + **Readiness scorecard** → *Registration Trajectory by Class*
(chart, 4 series) → *Capital Distribution* tier allotment chart → *Turnstile Ingress* peak arrival
forecast (3 days) → *Departmental Governance*: **7-committee readiness matrix** with progress
bars, milestones, status chips → *Rapid Directives* (3 high-authority actions) → *Live Operational
Trail* audit feed → **Issue Pass modal** ( dignitary, pass class, tier, delegation, `Authorize & Sign Pass`).
**Extract:** `AdminShell`, `ConsoleStatusStrip`, `MetricCard`, `ChartCard`, `ReadinessMatrix`,
`CommitteeReadinessRow`, `RapidDirectiveCard`, `AuditFeed`, `IssuePassDialog`, `DataTable`,
`ExportButton`.

#### A4 `private_committee_management_workspace` → `/committee/[slug]`
**Structure:** same console shell + `Classified · Level 4 Royal Clearance` banner → **workspace
switcher** (dropdown of sub-workspaces) → header actions (`Add Task`, `Upload Doc`) →
*Committee Direction* (HQ seat, officer count, attendance) + 3 health gauges (Pitch Readiness,
Equine Health, Umpire Accreditations) → **Task Board** with `Board / List / Gantt` toggle and 3
columns (Verified & Completed · In Progress · Action Required/Blocked), each task card carrying
owner chip, due date, %, status, `Escalate` → *Committee Sessions & Minutes* (next assembly card +
recent adjourned minutes) → *Internal Documents* "AES-256 Vault" file list (type, size, updated by,
download) → *Allocated Committee Budget* panel (total/remaining, `Request Budget Allocation`).
**Extract:** `CommitteeShell`, `ClearanceBanner`, `WorkspaceSwitcher`, `GaugeStat`,
`TaskBoard` + `TaskCard` + `TaskColumn`, `ViewToggle`, `MeetingCard`, `MinutesList`,
`DocumentVaultList`, `BudgetPanel`, `MemberChip`.

#### A5 `personalized_guest_dashboard_digital_qr_pass` → `/dashboard`
**Structure:** console shell (role-filtered for guests) → *Accreditation Verified & Active* →
welcome + access-grant banner → **two-tone pass card** (top green crest area / bottom ivory
credentials, dashed gold keyline, tier pill, token id, watermark, entitlement list, box allocation)
→ wallet/download/share actions → *Assigned Royal Liaison* contact card (WhatsApp / direct line) →
*Personalized Schedule* (3 dated itinerary cards with icon, venue, description) → *Venue & Arrival*
(map link, valet, helipad) → *Protocol & Attire* (dress code + accreditation fast-track).
**Extract:** `GuestShell`, `VerificationBanner`, `GuestPassCard`, `PassEntitlementList`,
`PassActionBar`, `LiaisonCard`, `ItineraryCard`, `VenueArrivalPanel`, `DressCodePanel`.

### 3.2 Batch B — public marketing family

| # | Screen | Proposed route | Distinct components to extract |
|---|---|---|---|
| B1 | Home redesign | `/` *(merge with A1)* | `FivePillarGrid`, `ProgrammeHighlightCards`, `ExperienceCards`, `ComplimentaryPassBanner`, `FaqAccordion`, `SectionHeader` |
| B2 | Official programme | `/programme` *(merge with A2)* | `DaySelectorCards`, `TimelineRow`, `DownloadPdfBar`, `PassCtaRow` |
| B3 | Royal Cup | `/royal-cup` | `FeatureHero`, `StatBand` (100 Kings / 4-chukker), `ProtocolList`, `NamingRightsCta`, `PatronEnrolCard` |
| B4 | Hospitality | `/hospitality` | `TierComparisonCard` (General/VIP/Chalet/Patrons), `AmenityGrid`, `DressCodeGuide`, `InterestRegistrationForm`, `EnquiryCtaBand` (WhatsApp +234 818 188 8884 / 0803 681 8916 / abeokutapolo@gmail.com) |
| B5 | Partnerships | `/sponsorship` | `ReachStats`, `SignaturePropertyCard` (7 properties), `PackageTierTable` (7 tiers, each with **"Proposed — subject to approval"** badge), `FulfilmentTimeline`, `InquiryForm`, `ContactBlock` |
| B6 | Gallery & press | `/gallery` + `/press` | `GalleryMasonry`, `MediaMetaOverlay` (RAW size, credit, date), `VideoCard`, `PressCredentialForm`, `PressContactBlock` |
| B7 | Publications | `/publications` | `DocumentCard` (type/size/label), `PdfReaderPanel`, `ArchiveRequestForm` |
| B8 | Registration & pass wallet | `/register` + `/dashboard/pass` | `RegistrationStepper` (3 steps: Category → Credentials → Pass Issue), `CategoryCard` (**free attendance categories — no prices, no cart**), `ItineraryCheckboxGroup`, `ConsentBlock`, `WalletPassPreview`, `GateChecklist`, `FindMyPassForm` |

> **Merge note:** A1/B1 and A2/B2 are two design proposals for the same routes. See §5.3 — I recommend
> **A1/A2 layout as the base** (it is the later, richer export) **with B1/B2 section blocks added**
> (Five Pillars, Complimentary Pass, FAQ, per-day selector). Final call is yours (D-10).

### 3.3 Shared chrome present in the exports
- **Public header** (identical across B1–B8): `Home · About · Programme · Experiences · Gallery ·
  Publications · Partners · FAQ · Contact` + `My Pass · Sign In · Register`.
- **Public footer** (identical across B1–B8): link columns *Tournament Schedule · VIP Hospitality &
  Cabanas · Archival Imagery · Tournament Gazette · Patrons & Royal Sponsors · Visitor Protocol &
  FAQs · Digital Member Pass · VIP Registration · Official Portal Login · Media & Press Access*,
  legal row (*Privacy · Terms of Entry · Accessibility Statement · Equestrian Safety Protocols*),
  contact block (phone/WhatsApp/email).
- **Operations Console shell** (identical across A3/A4/A5).
- **Internal footer blocks** *Festival Architecture · Executive Protocols · Abeokuta Polo Club*
  (A1, A2).

---

## 4. Design token merge (authority: `DESIGN.md` semantics + Stitch `heritage_excellence` values)

Three token documents exist. Resolution:

| Source | Role |
|---|---|
| `docs/DESIGN.md` §2 | **Semantic names + accessibility rules** (authority for *meaning*) |
| `Design/…/heritage_excellence/DESIGN.md` | **Actual rendered values** in the approved screens (authority for *appearance*) |
| `heritage_equestrian_grandeur_1/2` | Earlier variants — **reference only, not used** (logos: `#062d1d`/`#cfa758`; superseded) |

**Merged token map to implement in `globals.css` (CSS variables) + Tailwind theme:**

| CSS var / token | Value | From |
|---|---|---|
| `--color-forest` (primary) | `#123D32` | Stitch heritage_excellence "Heritage Green" |
| `--color-forest-deep` | `#0C241E` | Stitch dark canvas |
| `--color-forest-interactive` | `#1E5545` | Stitch hover/active |
| `--color-forest-ink` | `#00261E` | Stitch Material `primary` (headers, strong chrome) |
| `--color-ivory` | `#F8F5EC` | **shared** by DESIGN.md + Stitch |
| `--color-paper` | `#FFFFFF` | cards |
| `--color-sage` | `#E8EEE8` | admin background / table headers |
| `--color-gold` | `#C6A66B` | Stitch Champagne Gold (accent only) |
| `--color-gold-bright` | `#D4AF37` | trophy/badge accents only |
| `--color-ink` | `#242424` | body on light |
| `--color-muted` | `#737873` | secondary (verify ≥4.5:1 on ivory) |
| `--color-border` | `#DCE3DB` | dividers (DESIGN.md) |
| `--color-success` / `--warning` / `--danger` | `#26724E` / `#A66713` / `#B64242` | DESIGN.md semantic set |

**Type scale** (from `heritage_excellence`): `display-lg 56/64 600` (mobile 36/44) · `headline-lg
40/48` · `headline-md 28/36` · `headline-sm 22/30` · `title-lg 18/26` · `title-md 16/24` ·
`body-lg 16/26` · `body-md 14/22` · `body-sm 12/18` · `label-caps 11/16 700 tracking .12em`.
Fonts: **Playfair Display** (display) + **Plus Jakarta Sans** (UI/body).

**Radii:** controls 4px · cards/panels/passes 8px · pills 9999px · dividers 0.
**Elevation:** hairline borders first, shadows second: `0 4px 20px -2px rgba(12,36,30,.05)` (surface 1),
`0 12px 32px -4px rgba(18,61,50,.12)` (surface 2). Never pure black/grey shadows.
**Grid:** 12-col ≥1200 · 8-col 768–1199 · 4-col <768; margins 5rem/3rem/1.5rem; gutters 2rem/1.5rem/1rem;
dashboard rail 280px desktop, collapsible.
**Motion:** 150–250ms micro, 250–400ms transitions, honour `prefers-reduced-motion`.

> ⚠ **Divergence to confirm (D-05):** `DESIGN.md` suggested Cormorant Garamond/Playfair + **Inter**;
> the approved screens render **Playfair + Plus Jakarta Sans**. Plan follows the screens.

---

## 5. Navigation reconciliation (decision D-10)

### 5.1 The conflict
- **Stitch public nav (B1–B8):** Home · About · Programme · Experiences · Gallery · Publications · Partners · FAQ · Contact + My Pass / Sign In / Register
- **Stitch anchor nav (A1/A2):** Overview · Programme · Royal Cup · Hospitality & VIP · Sponsorship + internal shortcuts
- **`DESIGN.md` IA:** `/`, `/festival`, `/programme`, `/sponsors`, `/sponsorship`, `/hospitality`, `/register`, `/rsvp/[token]`, `/gallery`, `/news`, `/visit`, `/contact` *(note: `DESIGN.md` also lists `/tickets` — **dropped under D-01; there is no /tickets route**)*
- **Existing live site scrape:** `/en/about`, `/en/experiences`, `/en/publications`, `/en/partners`, `/en/faq`, `/en/account`

### 5.2 Proposed canonical public navigation (single header, two rows on desktop)
```
PRIMARY : Home · Programme · Experiences · Royal Cup · Hospitality · Sponsorship · Gallery · News · Visit · FAQ
UTILITY : Publications · Press · My Pass · Sign In · [Register — gold CTA]
FOOTER  : full Stitch link columns + legal + contact  (unchanged)
MOBILE  : Sheet drawer, same order, Register pinned
```
Everything in Stitch stays reachable; `About` folds into the hero/story section **and** remains at
`/about` (footer + drawer). **There is no Tickets entry anywhere** — attendance is free and entry runs
through `Register` (gold CTA) → approval → QR credential (D-01). No URL from any source is lost other
than `/tickets`, which is deliberately retired.

### 5.3 Homepage variant merge
Base = **A1** (hero → signature → enclosures → heritage → partners → CTA).
Insert from **B1**: `FivePillarGrid`, `ProgrammeHighlightCards` (3 sporting concepts),
`ExperienceCards`, `ComplimentaryPassBanner`, `FaqAccordion`.
`/programme` base = **A2**; insert from **B2**: day selector cards + pass CTA row.

---

## 6. Screen-to-component mapping (all 11 required systems)

Legend: **✔** = Stitch screen exists · **◐** = partial · **✘** = no design exists (build from
`heritage_excellence` component rules, flagged "no approved mock").

| # | System | Route(s) | Stitch source | Coverage | Components to build |
|---|---|---|---|---|---|
| 1 | Public website | `/`, `/about`, `/programme`, `/royal-cup`, `/experiences`, `/hospitality`, `/sponsorship`, `/partners`, `/gallery`, `/publications`, `/press`, `/news`, `/faq`, `/visit`, `/contact` | A1, A2, B1–B7 | **✔ ~85%** | header, footer, hero, all section cards (§3) |
| 1b | Public legal & states | `/privacy`, `/terms`, `/accessibility`, `not-found`, `error` | footer links only | **✘** | `LegalPageLayout`, `ErrorState`, `EmptyState`, `LoadingSkeleton` |
| 2 | Super Admin | `/admin/**` | A3 | **◐ shell + overview only** | + `AdminNav`, KPI/Chart/Matrix/Feed + **16 missing sub-pages** (§7) |
| 3 | Seven committees | `/committee/[slug]/**` | A4 | **◐ one generic shell** | `CommitteeShell`, `WorkspaceSwitcher`, readiness; per-committee empty states |
| 4 | Membership & tasks | `/committee/*/tasks|members` | A4 task board | **◐ tasks ✔ / members ✘** | `TaskBoard`, `TaskCard`, `MemberTable`, `VerificationQueue` |
| 5 | Guest registration & dashboards | `/register`, `/dashboard/**` | B8 (form), A5 (dashboard) | **✔ ~70%** | `RegistrationStepper`, `CategoryCard`, `GuestShell`, `ItineraryCard`, `ProfileForm`, `GroupManager` |
| 6 | Invitations & QR passes | `/dashboard/invitations`, `/dashboard/pass`, `/admin/invitations`, `/rsvp/[token]` | A5 pass, B8 wallet pass, A3 issue modal | **◐ issue ✔ / inbox ✘ / email ✘** | `GuestPassCard`, `QRCodeCanvas`, `InvitationCard`, `IssuePassDialog`, `RevocationDialog`, `InvitationEmail` |
| 7 | Programme CMS | `/admin/programme`, `/admin/media`, `/admin/content` | — | **✘** | `ProgrammeEditor`, `VersionDiff`, `ApprovalQueue`, `MediaLibraryGrid`, `SeoForm` |
| 8 | Sponsorship mgmt | `/admin/sponsors` | B5 public side only | **◐ public ✔ / CRM ✘** | `PipelineBoard`, `SlotAllocator`, `AgreementList`, `BenefitFulfilmentTable` |
| 9 | Free-entry allocation & offline finance | `/hospitality` (interest), `/register` (allocations), `/admin/allocations`, `/admin/hospitality`, `/admin/finance` | B4 (◐), B8 category cards | **◐ marketing ✔ / commerce ✘ → commerce *not built*** | `CategoryCard` (no price), `AllocationStatusPanel`, `CapacityMeter`, `WaitlistBadge`, `ApprovalFlow` (officer), `PassIssueDialog`, `OfflineCommitmentLedger` (finance-role only), `EnquiryCtaBand`/`WhatsAppCta` |
| 10 | Access control & check-in | `/scan`, `/admin/access` | — | **✘ critical gap** | `ScanViewport`, `ScanResult` (valid/invalid/used/expired/offline/zone), `ManualLookup`, `OverrideDialog` (audited), `OfflineQueueBadge` |
| 11 | Reports & notifications | `/admin/reports`, `/admin/notifications` | A3 charts only | **◐** | `ReportBuilder`, `ExportMenu`, `NotificationComposer`, `DeliveryLog`, `DateRangeFilter` |
| — | Authentication | `/sign-in`, `/forgot-password`, `/verify-email`, `/auth/callback` | — | **✘** | `AuthCard`, `EmailForm`, `OtpForm`, `AuthCallbackHandler` |
| — | Role switching | shell-dependent | A3/A4/A5 role chips | **◐** | `RoleSwitcher` (server-derived, not user-forgeable) |

---

## 7. Gap analysis

### 7.1 Missing screens (34)
**Public (4):** `/about`, `/news`, `/visit`, `/contact`.
**Legal & system (5):** `/privacy`, `/terms`, `/accessibility`, `not-found`, `error`.
**Auth (4):** sign-in, forgot-password, verify-email, callback.
**Guest (4):** `/dashboard` sub-pages beyond pass: invitations list, notifications, profile, group.
**Admin (16):** committees, committees/[id], members, tasks, meetings, guests, invitations, access,
programme, sponsors, **allocations**, hospitality, **finance (offline ledger)**, media, content,
reports — plus `users`, `audit`, `settings` (19 if counted separately).
**Committee (5):** members, meetings detail, decisions, documents detail, reports.
**Ops (2):** `/scan`, `/scan/history`.

### 7.2 Missing components
`StatusBadge` (full state set), `FilterBar`, `Pagination`, `ConfirmDialog`, `Toaster`, `Skeleton`,
`EmptyState`, `ErrorState`, `PermissionDenied`, `DataTable` (sort/filter/select/export),
`FileDropzone`, `RichTextEditor`, `DateRangePicker`, `RoleSwitcher`, `Breadcrumbs`, `SkipLink`,
`OfflineBanner`, `PrintablePass`, `WalletPass` (Apple/Google), `QRCode` (real, error-corrected),
`WhatsAppCta` / `EnquiryCtaBand` (official numbers + e-mail, `wa.me` deep links), `CapacityMeter`,
`charts` (line/bar/donut with accessible data tables).

### 7.3 Missing states (mandatory per `DESIGN.md` §3)
loading · empty · error · **expired invitation** · **revoked pass** · **offline scan** ·
**duplicate scan** · permission-denied · session-timeout · **capacity-full → waitlist** ·
**pending approval** · **registration rejected** · form-validation · success-confirmation.
None of these exist in the exports. *(No payment state of any kind is ever required — D-01.)*

### 7.4 Functionality that a visual prototype cannot provide
Registration→approval→credential issuance; server-side QR validation; role-scoped queries; RLS;
capacity/allocation transaction safety (no overselling of *slots*); offline-ledger entry for
settlements; audit log; exports; notifications; CMS approvals.
All are backend work — mapped to roadmap phases in `ARCHITECTURE_PLAN.md` §14.

---

## 8. Content-integrity rules for converted screens (critical)

The Stitch screens contain **illustrative detail that must not be published as fact**:

| Category found in exports | Examples | Handling |
|---|---|---|
| Exact clock times | `09:00 AM`, `04:30 PM`, `15:30–17:00` | Render `Time to be confirmed` until Tournament Committee publishes |
| Named teams/players/umpires | *Abeokuta Warriors vs. Lagos Kings*, *M. Lopez (ARG)*, *D. Adeleke* | CMS `event_participants` with `status='announced'`; else generic labels |
| Named individuals & titles | *Otunba Babatunde Adeleke*, *Alhaji Bello Danbaba*, *Lady Funmi Balogun*, *Dr. Cole*, *Chief Adebayo* | **SAMPLE fixtures only** (`lib/fixtures/`), watermark `DEMO DATA`, never in public queries |
| Sponsor logos / bank names | *Zenith Bank Plc Title Partner*, *BUA Group* | Hidden until `sponsors.status='approved'` — currently **no approved 2026 partner** |
| Financial figures | `₦385M / ₦500M`, `₦14,800,000` budget, escrow transfers | Admin/finance scopes only; **indicative budget never public** |
| Committee rosters/names | 7 committee names, HQ seats | **Private** — never in public payloads, metadata, sitemap, OG images |
| fabricated logistics | helipad slots, FTP press mirrors, RFID turnstiles | Only if the club confirms; otherwise "To be announced" |
| Pricing | ₦5k/₦50k/₦500k/₦1.5m ticket prices, 7 sponsorship tiers | **No ticket prices anywhere — attendance is free.** Sponsorship tier figures stay on `/sponsorship` with an `is_proposed=true` badge ("Proposed — subject to approval") until leadership approval; every other screen carries the trust line *Attendance is free; entry requires prior registration and accredited credential* |

Every converted page gets a **content lint**: any literal that matches the above categories must be
replaced by a CMS reference or a `TBC` component before the screen is accepted.

---

## 9. Asset strategy

1. **Extract & self-host (Phase 3 start):** download every `lh3.googleusercontent.com/aida-public/…`
   URL referenced by the 14 screens → `public/assets/stitch/<screen>/<hash>.jpg`, with a manifest
   JSON (`source-url`, `screen`, `local-path`). Zero hot-links remain in code.
2. **Interim use is subject to your rights confirmation (D-06)** — these are Stitch AI-generated
   images, not club photography.
3. **Final home:** marketing imagery that editors manage goes to Supabase bucket `public-site` /
   `media-library`; committee/sponsor/pass assets to private buckets with signed URLs (see
   `ARCHITECTURE_PLAN.md` §6.6).
4. **Icons:** Lucide React; the Material Symbols ligatures used in exports are mapped 1:1 in
   `components/design/icon-map.ts` (e.g. `shield_person → ShieldCheck`, `qr_code_scanner →
   QrCode`, `arrow_forward → ArrowRight`, `campaign → Megaphone`, `crisis_alert → Siren`,
   `lock_clock → TimerOff`). Icons that exist only as ligature text are never shipped as font glyphs.
5. **Logos/crests:** no official crest supplied — a typographic wordmark (Playfair) + gold rule is
   used until you provide approved artwork.
6. **`screen.png` files** stay where they are and serve as the **visual QA baseline** (side-by-side
   compare at 390/768/1440).

---

## 10. Responsive, accessibility and performance checklist (per screen)

- [ ] Renders correctly at **390 / 768 / 1100 / 1440**; no horizontal scroll; images `next/image`
- [ ] Landmarks: one `<h1>`, logical heading order, `<nav aria-label>`, skip-to-content link
- [ ] Contrast ≥ 4.5:1 for body, ≥ 3:1 for large text & UI (gold on green is the risk pair — tested)
- [ ] All interactive elements keyboard reachable with visible focus (2px gold ring on green, green on ivory)
- [ ] Forms: visible `<label>`, `aria-describedby` errors, 16px minimum input text on mobile, 44px targets
- [ ] Tabs/board/modal implement roving focus + `Escape`; accordion uses `<button aria-expanded>`
- [ ] `prefers-reduced-motion` respected; no autoplay audio; no large mobile parallax
- [ ] Every async region has loading + empty + error state
- [ ] Private content absent from view-source, metadata and network responses
- [ ] Lighthouse: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95

---

## 11. Conversion workflow

**Order (dependency-driven):**
```
0. Foundations  → design tokens, fonts, icons, Tailwind theme, UI primitives (shadcn), shells
1. Shared chrome → PublicHeader / PublicFooter / Operations Console shell / route-group layouts
2. Anchor screens (A1→A2→A5→A4→A3)  — proves both atmospheres early
3. Public family (B1…B8)            — reusable section library amortises the work
4. Missing screens built from the same component rules (auth, admin sub-pages, scan, guest subs)
5. Data binding (Supabase) + permission wiring + fixtures removal
6. Visual QA against `screen.png` at 390/768/1440 + a11y audit → sign-off per screen
```

**Definition of done for one converted screen**
1. Static JSX matches approved `screen.png` (±visual diff) at all breakpoints.
2. All copy sourced from CMS/fixtures — no stray fabricated literals (§8 lint passes).
3. Tokens only (no ad-hoc hex), Lucide icons, `next/image`, no CDN scripts.
4. Keyboard + screen-reader pass; axe clean.
5. Loading/empty/error/permission states implemented.
6. If authenticated: `requirePermission()` in the server layer **and** a passing RLS deny test.
7. Screenshot added to `docs/qa/` and listed in the change summary.
8. No payment symbol, route, price or checkout affordance appears in the screen (CI grep guard from `ARCHITECTURE_PLAN.md` §14).

---

## 12. Decisions

### 12.1 Closed — Phase 0

| ID | Question | Resolution |
|---|---|---|
| **D-01/D-03** | Payments / gateway? | **None.** No checkout, order, payment webhook, refund or `/tickets` route will exist. Entry = registration → approval → QR credential → gate. |
| **D-13** | Sponsorship figures public? | **Yes** — 7 proposed tiers + signature properties on `/sponsorship`, badged "Proposed — subject to approval", with WhatsApp/Call CTA. |
| **D-14** | Offline finance ledger | **Keep** — `offline_commitments`, `finance_officer`/`super_admin` RLS only. |
| **D-15** | Hospitality prices public? | **No** — invitation/allocated tiers + "Enquire by WhatsApp / Call"; deck values internal reference only. |
| D-05 | Playfair + Plus Jakarta Sans (as rendered) vs Cormorant + Inter (as written)? | Playfair + Plus Jakarta Sans |
| D-06 | Rights to publish the Stitch AI imagery until club photography arrives? | Confirm; self-host in the interim |
| D-10 | Nav merge (§5.2) and homepage variant merge (§5.3)? | Merge as proposed (A1 base + B1 sections; A2 timeline + B2 day cards) |
| — | Material Symbols → Lucide icon map approved? | Yes, with exceptions documented |
| — | `screen.png` files stay untouched as QA baselines? | Yes — no design file will be modified |

### 12.2 Open

| ID | Question | Recommendation | Status |
|---|---|---|---|
| D-06 | Rights to publish the Stitch AI imagery (rights confirmation not yet given) | Self-host interim; swap to authentic club photography as supplied | ⏳ awaiting you |
| — | Any nav/route amendment above | — | ⏳ waiting on you |

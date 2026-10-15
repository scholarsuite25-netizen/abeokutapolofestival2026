# DESIGN.md — The Blueprint / Abeokuta Polo Festival 2026

**Status:** Proposed design specification; update after Stitch concepts are reviewed and approved. **Applies to:** Antigravity, OpenCode, designers, frontend engineers. **Source:** festival sponsor deck + project specification; token values below are design recommendations, not officially approved brand standards.

## 1. Product identity
- Brand: **The Blueprint — 2026 Abeokuta Polo Festival**
- Tagline: **Where Heritage Meets Excellence**
- Date: **18–20 December 2026**
- Venue: **Abeokuta Polo Club, Kobape, Ogun State, Nigeria**
- Character: prestigious, culturally rooted, confident, warm, editorial, contemporary.
- Two coordinated visual modes: **public luxury/editorial** and **private operations/clarity**.

## 2. Design tokens

| Token | Proposed value | Use |
|---|---|---|
| `--color-forest` | `#073D2B` | Primary brand, public hero |
| `--color-forest-dark` | `#05291E` | Dark surfaces |
| `--color-ivory` | `#F8F5EC` | Public backgrounds |
| `--color-paper` | `#FFFEFA` | Cards and readable panels |
| `--color-gold` | `#C3A46A` | Restrained highlights, borders |
| `--color-ink` | `#182720` | Body text |
| `--color-muted` | `#64736B` | Secondary text (verify contrast) |
| `--color-border` | `#DCE3DB` | Dividers |
| `--color-success` | `#26724E` | Success state |
| `--color-warning` | `#A66713` | Warning state |
| `--color-danger` | `#B64242` | Destructive / error |

**Fonts:** Public headings: Cormorant Garamond / Playfair Display fallback serif; body and admin: Inter fallback system sans. Do not embed unlicensed font assets. Public H1 48–76px desktop / 36–46px mobile; body 16–18px; dashboard body 14–16px. Maintain at least 16px for mobile input text.

**Spacing:** 4px base; scale 4/8/12/16/24/32/48/64/96. Content max width 1200–1320px. Desktop dashboard sidebar ~256px; collapsible on tablet/mobile. Radii 8/12/16px. Shadows subtle; borders often preferred.

**Motion:** 150–250ms for microinteractions; 250–400ms for transitions. Respect `prefers-reduced-motion`. Avoid autoplay media with sound and large parallax on mobile.

## 3. Accessibility and responsiveness
- Target WCAG 2.2 AA for contrast, keyboard navigation, labels, focus, error descriptions and touch targets.
- Responsive checkpoints: 390px mobile, 768px tablet, 1440px desktop; design for intermediate widths too.
- All forms have visible labels, validation, confirmation and recoverable errors.
- QR pass must have readable fallback credential and explicit status; actual access validation is server-side.
- Loading, empty, error, expired invitation, revoked pass, offline scan and duplicate scan states are mandatory.

## 4. Information architecture

### Public
`/` homepage; `/festival`; `/programme`; `/programme/[slug]`; `/sponsors`; `/sponsorship`; `/tickets`; `/hospitality`; `/register`; `/rsvp/[token]`; `/gallery`; `/news`; `/visit`; `/contact`.

### Authenticated guest
`/dashboard`; `/dashboard/invitations`; `/dashboard/pass`; `/dashboard/programme`; `/dashboard/notifications`; `/dashboard/profile`.

### Private admin
`/admin`; `/admin/committees`; `/admin/committees/[id]`; `/admin/tasks`; `/admin/meetings`; `/admin/documents`; `/admin/guests`; `/admin/invitations`; `/admin/access`; `/admin/programme`; `/admin/sponsorship`; `/admin/finance`; `/admin/hospitality`; `/admin/media`; `/admin/reports`; `/admin/settings`.

Paths are proposed. **Route hiding is not authorization.** Implement server checks and Supabase RLS on all protected data.

## 5. Page templates

**Public homepage:** hero (event + date + venue + primary CTA), signature experiences, editorial story, three-day programme preview, sponsorship CTA, hospitality CTA, latest news, venue/footer.

**Programme:** day tabs, activity list, filters, details, status labels. The deck does not contain a confirmed hour-by-hour programme; use “Time to be confirmed,” never fabricated hours.

**Sponsor page:** editable package cards, clearly distinguish proposed packages from confirmed sponsor logos; sponsor enquiry CTA.

**Guest dashboard:** RSVP/registration state, pass preview, personal programme, notices, help.

**Admin overview:** actionable KPIs, pending approvals, task exceptions, committee readiness, alerts, recent activity; illustrative values clearly labeled until live data exists.

**Committee workspace:** committee overview, assigned tasks, meetings, decisions, private documents, reports, member directory; role-dependent controls.

**Mobile check-in:** large scan area, high-contrast validation status, guest/zone info only when authorized, duplicate/offline states, accessible manual lookup.

## 6. Component library
Implement reusable components: `PublicHeader`, `FestivalHero`, `EventCard`, `ProgrammeTimeline`, `SponsorTierCard`, `RegistrationStepper`, `GuestPassCard`, `AdminSidebar`, `MetricCard`, `DataTable`, `FilterBar`, `StatusBadge`, `TaskBoard`, `ApprovalQueue`, `DocumentList`, `MeetingCard`, `ScanResult`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `ConfirmDialog`.

Use shadcn/ui primitives where suitable. Build design tokens with CSS variables and Tailwind theme mappings. Use Lucide icons consistently. Do not hardcode festival-specific data into reusable UI components.

## 7. Content and trust rules
- Festival dates and venue from source; commercial packages/prices are **proposal values subject to approval**.
- Signature experiences: Royal Cup, All-Stars Game, Polo Queens Match, Bonfire Night & Fireworks, Kings Procession, VIP Pavilion; additional Media and Content Hub sponsorship property.
- Never invent confirmed performers, exact session times, official sponsor logos, dignitary attendance, or ticket availability.
- Use approved authentic event photos where supplied; otherwise neutral licensed placeholder imagery with attribution as appropriate.
- Private committee names, member rosters, minutes, budgets, correspondence, contact lists and confidential sponsorship information must never be displayed on public screens or bundled into public-facing static JSON.
- Private mockups should use fictitious sample names, masked contact details, and labels such as `DEMO DATA`.

## 8. Seven committee workspaces
1. Corporate Secretariat — meetings, minutes, decisions, correspondence.
2. Operations and Logistics — venue readiness, vendors, transport, infrastructure.
3. Finance and Business Development — restricted budgets, sponsorship, approvals.
4. Media and ICT — content, publicity, assets, publishing workflow.
5. Tournament — fixtures, teams, match results, safety.
6. Contacts and Mobilisation — invitation outreach, RSVPs, stakeholder engagement.
7. Welfare, Entertainment and Hospitality — guest services, catering, performances, VIP hosting (**functions proposed pending approval**).

Membership may overlap across committees; real names and assignments come from protected Supabase tables. Committee access model **hybrid is provisional**, pending leadership decision. Never silently grant broad admin access to every member.

## 9. Design-to-code handoff
1. Review Stitch's five anchor screens and approve revisions.
2. Export screen designs, assets and design rules if supported. Preserve this file as canonical written design specification; merge only approved changes.
3. Save references under `design/stitch/` and approved assets under `public/assets/` (public assets must contain **no private data**).
4. Implement tokens and components before pages; validate public/mobile/admin consistency.
5. Build with real data boundaries: use mock data only in isolated development fixtures, never claim it is production data.
6. Run visual QA on 390px, 768px, 1440px and keyboard navigation.
7. Do not let visual exports override Supabase RLS, server-side permissions, security reviews, or verified project requirements.

## 10. Acceptance checklist
- [ ] Cohesive public and admin identity
- [ ] Homepage clearly communicates dates, venue, festival, registration CTA
- [ ] Responsive programme, registration, sponsor, guest and committee views
- [ ] Seven private committee workspaces represented
- [ ] Private information absent from public pages and bundles
- [ ] Accessible contrast, labels, focus, keyboard use, reduced motion
- [ ] All empty/loading/error/permission states designed
- [ ] No invented schedule, sponsor or dignitary confirmations
- [ ] Designs approved before full frontend implementation

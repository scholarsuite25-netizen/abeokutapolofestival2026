# Google Stitch — Master Design Prompt

Copy the prompt below into Google Stitch. Attach approved festival imagery and branding if available. This is a **visual design assignment**, not an instruction to build the backend.

---

Act as an award-winning digital product creative director, luxury sports brand designer, accessibility specialist, and enterprise SaaS UX architect.

DESIGN an original, coherent, high-fidelity, responsive product experience for **The Blueprint — 2026 Abeokuta Polo Festival**, themed **“Where Heritage Meets Excellence.”** This is the **second Abeokuta Polo Festival**, 18–20 December 2026, at Abeokuta Polo Club, Kobape, Ogun State, Nigeria, in partnership with Ogun State Government. The experience must combine a prestigious polo-and-culture festival brand with a serious event-operations platform. It is NOT merely a landing page or a generic conference template.

## Creative direction
- Reference the attached *The Blueprint* sponsorship deck for visual inspiration: deep heritage/forest green, warm ivory, restrained champagne gold, documentary-style polo photography, refined editorial typography, sophisticated whitespace, tasteful lines, restrained motion, premium Nigerian cultural identity.
- Make the public site feel like an internationally recognized luxury sporting and cultural event; make internal dashboards calm, efficient, readable, and operationally reliable.
- Use an original design, not a replica of any other event platform. No fake partner logos, unapproved royal portraits, invented celebrity photos, or fabricated sponsors.
- Use accessible contrast, visible focus states, touch-friendly targets, readable type, responsive layouts and reduced-motion alternatives.
- Suggested design tokens (refine after visual testing): Forest `#073D2B`, Dark `#05291E`, Ivory `#F8F5EC`, Warm White `#FFFEFA`, Gold `#C3A46A`, Ink `#182720`, Muted `#64736B`, Border `#DCE3DB`, Danger `#B64242`, Success `#26724E`. Use gold for accents, never low-contrast body text.
- Suggested type pairing: elegant display serif for major public headings (e.g. Cormorant Garamond or Playfair Display) plus a clean sans serif for body and dashboard UI (e.g. Inter). Provide sensible fallbacks.

## Audience and product surfaces
1. Public: prospective attendees, polo enthusiasts, families, visitors, sponsors, media, vendors.
2. Guests: registered guests, VIPs, patrons, sponsors' guests, invited dignitaries.
3. Internal: Super Admin, festival leadership, committee chairpersons, secretaries, members, access-control officers and content editors.

## Screen family A — public festival website
Design desktop and mobile views for:
1. Premium homepage: cinematic editorial hero, dates/location, countdown, clear Register / Explore Programme / Partner With Us CTAs, signature experiences, heritage story, sponsor showcase, hospitality teaser, footer.
2. Three-day programme: day tabs, time-based event cards, categories, venue and detail drawers. Use **“Schedule to be confirmed”** for missing times.
3. Signature event detail: Royal Cup, Polo Queens Match, All-Stars Game, Kings Procession, Bonfire Night & Fireworks, VIP Pavilion. The proposal lists these but does not provide a complete approved timetable.
4. Sponsorship landing page: sponsorship packages, benefits, scarcity/slots only as **proposed or subject to confirmation**, enquiry form, sponsor brand placements. Use proposed tiers: Title ₦75m, Presenting ₦40m, Royal Cup ₦25m, Platinum ₦15m, Gold ₦8m, Silver ₦4m, Official Category ₦2.5m. Do not imply any package has been sold.
5. Tickets and hospitality: General Admission ₦5,000/day; VIP ₦50,000/day; Royal Patrons' Circle ₦500,000; Hospitality Chalet ₦1,500,000, all labeled **proposed / subject to approval** in design mockups.
6. Guest registration and RSVP flow: friendly multi-step form, validation, progress, confirmation, privacy notice.

## Screen family B — guest portal
7. Guest dashboard: welcome, RSVP status, upcoming programme, announcements, personal actions.
8. Digital invitation / QR pass: readable name/category, permitted dates/zones, scannable QR placeholder, expiry/reissue status, downloadable pass. Show **sample only**, not a real valid credential.
9. My programme: saved activities, change notices, downloadable programme.

## Screen family C — private administrative experience
10. Super Admin overview: KPI cards for registrations, invitations, check-ins, sponsorship enquiries, tasks and readiness; charts, alerts, pending approvals, audit activity. Use clearly marked **illustrative sample data**.
11. Committee directory and detail workspace: seven committees, members, responsibilities, tasks, meetings, decisions, documents, reports. Mark this screen **PRIVATE / AUTHORIZED USERS ONLY**.
12. Committee task board: statuses Not Started, In Progress, Awaiting Approval, Completed, Blocked, Cancelled; owner, due date, priority, evidence.
13. Corporate Secretariat workspace: agendas, minutes, correspondence, decision register, leadership reports.
14. Finance & Business Development workspace: restricted sponsorship pipeline, financial summary, budget approval status; never show this on public screens.
15. Contacts & Mobilisation workspace: private invitation campaigns, RSVP tracking, stakeholder outreach; mask sample personal contact information.
16. Media & ICT workspace: content editor, asset library, approval workflow, preview/publish.
17. Tournament workspace: fixtures, teams, umpires, match-day readiness, results publishing.
18. Operations & Logistics workspace: venue readiness, vendor checklist, incident escalation.
19. Welfare, Entertainment & Hospitality workspace: catering, performers, VIP hospitality, guest welfare; mark committee responsibilities as **proposed pending approval**.
20. Access-control scanning interface: mobile-first QR scanner state, validated / invalid / already-used / offline / sync conflict screens.

## Private committee definitions
- Corporate Secretariat
- Operations and Logistics
- Finance and Business Development
- Media and ICT
- Tournament Committee
- Contacts and Mobilisation
- Welfare, Entertainment and Hospitality

Committee membership and individual names are **confidential administrative content**; do not place them on the public-facing screens, public navigation, metadata, or example promotional material. If showing member names in private mockups, use fictional placeholders unless private source files are deliberately supplied for this purpose. The real application will load authorized records from Supabase.

## Key interactions to illustrate
- Public visitor -> programme -> register -> confirmation -> guest dashboard.
- Invited guest -> invitation -> RSVP -> QR pass -> event-day check-in.
- Sponsor prospect -> packages -> enquiry -> confirmation.
- Committee member -> private login -> assigned committee -> tasks -> update -> submit for approval.
- Super Admin -> pending approvals -> approve -> audit history.

## Components and design-system outputs
Produce reusable patterns for top navigation, footer, sidebar, role switcher, page headings, filters, tables, status badges, cards, tabs, forms, progress indicators, modal dialogs, empty states, errors, loading skeletons, toasts, confirmation screens, timeline, programme card, sponsor tier card, invitation card and QR pass.

Define desktop (1440px), tablet (768px) and mobile (390px) layouts. Provide clear typography scale, color tokens, spacing, radii, shadows, icon style, interaction states and accessible form patterns. Do not prioritize decorative effects over legibility.

## Deliverables and review gates
**First generate 5 anchor screens only**: public homepage (desktop + mobile), public programme, Super Admin dashboard, private committee workspace, guest dashboard with QR pass. Maintain a consistent design system across all five.

Then ask for design approval before generating remaining screens. After approval, produce reusable design specifications and exportable design assets / frontend references if the tool supports them. The engineering team will implement the backend, Supabase RLS, payment verification and actual QR validation separately.

**Success test:** a visitor immediately understands the festival and can register; a guest can find their pass and programme; an authorized committee member can find tasks and reports; the Super Admin can see readiness and exceptions. Public users must never see private committee data.

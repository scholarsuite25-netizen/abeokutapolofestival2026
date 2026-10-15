# Google Stitch → Antigravity / OpenCode: step-by-step

## Step 1 — Establish architecture
Extract the project ZIP and open it in Antigravity or OpenCode. Run `PROMPT_01_ANTIGRAVITY.md` or `PROMPT_01_OPENCODE.md`. Review the resulting `ARCHITECTURE_PLAN.md` and resolve key open decisions. Do not authorize implementation yet.

## Step 2 — Prepare Stitch inputs
Open https://stitch.withgoogle.com/ and create a new design project. Copy `STITCH_MASTER_DESIGN_PROMPT.md` into the prompt. Attach the *The Blueprint Sponsor Deck* or approved images if the current Stitch interface permits uploads. Do **not** upload private committee member lists, contact databases, finance files or credentials into public design examples.

## Step 3 — Request five anchor screens
Start with homepage (desktop/mobile), programme, Super Admin, committee workspace, guest dashboard/pass. If Stitch struggles with the full brief, split into separate prompts: (A) public brand system, (B) admin design system, (C) guest experience. Require the same tokens and components across each.

## Step 4 — Review and iterate
Check brand quality, clear CTAs, real festival details, accessible contrast, responsive layout, obvious private/public separation and no invented timetable. Ask Stitch to revise individual screens before expanding.

## Step 5 — Expand screen coverage
Once approved, ask for registration, sponsor enquiry, tickets, invitations, all seven committee workspace variants, media CMS, tournament, finance, check-in and error/empty states.

## Step 6 — Export the handoff
Use the export/share/design-to-code features available in your version of Stitch. Save approved screenshots, assets, design tokens and any generated frontend references under `design/stitch/`. Update `DESIGN.md` to match **approved** design choices. Stitch feature availability may vary; a screenshot + written design spec is an acceptable fallback.

## Step 7 — Hand off to coding agent
Open the project folder in Antigravity or OpenCode. Run the prompt below. Ask it to reconcile Stitch references with `MASTER_BUILD_PROMPT.md`, `DESIGN.md`, `ACCESS_CONTROL_AND_PRIVACY.md` and `SUPABASE_DATA_MODEL.md`.

### Handoff prompt
> Read `README.md`, `MASTER_BUILD_PROMPT.md`, `DESIGN.md`, `STITCH_MASTER_DESIGN_PROMPT.md`, and all approved references in `design/stitch/`. Treat Stitch as the visual source of truth only where approved; treat the master specification and security files as functional and privacy authority. First implement design tokens, navigation shells, reusable UI components, and the five approved anchor screens using Next.js, TypeScript, Tailwind and shadcn/ui. Keep mock data isolated and labeled. Do not connect private committee data to public pages. Validate 390px, 768px and 1440px views and keyboard accessibility. Show changed files, tests and screenshots; stop for approval before adding Supabase workflows.

## Step 8 — Build secure functionality
Follow the development roadmap: Supabase schema, authentication and RLS, committee permissions, guest registration, invitations and QR passes, sponsorship, ticketing, reporting and integrations. Use test credentials in development; never commit production secrets.

## Step 9 — Test and deploy
Test roles, access denial, invitations, revoked/duplicate passes, payment webhooks, mobile scanning, accessibility, performance, and operational reporting. Deploy to Vercel only after critical tests pass.

## Practical rule
**Stitch designs what users see. Antigravity/OpenCode builds what users can actually do. Supabase protects the data.**

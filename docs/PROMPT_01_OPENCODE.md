# First Prompt — OpenCode

You are the principal architect for **The Blueprint — 2026 Abeokuta Polo Festival**. Work inside the currently opened repository. Read all project specifications in this order: `README.md`, `MASTER_BUILD_PROMPT.md`, `FESTIVAL_CONTENT_AND_SPONSORSHIP.md`, `COMMITTEE_STRUCTURE_AND_MEMBERS.md`, `ACCESS_CONTROL_AND_PRIVACY.md`, `SUPABASE_DATA_MODEL.md`, `DEVELOPMENT_ROADMAP.md`. Do not silently skip any.

Target stack: Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui + Supabase Auth/Postgres/Storage/RLS + GitHub/Vercel. Scope: premium public festival site, super admin, seven private committee dashboards, role-scoped member workflows, guest registration, digital invitations and QR access, programme CMS, sponsorship, ticketing/hospitality and reports.

**Your first action is analysis, not implementation.** Inspect the existing repository using read-only commands. If web access is available, inspect https://abekutapoloeventaccess.vercel.app/register and state exactly what was observable. Never assume access to the previous source code. Avoid destructive commands, package installs, database migrations, secret changes or deployment at this stage.

Create `ARCHITECTURE_PLAN.md` containing:
- Requirements matrix and source-vs-assumption register.
- Proposed system boundaries, routes and folder structure.
- Public, guest, admin and committee sitemap.
- Supabase ERD, entity relationships, indexes, migration and seed approach.
- Row Level Security and granular permission matrix, including multiple committee memberships.
- Guest/RSVP/invitation/QR and sponsor/ticket/payment flows.
- Committee tasks, meetings, decisions, documents and reporting workflows.
- UI/UX design tokens, accessibility, performance and mobile strategy.
- Phased backlog with acceptance tests and deployment risks.
- Questions requiring approval (especially hybrid committee access and missing chairpersons).

Never expose internal committee rosters, contacts or budgets publicly. Preserve roster names verbatim as provisional, without auto-merging similar names. Mark proposed committee responsibilities and commercial terms as pending approval.

When the plan is written, summarize it and **STOP**. Ask for approval before editing application source or starting implementation.

# First Prompt — Google Antigravity

Act as Lead Software Architect, Senior Next.js Engineer, Supabase Security Engineer and Creative Director for **The Blueprint — Abeokuta Polo Festival 2026**.

**Workspace instruction:** Inspect this project folder first. Read `README.md`, `MASTER_BUILD_PROMPT.md`, `FESTIVAL_CONTENT_AND_SPONSORSHIP.md`, `COMMITTEE_STRUCTURE_AND_MEMBERS.md`, `ACCESS_CONTROL_AND_PRIVACY.md`, `SUPABASE_DATA_MODEL.md` and `DEVELOPMENT_ROADMAP.md` in full. If any file is missing, report it before proceeding. Treat the uploaded sponsorship deck as the source of the festival commercial facts if available.

**Goal:** Plan an international-standard full-stack festival management system using Next.js App Router, TypeScript, Tailwind, shadcn/ui, Supabase and Vercel. It must include a luxury public website, Super Admin, seven private committee workspaces, guest portal, invitations/QR check-in, sponsorship, ticketing, hospitality, CMS and analytics.

**Security first:** No committee roster, private committee files, financial records or guest directories on public routes or public API responses. Propose Supabase RLS and scoped authorization. Import named committee members only as provisional records, never as active user accounts. Do not merge similarly named individuals without confirmation.

**Do now (planning only):**
1. Inspect repository contents and existing application at https://abekutapoloeventaccess.vercel.app/register if accessible; distinguish observed facts from assumptions.
2. Produce a feature inventory and prioritized gaps.
3. Design public/private sitemap and user journeys.
4. Design architecture, folder structure, database ERD, migrations strategy and RLS policy matrix.
5. Define the committee role/permission model and private workflows.
6. Recommend a premium heritage-green/ivory visual system and responsive layout approach.
7. Plan integrations, testing, deployment and phased implementation with acceptance criteria.
8. List outstanding approval questions, including committee login policy and missing appointments.

**Output:** Write a detailed `ARCHITECTURE_PLAN.md` in the workspace. Give me a concise summary and list of decisions needing approval. **Do not scaffold, modify application code, run destructive commands, deploy, or start Phase 1 until I approve the architecture.**

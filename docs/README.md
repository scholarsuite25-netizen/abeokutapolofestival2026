# The Blueprint — Abeokuta Polo Festival 2026

## Project specification package

**Festival:** Second Abeokuta Polo Festival · **Theme:** Where Heritage Meets Excellence · **Dates:** 18–20 December 2026 · **Venue:** Abeokuta Polo Club, Kobape, Ogun State · **Partner:** Ogun State Government.

This folder is the working specification for an enterprise-grade event information, registration, accreditation, sponsorship, hospitality and committee-governance platform. Existing reference: https://abekutapoloeventaccess.vercel.app/register. Do not assume its implementation is accessible or verified.

### Reading order
1. `MASTER_BUILD_PROMPT.md` — authoritative implementation brief
2. `FESTIVAL_CONTENT_AND_SPONSORSHIP.md` — facts and commercial information from the supplied deck
3. `COMMITTEE_STRUCTURE_AND_MEMBERS.md` — internal committee structure and provisional membership
4. `ACCESS_CONTROL_AND_PRIVACY.md` — role/permission design
5. `SUPABASE_DATA_MODEL.md` — schema requirements
6. `DEVELOPMENT_ROADMAP.md` — delivery phases and acceptance criteria
7. `PROMPT_01_ANTIGRAVITY.md` or `PROMPT_01_OPENCODE.md` — initial prompt

### Source-of-truth and uncertainties
- Source: user-provided *The Blueprint Sponsor Deck (2).pdf*, 12 pages, and committee information provided in chat.
- Seven committees are required. Welfare, Entertainment & Hospitality responsibilities are **proposed**, not approved; membership is **not provided**.
- Only General Morakinyo is explicitly identified as committee chairman (Finance and Business Development).
- Similar variants of Sheriff Adams's name must **not** be merged automatically.
- Committee access model is pending confirmation; **hybrid access is the provisional recommendation**, not an approved decision.
- Pricing and dates are sourced from the proposal and must remain configurable and subject to event-leadership approval.
- The deck is a sponsorship proposal, **not** a complete confirmed hour-by-hour programme; do not fabricate schedules.

### Starting workflow
Unzip into an existing or new project folder. In Antigravity or OpenCode, open that folder, attach or paste the relevant `PROMPT_01_*.md` and ask the agent to read all specs. Review its `ARCHITECTURE_PLAN.md` before authorizing implementation. Do not paste live Supabase credentials into prompts or source control.

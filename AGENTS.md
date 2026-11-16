<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Production Verification & Anti-Mock Fallacy Guard
1. Never equate `npm test` or `next build` passes with real-world functional success.
2. Verify remote database schema and production environment secrets before declaring completion.
3. Perform live browser interaction tests on actual UI forms to ensure state transitions work end-to-end.
4. Keep Day 3 strict paywall: Unverified bank transfers must only receive Provisional Claim Slips with explicit watermarks, denied at turnstiles until Secretariat Accounts reconciliation.

## Zero-Cost Agent Quota Discipline (Antigravity & OpenCode)

Antigravity's free quota is **weekly and measured by work done**, not prompts. Repo exploration, long logs, whole-file reads, full test runs and retry loops all drain it. Every agent working in this repo must follow these rules.

**Cheap by default**
1. Never read `node_modules/`, `.next/`, `.git/`, `stitch_abeokuta_polo_festival_platform/`, `supabase/*.sql` dumps, or any file over ~250 lines unless the task truly needs it.
2. Locate code with targeted `rg -n "pattern" path/` first; open only the matching lines.
3. Batch all related edits into one turn. Use surgical edits, never rewrite whole files.
4. Run only the affected test file (`npx vitest run tests/unit/<file>.test.ts`). Run the full suite once per milestone, not per edit.
5. On first failure: stop, report the error, propose a fix. Never blind-retry — each retry spends quota.
6. Keep replies terse: conclusions, file paths, diffs. Do not restate code in prose; no screenshots unless asked.
7. One feature per conversation. Start a new conversation for unrelated work instead of dragging a long history.

**Work routing**
- Architecture, hard debugging, security review → Antigravity (its scarce quota is for thinking, not typing).
- Mechanical work (renames, copy edits, boilerplate, test scaffolding, doc formatting) → OpenCode free models or local Ollama, not Antigravity.
- Large reading/research → this repo's OpenCode session or a free Gemini API key (`agy` with `modelProvider: gemini`), not the Antigravity subscription quota.

Full zero-cost playbook, capacities and reset dates: `docs/AGENT_ROUTING_PLAYBOOK.md`. Lean tasking template: `docs/PROMPT_02_ANTIGRAVITY_LEAN.md`.


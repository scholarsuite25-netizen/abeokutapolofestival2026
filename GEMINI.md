# Project Agent Instructions (Antigravity CLI / Gemini)

Read `AGENTS.md` first — it is the source of truth for code standards **and** for quota discipline.

## Quota discipline (summary)
- The free Antigravity quota is **weekly** and measured by **work done**, not by prompts.
- Explore with `rg -n`, never by reading whole files or scanning the repo.
- Read only files named in the task brief. Never open `node_modules/`, `.next/`, `stitch_abeokuta_polo_festival_platform/` or SQL dumps.
- Batch edits. Run only the affected test file. Stop and report on the first failure; never blind-retry.
- One feature per conversation. Keep answers short; output tokens also spend quota.
- These rules exist because a single careless "read the whole repo" run can consume a free week's quota.

## Routing
- Deep design, hard debugging, security review → signed-in Antigravity quota (scarce).
- Mechanical/bulk edits → OpenCode free models or local Ollama.
- Reading/research → OpenCode session or `agy` on a free Gemini API key
  (`~/.gemini/antigravity-cli/settings.json` → `{"modelProvider":"gemini"}` + `GEMINI_API_KEY`).

## Never do
- Never use the Antigravity login inside third-party tools, extract tokens, or run account pools — Google's FAQ treats this as a ToS violation (suspension risk).

Full playbook: `docs/AGENT_ROUTING_PLAYBOOK.md`.

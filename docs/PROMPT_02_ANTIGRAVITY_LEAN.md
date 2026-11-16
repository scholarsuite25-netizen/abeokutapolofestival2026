# Lean Tasking Template — Antigravity

Copy, fill in, send. The goal: Antigravity spends quota on **thinking**, not exploring.

```
SCOPE (one feature or fix only):
<what to change, in one paragraph>

FILES — read ONLY these, in full if needed:
- <path/to/file.tsx>
- <path/to/test.ts>

DO NOT:
- scan or "inspect" other folders
- read node_modules/, .next/, stitch_*, or SQL dumps
- run the full test suite (only the test file above)
- paste screenshots or long logs back to me
- restate code in prose

CONSTRAINTS:
- follow AGENTS.md (security, Day 3 paywall, no mock success)
- surgical edits only; no file rewrites
- TypeScript strict; keep existing patterns and naming

ACCEPTANCE:
- <behaviour that must work>
- npx vitest run <test file> passes

OUTPUT:
1) patch-only diff  2) 5-line summary  3) any risk I must know
If the files don't match my description, STOP and ask — do not search for alternatives.
```

## Why this shape

The old kickoff (`docs/PROMPT_01_ANTIGRAVITY.md`) asked Antigravity to read seven documents in full and produce a long plan. That is fine once, at project start, but repeating it every session is what empties the weekly quota: quota tracks work, and reading a large repo is the most expensive thing an agent can do.

Rules of thumb:
- A task packet with exact files costs ~10× less than "find and fix it".
- One feature per conversation; start fresh afterwards.
- Ask for a diff, not a rewrite.
- Stop at the first failure instead of retrying.

Full routing and budget rules: `docs/AGENT_ROUTING_PLAYBOOK.md`.

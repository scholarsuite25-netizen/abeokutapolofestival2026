# Zero-Cost Agent Routing & Quota Playbook

**Purpose:** stop Antigravity's free quota running dry mid-week, and keep shipping at ₦0.
**Written:** 16 November 2026 · applies to Antigravity IDE + `agy` CLI (v1.5.1 installed).

---

## 1. Why it keeps happening (the mechanics)

| Fact | Consequence |
|---|---|
| Free/AI-Plus quota is **weekly**, not 5-hourly | One bad day can cost you the rest of the week (this is why the lock lasts to 23 Nov) |
| Quota is measured by **work done**, not prompts (Google: "correlates with the amount of work done by the agent") | A single "read the whole repo" or a full test suite costs more than 50 small edits |
| **Two meters**: Gemini models vs Claude/GPT models | Switching groups used to buy time; on free tier the Claude/GPT models disappear on **18 Nov 2026**, leaving Gemini 3.8 Flash only |
| No BYOK / no custom endpoint on the **subscription** quota | You cannot top up free tier; only paid AI Pro/Ultra adds 5-hour refreshes |
| Quota belongs to the **Google account**, not the device | Re-installing does not reset it; account farming is not a legitimate fix |

Sources: Google Antigravity Plans docs (`antigravity.google/docs/plans`), Models docs (`antigravity.google/docs/models`), Google's Antigravity FAQ.

**Your biggest leaks (diagnosed from this repo):**
1. `docs/PROMPT_01_ANTIGRAVITY.md` tells Antigravity to read **seven documentation files in full** and produce a long plan. That single kickoff can burn a large slice of a free week.
2. Whole-repo exploration habits ("inspect this project folder first").
3. Full `npm test` runs after small edits (522 tests = 40 files of work every time).
4. Retry loops on failures.
5. Long conversations that re-send a huge history on every turn.
6. Screenshots and long logs pasted into chat — images and logs are expensive input.

---

## 2. Zero-cost capacity you already have

### A. Antigravity free tier (scarce — use for *thinking* only)
- Weekly quota, Gemini 3.8 Flash; Claude 4.6 / GPT-OSS-120B removed 18 Nov 2026.
- Check usage: **Settings → Models & Usage** (IDE) or `/usage` (CLI).
- Community reset tracker (Google sometimes resets everyone early): `agyresets.com` / @_mohansolo on X.

### B. Antigravity CLI on a free Gemini API key — *official, works today*
The CLI supports running against the Gemini API with your own key, completely separate from the Antigravity weekly quota:

```jsonc
// %USERPROFILE%\.gemini\antigravity-cli\settings.json
{ "modelProvider": "gemini" }
```
```powershell
$env:GEMINI_API_KEY = "your-key"   # or set it permanently: setx GEMINI_API_KEY "..."
agy
```
Get the key free at `aistudio.google.com` (no card). Verified free-tier shapes (Oct–Nov 2026 readings; check your own project at `aistudio.google.com/rate-limit`):

| Model | RPM | Requests/day |
|---|---|---|
| Gemini 3.8 Flash / 3.6 Flash | 5 | **20** |
| Gemini 3.5 / 3.1 Flash-Lite | 15 | **500** |
| Gemma 4 | 30 | **14,400** |

Rules that matter:
- Limits are **per project**, not per key — minting more keys in the same project adds nothing.
- Daily reset is **midnight Pacific**.
- Free-tier prompts **may be used to improve Google's products** — do not paste client secrets or the staff credentials file.
- 20 requests/day on Flash is one agentic task; use **Flash-Lite** for mechanical loops and **Gemma 4** for bulk simple work.
- Setup helper: `scripts/setup-agy-free-gemini-key.ps1` (and `-Remove` to go back to OAuth).

### C. OpenCode (this workspace) — free models at $0
Available today in this workspace's model list:
`opencode-go/beam-free`, `opencode-go/longcat-2.5-free`, `opencode-go/iceman-contributor-free` — all priced $0.
Use them for mechanical work; quality is below frontier models, so keep tasks small and verify with tests.

### D. Local Ollama (this laptop: i5-1235U, 16 GB RAM, Intel UHD, 29 GB free)
Installed with `qwen2.5-coder:1.5b-base`, `llama3.1:8b`, `mistral`, `qwen3.5:4b`.
CPU-only inference: 8B models run ~4–7 tokens/s — fine for commit messages, explanations, tiny edits; **not** for agentic multi-file coding. Never load two big models at once (`ollama ps`, `ollama stop <model>`).

---

## 3. Routing rules (who does what)

| Task type | Tool | Why |
|---|---|---|
| Architecture, security review, hard debugging, one-shot complex refactor | **Antigravity** (signed-in quota) | Frontier reasoning; use sparingly |
| Bulk implementation, renames, copy edits, boilerplate, test scaffolding, docs | **OpenCode** (free models) or local Ollama | Zero cost, no quota |
| Reading long docs / research / summarising | **OpenCode** session or `agy` on free API key | Keeps Antigravity's week intact |
| Trivial offline edits | **Ollama** | No network, no quota |
| Verification, live browser checks, deployments | **OpenCode session** | Already wired to this repo's Playwright/Vercel tooling |

**Task packet rule:** never send Antigravity "go explore". Send a packet:
scope → exact files → constraints → acceptance test → "patch-only diff, 5-line summary".
Template: `docs/PROMPT_02_ANTIGRAVITY_LEAN.md`.

---

## 4. Weekly budget protocol (prevents the lockout recurring)

1. **Check the meter first** (Settings → usage). Write the number down.
2. **Stop at 70 %.** The last 30 % is the emergency reserve for event-week bugs.
3. **Front-load the week**: hard structural work Monday–Tuesday while quota is full; polish later.
4. **One feature per conversation.** Start a new conversation for unrelated work — don't carry a 200-message history.
5. **Targeted tests only**: `npx vitest run tests/unit/<file>.test.ts`. Full suite once per milestone.
6. **Never retry blindly.** One failure → stop, paste the error, get a fix.
7. **No screenshots/images inside Antigravity** unless a visual bug needs it; describe instead.
8. **Keep replies short**: output tokens are work too.
9. **Keep the repo lean** for indexing: `.vscode/settings.json` excludes `node_modules`, `.next`, `.git`, `stitch_*`; `AGENTS.md` bans reading them.

### Festival calendar plan
| Week | Antigravity budget | Focus |
|---|---|---|
| 16–22 Nov (locked) | 0 % | OpenCode/free-key/Ollama only: handover items, monitoring, registration dry-runs |
| 23–29 Nov (reset) | ≤ 70 % | Structural work: any remaining hardening, performance, accessibility pass |
| 30 Nov–6 Dec | ≤ 70 % | Regression fixes from live testing; finalise admin workflows |
| 7–13 Dec | ≤ 40 % | Polish only; no refactors; freeze non-critical changes |
| 14–20 Dec (event) | reserve only | Only gate-critical fixes (scanner, paywall, pass issuance) |

---

## 5. Hard "do nots" (account safety)

- **Do not** use the Antigravity login inside third-party tools (Claude Code, OpenCode, Cline, scripts). Google's FAQ: using third-party software to access Antigravity is a ToS violation and can suspend the account.
- **Do not** extract OAuth tokens/session files or build account pools/switchers.
- **Do not** farm multiple Google accounts to multiply free quota.
- **Do** use the official `GEMINI_API_KEY` path for the CLI, or a separate Gemini API key inside OpenCode/Cline — that is the supported way to get independent quota at ₦0.

---

## 6. When the quota is gone (decision tree)

```
Quota exhausted?
├─ Need deep reasoning now?
│   ├─ Yes → `agy` with free Gemini API key (Flash-Lite/Gemma 4) or wait for reset
│   └─ No  → OpenCode free models / local Ollama (do it now, free)
├─ Is it before 23 Nov? → Work the handover checklist; no code freeze required
└─ Still stuck? → Check agyresets.com (Google may reset everyone early)
```

---

## 7. Maintenance

- Re-check `aistudio.google.com/rate-limit` monthly — Google changes free limits without notice.
- Re-check Antigravity free models after 18 Nov 2026 (Claude/GPT removal changes routing).
- If a new agent joins (Cursor, Cline, Qwen Code…): give it `AGENTS.md` first and the task-packet template.
- Rotate nothing here automatically; the Gemini API key is a user secret — keep it out of this repo and out of screenshots.

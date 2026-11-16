import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * Secret-leak guard.
 *
 * Fails the build if a real credential pattern appears in any tracked file.
 * This is the safety net for the public repository: API keys, service-role
 * tokens, JWTs, private keys and provider tokens must live in environment
 * variables or the hosting dashboard — never in source.
 *
 * Allowed: placeholder values in `.env.example` (e.g. your-key-here), and this
 * file itself (it contains the detection patterns).
 */

const ROOT = process.cwd();
const SELF = "tests/unit/secret-leak-guard.test.ts";

const TEXT_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".mdx",
  ".yml", ".yaml", ".sql", ".ps1", ".sh", ".txt", ".css", ".html", ".example",
]);

const SKIP_PATHS = [
  "node_modules/", ".next/", ".git/", "package-lock.json", "pnpm-lock.yaml",
  "yarn.lock", "stitch_abeokuta_polo_festival_platform/", "public/",
];

const PLACEHOLDER = /(your[-_]?key|placeholder|example|dummy|sample|xxxx|redacted|changeme|test[-_]?key|\.\.\.)/i;

interface Rule {
  name: string;
  pattern: RegExp;
}

const RULES: Rule[] = [
  { name: "Google API key (AIza…)", pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { name: "Google API key (AQ.…)", pattern: /\bAQ\.[A-Za-z0-9_-]{30,}\b/g },
  { name: "OpenRouter key", pattern: /\bsk-or-v1-[a-f0-9]{20,}\b/g },
  { name: "Groq key", pattern: /\bgsk_[A-Za-z0-9]{20,}\b/g },
  { name: "OpenAI-style key", pattern: /\bsk-(proj-)?[A-Za-z0-9]{32,}\b/g },
  { name: "Anthropic key", pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  { name: "JWT bearer", pattern: /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/g },
  { name: "Private key block", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { name: "Supabase service-role token", pattern: /service_role["']?\s*[:=]\s*["'][A-Za-z0-9_.-]{30,}["']/g },
];

function trackedFiles(): string[] {
  const out = execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" });
  return out
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((f) => !SKIP_PATHS.some((s) => f.startsWith(s) || f.includes(s)))
    .filter((f) => TEXT_EXT.has(path.extname(f).toLowerCase()) || path.basename(f).startsWith(".env"));
}

describe("Secret-leak guard (public repository safety)", () => {
  it("no credential patterns appear in tracked files", () => {
    const findings: string[] = [];

    for (const file of trackedFiles()) {
      if (file === SELF || file === ".env.example") continue;
      let content: string;
      try {
        content = fs.readFileSync(path.join(ROOT, file), "utf8");
      } catch {
        continue;
      }
      for (const rule of RULES) {
        for (const match of content.matchAll(rule.pattern)) {
          const line = content.slice(0, match.index ?? 0).split(/\r?\n/).length;
          const excerpt = match[0].slice(0, 12) + "…";
          if (PLACEHOLDER.test(match[0])) continue;
          findings.push(`${file}:${line} ${rule.name} (${excerpt})`);
        }
      }
    }

    expect(findings, `Secret patterns found:\n${findings.join("\n")}`).toEqual([]);
  });

  it(".gitignore excludes env files, private keys and certificates", () => {
    const ignore = fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8");
    for (const needle of [".env*", "*.pem", "*.key"]) {
      expect(ignore).toContain(needle);
    }
  });

  it("no NEXT_PUBLIC_ variable is named like a secret", () => {
    const offenders: string[] = [];
    for (const file of trackedFiles()) {
      let content: string;
      try {
        content = fs.readFileSync(path.join(ROOT, file), "utf8");
      } catch {
        continue;
      }
      for (const match of content.matchAll(/NEXT_PUBLIC_[A-Z0-9_]*(SECRET|SERVICE_ROLE|PRIVATE)[A-Z0-9_]*/g)) {
        offenders.push(`${file}: ${match[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

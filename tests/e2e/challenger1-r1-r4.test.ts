import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

const ROOT = process.cwd();

describe("CHALLENGER 1 EMPIRICAL AUDIT: R1 Email Consistency Cleanup", () => {
  const BANNED_EMAILS = [
    "secretariat@abeokutapolo.com",
    "admin@abeokutapolo.com",
    "secretariat@abeokutapolofestival.com",
    "liaison@abeokutapolofestival.com",
    "privacy@abeokutapolofestival.com",
    "tickets@abeokutapolofestival.com",
    "passes@abeokutapolo.com",
  ];

  it("1.1: Exhaustive scan confirms ZERO banned emails across active code, docs, and configs", () => {
    const scanDirs = ["app", "components", "lib", "docs", "public"];
    const foundOccurrences: { file: string; email: string; line: number }[] = [];

    function scan(dir: string) {
      const entries = fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scan(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if ([".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".md", ".txt"].includes(ext)) {
            const content = fs.readFileSync(path.join(ROOT, fullPath), "utf8");
            const lines = content.split("\n");
            lines.forEach((lineText, idx) => {
              for (const banned of BANNED_EMAILS) {
                if (lineText.toLowerCase().includes(banned.toLowerCase())) {
                  foundOccurrences.push({ file: fullPath, email: banned, line: idx + 1 });
                }
              }
            });
          }
        }
      }
    }

    for (const dir of scanDirs) {
      if (fs.existsSync(path.join(ROOT, dir))) {
        scan(dir);
      }
    }

    expect(
      foundOccurrences,
      `Found legacy banned emails in active code/docs: ${JSON.stringify(foundOccurrences, null, 2)}`
    ).toEqual([]);
  });

  it("1.2: Confirms public inquiry endpoints strictly resolve to 'abeokutapolo@gmail.com'", () => {
    const publicFooter = fs.readFileSync(path.join(ROOT, "components/design/public/public-footer.tsx"), "utf8");
    const pressHub = fs.readFileSync(path.join(ROOT, "components/design/public/press-hub.tsx"), "utf8");

    expect(publicFooter).toContain("abeokutapolo@gmail.com");
    expect(pressHub).toContain("abeokutapolo@gmail.com");
  });

  it("1.3: Confirms transactional system emails strictly resolve to 'tickets@guests.abeokutapolofestival2026.org.ng'", () => {
    const envExample = fs.readFileSync(path.join(ROOT, ".env.example"), "utf8");
    expect(envExample).toContain("tickets@guests.abeokutapolofestival2026.org.ng");
  });
});

describe("CHALLENGER 1 EMPIRICAL AUDIT: Open Media Desk & Press Pack Removal", () => {
  it("4.1: Middleware explicitly excludes /press from authentication barriers", async () => {
    const req = new NextRequest("http://localhost:3000/press");
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("4.2: Press kit simulated downloads and unverified metrics are completely removed", () => {
    const pressHubCode = fs.readFileSync(path.join(ROOT, "components/design/public/press-hub.tsx"), "utf8");
    expect(pressHubCode).not.toContain("2,400+");
    expect(pressHubCode).not.toContain("1 Gbps");
    expect(pressHubCode).not.toContain("Download Press Pack");
    expect(pressHubCode).not.toContain("/api/press/pack");
  });

  it("4.3: Unverified press pack API route and PDF file are permanently deleted", () => {
    expect(fs.existsSync(path.join(ROOT, "app/api/press/pack/route.ts"))).toBe(false);
    expect(fs.existsSync(path.join(ROOT, "public/docs/Abeokuta_Polo_Festival_2026_Press_Kit.pdf"))).toBe(false);
  });

  it("4.4: Press hub media accreditation contact displays canonical 'abeokutapolo@gmail.com'", () => {
    const pressHubCode = fs.readFileSync(path.join(ROOT, "components/design/public/press-hub.tsx"), "utf8");
    expect(pressHubCode).toContain("abeokutapolo@gmail.com");
    expect(pressHubCode).toContain("+234 818 188 8884");
  });
});

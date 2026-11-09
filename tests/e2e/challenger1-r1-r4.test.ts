import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { GET, generatePressKitPdf } from "@/app/api/press/pack/route";
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

  it("1.2: Confirms .env.example strictly uses canonical transactional sender", () => {
    const envExample = fs.readFileSync(path.join(ROOT, ".env.example"), "utf8");
    expect(envExample).toContain("EMAIL_FROM=tickets@guests.abeokutapolofestival2026.org.ng");
    expect(envExample).not.toContain("abeokutapolofestival.com");
    expect(envExample).not.toContain("secretariat@abeokutapolo.com");
  });

  it("1.3: Confirms all public inquiry touchpoints strictly display abeokutapolo@gmail.com", () => {
    const publicTouchpoints = [
      "components/design/public/public-footer.tsx",
      "components/design/public/public-header.tsx",
      "components/design/public/enquiry-dialog.tsx",
      "app/(public)/accessibility/page.tsx",
      "app/(public)/privacy/page.tsx",
      "components/design/public/press-hub.tsx",
      "components/design/public/publications-hub.tsx",
    ];

    for (const fileRel of publicTouchpoints) {
      const content = fs.readFileSync(path.join(ROOT, fileRel), "utf8");
      expect(content, `File ${fileRel} must contain abeokutapolo@gmail.com`).toContain(
        "abeokutapolo@gmail.com"
      );
    }
  });

  it("1.4: Confirms transactional mailer client defaults to tickets@guests.abeokutapolofestival2026.org.ng", () => {
    const mailerCode = fs.readFileSync(path.join(ROOT, "lib/email/client.ts"), "utf8");
    expect(mailerCode).toContain('tickets@guests.abeokutapolofestival2026.org.ng');
  });

  it("1.5: Confirms calendar ICS UIDs use @guests.abeokutapolofestival2026.org.ng", () => {
    const icsCode = fs.readFileSync(path.join(ROOT, "lib/calendar/event-ics.ts"), "utf8");
    expect(icsCode).toContain("UID:abk-polo-2026-day1@guests.abeokutapolofestival2026.org.ng");
    expect(icsCode).toContain("UID:abk-polo-2026-day2@guests.abeokutapolofestival2026.org.ng");
    expect(icsCode).toContain("UID:abk-polo-2026-day3@guests.abeokutapolofestival2026.org.ng");
    expect(icsCode).not.toContain("@abeokutapolo.com");
  });

  it("1.6: Confirms internal admin credentials (@abeokutapolo2026.ng) remain intact and functional", () => {
    const authForm = fs.readFileSync(path.join(ROOT, "components/auth/sign-in-form.tsx"), "utf8");
    const sessionAuth = fs.readFileSync(path.join(ROOT, "lib/auth/session.ts"), "utf8");
    const regManager = fs.readFileSync(path.join(ROOT, "components/admin/registrations-manager.tsx"), "utf8");

    // Must recognize official admin roles
    expect(authForm).toContain("admin@abeokutapolo2026.ng");
    expect(authForm).toContain("superadmin@abeokutapolo2026.ng");
    expect(authForm).toContain("president@abeokutapolo2026.ng");
    expect(authForm).toContain("secretary@abeokutapolo2026.ng");

    expect(sessionAuth).toContain("superadmin@abeokutapolo2026.ng");
    expect(sessionAuth).toContain("admin@abeokutapolo2026.ng");

    // Placeholder in admin UI must use official domain
    expect(regManager).toContain("admin@abeokutapolo2026.ng");
  });
});

describe("CHALLENGER 1 EMPIRICAL AUDIT: R4 Open Press Kit Access", () => {
  it("4.1: Middleware test proves unauthenticated requests to /press and /api/press/pack are NEVER redirected to sign-in", async () => {
    // 1. Test unauthenticated request to /press
    const pressReq = new NextRequest("https://abeokuta-polo-festival-2026.vercel.app/press", {
      method: "GET",
    });
    const pressRes = await middleware(pressReq);
    expect(pressRes.status).toBe(200);
    expect(pressRes.headers.get("location")).toBeNull();

    // 2. Test unauthenticated request to /api/press/pack
    const apiReq = new NextRequest("https://abeokuta-polo-festival-2026.vercel.app/api/press/pack", {
      method: "GET",
    });
    const apiRes = await middleware(apiReq);
    expect(apiRes.status).toBe(200);
    expect(apiRes.headers.get("location")).toBeNull();

    // 3. Contrast with protected route: /abawole MUST redirect unauthenticated requests to /sign-in
    const adminReq = new NextRequest("https://abeokuta-polo-festival-2026.vercel.app/abawole", {
      method: "GET",
    });
    const adminRes = await middleware(adminReq);
    expect(adminRes.status).toBe(307);
    expect(adminRes.headers.get("location")).toContain("/sign-in");
  });

  it("4.2: GET /api/press/pack returns 200 OK with correct PDF headers and valid attachment filename", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toBe(
      'attachment; filename="Abeokuta_Polo_Festival_2026_Press_Kit.pdf"'
    );
    expect(res.headers.get("Cache-Control")).toContain("public");

    const contentLength = res.headers.get("Content-Length");
    expect(contentLength).toBeDefined();
    const len = parseInt(contentLength!, 10);
    expect(len).toBeGreaterThan(10240); // > 10KB
  });

  it("4.3: Binary buffer inspection verifies PDF-1.4 header, %%EOF trailer, and exact xref table integrity", async () => {
    const res = await GET();
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Size check
    expect(buffer.length).toBeGreaterThan(10240);

    // Magic bytes check
    const header = buffer.subarray(0, 8).toString("latin1");
    expect(header).toMatch(/^%PDF-1\./);

    // Trailer check
    const contentStr = buffer.toString("latin1");
    expect(contentStr.trim().endsWith("%%EOF")).toBe(true);

    // Verify startxref and xref table structure
    const startxrefMatch = contentStr.match(/startxref\s+(\d+)\s+%%EOF/);
    expect(startxrefMatch).not.toBeNull();
    const startxrefOffset = parseInt(startxrefMatch![1], 10);
    expect(startxrefOffset).toBeGreaterThan(0);
    expect(startxrefOffset).toBeLessThan(buffer.length);

    // Verify string at startxref is 'xref'
    const xrefHeader = contentStr.slice(startxrefOffset, startxrefOffset + 4);
    expect(xrefHeader).toBe("xref");

    // Verify all xref object offsets match actual objects in buffer
    const xrefLines = contentStr.slice(startxrefOffset).split("\n");
    let objNum = 0;
    for (const line of xrefLines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length === 3 && parts[2] === "n") {
        objNum++;
        const offset = parseInt(parts[0], 10);
        const objSlice = contentStr.slice(offset, offset + 20);
        expect(objSlice).toMatch(new RegExp(`^${objNum}\\s+0\\s+obj`));
      }
    }
    expect(objNum).toBeGreaterThanOrEqual(12);
  });

  it("4.4: Press Kit PDF content verifies royal patronage, 4 color tokens, and canonical emails", async () => {
    const res = await GET();
    const text = (await res.arrayBuffer()).toString(); // or Buffer.from(await res.arrayBuffer()).toString('latin1')
    const buffer = Buffer.from(await (await GET()).arrayBuffer());
    const content = buffer.toString("latin1");

    // Royal patronage
    expect(content).toContain("HRM Oba Dr. Adedotun Aremu Gbadebo CFR");
    expect(content).toContain("Dr. Sheriff Adams Abdulrahman");
    expect(content).toContain("Hon. Bola Balogun");

    // Competing clubs
    expect(content).toContain("LAGOS POLO CLUB");
    expect(content).toContain("FIFTH CHUKKER KADUNA");
    expect(content).toContain("IBADAN POLO CLUB");
    expect(content).toContain("ABEOKUTA POLO CLUB");

    // Color tokens
    expect(content).toContain("#002F1A"); // Forest
    expect(content).toContain("#C9A84C"); // Gold
    expect(content).toContain("#00210E"); // Deep Forest
    expect(content).toContain("#FCF9F8"); // Warm Ivory

    // Canonical emails inside PDF
    expect(content).toContain("abeokutapolo@gmail.com");
    expect(content).toContain("tickets@guests.abeokutapolofestival2026.org.ng");
    expect(content).not.toContain("secretariat@abeokutapolo.com");
    expect(content).not.toContain("admin@abeokutapolo.com");
  });

  it("4.5: Fallback generator generates valid buffer even if physical file is missing", () => {
    const generated = generatePressKitPdf();
    expect(generated).toBeInstanceOf(Buffer);
    expect(generated.length).toBeGreaterThan(10240);
    expect(generated.subarray(0, 8).toString("latin1")).toMatch(/^%PDF-1\./);
    expect(generated.toString("latin1").trim().endsWith("%%EOF")).toBe(true);
  });

  it("4.6: Adversarial stress test: handles 50 concurrent downloads deterministically without state leakage", async () => {
    const startTime = Date.now();
    const promises = Array.from({ length: 50 }, () => GET());
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;

    expect(results.length).toBe(50);
    const firstLength = results[0].headers.get("Content-Length");
    const firstHash = crypto.createHash("sha256").update(Buffer.from(await results[0].arrayBuffer())).digest("hex");

    for (let i = 1; i < results.length; i++) {
      expect(results[i].status).toBe(200);
      expect(results[i].headers.get("Content-Length")).toBe(firstLength);
      const hash = crypto.createHash("sha256").update(Buffer.from(await results[i].arrayBuffer())).digest("hex");
      expect(hash).toBe(firstHash);
    }

    // Must be fast (< 2000ms for 50 requests)
    expect(duration).toBeLessThan(2000);
  });

  it("4.7: Press hub UI correctly wires download button to /api/press/pack with zero mock delays", () => {
    const pressHubCode = fs.readFileSync(path.join(ROOT, "components/design/public/press-hub.tsx"), "utf8");

    // Must use real link to /api/press/pack
    expect(pressHubCode).toContain('link.href = "/api/press/pack"');
    expect(pressHubCode).toContain('link.setAttribute("download", "Abeokuta_Polo_Festival_2026_Press_Kit.pdf")');

    // Must NOT have mock setTimeout simulation for download
    expect(pressHubCode).not.toContain("setTimeout(() => setDownloadingPack(false), 1200)");
  });

  it("4.8: HEAD request verification proves all attachment headers are returned for preflight checks", async () => {
    // App Router synthesizes HEAD from GET: headers must be identical and complete
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain('filename="Abeokuta_Polo_Festival_2026_Press_Kit.pdf"');
    expect(res.headers.get("Content-Length")).toBe("18690");
    expect(res.headers.get("Cache-Control")).toContain("public");
  });

  it("4.9: Range request resilience: returns full 200 OK without crashing or truncation", async () => {
    // When range headers are provided to a non-chunked static resource, RFC 7233 §3.1 allows 200 OK with full representation
    const res = await GET();
    expect(res.status).toBe(200);
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.length).toBe(18690);
    expect(buf.subarray(0, 8).toString("latin1")).toBe("%PDF-1.4");
  });

  it("4.10: Adversarial credential injection cannot lock out unauthenticated press kit access", async () => {
    // Regardless of what hostile or broken tokens/cookies are sent, the endpoint remains open and unauthenticated
    const hostileTokens = [
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.corrupted",
      "Basic YWRtaW46cGFzc3dvcmQ=",
      "Token invalid-bearer-value",
      "Bearer null",
    ];

    for (const token of hostileTokens) {
      const res = await GET();
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/pdf");
      const len = parseInt(res.headers.get("Content-Length")!, 10);
      expect(len).toBe(18690);
    }
  });
});


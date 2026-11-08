import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import fs from "node:fs";
import path from "node:path";

describe("Venue Registration Poster & Strategic QR Signage", () => {
  const VENUE_POSTER_URL = "https://abeokuta-polo-festival-2026.vercel.app/register?ref=venue_poster";

  it("generates a high-contrast valid vector SVG QR code for the venue URL", async () => {
    const svg = await QRCode.toString(VENUE_POSTER_URL, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "H",
      color: {
        dark: "#002F1A",
        light: "#FFFFFF",
      },
    });

    expect(svg).toBeDefined();
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg.length).toBeGreaterThan(1000);
  });

  it("generates a high-resolution PNG data URL suitable for A4 print and standalone download", async () => {
    const dataUrl = await QRCode.toDataURL(VENUE_POSTER_URL, {
      margin: 1,
      width: 1200,
      errorCorrectionLevel: "H",
      color: {
        dark: "#002F1A",
        light: "#FFFFFF",
      },
    });

    expect(dataUrl).toBeDefined();
    expect(dataUrl.startsWith("data:image/png;base64,")).toBe(true);
    expect(dataUrl.length).toBeGreaterThan(1000);
  });

  it("ensures the dedicated poster page exists at app/(public)/register/poster/page.tsx", () => {
    const posterPagePath = path.join(
      process.cwd(),
      "app",
      "(public)",
      "register",
      "poster",
      "page.tsx"
    );
    expect(fs.existsSync(posterPagePath)).toBe(true);

    const content = fs.readFileSync(posterPagePath, "utf-8");
    // Verify required protocols & instructions are present on the poster
    expect(content).toContain("100% FREE Public Admission");
    expect(content).toContain("50,000 VVIP");
    expect(content).toContain("ref=venue_poster");
    expect(content).toContain("Print A4 Poster");
    expect(content).toContain("Save Poster Image");
  });

  it("verifies public header and footer link to the venue poster page", () => {
    const headerPath = path.join(process.cwd(), "components", "design", "public", "public-header.tsx");
    const footerPath = path.join(process.cwd(), "components", "design", "public", "public-footer.tsx");

    const headerContent = fs.readFileSync(headerPath, "utf-8");
    const footerContent = fs.readFileSync(footerPath, "utf-8");

    expect(headerContent).toContain("/register/poster");
    expect(footerContent).toContain("/register/poster");
  });

  it("verifies admin console and visit page link to the venue poster page", () => {
    const adminLayoutPath = fs.existsSync(path.join(process.cwd(), "app", "(admin)", "abawole", "layout.tsx"))
      ? path.join(process.cwd(), "app", "(admin)", "abawole", "layout.tsx")
      : path.join(process.cwd(), "app", "(admin)", "admin", "layout.tsx");
    const adminPagePath = fs.existsSync(path.join(process.cwd(), "app", "(admin)", "abawole", "page.tsx"))
      ? path.join(process.cwd(), "app", "(admin)", "abawole", "page.tsx")
      : path.join(process.cwd(), "app", "(admin)", "admin", "page.tsx");
    const visitPagePath = path.join(process.cwd(), "app", "(public)", "visit", "page.tsx");

    const adminLayoutContent = fs.readFileSync(adminLayoutPath, "utf-8");
    const adminPageContent = fs.readFileSync(adminPagePath, "utf-8");
    const visitPageContent = fs.readFileSync(visitPagePath, "utf-8");

    expect(adminLayoutContent).toContain("/register/poster");
    expect(adminPageContent).toContain("/register/poster");
    expect(visitPageContent).toContain("/register/poster");
  });

  it("verifies registration page recognizes ref=venue_poster query parameter", () => {
    const registerPagePath = path.join(process.cwd(), "app", "(public)", "register", "page.tsx");
    const registerContent = fs.readFileSync(registerPagePath, "utf-8");

    expect(registerContent).toContain("venue_poster");
    expect(registerContent).toContain("/register/poster");
  });
});

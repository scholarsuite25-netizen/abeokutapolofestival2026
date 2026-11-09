import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { GALLERY_DATA, GalleryItem } from "@/components/design/public/gallery-showcase";

describe("Milestone 2: Authentic Media Gallery Assets & Layout Updates (R2)", () => {
  const REQUIRED_CATEGORIES = new Set([
    "Royal Fathers",
    "President & Leadership",
    "Government Participation",
    "Official Opening & Chukkas",
    "Culture & Entertainment",
  ]);

  describe("1. Zero Unsplash Stock Imagery & Physical Asset Verification", () => {
    it("ensures GALLERY_DATA contains exactly zero Unsplash stock URLs", () => {
      expect(GALLERY_DATA.length).toBeGreaterThan(0);
      const unsplashItems = GALLERY_DATA.filter((item) =>
        item.imageUrl.toLowerCase().includes("unsplash")
      );
      expect(unsplashItems).toHaveLength(0);
    });

    it("verifies every gallery card points to a local authentic asset in /images/gallery/", () => {
      GALLERY_DATA.forEach((item) => {
        expect(item.imageUrl).toMatch(/^\/images\/gallery\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/);
      });
    });

    it("verifies all referenced gallery image files physically exist on disk and are non-empty", () => {
      GALLERY_DATA.forEach((item) => {
        const relativePath = item.imageUrl.replace(/^\//, "");
        const diskPath = path.join(process.cwd(), "public", relativePath.replace(/^public\//, ""));
        
        expect(fs.existsSync(diskPath), `Expected ${diskPath} to exist on disk`).toBe(true);
        const stat = fs.statSync(diskPath);
        expect(stat.size, `Expected ${diskPath} to be a valid non-empty image (> 10KB)`).toBeGreaterThan(10000);
      });
    });
  });

  describe("2. 100% Uniqueness & Zero Duplication Guarantee", () => {
    it("guarantees 100% unique image URLs across all gallery cards with zero duplicates", () => {
      const allUrls = GALLERY_DATA.map((item) => item.imageUrl);
      const uniqueUrls = new Set(allUrls);
      expect(uniqueUrls.size).toBe(allUrls.length);
    });

    it("guarantees 100% unique card IDs across all gallery cards", () => {
      const allIds = GALLERY_DATA.map((item) => item.id);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it("guarantees 100% unique titles across all gallery cards", () => {
      const allTitles = GALLERY_DATA.map((item) => item.title);
      const uniqueTitles = new Set(allTitles);
      expect(uniqueTitles.size).toBe(allTitles.length);
    });
  });

  describe("3. Explicit Representation of Required Historical & Club Events", () => {
    it("explicitly represents the Alake Groundbreaking event", () => {
      const item = GALLERY_DATA.find((i) => i.id === "royal-groundbreaking-2025");
      expect(item).toBeDefined();
      expect(item?.title).toBe("HRM The Alake of Egbaland Chairs Landmark Groundbreaking");
      expect(item?.category).toBe("Royal Fathers");
      expect(item?.imageUrl).toBe("/images/gallery/alake-groundbreaking.jpg");
      expect(item?.dignitaries).toContain("HRM Oba Dr. Adedotun Aremu Gbadebo CFR");
      expect(item?.location).toContain("Kobape");
    });

    it("explicitly represents the Chieftaincy Conferment event", () => {
      const item = GALLERY_DATA.find((i) => i.id === "president-aare-eleshin-conferment");
      expect(item).toBeDefined();
      expect(item?.title).toBe("Conferment of Aare Eleshin Chieftaincy on Club President");
      expect(item?.category).toBe("President & Leadership");
      expect(item?.imageUrl).toBe("/images/gallery/chieftaincy-conferment.jpg");
      expect(item?.dignitaries).toContain("Dr. Chief Sheriff Abdulrahman Adams");
      expect(item?.dignitaries).toContain("HRM Oba Dr. Adedapo Tejuoso");
    });

    it("explicitly represents the Kobape Turf matches inaugural chukka", () => {
      const item = GALLERY_DATA.find((i) => i.id === "maiden-festival-chukka-2025");
      expect(item).toBeDefined();
      expect(item?.title).toBe("Maiden Abeokuta Polo Festival: Inaugural Chukka on Kobape Turf");
      expect(item?.category).toBe("Official Opening & Chukkas");
      expect(item?.imageUrl).toBe("/images/gallery/kobape-inaugural-chukka.jpg");
      expect(item?.description).toContain("historic inaugural chukka");
    });

    it("explicitly represents the Patrons Gala & Twilight Celebration with Aristos Band", () => {
      const item = GALLERY_DATA.find((i) => i.id === "aristos-berryola-musical-gala");
      expect(item).toBeDefined();
      expect(item?.title).toBe("Patrons Gala & Twilight Celebration: Aristos Band Live");
      expect(item?.category).toBe("Culture & Entertainment");
      expect(item?.imageUrl).toBe("/images/gallery/patrons-gala-twilight.jpg");
      expect(item?.dignitaries).toContain("Aristos Band");
    });
  });

  describe("4. Card Aspect Ratio, Containment & Lightbox Layout Verification", () => {
    const componentSource = fs.readFileSync(
      path.join(process.cwd(), "components", "design", "public", "gallery-showcase.tsx"),
      "utf-8"
    );

    it("enforces aspect-[16/10] and overflow-hidden on gallery card containers", () => {
      expect(componentSource).toContain("aspect-[16/10]");
      expect(componentSource).toContain("overflow-hidden");
    });

    it("enforces object-cover containment on card images", () => {
      expect(componentSource).toContain("object-cover");
    });

    it("softens card gradient overlay to ensure photograph details remain clearly visible", () => {
      expect(componentSource).toContain("from-forest-deep/40 via-transparent to-transparent pointer-events-none");
      // Must not contain the old heavy 90% opacity gradient
      expect(componentSource).not.toContain("from-forest-deep/90 via-forest-deep/20");
    });

    it("removes opacity-80 dark gradient overlay from the modal lightbox preview", () => {
      expect(componentSource).toContain("aspect-[16/9]");
      // The modal image wrapper must not contain the dark opacity-80 gradient
      expect(componentSource).not.toContain("from-forest-deep via-transparent to-transparent opacity-80");
    });
  });

  describe("5. Structural Integrity & Category Conformity", () => {
    it("ensures every gallery item adheres to valid schema and approved categories", () => {
      GALLERY_DATA.forEach((item: GalleryItem) => {
        expect(REQUIRED_CATEGORIES.has(item.category)).toBe(true);
        expect(item.id.length).toBeGreaterThan(0);
        expect(item.title.length).toBeGreaterThan(0);
        expect(item.date.length).toBeGreaterThan(0);
        expect(["2025", "2026"]).toContain(item.year);
        expect(item.location.length).toBeGreaterThan(0);
        expect(item.dignitaries.length).toBeGreaterThan(0);
        expect(item.description.length).toBeGreaterThan(0);
        expect(item.fallbackColor.length).toBeGreaterThan(0);
      });
    });
  });
});

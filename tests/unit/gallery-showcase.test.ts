import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { GALLERY_DATA } from "@/components/design/public/gallery-showcase";

describe("Media Gallery Unoriginal Image Removal Verification", () => {
  it("verifies GALLERY_DATA contains zero unverified external or AI mock image URLs", () => {
    const unverifiedItems = GALLERY_DATA.filter((item) =>
      item.imageUrl.toLowerCase().includes("unsplash") ||
      item.imageUrl.toLowerCase().includes("googleusercontent")
    );
    expect(unverifiedItems).toHaveLength(0);
  });

  it("verifies public/images/gallery contains zero unoriginal mock files", () => {
    const galleryDir = path.join(process.cwd(), "public", "images", "gallery");
    if (fs.existsSync(galleryDir)) {
      const files = fs.readdirSync(galleryDir).filter((f) => f.endsWith(".jpg") || f.endsWith(".png"));
      expect(files).toHaveLength(0);
    }
  });

  it("verifies app/(public)/gallery/page.tsx displays the curatorial notice without stock videos or AI imagery", () => {
    const pageContent = fs.readFileSync(
      path.join(process.cwd(), "app/(public)/gallery/page.tsx"),
      "utf8"
    );
    expect(pageContent).toContain("Official Photographic Archives in Curation");
    expect(pageContent).not.toContain("abeokuta-polo-trailer.mp4");
  });
});

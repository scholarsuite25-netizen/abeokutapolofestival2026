import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Public Header Navigation & Layout Integrity", () => {
  const headerPath = path.join(
    process.cwd(),
    "components/design/public/public-header.tsx"
  );
  const headerSource = fs.readFileSync(headerPath, "utf-8");

  it("1. Event brand link uses shrink-0 without shrink min-w-0 to prevent layout squishing", () => {
    // Brand link should be shrink-0 so it never collapses to 0px on mid-size screens
    expect(headerSource).toMatch(/<Link[\s\S]*?href="\/"[\s\S]*?shrink-0/);
    expect(headerSource).not.toMatch(/<Link[\s\S]*?href="\/"[\s\S]*?shrink min-w-0/);
  });

  it("2. Brand typography container prevents wrapping and title overlap", () => {
    expect(headerSource).toContain("whitespace-nowrap shrink-0");
    expect(headerSource).toContain("Abeokuta Polo Festival");
    // Ensure title text itself enforces whitespace-nowrap and doesn't truncate away
    expect(headerSource).toMatch(
      /<span[^>]*font-display[^>]*whitespace-nowrap[^>]*>[\s\S]*?Abeokuta Polo Festival/
    );
  });

  it("3. Desktop navbar switches cleanly at the 1750px breakpoint (hidden min-[1750px]:flex) and mobile trigger uses min-[1750px]:hidden", () => {
    expect(headerSource).toContain("hidden min-[1750px]:flex items-center");
    expect(headerSource).not.toContain("hidden lg:flex items-center");
    expect(headerSource).toContain("min-[1750px]:hidden shrink-0");
  });

  it("4. Mobile drawer quick actions grid has 3 columns and NO duplicate Partnerships link", () => {
    // Check quick actions section
    const quickActionsRegex =
      /{\/\* Mobile Quick Action Buttons: VIP Tables, Affiliates, Membership \*\/}\s*<div className="mt-4 grid grid-cols-3 gap-2">([\s\S]*?)<\/div>/;
    const match = headerSource.match(quickActionsRegex);
    expect(match).not.toBeNull();
    const quickActionsBlock = match![1];

    // Must contain VIP Tables, Affiliates, and Membership
    expect(quickActionsBlock).toContain('href="/tables"');
    expect(quickActionsBlock).toContain("VIP Tables");
    expect(quickActionsBlock).toContain('href="/affiliates"');
    expect(quickActionsBlock).toContain("Affiliates (10%)");
    expect(quickActionsBlock).toContain("Membership");

    // Must NOT contain duplicate Partnerships link in this quick actions grid
    expect(quickActionsBlock).not.toContain('href="/sponsorship"');
    expect(quickActionsBlock).not.toContain("<span>Partnerships</span>");
  });

  it("5. Mobile drawer items marked isPriority display Priority badge, NOT Day 1 Free", () => {
    // Verify badge logic in mobile submenu
    expect(headerSource).toContain(
      '{item.href === "/register" ? "Day 1 Free" : "Priority"}'
    );
  });

  it("6. Desktop category dropdown button handles hover/click coordination and closes on Escape/outside click", () => {
    expect(headerSource).toContain("handleCategoryClick(category.title)");
    expect(headerSource).toContain('e.key === "Escape"');
    expect(headerSource).toContain("handleClickOutside");
  });

  it("7. Clear submenu indicators are displayed on both desktop dropdown and mobile drawer", () => {
    // Desktop dropdown has explicit submenu header
    expect(headerSource).toContain("{category.title} Submenus");
    // Mobile drawer has explicit menu categories & submenus section
    expect(headerSource).toContain("Menu Categories &amp; Submenus");
    expect(headerSource).toContain("{category.items.length} submenus");
  });

  it("8. Header CTA actions prevent mobile overflow and clipping when storedPass is present", () => {
    // Ensure Register CTA hides on mobile when storedPass is present to protect hamburger menu
    expect(headerSource).toContain('storedPass ? "hidden sm:inline-flex" : "inline-flex"');
  });

  it("9. Day 1 & 2 registration is the first menu and Day 3 registration the second, both inside the navbar container", () => {
    // Wide enough container so logo + both registration menus + dropdown nav never clip
    expect(headerSource).toContain("max-w-[1700px]");
    expect(headerSource).not.toContain("max-w-7xl");

    const leftGroupIdx = headerSource.indexOf(
      'flex min-w-0 items-center gap-1.5 sm:gap-2.5'
    );
    const registerIdx = headerSource.indexOf('href="/register"');
    const tablesIdx = headerSource.indexOf('href="/tables"');
    const navIdx = headerSource.indexOf("<nav");

    // Both registration menus live in the left group that opens the navbar
    expect(leftGroupIdx).toBeGreaterThan(-1);
    expect(registerIdx).toBeGreaterThan(leftGroupIdx);
    // FIRST menu = Day 1 & 2, SECOND menu = Day 3, dropdown categories follow
    expect(tablesIdx).toBeGreaterThan(registerIdx);
    expect(navIdx).toBeGreaterThan(tablesIdx);
  });
});

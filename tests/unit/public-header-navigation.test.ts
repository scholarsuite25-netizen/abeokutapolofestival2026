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

  it("3. Desktop navbar switches cleanly at xl breakpoint (hidden xl:flex) and mobile trigger uses xl:hidden", () => {
    expect(headerSource).toContain("hidden xl:flex items-center");
    expect(headerSource).not.toContain("hidden lg:flex items-center");
    expect(headerSource).toContain("xl:hidden shrink-0");
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
});

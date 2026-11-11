import { chromium } from "playwright";

const VIEWPORTS = [
  { name: "375px (Mobile)", width: 375, height: 667, isMobile: true },
  { name: "768px (Tablet)", width: 768, height: 1024, isMobile: true },
  { name: "1024px (Small Laptop / iPad Pro)", width: 1024, height: 768, isMobile: true },
  { name: "1280px (Desktop HD)", width: 1280, height: 800, isMobile: false },
  { name: "1440px (Desktop Full HD)", width: 1440, height: 900, isMobile: false },
];

const TARGET_URL = "https://www.abeokutapolofestival2026.org.ng";

async function run() {
  console.log(`Starting headless browser verification on ${TARGET_URL}...`);
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  let allPassed = true;

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n──────────────────────────────────────────────────`);
      console.log(`Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(1500);

      // 1. Check for horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      const hasHorizontalScroll = scrollWidth > clientWidth + 1; // 1px tolerance
      console.log(`- Page scrollWidth: ${scrollWidth}px, clientWidth: ${clientWidth}px -> No horizontal overflow: ${!hasHorizontalScroll}`);
      if (hasHorizontalScroll) {
        console.error(`  FAIL: Page overflows horizontally! scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
        allPassed = false;
      }

      // 2. Check brand title bounding box
      const brandLink = page.locator('header a[href="/"]').first();
      await brandLink.waitFor({ state: "visible" });
      const brandBox = await brandLink.boundingBox();
      console.log(`- Brand header box: width=${brandBox?.width.toFixed(1)}px, height=${brandBox?.height.toFixed(1)}px`);
      if (!brandBox || brandBox.width < 100) {
        console.error(`  FAIL: Brand header box collapsed to ${brandBox?.width}px!`);
        allPassed = false;
      }

      // Check brand title text
      const brandText = await brandLink.innerText();
      console.log(`- Brand text content:\n  ${brandText.replace(/\n/g, " | ")}`);
      if (!brandText.includes("Abeokuta Polo Festival") || !brandText.includes("2026")) {
        console.error(`  FAIL: Brand text missing expected title!`);
        allPassed = false;
      }

      if (vp.isMobile) {
        // Desktop nav should be hidden, hamburger trigger visible
        const desktopNavVisible = await page.locator('header nav[aria-label="Main Navigation"]').isVisible();
        const hamburgerVisible = await page.locator('header button[aria-label="Open Navigation Menu"]').isVisible();
        console.log(`- Desktop nav visible: ${desktopNavVisible} (expected: false)`);
        console.log(`- Mobile menu button visible: ${hamburgerVisible} (expected: true)`);
        if (desktopNavVisible || !hamburgerVisible) {
          console.error(`  FAIL: Breakpoint mismatch on ${vp.name}`);
          allPassed = false;
        }

        // Click hamburger and inspect drawer
        await page.locator('header button[aria-label="Open Navigation Menu"]').click();
        await page.waitForTimeout(600);

        // Check drawer title
        const drawerTitle = await page.locator('[role="dialog"]').innerText();
        console.log(`- Mobile Drawer opened successfully.`);

        // Check that duplicate "Partnerships" quick action tile is GONE
        const quickActions = page.locator('[role="dialog"] .grid-cols-3 a');
        const count = await quickActions.count();
        console.log(`- Mobile quick action tiles count: ${count} (expected: 3)`);
        if (count !== 3) {
          console.error(`  FAIL: Expected 3 quick action tiles, got ${count}`);
          allPassed = false;
        }

        const tileTexts = [];
        for (let i = 0; i < count; i++) {
          tileTexts.push((await quickActions.nth(i).innerText()).trim());
        }
        console.log(`- Quick action tiles: [${tileTexts.join(", ")}]`);
        if (tileTexts.includes("Partnerships")) {
          console.error(`  FAIL: Duplicate Partnerships quick action tile is still present!`);
          allPassed = false;
        }
        if (!tileTexts.some(t => t.includes("VIP Tables")) || !tileTexts.some(t => t.includes("Affiliates")) || !tileTexts.some(t => t.includes("Membership"))) {
          console.error(`  FAIL: Expected VIP Tables, Affiliates, and Membership in quick actions!`);
          allPassed = false;
        }

        // Check submenu items in drawer: VIP Tables & Corporate Sponsorship must NOT have "Day 1 Free"
        const dialogText = await page.locator('[role="dialog"]').innerHTML();
        // Check if "VIP Tables" row has "Day 1 Free"
        const vipTableHasDay1Free = dialogText.includes("VIP Tables") && dialogText.includes("VIP Tables</span>") && dialogText.match(/VIP Tables[\s\S]*?Day 1 Free/);
        // Better: parse the badge next to VIP Tables in the dialog
        const vipRowBadge = page.locator('[role="dialog"] a[href="/tables"]').last();
        const vipRowBadgeText = await vipRowBadge.innerText();
        console.log(`- VIP Tables submenu item text: "${vipRowBadgeText.replace(/\n/g, " ")}"`);
        if (vipRowBadgeText.includes("Day 1 Free")) {
          console.error(`  FAIL: VIP Tables displays "Day 1 Free" badge!`);
          allPassed = false;
        }

        const sponsorRow = page.locator('[role="dialog"] a[href="/sponsorship"]').last();
        const sponsorRowText = await sponsorRow.innerText();
        console.log(`- Corporate Sponsorship submenu item text: "${sponsorRowText.replace(/\n/g, " ")}"`);
        if (sponsorRowText.includes("Day 1 Free")) {
          console.error(`  FAIL: Corporate Sponsorship displays "Day 1 Free" badge!`);
          allPassed = false;
        }

        // Close drawer with Escape or close button
        await page.keyboard.press("Escape");
        await page.waitForTimeout(400);

      } else {
        // Desktop viewport (1280px / 1440px)
        const desktopNavVisible = await page.locator('header nav[aria-label="Main Navigation"]').isVisible();
        const hamburgerVisible = await page.locator('header button[aria-label="Open Navigation Menu"]').isVisible();
        console.log(`- Desktop nav visible: ${desktopNavVisible} (expected: true)`);
        console.log(`- Mobile menu button visible: ${hamburgerVisible} (expected: false)`);
        if (!desktopNavVisible || hamburgerVisible) {
          console.error(`  FAIL: Breakpoint mismatch on desktop ${vp.name}`);
          allPassed = false;
        }

        // Test hover and click on dropdown
        const hospitalityBtn = page.locator('header nav button:has-text("Hospitality")').first();
        await hospitalityBtn.hover();
        await page.waitForTimeout(300);

        // Check if dropdown is visible
        const hospitalityDropdown = page.locator('header nav:has-text("VIP Tables")');
        console.log(`- Dropdown visible on hover: ${await hospitalityDropdown.isVisible()}`);

        // Click the Hospitality button while open
        await hospitalityBtn.click();
        await page.waitForTimeout(200);

        // Verify dropdown stays open (click doesn't snap shut!)
        const stillVisibleAfterClick = await page.locator('header p:has-text("VIP suites, tables & enclosures")').first().isVisible();
        console.log(`- Dropdown still visible after click (no snap-shut): ${stillVisibleAfterClick}`);
        if (!stillVisibleAfterClick) {
          console.error(`  FAIL: Dropdown snapped shut when clicked while hovering!`);
          allPassed = false;
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  if (!allPassed) {
    console.error("\n❌ Some viewport verification checks failed!");
    process.exit(1);
  } else {
    console.log("\n✅ All viewport verification checks PASSED across 375px, 768px, 1024px, 1280px, and 1440px!");
  }
}

run().catch((err) => {
  console.error("Error executing verification:", err);
  process.exit(1);
});

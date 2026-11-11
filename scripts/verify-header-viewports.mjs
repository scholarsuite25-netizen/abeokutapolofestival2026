import { chromium } from "playwright";

const VIEWPORTS = [
  { name: "320px (Narrow Mobile / iPhone SE 1st)", width: 320, height: 568, isMobile: true },
  { name: "360px (Standard Android / Galaxy A)", width: 360, height: 640, isMobile: true },
  { name: "375px (iPhone SE / iPhone 8)", width: 375, height: 667, isMobile: true },
  { name: "768px (iPad Portrait)", width: 768, height: 1024, isMobile: true },
  { name: "1024px (Small Laptop / iPad Pro)", width: 1024, height: 768, isMobile: true },
  { name: "1280px (Desktop HD)", width: 1280, height: 800, isMobile: false },
  { name: "1366px (Standard Laptop PC)", width: 1366, height: 768, isMobile: false },
  { name: "1440px (Desktop Full HD)", width: 1440, height: 900, isMobile: false },
];

const TARGET_URL = process.env.TEST_URL || "https://www.abeokutapolofestival2026.org.ng";

export async function runHeaderVerification(baseUrl = TARGET_URL) {
  console.log(`Starting headless browser verification on ${baseUrl}...`);
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  let allPassed = true;

  try {
    for (const withPass of [false, true]) {
      console.log(`\n==================================================`);
      console.log(`TEST SUITE RUN: ${withPass ? "WITH STORED PASS IN LOCALSTORAGE" : "WITHOUT STORED PASS (ANONYMOUS GUEST)"}`);
      console.log(`==================================================`);

      for (const vp of VIEWPORTS) {
        console.log(`\n──────────────────────────────────────────────────`);
        console.log(`Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
        });
        const page = await context.newPage();

        if (withPass) {
          await page.addInitScript(() => {
            localStorage.setItem(
              "abk_polo_registered_pass",
              JSON.stringify({
                passCode: "POLO-VIP-1234",
                holderName: "Prince Adebayo",
                category: "VIP",
                affiliationType: "individual",
                registeredAt: new Date().toISOString(),
              })
            );
          });
        }

        await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(1200);

        // 1. Check for page and header horizontal overflow
        const docScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const docClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        const headerInner = await page.evaluate(() => {
          const header = document.querySelector("header > div");
          return {
            scrollWidth: header?.scrollWidth ?? 0,
            clientWidth: header?.clientWidth ?? 0,
          };
        });

        const hasDocOverflow = docScrollWidth > docClientWidth + 1;
        const hasHeaderOverflow = headerInner.scrollWidth > headerInner.clientWidth + 1;

        console.log(`- Page: scrollWidth=${docScrollWidth}px, clientWidth=${docClientWidth}px -> No overflow: ${!hasDocOverflow}`);
        console.log(`- Header Inner: scrollWidth=${headerInner.scrollWidth}px, clientWidth=${headerInner.clientWidth}px -> No overflow: ${!hasHeaderOverflow}`);

        if (hasDocOverflow || hasHeaderOverflow) {
          console.error(`  FAIL: Overflow detected! page=${hasDocOverflow}, header=${hasHeaderOverflow} (scroll=${headerInner.scrollWidth}, client=${headerInner.clientWidth})`);
          allPassed = false;
        }

        // 2. Check brand title bounding box
        const brandLink = page.locator('header a[href="/"]').first();
        await brandLink.waitFor({ state: "visible" });
        const brandBox = await brandLink.boundingBox();
        console.log(`- Brand header box: width=${brandBox?.width.toFixed(1)}px, height=${brandBox?.height.toFixed(1)}px`);
        if (!brandBox || brandBox.width < 90) {
          console.error(`  FAIL: Brand header box collapsed to ${brandBox?.width}px!`);
          allPassed = false;
        }

        // Check brand title text
        const brandText = await brandLink.innerText();
        if (!brandText.includes("Abeokuta Polo Festival") || !brandText.includes("2026")) {
          console.error(`  FAIL: Brand text missing expected title!`);
          allPassed = false;
        }

        if (vp.isMobile) {
          // Mobile controls
          const desktopNavVisible = await page.locator('header nav[aria-label="Main Navigation"]').isVisible();
          const hamburgerButton = page.locator('header button[aria-label="Open Navigation Menu"]');
          const hamburgerVisible = await hamburgerButton.isVisible();

          console.log(`- Desktop nav visible: ${desktopNavVisible} (expected: false)`);
          console.log(`- Mobile menu button visible: ${hamburgerVisible} (expected: true)`);
          if (desktopNavVisible || !hamburgerVisible) {
            console.error(`  FAIL: Breakpoint mismatch on ${vp.name}`);
            allPassed = false;
          }

          // Ensure hamburger button is completely inside the viewport (not clipped)
          const menuBox = await hamburgerButton.boundingBox();
          if (menuBox && menuBox.x + menuBox.width > vp.width + 1) {
            console.error(`  FAIL: Hamburger menu button is pushed off-screen at ${menuBox.x + menuBox.width}px (viewport: ${vp.width}px)!`);
            allPassed = false;
          }

          // Click hamburger and inspect drawer
          await hamburgerButton.click();
          await page.waitForTimeout(500);

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

          // Check clear submenu indicator in mobile drawer
          const drawerHtml = await page.locator('[role="dialog"]').innerHTML();
          if (!drawerHtml.includes("Menu Categories &amp; Submenus") && !drawerHtml.includes("Menu Categories & Submenus")) {
            console.error(`  FAIL: Mobile drawer missing explicit submenu header!`);
            allPassed = false;
          }

          // Check that VIP Tables does NOT have "Day 1 Free"
          const vipRowBadge = page.locator('[role="dialog"] a[href="/tables"]').last();
          const vipRowBadgeText = await vipRowBadge.innerText();
          if (vipRowBadgeText.includes("Day 1 Free")) {
            console.error(`  FAIL: VIP Tables displays "Day 1 Free" badge!`);
            allPassed = false;
          }

          await page.keyboard.press("Escape");
          await page.waitForTimeout(300);

        } else {
          // Desktop viewport (1280px+)
          const desktopNavVisible = await page.locator('header nav[aria-label="Main Navigation"]').isVisible();
          console.log(`- Desktop nav visible: ${desktopNavVisible} (expected: true)`);
          if (!desktopNavVisible) {
            console.error(`  FAIL: Desktop nav not visible on ${vp.name}`);
            allPassed = false;
          }

          // Check that primary desktop Register button is not clipped
          const regLink = page.locator('header a[href="/register"]').last();
          if (await regLink.isVisible()) {
            const regBox = await regLink.boundingBox();
            if (regBox && regBox.x + regBox.width > vp.width + 1) {
              console.error(`  FAIL: Register CTA is clipped at ${regBox.x + regBox.width}px (viewport: ${vp.width}px)!`);
              allPassed = false;
            }
          }

          // Check hover opens dropdown
          const hospitalityBtn = page.locator('header nav button:has-text("Hospitality")').first();
          await hospitalityBtn.hover();
          await page.waitForTimeout(250);

          const dropdownHeader = page.locator('header p:has-text("Hospitality Submenus")');
          const isDropdownVisible = await dropdownHeader.isVisible();
          console.log(`- Dropdown visible on hover with explicit Submenu title: ${isDropdownVisible}`);
          if (!isDropdownVisible) {
            console.error(`  FAIL: Dropdown did not open on hover!`);
            allPassed = false;
          }

          // Click button while open: should retain open state (no snap shut)
          await hospitalityBtn.click();
          await page.waitForTimeout(200);
          const stillVisibleAfterClick = await dropdownHeader.isVisible();
          console.log(`- Dropdown retains open on click: ${stillVisibleAfterClick}`);
          if (!stillVisibleAfterClick) {
            console.error(`  FAIL: Dropdown snapped shut on click!`);
            allPassed = false;
          }

          // Press Escape: should close dropdown
          await page.keyboard.press("Escape");
          await page.waitForTimeout(200);
          const closedAfterEscape = !(await dropdownHeader.isVisible());
          console.log(`- Dropdown closed after Escape key: ${closedAfterEscape}`);
          if (!closedAfterEscape) {
            console.error(`  FAIL: Dropdown did not close after Escape key!`);
            allPassed = false;
          }
        }

        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  if (!allPassed) {
    console.error("\n❌ Viewport verification checks failed!");
    process.exit(1);
  } else {
    console.log("\n✅ All comprehensive viewport verification checks PASSED across all tested viewports (with & without stored pass)!");
  }
}

// When executed directly as script
if (process.argv[1]?.endsWith("verify-header-viewports.mjs")) {
  runHeaderVerification().catch((err) => {
    console.error("Error executing verification:", err);
    process.exit(1);
  });
}

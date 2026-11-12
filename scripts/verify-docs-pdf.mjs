import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

/**
 * Renders the generated PDFs to PNG images so they can be inspected.
 *
 *   node scripts/verify-docs-pdf.mjs docs/HANDOVER.pdf [pageNumbers...]
 *
 * Opens the PDF in the full Chromium PDF viewer and screenshots each page,
 * writing the images to the system temp folder.
 */

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pdfPath = path.resolve(process.argv[2] || path.join(root, "docs", "HANDOVER.pdf"));
const requested = process.argv.slice(3).map(Number).filter((n) => Number.isFinite(n));

if (!fs.existsSync(pdfPath)) {
  console.error(`Not found: ${pdfPath}`);
  process.exit(1);
}

/** The full Chromium build is required — the headless shell has no PDF viewer. */
function findFullChromium() {
  const base = path.join(os.homedir(), "AppData", "Local", "ms-playwright");
  if (!fs.existsSync(base)) return null;
  const builds = fs
    .readdirSync(base)
    .filter((name) => name.startsWith("chromium-"))
    .sort()
    .reverse();
  for (const build of builds) {
    const exe = path.join(base, build, "chrome-win64", "chrome.exe");
    if (fs.existsSync(exe)) return exe;
  }
  return null;
}

const executablePath = findFullChromium();
if (!executablePath) {
  console.error("Full Chromium not found. Run: npx playwright install chromium");
  process.exit(1);
}

const fileUrl = `file:///${pdfPath.replace(/\\/g, "/")}`;
const outDir = path.join(os.homedir(), "AppData", "Local", "Temp", "pdf-preview");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1000, height: 1400 } });
const page = await context.newPage();

const pages = requested.length ? requested : [1];
const written = [];

for (const number of pages) {
  await page.goto(`${fileUrl}#page=${number}&zoom=page-width`, { waitUntil: "load" });
  await page.waitForTimeout(2500);

  const outPath = path.join(outDir, `${path.basename(pdfPath, ".pdf")}-p${number}.png`);
  await page.screenshot({ path: outPath });
  written.push(outPath);
  console.log(outPath);
}

await browser.close();

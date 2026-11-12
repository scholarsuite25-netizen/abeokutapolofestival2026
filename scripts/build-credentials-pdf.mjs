import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

/**
 * Builds a print-ready A4 PDF of the 2026 Abeokuta Admin Credentials from the
 * private Desktop credentials file, saves it to Desktop & Downloads (never in
 * the repository), uploads it to the private `club-backups` Supabase Storage
 * bucket, and prints 7-day signed download URLs.
 *
 * Passwords are NEVER printed to console output.
 */

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const txtPath = path.join(
  os.homedir(),
  "Desktop",
  "ABEOKUTA ADMIN CREDENTIALS - KEEP PRIVATE.txt",
);

if (!fs.existsSync(txtPath)) {
  console.error(`Missing credentials file at ${txtPath}`);
  process.exit(1);
}

const rawTxt = fs.readFileSync(txtPath, "utf8");

function parseBlocks(text) {
  const rows = [];
  let current = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    const em = line.match(/^EMAIL\s*:\s*(\S+@\S+)$/i);
    if (em) {
      current = { email: em[1] };
      continue;
    }
    const pw = line.match(/^PASSWORD\s*:\s*(\S.*)$/i);
    if (pw && current.email) {
      current.password = pw[1].trim();
      continue;
    }
    const rl = line.match(/^ROLE\s*:\s*(.+)$/i);
    if (rl && current.email) {
      current.role = rl[1].trim();
      rows.push(current);
      current = {};
    }
  }
  return rows;
}

const rows = parseBlocks(rawTxt);
if (rows.length === 0) {
  console.error("Could not parse any credential rows.");
  process.exit(1);
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>2026 Abeokuta Polo Festival — Official Staff & Admin Credentials</title>
<style>
  @page { size: A4 portrait; margin: 16mm 14mm 16mm 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.45;
    color: #16211b;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .banner {
    background: #002f1a;
    color: #fcf9f8;
    padding: 12mm 10mm 10mm 10mm;
    border-radius: 2mm;
    border-bottom: 3px solid #c9a84c;
    margin-bottom: 6mm;
  }
  .kicker {
    font-size: 7.5pt;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #c9a84c;
    font-weight: 700;
    margin-bottom: 2.5mm;
  }
  h1 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 22pt;
    margin: 0 0 2mm 0;
    line-height: 1.15;
  }
  .sub {
    margin: 0;
    font-size: 9.5pt;
    color: #d9e2dc;
  }
  .warn {
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-left: 4px solid #b45309;
    padding: 3.5mm 4mm;
    border-radius: 1.5mm;
    margin-bottom: 5mm;
    font-size: 9.2pt;
    color: #78350f;
  }
  .urls {
    display: flex;
    gap: 4mm;
    margin-bottom: 5mm;
    font-size: 9pt;
  }
  .url-box {
    flex: 1;
    border: 1px solid #c1c9bf;
    background: #f7f8f6;
    border-radius: 1.5mm;
    padding: 2.8mm 3.5mm;
  }
  .url-box strong {
    display: block;
    font-size: 7.8pt;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #55635a;
    margin-bottom: 1mm;
  }
  .url-box code {
    font-family: Consolas, Menlo, monospace;
    font-size: 8.8pt;
    color: #002f1a;
    font-weight: 700;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 5mm;
  }
  th {
    background: #002f1a;
    color: #fcf9f8;
    text-align: left;
    padding: 2.6mm 3mm;
    font-size: 8.3pt;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 1px solid #002f1a;
  }
  td {
    padding: 3mm 3mm;
    border: 1px solid #cbd2cc;
    vertical-align: middle;
    font-size: 9.3pt;
  }
  tbody tr:nth-child(even) td { background: #f6f8f6; }
  .mono {
    font-family: Consolas, 'Courier New', monospace;
    font-size: 9.8pt;
    font-weight: 700;
    color: #00210e;
    letter-spacing: 0.03em;
  }
  .pwd {
    font-family: Consolas, 'Courier New', monospace;
    font-size: 10.5pt;
    font-weight: 700;
    color: #002f1a;
    background: #eef3ef;
    padding: 1.2mm 2.2mm;
    border-radius: 1mm;
    border: 1px solid #b9c7bd;
    display: inline-block;
    letter-spacing: 0.04em;
  }
  .notes {
    border: 1px solid #c1c9bf;
    background: #faf9f5;
    border-radius: 1.5mm;
    padding: 3.5mm 4.5mm;
    font-size: 9pt;
  }
  .notes h2 {
    font-family: Georgia, serif;
    font-size: 12pt;
    color: #002f1a;
    margin: 0 0 2mm 0;
  }
  .notes ul { margin: 0; padding-left: 5mm; }
  .notes li { margin-bottom: 1.2mm; }
</style>
</head>
<body>
  <div class="banner">
    <div class="kicker">Confidential · For the Abeokuta Polo Club Only</div>
    <h1>2026 Abeokuta Polo Festival — Staff &amp; Admin Credentials</h1>
    <p class="sub">Official Console (/abawole) and Turnstile Gate Scanner (/scan) Logins</p>
  </div>

  <div class="warn">
    <strong>Keep this sheet private.</strong> Give each officer or marshal <strong>only their own row</strong>. Never share one login between two people — every approval, verification, and gate scan is recorded against the individual account that signed in.
  </div>

  <div class="urls">
    <div class="url-box">
      <strong>Sign-In Page</strong>
      <code>https://www.abeokutapolofestival2026.org.ng/sign-in</code>
    </div>
    <div class="url-box">
      <strong>Operations Console (Executives &amp; Accounts)</strong>
      <code>https://www.abeokutapolofestival2026.org.ng/abawole</code>
    </div>
    <div class="url-box">
      <strong>Turnstile Scanner (Gate Marshals)</strong>
      <code>https://www.abeokutapolofestival2026.org.ng/scan</code>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 34%">Club Email Address</th>
        <th style="width: 28%">Password</th>
        <th style="width: 26%">Role &amp; Access</th>
        <th style="width: 12%">Landing</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map((r) => {
          const isGate = r.email.startsWith("gate");
          return `<tr>
            <td class="mono">${escapeHtml(r.email)}</td>
            <td><span class="pwd">${escapeHtml(r.password)}</span></td>
            <td>${escapeHtml(r.role)}</td>
            <td class="mono">${isGate ? "/scan" : "/abawole"}</td>
          </tr>`;
        })
        .join("\n")}
    </tbody>
  </table>

  <div class="notes">
    <h2>How to sign in &amp; how to help a staff member who is stuck</h2>
    <ul>
      <li><strong>Sign in with your username &amp; password:</strong> open the Sign-In page (<code>/sign-in</code>), enter your assigned Club username and password above (use <em>Show</em> to verify what you typed), and press <strong>Sign in</strong>.</li>
      <li><strong>No email or SMS codes needed:</strong> because the <code>@abeokutapolo2026.ng</code> usernames were autogenerated and do not receive mail, sign-in is strictly through your assigned username and password.</li>
      <li><strong>One-click Super Admin "Approve" button:</strong> if any admin forgets their password or has a sign-in problem, a Super Admin (<code>superadmin@</code> or <code>admin@</code>) opens <strong>Admin Hierarchy</strong> (<code>/abawole/admins</code>) and clicks <strong>Approve</strong> next to that person's name to immediately restore their account and issue a fresh password.</li>
      <li><strong>Removed account:</strong> the old <code>bursa@abeokutapolo2026.ng</code> account has been permanently deleted; the unit is now <strong>Accounts</strong> under the Financial Secretary (<code>finsec@abeokutapolo2026.ng</code>).</li>
    </ul>
  </div>
</body>
</html>`;

const desktopPdf = path.join(os.homedir(), "Desktop", "2026 ABEOKUTA ADMIN CREDENTIALS.pdf");
const folderPdf = path.join(
  os.homedir(),
  "Desktop",
  "ABEOKUTA POLO FESTIVAL 2026 - CLUB DOCUMENTS",
  "2026 ABEOKUTA ADMIN CREDENTIALS.pdf",
);
const downloadsPdf = path.join(os.homedir(), "Downloads", "2026 ABEOKUTA ADMIN CREDENTIALS.pdf");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "load" });
await page.pdf({
  path: desktopPdf,
  format: "A4",
  printBackground: true,
});
await browser.close();

fs.mkdirSync(path.dirname(folderPdf), { recursive: true });
fs.copyFileSync(desktopPdf, folderPdf);
fs.copyFileSync(desktopPdf, downloadsPdf);
console.log(`Saved PDF (${Math.round(fs.statSync(desktopPdf).size / 1024)} KB) to Desktop & Downloads.`);

// Upload to private club-backups bucket and mint 7-day signed download URLs
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const BUCKET = "club-backups";
const uploads = [
  {
    remote: "handover/2026-ABEOKUTA-ADMIN-CREDENTIALS.pdf",
    local: desktopPdf,
    contentType: "application/pdf",
    downloadName: "2026 ABEOKUTA ADMIN CREDENTIALS.pdf",
  },
  {
    remote: "handover/2026-ABEOKUTA-ADMIN-CREDENTIALS.txt",
    local: txtPath,
    contentType: "text/plain; charset=utf-8",
    downloadName: "2026 ABEOKUTA ADMIN CREDENTIALS.txt",
  },
  {
    remote: "handover/Abeokuta-Polo-Festival-2026-Handover-Document.pdf",
    local: path.join(root, "docs", "HANDOVER.pdf"),
    contentType: "application/pdf",
    downloadName: "Abeokuta Polo Festival 2026 - Handover Document.pdf",
  },
  {
    remote: "handover/Abeokuta-Polo-Festival-2026-Console-Walkthrough.pdf",
    local: path.join(root, "docs", "CONSOLE_WALKTHROUGH.pdf"),
    contentType: "application/pdf",
    downloadName: "Abeokuta Polo Festival 2026 - Console Walkthrough.pdf",
  },
];

const SEVEN_DAYS = 7 * 24 * 60 * 60;
const signedLinks = {};

for (const item of uploads) {
  const bytes = fs.readFileSync(item.local);
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(item.remote, bytes, {
    contentType: item.contentType,
    upsert: true,
  });
  if (upErr) {
    console.error(`Upload failed for ${item.remote}: ${upErr.message}`);
    process.exit(1);
  }
  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(item.remote, SEVEN_DAYS, { download: item.downloadName });
  if (signErr || !signed?.signedUrl) {
    console.error(`Sign failed for ${item.remote}: ${signErr?.message}`);
    process.exit(1);
  }
  signedLinks[item.remote] = signed.signedUrl;
}

fs.writeFileSync(
  path.join(os.homedir(), "AppData", "Local", "Temp", "opencode", "signed-download-links.json"),
  JSON.stringify(signedLinks, null, 2),
  "utf8",
);
console.log("Uploaded all 4 files to private storage and generated 7-day signed download links.");

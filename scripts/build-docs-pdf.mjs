import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

/**
 * Builds print-ready PDFs for the Club's documents.
 *
 *   node scripts/build-docs-pdf.mjs
 *
 * The markdown is converted to HTML by the small renderer below (the project
 * has no markdown library), then Chromium prints it with print CSS, running
 * headers and page numbers. The brand fonts are downloaded once and embedded
 * in the page, so the build does not depend on the network at render time.
 */

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = path.join(root, "docs");

/* ------------------------------------------------------------------ *
 * Markdown rendering
 * ------------------------------------------------------------------ */

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };

function escapeHtml(text) {
  return String(text).replace(/[&<>]/g, (c) => ESCAPES[c]);
}

/** Inline markup: code, links, bold, italic, strike, bare URLs. */
function renderInline(text) {
  let out = escapeHtml(text);

  // Pull code spans out first so their contents are not touched by the rest.
  const codeSpans = [];
  out = out.replace(/`([^`]+)`/g, (_, code) => {
    codeSpans.push(code);
    return `\u0000CODE${codeSpans.length - 1}\u0000`;
  });

  // [label](url)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    return `<a href="${url}">${label}</a>`;
  });

  // **bold**
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // *italic* (not part of a bold span)
  out = out.replace(/(^|[^*\w])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  // ~~struck~~
  out = out.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  // Bare URLs with a scheme.
  out = out.replace(
    /(^|[\s(])(https?:\/\/[^\s<)]+)/g,
    (_, lead, url) => `${lead}<a href="${url}">${url}</a>`,
  );
  // Bare domains that carry a path (e.g. github.com/org/repo).
  out = out.replace(
    /(^|[\s(])([a-z0-9][a-z0-9.-]*\.[a-z]{2,}\/[^\s)]+)/gi,
    (_, lead, url) => `${lead}<a href="https://${url}">${url}</a>`,
  );

  // Restore code spans.
  out = out.replace(/\u0000CODE(\d+)\u0000/g, (_, n) => `<code>${codeSpans[Number(n)]}</code>`);

  return out;
}

const isTableSeparator = (line) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(line) && line.includes("-");

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function alignmentOf(cell) {
  const left = cell.startsWith(":");
  const right = cell.endsWith(":");
  if (left && right) return "center";
  if (right) return "right";
  return "left";
}

/** Renders a list, honouring indentation for nested items. */
function renderList(items) {
  let index = 0;
  const baseIndent = Math.min(...items.map((i) => i.indent));

  function build(indent) {
    let out = "";
    let openTag = null;

    const close = () => {
      if (openTag) {
        out += `</${openTag}>`;
        openTag = null;
      }
    };

    while (index < items.length) {
      const item = items[index];
      if (item.indent < indent) break;
      if (item.indent > indent) {
        // Unreachable in practice: deeper items are consumed by the recursion.
        break;
      }

      const wanted = item.ordered ? "ol" : "ul";
      if (openTag !== wanted) {
        close();
        out += `<${wanted}>`;
        openTag = wanted;
      }

      index += 1;
      let content = renderInline(item.text);

      // A task-list marker becomes a printed checkbox.
      const task = content.match(/^\[([ xX])\]\s*(.*)$/);
      if (task) {
        content = `<span class="box">${task[1].toLowerCase() === "x" ? "&#10003;" : ""}</span> ${task[2]}`;
      }

      if (index < items.length && items[index].indent > indent) {
        content += build(items[index].indent);
      }

      out += `<li>${content}</li>`;
    }

    close();
    return out;
  }

  let html = build(baseIndent);

  // Anything left over (pathological input) is rendered flat.
  while (index < items.length) {
    const item = items[index];
    index += 1;
    html += `<ul><li>${renderInline(item.text)}</li></ul>`;
  }

  return html;
}

function parseBlocks(lines) {
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Fenced code
    if (/^```/.test(line)) {
      const body = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: "code", text: body.join("\n") });
      continue;
    }

    // Heading
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2].trim() });
      i += 1;
      continue;
    }

    // Horizontal rule
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) {
      blocks.push({ type: "rule" });
      i += 1;
      continue;
    }

    // Table
    if (line.trim().startsWith("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = splitTableRow(line);
      const align = splitTableRow(lines[i + 1]).map(alignmentOf);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: "table", header, align, rows });
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const body = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        body.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "quote", text: body.join("\n") });
      continue;
    }

    // List
    if (/^(\s*)([-*+]|\d+[.)])\s+/.test(line)) {
      const items = [];
      while (i < lines.length) {
        const match = lines[i].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
        if (!match) {
          // A wrapped line continues the previous item.
          if (lines[i].trim() && items.length) {
            items[items.length - 1].text += ` ${lines[i].trim()}`;
            i += 1;
            continue;
          }
          break;
        }
        items.push({
          indent: match[1].replace(/\t/g, "  ").length,
          ordered: /\d/.test(match[2]),
          text: match[3],
        });
        i += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    // Paragraph
    const paragraph = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|>\s?|\s*([-*+]|\d+[.)])\s|```)/.test(lines[i]) &&
      !(lines[i].trim().startsWith("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "para", text: paragraph.join("\n") });
  }

  return blocks;
}

function renderBlocks(blocks, options = {}) {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading": {
          const level = Math.min(block.level, 4);
          return `<h${level} class="h${level}">${renderInline(block.text)}</h${level}>`;
        }
        case "para":
          return `<p>${renderInline(block.text).replace(/\n/g, "<br />")}</p>`;
        case "rule":
          return '<hr />';
        case "quote":
          return `<blockquote>${renderInline(block.text).replace(/\n/g, "<br />")}</blockquote>`;
        case "code":
          return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
        case "list":
          return renderList(block.items);
        case "table": {
          const head = block.header
            .map((cell, c) => `<th style="text-align:${block.align[c] || "left"}">${renderInline(cell)}</th>`)
            .join("");
          const body = block.rows
            .map(
              (row) =>
                `<tr>${row
                  .map(
                    (cell, c) =>
                      `<td style="text-align:${block.align[c] || "left"}">${renderInline(cell)}</td>`,
                  )
                  .join("")}</tr>`,
            )
            .join("");
          return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
        }
        default:
          return "";
      }
    })
    .join("\n");
}

/**
 * Splits a document into its title block (first H1 plus the metadata lines
 * that follow it) and the remaining body.
 */
function splitTitle(markdown) {
  const lines = markdown.split(/\r?\n/);
  let title = "";
  let subtitle = "";

  let index = 0;
  while (index < lines.length && !lines[index].trim()) index += 1;

  const h1 = lines[index]?.match(/^#\s+(.*)$/);
  if (h1) {
    title = h1[1].trim();
    index += 1;
  }

  const meta = [];
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (/^#/.test(line) || /^---$/.test(line.trim())) break;
    const match = line.match(/^\*\*(.+?):\*\*\s*(.*)$/);
    if (match) {
      meta.push([match[1].trim(), match[2].trim()]);
    } else if (!subtitle) {
      subtitle = line.trim();
    }
    index += 1;
  }

  return { title, subtitle, meta, body: lines.slice(index).join("\n") };
}

/* ------------------------------------------------------------------ *
 * Fonts
 * ------------------------------------------------------------------ */

async function embedFonts() {
  const cssUrl =
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap";

  const cssResponse = await fetch(cssUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  });
  if (!cssResponse.ok) {
    console.warn(`[pdf] Font CSS unavailable (${cssResponse.status}); using system fonts.`);
    return "";
  }

  const css = await cssResponse.text();
  const blocks = css.split("@font-face").slice(1);

  const kept = [];
  for (const block of blocks) {
    // Keep only the Latin subset — the documents are English.
    const range = block.match(/unicode-range:\s*([^;]+);/);
    if (range && !range[1].includes("U+0000-00FF")) continue;

    const url = block.match(/url\((https:[^)]+)\)/);
    const family = block.match(/font-family:\s*'([^']+)'/);
    const weight = block.match(/font-weight:\s*(\d+)/);
    const style = block.match(/font-style:\s*(\w+)/);
    if (!url || !family) continue;

    const file = await fetch(url[1]);
    if (!file.ok) continue;
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

    kept.push(
      `@font-face{font-family:'${family[1]}';font-style:${style ? style[1] : "normal"};` +
        `font-weight:${weight ? weight[1] : "400"};font-display:block;` +
        `src:url(data:font/woff2;base64,${base64}) format('woff2');}`,
    );
  }

  console.log(`[pdf] Embedded ${kept.length} font files.`);
  return kept.join("\n");
}

/* ------------------------------------------------------------------ *
 * Document assembly
 * ------------------------------------------------------------------ */

function buildHtml({ title, subtitle, meta, bodyHtml, fonts, docLabel }) {
  const metaHtml = meta.length
    ? `<dl class="meta">${meta
        .map(([label, value]) => `<div><dt>${label}</dt><dd>${renderInline(value)}</dd></div>`)
        .join("")}</dl>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
${fonts}

@page {
  size: A4;
  margin: 20mm 16mm 18mm 16mm;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  font-family: 'Manrope', 'Segoe UI', Arial, sans-serif;
  font-size: 10.2pt;
  line-height: 1.55;
  color: #16211b;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ---- title block ---- */
.title-block {
  background: #002f1a;
  color: #fcf9f8;
  padding: 16mm 12mm 12mm 12mm;
  margin: -6mm 0 8mm 0;
  border-radius: 2mm;
  border-bottom: 3px solid #c9a84c;
}
.title-block .kicker {
  font-size: 7.6pt;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #c9a84c;
  font-weight: 700;
  margin-bottom: 4mm;
}
.title-block h1 {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 27pt;
  font-weight: 700;
  line-height: 1.12;
  margin: 0 0 3mm 0;
}
.title-block .sub {
  font-size: 10pt;
  color: #d9e2dc;
  margin: 0;
  max-width: 145mm;
}

.meta {
  margin: 0 0 7mm 0;
  padding: 0;
  border-top: 0.5pt solid #c1c9bf;
}
.meta > div {
  display: flex;
  gap: 4mm;
  padding: 2.1mm 0;
  border-bottom: 0.5pt solid #dfe3e0;
}
.meta dt {
  flex: 0 0 38mm;
  font-weight: 700;
  font-size: 8.6pt;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #55635a;
}
.meta dd { margin: 0; font-size: 9.6pt; }

/* ---- body ---- */
h1.h1, h2.h2, h3.h3, h4.h4 {
  font-family: 'Cormorant Garamond', Georgia, serif;
  color: #002f1a;
  page-break-after: avoid;
  break-after: avoid;
}
h1.h1 {
  font-size: 20pt;
  margin: 9mm 0 4mm 0;
  padding-bottom: 2mm;
  border-bottom: 1.2pt solid #c9a84c;
}
h2.h2 {
  font-size: 15pt;
  margin: 7mm 0 3mm 0;
}
h3.h3 {
  font-size: 12.5pt;
  margin: 5mm 0 2mm 0;
  color: #004225;
}
h4.h4 {
  font-size: 11pt;
  margin: 4mm 0 2mm 0;
  color: #55635a;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

p { margin: 0 0 3mm 0; orphans: 3; widows: 3; }

a { color: #004225; text-decoration: none; border-bottom: 0.5pt solid #b9c7bd; word-break: break-word; }

strong { font-weight: 700; color: #00210e; }
em { font-style: italic; }

code {
  font-family: 'Consolas', 'SFMono-Regular', Menlo, monospace;
  font-size: 8.8pt;
  background: #f0f2ef;
  border: 0.5pt solid #dfe3e0;
  border-radius: 1mm;
  padding: 0.4mm 1.1mm;
  word-break: break-word;
}
pre {
  background: #f6f7f5;
  border: 0.5pt solid #dfe3e0;
  border-left: 2.4pt solid #002f1a;
  border-radius: 1mm;
  padding: 3mm 4mm;
  overflow: hidden;
  white-space: pre-wrap;
  word-break: break-word;
}
pre code { background: none; border: none; padding: 0; font-size: 8.6pt; }

hr {
  border: none;
  border-top: 0.5pt solid #d7dcd8;
  margin: 5mm 0;
}

blockquote {
  margin: 3.5mm 0;
  padding: 2.6mm 4mm;
  background: #f6f4ec;
  border-left: 2.4pt solid #c9a84c;
  border-radius: 0 1.4mm 1.4mm 0;
  color: #23301f;
  page-break-inside: avoid;
}
blockquote p { margin: 0 0 1.6mm 0; }
blockquote p:last-child { margin-bottom: 0; }

ul, ol { margin: 0 0 3mm 0; padding-left: 6mm; }
li { margin-bottom: 1.4mm; }
ul { list-style-type: disc; }
ol { list-style-type: decimal; }
li > ul, li > ol { margin-top: 1.4mm; margin-bottom: 1mm; }

.box {
  display: inline-block;
  width: 3.4mm;
  height: 3.4mm;
  border: 0.6pt solid #55635a;
  border-radius: 0.7mm;
  text-align: center;
  line-height: 3.2mm;
  font-size: 7pt;
  vertical-align: 0.3mm;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 3mm 0 4mm 0;
  font-size: 8.9pt;
  page-break-inside: auto;
}
thead { display: table-header-group; }
tr { page-break-inside: avoid; }
th {
  background: #002f1a;
  color: #fcf9f8;
  text-align: left;
  padding: 2.1mm 2.6mm;
  font-weight: 600;
  font-size: 8.4pt;
  letter-spacing: 0.03em;
  border: 0.5pt solid #002f1a;
}
td {
  padding: 2.1mm 2.6mm;
  border: 0.5pt solid #d3d9d4;
  vertical-align: top;
}
tbody tr:nth-child(even) td { background: #f7f8f6; }
td strong { color: #00210e; }
</style>
</head>
<body>
  <div class="title-block">
    <div class="kicker">${escapeHtml(docLabel)}</div>
    <h1>${renderInline(title)}</h1>
    ${subtitle ? `<p class="sub">${renderInline(subtitle)}</p>` : ""}
  </div>
  ${metaHtml}
  ${bodyHtml}
</body>
</html>`;
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

const TARGETS = [
  {
    file: "HANDOVER.md",
    out: "HANDOVER.pdf",
    label: "System handover",
  },
  {
    file: "CONSOLE_WALKTHROUGH.md",
    out: "CONSOLE_WALKTHROUGH.pdf",
    label: "Club operating guide",
  },
];

async function main() {
  const fonts = await embedFonts();

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const target of TARGETS) {
    const sourcePath = path.join(docsDir, target.file);
    if (!fs.existsSync(sourcePath)) {
      console.warn(`[pdf] Skipping ${target.file} — not found.`);
      continue;
    }

    const markdown = fs.readFileSync(sourcePath, "utf8");
    const { title, subtitle, meta, body } = splitTitle(markdown);
    const bodyHtml = renderBlocks(parseBlocks(body.split(/\r?\n/)));

    const html = buildHtml({
      title: title || target.file,
      subtitle,
      meta,
      bodyHtml,
      fonts,
      docLabel: target.label,
    });

    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);

    const outPath = path.join(docsDir, target.out);
    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      margin: { top: "18mm", bottom: "16mm", left: "15mm", right: "15mm" },
      headerTemplate: `
        <div style="width:100%;font-family:'Manrope',Arial,sans-serif;font-size:7pt;color:#55635a;padding:0 15mm;display:flex;justify-content:space-between;">
          <span style="letter-spacing:0.12em;text-transform:uppercase;">Abeokuta Polo Festival 2026</span>
          <span style="letter-spacing:0.12em;text-transform:uppercase;">${escapeHtml(target.label)}</span>
        </div>`,
      footerTemplate: `
        <div style="width:100%;font-family:'Manrope',Arial,sans-serif;font-size:7.4pt;color:#55635a;padding:0 15mm;display:flex;justify-content:space-between;border-top:0.5pt solid #d7dcd8;padding-top:2mm;">
          <span>www.abeokutapolofestival2026.org.ng</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          <span>Prepared for the Abeokuta Polo Club</span>
        </div>`,
    });

    const size = fs.statSync(outPath).size;
    console.log(`[pdf] ${target.out} written (${Math.round(size / 1024)} KB)`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error("[pdf] Failed:", err);
  process.exit(1);
});

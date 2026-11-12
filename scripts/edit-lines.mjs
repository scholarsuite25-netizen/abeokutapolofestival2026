import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * One-off edit helper: replaces exact line ranges in a markdown file.
 *
 *   node scripts/edit-lines.mjs <file> <startLine> <endLine> <replacementFile>
 *
 * Line numbers are 1-based and inclusive.
 */
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const [file, startRaw, endRaw, replacementFile] = process.argv.slice(2);

const target = path.resolve(root, file);
const lines = fs.readFileSync(target, "utf8").split(/\r?\n/);

const start = Number(startRaw) - 1;
const end = Number(endRaw) - 1;
const replacement = fs.readFileSync(path.resolve(root, replacementFile), "utf8").replace(/\r?\n$/, "");

const before = lines.slice(start, end + 1);
console.log(`Replacing ${before.length} line(s) ${startRaw}-${endRaw}:`);
for (const line of before) console.log(`  - ${line}`);
console.log("With:");
for (const line of replacement.split(/\r?\n/)) console.log(`  + ${line}`);

lines.splice(start, end - start + 1, replacement);
fs.writeFileSync(target, lines.join("\n"), "utf8");
console.log(`\n${file} updated.`);

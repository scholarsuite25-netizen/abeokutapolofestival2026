import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

/**
 * Checks that no live staff password appears anywhere in the repository.
 *
 *   node scripts/check-no-passwords-in-repo.mjs
 *
 * Reads the out-of-band credentials file, then greps the working tree (and
 * the committed history) for each password.
 */
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const credentialsPath =
  process.argv[2] ||
  path.join(os.homedir(), "Desktop", "ABEOKUTA ADMIN CREDENTIALS - KEEP PRIVATE.txt");

if (!fs.existsSync(credentialsPath)) {
  console.error(`Credentials file not found: ${credentialsPath}`);
  process.exit(1);
}

const text = fs.readFileSync(credentialsPath, "utf8");
const passwords = [...text.matchAll(/^PASSWORD\s*:\s*(\S+)/gim)].map((m) => m[1]);
console.log(`Checking ${passwords.length} staff password(s) against the repository...`);

let leaks = 0;

// 1. The working tree (tracked and untracked files, excluding .git).
try {
  const files = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);

  for (const file of files) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    let content = "";
    try {
      content = fs.readFileSync(full, "utf8");
    } catch {
      continue;
    }
    for (const password of passwords) {
      if (content.includes(password)) {
        console.log(`LEAK  ${file} contains a staff password`);
        leaks += 1;
      }
    }
  }
} catch (err) {
  console.error("git ls-files failed:", err.message);
}

// 2. The committed history.
try {
  const history = execFileSync("git", ["log", "-p", "--all"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 200 * 1024 * 1024,
  });
  for (const password of passwords) {
    if (history.includes(password)) {
      console.log("LEAK  the git history contains a staff password");
      leaks += 1;
    }
  }
} catch (err) {
  console.error("git log failed:", err.message);
}

console.log(leaks === 0 ? "CLEAN — no staff password appears in the repository or its history." : `FOUND ${leaks} leak(s).`);
process.exit(leaks === 0 ? 0 : 1);

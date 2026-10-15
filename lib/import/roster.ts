import { rosterRowSchema, type RosterRow } from "@/lib/validators/committee";

/**
 * Minimal RFC-4180-style CSV parser (quotes, escaped quotes, CRLF).
 * No external dependency; suitable for small roster files (< 1000 rows).
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i]!;

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

type HeaderKey = "name" | "email" | "phone" | "position" | "role";

const HEADER_ALIASES: Record<string, HeaderKey> = {
  name: "name",
  "full name": "name",
  fullname: "name",
  "source spelling": "name",
  email: "email",
  "e-mail": "email",
  "email address": "email",
  phone: "phone",
  "phone number": "phone",
  "tel": "phone",
  position: "position",
  role: "role",
};

export type RosterParseResult =
  | { ok: true; rows: RosterRow[] }
  | { ok: false; error: string };

/**
 * Parses a roster CSV. Expected headers (any order, aliases accepted):
 *   name, email, phone, position, role
 * `role` must be committee_member or committee_officer (default: member).
 */
export function parseRosterCsv(input: string): RosterParseResult {
  const table = parseCsv(input);
  if (table.length < 2) {
    return { ok: false, error: "CSV needs a header row plus at least one data row." };
  }

  const header = table[0]!.map((h) => h.trim().toLowerCase());
  const columnFor: Partial<Record<HeaderKey, number>> = {};

  header.forEach((cell, index) => {
    const key = HEADER_ALIASES[cell];
    if (key !== undefined && columnFor[key] === undefined) {
      columnFor[key] = index;
    }
  });

  if (columnFor.name === undefined) {
    return { ok: false, error: 'Missing required column: "name" (or "source spelling").' };
  }

  const rows: RosterRow[] = [];
  const errors: string[] = [];

  table.slice(1).forEach((cells, rowIndex) => {
    const read = (key: HeaderKey) => {
      const index = columnFor[key];
      return index === undefined ? "" : (cells[index] ?? "").trim();
    };

    const parsed = rosterRowSchema.safeParse({
      name: read("name"),
      email: read("email"),
      phone: read("phone"),
      position: read("position"),
      role: read("role") || "committee_member",
    });

    if (!parsed.success) {
      errors.push(
        `Row ${rowIndex + 2}: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
      );
      return;
    }
    rows.push(parsed.data);
  });

  if (errors.length > 0) {
    return { ok: false, error: errors.slice(0, 5).join(" | ") };
  }
  if (rows.length === 0) {
    return { ok: false, error: "No valid data rows found." };
  }

  return { ok: true, rows };
}

import { describe, expect, it } from "vitest";
import { parseCsv, parseRosterCsv } from "@/lib/import/roster";

describe("parseCsv", () => {
  it("parses simple rows", () => {
    expect(parseCsv("a,b\n1,2\n3,4")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("handles quoted fields with commas and escaped quotes", () => {
    expect(parseCsv('name,note\n"Adams, Sheriff","He said ""hello"""\n')).toEqual([
      ["name", "note"],
      ["Adams, Sheriff", 'He said "hello"'],
    ]);
  });

  it("ignores blank lines and CR", () => {
    expect(parseCsv("a,b\r\n1,2\r\n\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("parseRosterCsv", () => {
  it("accepts header aliases and defaults role", () => {
    const result = parseRosterCsv(
      "Full Name,Email Address,Phone Number,Position\nAda Obi,ada@example.com,08030000000,Secretary\n",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toEqual([
      {
        name: "Ada Obi",
        email: "ada@example.com",
        phone: "08030000000",
        position: "Secretary",
        role: "committee_member",
      },
    ]);
  });

  it("rejects a missing name column", () => {
    const result = parseRosterCsv("email,phone\na@b.com,123\n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/name/i);
  });

  it("rejects invalid email with row number", () => {
    const result = parseRosterCsv("name,email\nAda,not-an-email\n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/Row 2/);
  });

  it("accepts committee_officer role", () => {
    const result = parseRosterCsv("name,role\nTunde,committee_officer\n");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows[0]?.role).toBe("committee_officer");
  });

  it("rejects an unknown role", () => {
    const result = parseRosterCsv("name,role\nTunde,chairman\n");
    expect(result.ok).toBe(false);
  });
});

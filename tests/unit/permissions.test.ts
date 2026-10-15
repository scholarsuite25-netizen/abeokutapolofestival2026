import { describe, expect, it } from "vitest";
import {
  PERMISSIONS,
  ROLES,
  can,
  canReadFinance,
  roleGrants,
  type Actor,
} from "@/lib/permissions/matrix";

const actor = (...roles: Actor["roles"][number][]): Actor => ({
  userId: "00000000-0000-0000-0000-000000000000",
  roles,
});

describe("permission matrix", () => {
  it("is default-deny: public holds only read permissions", () => {
    const grants = roleGrants("public");
    expect(grants).toEqual(["content.read", "sponsorship.read_public"]);
  });

  it("denies everything to an actor with no roles", () => {
    for (const permission of PERMISSIONS) {
      expect(can(actor(), permission)).toBe(false);
    }
  });

  it("restricts financial reads to finance_officer and super_admin", () => {
    expect(canReadFinance(actor("finance_officer"))).toBe(true);
    expect(canReadFinance(actor("super_admin"))).toBe(true);

    for (const role of ROLES) {
      if (role === "finance_officer" || role === "super_admin") continue;
      expect(canReadFinance(actor(role))).toBe(false);
    }
  });

  it("reserves permission grants to super_admin only", () => {
    for (const role of ROLES) {
      if (role === "super_admin") continue;
      expect(can(actor(role), "grants.manage")).toBe(false);
    }
    expect(can(actor("super_admin"), "grants.manage")).toBe(true);
  });

  it("gives committee members read access to their own tasks and roster", () => {
    const member = actor("committee_member");
    expect(can(member, "tasks.read")).toBe(true);
    expect(can(member, "roster.read")).toBe(true);
    expect(can(member, "roster.read_all")).toBe(false);
    expect(can(member, "tasks.manage")).toBe(false);
  });

  it("splits credential powers between issuance and gate validation", () => {
    expect(can(actor("accreditation_officer"), "credential.issue")).toBe(true);
    expect(can(actor("security_checkin_officer"), "credential.issue")).toBe(false);
    expect(can(actor("security_checkin_officer"), "credential.validate")).toBe(true);
    expect(can(actor("guest"), "credential.validate")).toBe(false);
  });

  it("grants guests access only to their own records", () => {
    const guest = actor("guest");
    expect(can(guest, "registration.read_own")).toBe(true);
    expect(can(guest, "directory.read_own")).toBe(true);
    expect(can(guest, "registration.manage")).toBe(false);
    expect(can(guest, "roster.read")).toBe(false);
    expect(can(guest, "minutes.read")).toBe(false);
  });

  it("keeps content management away from every role except media_officer and super_admin", () => {
    for (const role of ROLES) {
      const expected = role === "media_officer" || role === "super_admin";
      expect(can(actor(role), "cms.publish")).toBe(expected);
    }
  });

  it("lists every role in ROLES", () => {
    expect(new Set(ROLES).size).toBe(ROLES.length);
  });
});

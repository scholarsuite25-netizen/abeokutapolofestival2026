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

  it("gives accreditation officers manage access to registrations and credentials", () => {
    const officer = actor("accreditation_officer");
    expect(can(officer, "registration.manage")).toBe(true);
    expect(can(officer, "credential.issue")).toBe(true);
    expect(can(officer, "roster.read")).toBe(true);
  });

  it("splits credential powers between issuance and gate validation", () => {
    expect(can(actor("accreditation_officer"), "credential.issue")).toBe(true);
    expect(can(actor("security_checkin_officer"), "credential.issue")).toBe(false);
    expect(can(actor("security_checkin_officer"), "credential.validate")).toBe(true);
    expect(can(actor("guest"), "credential.validate")).toBe(false);
  });

  it("does not leak privileged permissions to guest", () => {
    const guest = actor("guest");
    expect(can(guest, "registration.manage")).toBe(false);
    expect(can(guest, "credential.issue")).toBe(false);
    expect(can(guest, "credential.validate")).toBe(false);
    expect(can(guest, "finance.read")).toBe(false);
    expect(can(guest, "registration.read_own")).toBe(true);
  });

  it("confirms super_admin holds all declared permissions", () => {
    const admin = actor("super_admin");
    for (const permission of PERMISSIONS) {
      expect(can(admin, permission)).toBe(true);
    }
  });
});

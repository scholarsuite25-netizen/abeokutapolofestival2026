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

  it("restricts financial reads to finance_officer, president, general_secretary, and super_admin", () => {
    expect(canReadFinance(actor("finance_officer"))).toBe(true);
    expect(canReadFinance(actor("president"))).toBe(true);
    expect(canReadFinance(actor("general_secretary"))).toBe(true);
    expect(canReadFinance(actor("super_admin"))).toBe(true);

    for (const role of ROLES) {
      if (
        role === "finance_officer" ||
        role === "president" ||
        role === "general_secretary" ||
        role === "super_admin"
      ) {
        continue;
      }
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

  it("reserves admin management (admin.manage) strictly to super_admin only", () => {
    for (const role of ROLES) {
      if (role === "super_admin") continue;
      expect(can(actor(role), "admin.manage")).toBe(false);
    }
    expect(can(actor("super_admin"), "admin.manage")).toBe(true);
  });

  it("grants full operational permissions to president and general_secretary", () => {
    for (const role of ["president", "general_secretary"] as const) {
      const executive = actor(role);
      expect(can(executive, "registration.manage")).toBe(true);
      expect(can(executive, "finance.read")).toBe(true);
      expect(can(executive, "roster.read_all")).toBe(true);
      expect(can(executive, "credential.issue")).toBe(true);
      expect(can(executive, "credential.override")).toBe(true);
      expect(can(executive, "export.bulk")).toBe(true);
      expect(can(executive, "admin.manage")).toBe(false);
      expect(can(executive, "grants.manage")).toBe(false);
    }
  });

  it("strictly confines gate marshal (security_checkin_officer) with zero financial or administrative access", () => {
    const gateMarshal = actor("security_checkin_officer");
    expect(can(gateMarshal, "credential.validate")).toBe(true);
    expect(can(gateMarshal, "credential.override")).toBe(true);
    expect(can(gateMarshal, "finance.read")).toBe(false);
    expect(can(gateMarshal, "admin.manage")).toBe(false);
    expect(can(gateMarshal, "roster.read_all")).toBe(false);
    expect(can(gateMarshal, "registration.manage")).toBe(false);
    expect(can(gateMarshal, "export.bulk")).toBe(false);
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

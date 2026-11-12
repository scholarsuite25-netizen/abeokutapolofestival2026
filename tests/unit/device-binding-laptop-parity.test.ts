import { describe, expect, it, beforeEach } from "vitest";
import {
  verifyPassDeviceBinding,
  resetPassDeviceBinding,
} from "@/lib/security/device-binding";

/**
 * Laptop registrants must receive exactly the same anti-transfer protection
 * as phone registrants:
 *
 *  - a laptop is a legitimate FIRST claimant (the pass is claimed for that
 *    machine, so it can never be forwarded to another one);
 *  - that laptop claim is PROVISIONAL: the guest may activate the pass on
 *    their phone exactly once, and the phone then becomes the final device;
 *  - after that, every other device — laptop or phone — is refused.
 */

const PASS = "ABK-2026-IVP01-S02-9XYZ";

describe("Device binding — laptop parity with phone", () => {
  beforeEach(() => {
    // Clear any binding left by a previous case.
    void resetPassDeviceBinding(PASS);
  });

  it("lets a laptop claim an unclaimed pass (it is not left transferable)", async () => {
    const res = await verifyPassDeviceBinding(PASS, "DESKTOP-laptop-1", "Guest One");

    expect(res.isAuthorized).toBe(true);
    expect(res.status).toBe("newly_bound");
    expect(res.boundDeviceId).toBe("DESKTOP-laptop-1");
  });

  it("refuses a SECOND laptop once the first laptop holds the pass", async () => {
    await verifyPassDeviceBinding(PASS, "DESKTOP-laptop-1", "Guest One");

    const second = await verifyPassDeviceBinding(PASS, "DESKTOP-laptop-2", "Guest One");
    expect(second.isAuthorized).toBe(false);
    expect(second.status).toBe("forwarding_blocked");
  });

  it("lets the guest activate the pass on their phone exactly once", async () => {
    await verifyPassDeviceBinding(PASS, "DESKTOP-laptop-1", "Guest One");

    const phone = await verifyPassDeviceBinding(PASS, "MOBILE-phone-1", "Guest One");
    expect(phone.isAuthorized).toBe(true);
    expect(phone.status).toBe("newly_bound");
    expect(phone.boundDeviceId).toBe("MOBILE-phone-1");
  });

  it("refuses a second phone after the phone took over", async () => {
    await verifyPassDeviceBinding(PASS, "DESKTOP-laptop-1", "Guest One");
    await verifyPassDeviceBinding(PASS, "MOBILE-phone-1", "Guest One");

    const other = await verifyPassDeviceBinding(PASS, "MOBILE-phone-2", "Guest One");
    expect(other.isAuthorized).toBe(false);
    expect(other.status).toBe("forwarding_blocked");
  });

  it("refuses the laptop once the phone holds the pass", async () => {
    await verifyPassDeviceBinding(PASS, "DESKTOP-laptop-1", "Guest One");
    await verifyPassDeviceBinding(PASS, "MOBILE-phone-1", "Guest One");

    const laptop = await verifyPassDeviceBinding(PASS, "DESKTOP-laptop-1", "Guest One");
    expect(laptop.isAuthorized).toBe(false);
    expect(laptop.status).toBe("forwarding_blocked");
  });

  it("allows the same device to come back (re-opening its own pass)", async () => {
    const first = await verifyPassDeviceBinding(PASS, "MOBILE-phone-1", "Guest One");
    expect(first.status).toBe("newly_bound");

    const again = await verifyPassDeviceBinding(PASS, "MOBILE-phone-1", "Guest One");
    expect(again.isAuthorized).toBe(true);
    expect(again.status).toBe("already_bound_to_this_device");
  });

  it("never lets a laptop take over a pass already locked to a phone", async () => {
    await verifyPassDeviceBinding(PASS, "MOBILE-phone-1", "Guest One");

    const laptop = await verifyPassDeviceBinding(PASS, "DESKTOP-laptop-9", "Guest One");
    expect(laptop.isAuthorized).toBe(false);
    expect(laptop.status).toBe("forwarding_blocked");
  });

  it("leaves the table host master pass unrestricted", async () => {
    const host = await verifyPassDeviceBinding(
      "ABK-2026-IVP01-S01-HOST1",
      "DESKTOP-laptop-1",
      "Host Guest",
    );
    expect(host.isAuthorized).toBe(true);
    expect(host.status).toBe("unrestricted");
  });
});

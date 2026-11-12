/**
 * Device classes.
 *
 * A laptop is a legitimate first claimant (guests register and pay on a
 * laptop), so a desktop claim is allowed — but it is PROVISIONAL: the pass may
 * still be handed over, exactly once, to the guest's phone (which becomes the
 * final device). After that the pass is locked, exactly like a pass claimed on
 * a phone from the start.
 *
 * Kept in its own module (no "use server") so it can be used from both server
 * and client code without becoming a Server Action.
 */

export function isDesktopDeviceId(deviceId: string): boolean {
  return deviceId.startsWith("DESKTOP-");
}

export function isMobileDeviceId(deviceId: string): boolean {
  return deviceId.startsWith("MOBILE-");
}

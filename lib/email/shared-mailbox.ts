/**
 * Where club-only messages are delivered.
 *
 * The club's staff logins live on `abeokutapolo2026.ng` — a name that is not
 * a registered domain, so no mail can ever be delivered to it. The website
 * lives on `abeokutapolofestival2026.org.ng`, which now has working mail
 * routing but still no mailbox behind it.
 *
 * The club's decision is therefore: every code and reset message for a club
 * address is delivered to ONE shared mailbox the club controls, and each
 * person collects their code from there.
 */

/** Domains owned by the club. Addresses on these are login identities only. */
export const CLUB_DOMAINS = ["abeokutapolo2026.ng", "abeokutapolofestival2026.org.ng"];

/** The one mailbox the club watches for codes and reset messages. */
export function sharedMailbox(): string {
  return (process.env.SIGNIN_CODE_SHARED_MAILBOX || "abeokutapolo@gmail.com").trim();
}

/** True when the address belongs to the club rather than to a person. */
export function isClubAddress(address: string): boolean {
  const domain = address.trim().toLowerCase().split("@")[1] ?? "";
  return CLUB_DOMAINS.includes(domain);
}

/**
 * The address a message for this account should be sent to.
 * Club addresses go to the shared mailbox; personal addresses go to themselves.
 */
export function deliveryAddressFor(accountEmail: string): string {
  return isClubAddress(accountEmail) ? sharedMailbox() : accountEmail.trim().toLowerCase();
}

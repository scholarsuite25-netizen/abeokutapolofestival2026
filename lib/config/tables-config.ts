/**
 * Day 3 Exclusive Table Packages Configuration — Single Source of Truth
 * Abeokuta Polo Festival 2026 Grand Finale — The Blueprint (20 Dec 2026)
 *
 * Each package reserves a private, serial-numbered table for 10 guests.
 * Pricing: Official prestige value is displayed alongside the active pilot testing fee (₦100.00).
 */

export interface TablePackage {
  id: "kings_table" | "royal_table" | "queens_table" | "premium_table" | "individual_vip";
  name: string;
  tagline: string;
  officialPriceNgn: number;
  officialPriceDisplay: string;
  testingPriceNgn: number;
  testingPriceDisplay: string;
  guestCapacity: number;
  tableCount: number;
  tablePrefix: string;
  enclosure: string;
  themeColor: "gold" | "emerald" | "rose" | "indigo" | "amber";
  badge: string;
  features: string[];
}

export const DAY3_TABLE_PACKAGES: Record<string, TablePackage> = {
  individual_vip: {
    id: "individual_vip",
    name: "Individual VIP Table Seat",
    tagline: "Individual VIP Table Enclosure Seating · Day 3 Grand Finale",
    officialPriceNgn: 50_000,
    officialPriceDisplay: "₦50,000",
    testingPriceNgn: 100,
    testingPriceDisplay: "₦100.00",
    guestCapacity: 1,
    tableCount: 200,
    tablePrefix: "VIP Seat",
    enclosure: "VIP Table Enclosures (Individual Option)",
    themeColor: "gold",
    badge: "Individual VIP · 1 Guest",
    features: [
      "1 distinct HMAC-256 Turnstile ID Access Card with Device-Locked Anti-Forwarding",
      "Reserved individual seating within premium Day 3 VIP Table Enclosure",
      "Full access to the Day 3 Royal Cup Grand Finale & 100 Kings Celebration",
      "VIP hospitality, gourmet banquet service & champagne pairing",
      "Priority fast-track turnstile ingress & security clearance",
      "Access to post-match royal celebration concert with ARISTOS BAND & BERRYOLA",
    ],
  },
  kings_table: {
    id: "kings_table",
    name: "The Kings Table",
    tagline: "Ultra-Exclusive VIP Experience · Royal Dais Enclosure",
    officialPriceNgn: 10_000_000,
    officialPriceDisplay: "₦10,000,000",
    testingPriceNgn: 100,
    testingPriceDisplay: "₦100.00",
    guestCapacity: 10,
    tableCount: 5,
    tablePrefix: "Kings Table",
    enclosure: "Kings Arena & Royal Dais",
    themeColor: "gold",
    badge: "Kings Arena · 10 Guests",
    features: [
      "10 distinct HMAC-256 Turnstile ID Access Cards with Device-Locked Anti-Forwarding",
      "Pitch-side front-row Kings Arena private table enclosure",
      "Pre-reserved Royal VIP parking (5 dedicated bays)",
      "Vintage Champagne reception & five-course gourmet banquet service",
      "Dedicated private butler & concierge team throughout Day 3",
      "Official commemoration Royal Cup program & VIP gift presentation",
    ],
  },
  royal_table: {
    id: "royal_table",
    name: "The Royal Table",
    tagline: "Luxury Hospitality & Pitch-side Marquee Seating",
    officialPriceNgn: 5_000_000,
    officialPriceDisplay: "₦5,000,000",
    testingPriceNgn: 100,
    testingPriceDisplay: "₦100.00",
    guestCapacity: 10,
    tableCount: 10,
    tablePrefix: "Royal Table",
    enclosure: "Royal Enclosure Pavilion",
    themeColor: "emerald",
    badge: "Royal Pavilion · 10 Guests",
    features: [
      "10 distinct HMAC-256 Turnstile ID Access Cards with Device-Locked Anti-Forwarding",
      "Prime pitch-side Royal Pavilion reserved table for 10",
      "VIP parking passes (3 dedicated bays)",
      "Continuous Champagne service & curated luxury menu",
      "Dedicated hospitality waitstaff",
      "Festival commemorative editions & accreditation",
    ],
  },
  queens_table: {
    id: "queens_table",
    name: "The Queens Table",
    tagline: "Signature Society & Ladies Pavilion Experience",
    officialPriceNgn: 3_000_000,
    officialPriceDisplay: "₦3,000,000",
    testingPriceNgn: 100,
    testingPriceDisplay: "₦100.00",
    guestCapacity: 10,
    tableCount: 10,
    tablePrefix: "Queens Table",
    enclosure: "Queens Lounge & Garden Pavilion",
    themeColor: "rose",
    badge: "Queens Lounge · 10 Guests",
    features: [
      "10 distinct HMAC-256 Turnstile ID Access Cards with Device-Locked Anti-Forwarding",
      "Curated high-fashion & society pavilion reserved table",
      "Signature craft cocktails & artisanal champagne pairing",
      "Gourmet grazing tables & dessert styling",
      "Preferred VIP parking (2 dedicated bays)",
      "Exclusive tournament floral gifting & photo opportunities",
    ],
  },
  premium_table: {
    id: "premium_table",
    name: "The Premium Table",
    tagline: "Premium Festival Experience · Reserved Elevated Seating",
    officialPriceNgn: 1_500_000,
    officialPriceDisplay: "₦1,500,000",
    testingPriceNgn: 100,
    testingPriceDisplay: "₦100.00",
    guestCapacity: 10,
    tableCount: 20,
    tablePrefix: "Premium Table",
    enclosure: "Clubhouse Terrace & Grandstand",
    themeColor: "indigo",
    badge: "Clubhouse Terrace · 10 Guests",
    features: [
      "10 distinct HMAC-256 Turnstile ID Access Cards with Device-Locked Anti-Forwarding",
      "Elevated Clubhouse Terrace reserved table for 10",
      "Gourmet food & beverage hospitality package",
      "Fast-track VIP gate check-in",
      "Reserved VIP parking (2 bays)",
      "Unrestricted pitch-side view of the Grand Finale chukkas",
    ],
  },
};

export const TABLE_PACKAGE_LIST = Object.values(DAY3_TABLE_PACKAGES);

export function getTablePackage(packageId: string): TablePackage | undefined {
  return DAY3_TABLE_PACKAGES[packageId];
}

/**
 * Generates serial table labels for a package (e.g. ['Kings Table 01', 'Kings Table 02', ...])
 */
export function getTableSerialList(packageId: string): string[] {
  const pkg = getTablePackage(packageId);
  if (!pkg) return [];
  const list: string[] = [];
  for (let i = 1; i <= pkg.tableCount; i++) {
    const pad = i.toString().padStart(2, "0");
    list.push(`${pkg.tablePrefix} ${pad}`);
  }
  return list;
}

export function formatTablePriceNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

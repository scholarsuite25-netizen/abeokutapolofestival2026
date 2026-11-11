/**
 * Day 3 Exclusive Table & Hospitality Packages Configuration — Single Source of Truth
 * Abeokuta Polo Festival 2026 Grand Finale — The Blueprint (20 Dec 2026)
 *
 * Official Brochure Categories:
 * 1. THE KINGS TABLE (Ultra-Exclusive VIP Experience) — 10 Guests, 10 Parking Vehicles — ₦5,000,000
 * 2. THE ROYAL TABLE (Luxury Hospitality Experience) — 8 Guests, 5 Parking Vehicles — ₦3,000,000
 * 3. THE QUEENS TABLE (Signature Ladies’ Experience) — 6 Guests — ₦2,000,000
 * 4. THE PREMIUM TABLE (Premium Festival Experience) — 5 Guests — ₦500,000
 * 5. THE REGULAR SECTION (General Festival Experience) — Per Person (1 Guest) — ₦50,000
 *
 * Pricing: Official brochure value is displayed alongside the toggleable ₦100.00 pilot testing fee
 * (which automatically disables itself after a successful ₦100 test payment).
 */

export interface TablePackage {
  id: "kings_table" | "royal_table" | "queens_table" | "premium_table" | "individual_vip";
  categoryNumber: number;
  name: string;
  tagline: string;
  officialPriceNgn: number;
  officialPriceDisplay: string;
  testingPriceNgn: number;
  testingPriceDisplay: string;
  guestCapacity: number;
  parkingVehicles?: number;
  tableCount: number;
  tablePrefix: string;
  enclosure: string;
  themeColor: "gold" | "emerald" | "rose" | "indigo" | "amber";
  badge: string;
  features: string[];
}

export const DAY3_TABLE_PACKAGES: Record<string, TablePackage> = {
  kings_table: {
    id: "kings_table",
    categoryNumber: 1,
    name: "The Kings Table",
    tagline: "Ultra-Exclusive VIP Experience",
    officialPriceNgn: 5_000_000,
    officialPriceDisplay: "₦5,000,000",
    testingPriceNgn: 100,
    testingPriceDisplay: "₦100.00",
    guestCapacity: 10,
    parkingVehicles: 10,
    tableCount: 5,
    tablePrefix: "Kings Table",
    enclosure: "Kings Arena & Royal and Kings Hospitality Lounge",
    themeColor: "gold",
    badge: "Kings Arena · 10 Guests",
    features: [
      "Premium VIP seating within the Kings Arena.",
      "Exclusive table for 10 guests.",
      "Special royal hospitality with dedicated attendants.",
      "Premium food and beverage service.",
      "Exclusive access to the Royal and Kings Hospitality Lounge.",
      "Personalised table branding.",
      "Priority access to the Grand Finale.",
      "Special recognition in the official festival programme.",
      "Exclusive photo opportunities with distinguished dignitaries.",
      "Dedicated VIP parking allocation for 10 vehicles.",
    ],
  },
  royal_table: {
    id: "royal_table",
    categoryNumber: 2,
    name: "The Royal Table",
    tagline: "Luxury Hospitality Experience",
    officialPriceNgn: 3_000_000,
    officialPriceDisplay: "₦3,000,000",
    testingPriceNgn: 100,
    testingPriceDisplay: "₦100.00",
    guestCapacity: 8,
    parkingVehicles: 5,
    tableCount: 10,
    tablePrefix: "Royal Table",
    enclosure: "VVIP Hospitality Section",
    themeColor: "emerald",
    badge: "VVIP Hospitality · 8 Guests",
    features: [
      "Exclusive table for 8 guests.",
      "Premium seating within the VVIP Hospitality Section.",
      "Premium buffet and refreshments.",
      "Dedicated hospitality service.",
      "Personalised table branding.",
      "VIP parking allocation for 5 vehicles.",
      "Priority access to festival activities.",
      "Official festival souvenir package.",
    ],
  },
  queens_table: {
    id: "queens_table",
    categoryNumber: 3,
    name: "The Queens Table",
    tagline: "Signature Ladies’ Experience",
    officialPriceNgn: 2_000_000,
    officialPriceDisplay: "₦2,000,000",
    testingPriceNgn: 100,
    testingPriceDisplay: "₦100.00",
    guestCapacity: 6,
    parkingVehicles: 0,
    tableCount: 10,
    tablePrefix: "Queens Table",
    enclosure: "Queens Polo Hospitality Enclosure",
    themeColor: "rose",
    badge: "Queens Experience · 6 Guests",
    features: [
      "Exclusive table for 6 guests.",
      "Premium seating with excellent views of the polo activities.",
      "Special ladies’ hospitality experience.",
      "Premium dining and refreshments.",
      "Personalised table branding.",
      "Dedicated hospitality attendants.",
      "Access to designated Queens Polo experiences.",
      "Exclusive festival souvenirs.",
    ],
  },
  premium_table: {
    id: "premium_table",
    categoryNumber: 4,
    name: "The Premium Table",
    tagline: "Premium Festival Experience",
    officialPriceNgn: 500_000,
    officialPriceDisplay: "₦500,000",
    testingPriceNgn: 100,
    testingPriceDisplay: "₦100.00",
    guestCapacity: 5,
    parkingVehicles: 0,
    tableCount: 20,
    tablePrefix: "Premium Table",
    enclosure: "Reserved Premium Festival Seating",
    themeColor: "indigo",
    badge: "Premium Seating · 5 Guests",
    features: [
      "Reserved table for 5 guests.",
      "Reserved premium festival seating.",
      "Food and beverage package.",
      "Access to the main festival viewing area.",
      "Dedicated table service.",
      "Festival souvenir package.",
    ],
  },
  individual_vip: {
    id: "individual_vip",
    categoryNumber: 5,
    name: "The Regular Section",
    tagline: "General Festival Experience",
    officialPriceNgn: 50_000,
    officialPriceDisplay: "₦50,000",
    testingPriceNgn: 100,
    testingPriceDisplay: "₦100.00",
    guestCapacity: 1,
    parkingVehicles: 0,
    tableCount: 200,
    tablePrefix: "Regular Pass",
    enclosure: "Festival Viewing Area & Designated Public Seating",
    themeColor: "amber",
    badge: "Regular Section · Per Person",
    features: [
      "General admission to the festival viewing area.",
      "Access to designated public seating areas, subject to availability.",
      "Opportunity to enjoy the polo matches and festival entertainment.",
      "Access to designated food and beverage vendors at prevailing prices.",
      "Opportunity to experience cultural performances and other festival activities.",
    ],
  },
};

export const TABLE_PACKAGE_LIST = Object.values(DAY3_TABLE_PACKAGES);

export function getTablePackage(packageId: string): TablePackage | undefined {
  if (packageId === "regular_section") {
    return DAY3_TABLE_PACKAGES.individual_vip;
  }
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

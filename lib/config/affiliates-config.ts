/**
 * International Affiliate Centre Configuration
 * Abeokuta Polo Festival 2026 — The Blueprint
 *
 * Affiliates earn 10% commission on confirmed festival tickets and table packages.
 * Includes global payout options, marketing promotion kit, and ticketing agency directory.
 */

export const AFFILIATE_COMMISSION_RATE = 0.10; // 10%

export interface CommissionTier {
  categoryName: string;
  officialPackageValueNgn: number;
  officialCommissionNgn: number;
  description: string;
}

export const AFFILIATE_COMMISSION_TIERS: CommissionTier[] = [
  {
    categoryName: "The Kings Table (10 Guests)",
    officialPackageValueNgn: 5_000_000,
    officialCommissionNgn: 500_000,
    description: "Ultra-Exclusive VIP Experience within the Kings Arena (10 Guests, 10 VIP parking vehicles).",
  },
  {
    categoryName: "The Royal Table (8 Guests)",
    officialPackageValueNgn: 3_000_000,
    officialCommissionNgn: 300_000,
    description: "Luxury Hospitality Experience within the VVIP Hospitality Section (8 Guests, 5 VIP parking vehicles).",
  },
  {
    categoryName: "The Queens Table (6 Guests)",
    officialPackageValueNgn: 2_000_000,
    officialCommissionNgn: 200_000,
    description: "Signature Ladies’ Experience with premium dining and Queens Polo access (6 Guests).",
  },
  {
    categoryName: "The Premium Table (5 Guests)",
    officialPackageValueNgn: 500_000,
    officialCommissionNgn: 50_000,
    description: "Premium Festival Experience with reserved seating and food & beverage package (5 Guests).",
  },
  {
    categoryName: "The Regular Section (Day 3 Individual Pass)",
    officialPackageValueNgn: 50_000,
    officialCommissionNgn: 5_000,
    description: "General Festival Experience — ₦50,000 Per Person admission to the festival viewing area.",
  },
];

export interface SupportedCountry {
  code: string;
  name: string;
  currency: string;
  region: "Nigeria" | "Africa" | "Europe" | "North America" | "Middle East" | "International";
}

export const SUPPORTED_AFFILIATE_COUNTRIES: SupportedCountry[] = [
  { code: "NG", name: "Nigeria", currency: "NGN", region: "Nigeria" },
  { code: "GB", name: "United Kingdom", currency: "GBP", region: "Europe" },
  { code: "US", name: "United States", currency: "USD", region: "North America" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", region: "Middle East" },
  { code: "ZA", name: "South Africa", currency: "ZAR", region: "Africa" },
  { code: "GH", name: "Ghana", currency: "GHS", region: "Africa" },
  { code: "KE", name: "Kenya", currency: "KES", region: "Africa" },
  { code: "CA", name: "Canada", currency: "CAD", region: "North America" },
  { code: "FR", name: "France", currency: "EUR", region: "Europe" },
  { code: "DE", name: "Germany", currency: "EUR", region: "Europe" },
  { code: "OTHER", name: "Other International", currency: "USD", region: "International" },
];

export interface TicketingAgency {
  id: string;
  name: string;
  scope: "Nigeria" | "International";
  website: string;
  tagline: string;
  keyStrengths: string[];
  headquarters: string;
  integrationNote: string;
}

export const TICKETING_AGENCIES: TicketingAgency[] = [
  // ── Nigerian Agencies ──────────────────────────────────────────────────
  {
    id: "nairabox",
    name: "Nairabox",
    scope: "Nigeria",
    website: "https://www.nairabox.com",
    tagline: "Nigeria's leading digital lifestyle, entertainment & live event ticketing network",
    headquarters: "Lagos, Nigeria",
    keyStrengths: [
      "Extensive mobile app user base across Lagos, Abuja, and Port Harcourt",
      "Seamless bank USSD and quick mobile wallet payments",
      "Robust physical turnstile validation hardware integration",
    ],
    integrationNote: "Ideal for mass outreach to affluent urban youth and young executives attending Days 1 and 2.",
  },
  {
    id: "ariiya",
    name: "Ariiya Tickets",
    scope: "Nigeria",
    website: "https://ariiyatickets.com",
    tagline: "Premier box office for high-profile concerts, cultural pageantry & VIP galas",
    headquarters: "Lagos, Nigeria",
    keyStrengths: [
      "Strong track record with high-net-worth society galas and cultural festivals",
      "VIP seat reservation and customized hospitality box office distribution",
      "Over-the-counter sales points at premier hotels and shopping malls",
    ],
    integrationNote: "Direct synergy for marketing Queens Table and Royal Table hospitality packages.",
  },
  {
    id: "tix-africa",
    name: "Tix Africa",
    scope: "Nigeria",
    website: "https://tix.africa",
    tagline: "Modern creator-first event ticketing and experiential community hub in West Africa",
    headquarters: "Lagos, Nigeria & Accra, Ghana",
    keyStrengths: [
      "Clean mobile-first UX with instant digital pass issuance",
      "Integrated marketing emails and attendee discovery newsletters",
      "Self-service scanning app compatible with mobile turnstiles",
    ],
    integrationNote: "Excellent for tech enthusiasts, creative entrepreneurs, and polo lifestyle newcomers.",
  },
  {
    id: "quickteller",
    name: "Quickteller Events (Interswitch)",
    scope: "Nigeria",
    website: "https://events.quickteller.com",
    tagline: "Enterprise ticketing backed by Nigeria's largest electronic payment infrastructure",
    headquarters: "Lagos, Nigeria",
    keyStrengths: [
      "Ubiquitous reach through thousands of Nigerian bank ATMs and Quickteller kiosks",
      "Highest corporate enterprise trust for institutional transactions",
      "Direct settlement into Abeokuta Polo Club WEMA Bank bursary account",
    ],
    integrationNote: "Recommended for corporate conglomerates buying Kings and Royal Tables by direct invoice.",
  },
  {
    id: "afritickets",
    name: "Afritickets",
    scope: "Nigeria",
    website: "https://www.afritickets.com",
    tagline: "Pioneering Pan-African e-ticketing platform for premium sports and exhibitions",
    headquarters: "Lagos, Nigeria",
    keyStrengths: [
      "Extensive background in equestrian, polo, and sporting tournament ticketing",
      "Cross-border West African card processing (GHS, NGN, XOF)",
      "High reliability for peak-load on-demand pass generation",
    ],
    integrationNote: "Natural alignment with tournament spectators and regional sports delegations.",
  },
  {
    id: "eventprime",
    name: "Eventprime",
    scope: "Nigeria",
    website: "https://eventprime.co",
    tagline: "Comprehensive event management, access control and promotional ticketing gateway",
    headquarters: "Lagos, Nigeria",
    keyStrengths: [
      "Dynamic social affiliate commission tracking built into event pages",
      "Automated SMS and WhatsApp ticket delivery",
      "Real-time turnstile capacity and scan heatmaps",
    ],
    integrationNote: "Great for independent lifestyle affiliates and tournament ambassadors.",
  },

  // ── International Agencies ─────────────────────────────────────────────
  {
    id: "eventbrite",
    name: "Eventbrite",
    scope: "International",
    website: "https://www.eventbrite.com",
    tagline: "The world's largest event discovery marketplace and global ticketing leader",
    headquarters: "San Francisco, USA (Worldwide)",
    keyStrengths: [
      "Global brand recognition with millions of active international travelers",
      "Multi-currency checkout (USD, GBP, EUR, CAD, AUD)",
      "Vast diaspora audience searching for Nigerian cultural and heritage events",
    ],
    integrationNote: "Primary international portal for UK, US, and European diaspora guests booking travel.",
  },
  {
    id: "ticketmaster-africa",
    name: "Ticketmaster Africa / Live Nation",
    scope: "International",
    website: "https://www.ticketmaster.co.za",
    tagline: "Global sports and live entertainment authority with expanding Pan-African operations",
    headquarters: "Johannesburg, South Africa & London, UK",
    keyStrengths: [
      "Enterprise digital ticketing with SafeTix dynamic encrypted barcoding",
      "Global partnerships with international travel concierges and airlines",
      "Massive African entertainment footprint connecting South Africa, Kenya, and Nigeria",
    ],
    integrationNote: "Ideal for international equestrian travel packages and VIP hospitality syndicates.",
  },
  {
    id: "stubhub",
    name: "StubHub International",
    scope: "International",
    website: "https://www.stubhub.international",
    tagline: "World's top marketplace for premium sporting tournaments and luxury hospitality",
    headquarters: "Madrid, Spain & New York, USA",
    keyStrengths: [
      "100% buyer guarantee on authenticated high-value sports passes",
      "Active international clientele accustomed to five-figure luxury sport suites",
      "Comprehensive multi-language and global VIP customer care",
    ],
    integrationNote: "Strong channel for high-tier international resale of Kings and Royal Table allocations.",
  },
  {
    id: "fever",
    name: "Fever",
    scope: "International",
    website: "https://feverup.com",
    tagline: "Curated experiential entertainment discovery platform operating in 100+ cities",
    headquarters: "London, UK & Madrid, Spain",
    keyStrengths: [
      "Proprietary recommendation algorithm targeting affluent experience seekers",
      "Secret London / Secret NYC media network amplification",
      "High mobile conversion for exclusive society galas and royal exhibitions",
    ],
    integrationNote: "Excellent for promoting Abeokuta Polo Festival cultural tours to international tourists.",
  },
  {
    id: "universe",
    name: "Universe (A Ticketmaster Company)",
    scope: "International",
    website: "https://www.universe.com",
    tagline: "Experiential ticketing platform engineered for advanced branding and social virality",
    headquarters: "Toronto, Canada",
    keyStrengths: [
      "White-label embeddable widgets that preserve royal polo visual identity",
      "Direct integration with social ad pixels and custom affiliate tracking",
      "Flexible group and table seating reservation maps",
    ],
    integrationNote: "Recommended for embedding directly onto international sponsor websites.",
  },
  {
    id: "platinumlist",
    name: "Platinumlist",
    scope: "International",
    website: "https://platinumlist.net",
    tagline: "The premier luxury ticketing and VIP concierge platform in the UAE & Gulf region",
    headquarters: "Dubai, United Arab Emirates",
    keyStrengths: [
      "Unrivalled reach among equestrian, polo, and royal hospitality enthusiasts in Dubai and Abu Dhabi",
      "Accepts GCC payment methods (Apple Pay, Tabby, Tamara, KNET)",
      "High average order value specializing in ₦5M+ VIP table packages",
    ],
    integrationNote: "Essential bridge for royal polo patrons and diaspora executives traveling from the UAE.",
  },
];

export interface PromoTemplate {
  title: string;
  channel: "WhatsApp" | "X / Twitter" | "Instagram" | "LinkedIn";
  copyText: string;
}

export function getPromoTemplates(affiliateCode: string, siteUrl: string): PromoTemplate[] {
  const tableLink = `${siteUrl}/tables?ref=${affiliateCode}`;
  const registerLink = `${siteUrl}/register?ref=${affiliateCode}`;

  return [
    {
      title: "WhatsApp VIP Table Broadcast",
      channel: "WhatsApp",
      copyText: `👑 *ABEOKUTA POLO FESTIVAL 2026 — THE BLUEPRINT*
*Dates:* 18–20 December 2026 | Abeokuta, Ogun State

Experience an exceptional fusion of heritage, royalty, sporting excellence and luxury hospitality at the Abeokuta Polo Festival 2026 — THE BLUEPRINT.

🌟 *Grand Finale (20 Dec 2026) Exclusive Table & Hospitality Packages:*
• *The Kings Table* (10 Guests · 10 VIP Parking Vehicles) — ₦5,000,000
• *The Royal Table* (8 Guests · 5 VIP Parking Vehicles) — ₦3,000,000
• *The Queens Table* (6 Guests · Signature Ladies’ Experience) — ₦2,000,000
• *The Premium Table* (5 Guests · Premium Festival Experience) — ₦500,000
• *The Regular Section* (General Festival Experience) — ₦50,000 Per Person

🛡️ Reserve your hospitality package with verified device-locked turnstile passes:
👉 ${tableLink}

Complimentary Day 1 & Day 2 passes available here:
👉 ${registerLink}

_Inquiries & Reservations: Abeokuta Polo Club Secretariat_`,
    },
    {
      title: "LinkedIn Executive Invitation",
      channel: "LinkedIn",
      copyText: `Prestigious networking meets world-class equestrian tradition: The 2026 Abeokuta Polo Festival — "The Blueprint" (18–20 December 2026).

Corporate organisations, families, and distinguished personalities can now secure Exclusive Table & Hospitality Packages for the Grand Finale (20 December 2026):
- The Kings Table (Ultra-Exclusive VIP Experience · 10 Guests · ₦5,000,000)
- The Royal Table (Luxury Hospitality Experience · 8 Guests · ₦3,000,000)
- The Queens Table (Signature Ladies’ Experience · 6 Guests · ₦2,000,000)
- The Premium Table (Premium Festival Experience · 5 Guests · ₦500,000)
- The Regular Section (General Festival Experience · ₦50,000 Per Person)

Reserve your allocation: ${tableLink}

#AbeokutaPolo2026 #CorporateHospitality #PoloFestival #TheBlueprint #ExecutiveLeadership`,
    },
    {
      title: "X (Twitter) Hype Post",
      channel: "X / Twitter",
      copyText: `The grandest polo spectacle in Ogun State history is here: 2026 Abeokuta Polo Festival (18–20 Dec)! 🐎✨

Day 1 & Day 2 Free Passes are open. Grand Finale Hospitality Packages (Kings, Royal, Queens, Premium Tables & Regular Section) now available.

Lock in your table before allocations close:
${tableLink}

#AbeokutaPolo2026 #PoloFestival`,
    },
    {
      title: "Instagram Caption & Bio Copy",
      channel: "Instagram",
      copyText: `Heritage. Royalty. Sporting Excellence. 🐎🏆
Welcome to the 2026 Abeokuta Polo Festival — "The Blueprint" (18–20 December 2026).

Grand Finale (20 Dec) Exclusive Hospitality Packages are now open:
✨ The Kings Table (10 Guests · ₦5,000,000)
✨ The Royal Table (8 Guests · ₦3,000,000)
✨ The Queens Table (6 Guests · ₦2,000,000)
✨ The Premium Table (5 Guests · ₦500,000)
✨ The Regular Section (₦50,000 Per Person)

Link in bio to reserve your hospitality package or claim complimentary Day 1 & 2 Passes! 
🔗 ${tableLink}

#AbeokutaPolo #PoloFestival2026 #RoyalCup #LuxuryLifestyle #Abeokuta`,
    },
  ];
}

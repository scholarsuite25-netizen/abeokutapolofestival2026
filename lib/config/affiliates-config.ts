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
  testingPriceNgn: number;
  testingCommissionNgn: number;
  description: string;
}

export const AFFILIATE_COMMISSION_TIERS: CommissionTier[] = [
  {
    categoryName: "The Kings Table (10 Guests)",
    officialPackageValueNgn: 10_000_000,
    officialCommissionNgn: 1_000_000,
    testingPriceNgn: 100,
    testingCommissionNgn: 10,
    description: "Ultra-exclusive private table enclosure at Kings Arena with vintage champagne banquet.",
  },
  {
    categoryName: "The Royal Table (10 Guests)",
    officialPackageValueNgn: 5_000_000,
    officialCommissionNgn: 500_000,
    testingPriceNgn: 100,
    testingCommissionNgn: 10,
    description: "Pitch-side Royal Pavilion luxury table with 10 VIP turnstile accreditation cards.",
  },
  {
    categoryName: "The Queens Table (10 Guests)",
    officialPackageValueNgn: 3_000_000,
    officialCommissionNgn: 300_000,
    testingPriceNgn: 100,
    testingCommissionNgn: 10,
    description: "Signature Society & Ladies Pavilion experience with floral gifting & cocktail service.",
  },
  {
    categoryName: "The Premium Table (10 Guests)",
    officialPackageValueNgn: 1_500_000,
    officialCommissionNgn: 150_000,
    testingPriceNgn: 100,
    testingCommissionNgn: 10,
    description: "Elevated Clubhouse Terrace reserved table for 10 with gourmet hospitality.",
  },
  {
    categoryName: "Day 3 Individual VVIP Pass",
    officialPackageValueNgn: 50_000,
    officialCommissionNgn: 5_000,
    testingPriceNgn: 100,
    testingCommissionNgn: 10,
    description: "Individual VIP grand finale entry pass with royal grandstand seating.",
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
*Dates:* 18–20 December 2026 | Abeokuta Polo Club

Experience the pinnacle of royal heritage, pitch-side glamour, and championship polo. 

🌟 *Exclusive Day 3 VIP Table Packages (10 Guests Each):*
• *The Kings Table* — Kings Arena & Royal Dais front-row luxury
• *The Royal Table* — Prime Royal Pavilion & champagne service
• *The Queens Table* — Signature Society & Ladies Pavilion
• *The Premium Table* — Clubhouse Terrace reserved hospitality

🛡️ Reserve your table of 10 with verified device-locked turnstile passes:
👉 ${tableLink}

Complimentary Day 1 & Day 2 passes available here:
👉 ${registerLink}

_Inquiries & Reservations: Abeokuta Polo Club Secretariat_`,
    },
    {
      title: "LinkedIn Executive Invitation",
      channel: "LinkedIn",
      copyText: `Prestigious networking meets world-class equestrian tradition: The 2026 Abeokuta Polo Festival — "The Blueprint" (18–20 December 2026).

Corporate organisations and executive leaders can now secure exclusive pitch-side Table Enclosures for 10 guests at the Day 3 Grand Finale:
- The Kings Table (Royal Dais Enclosure)
- The Royal Table (Pitch-side Marquee Seating)
- The Queens Table (High-Fashion Society Pavilion)
- The Premium Table (Elevated Clubhouse Terrace)

Each package includes 10 encrypted digital turnstile credentials with anti-forwarding security.

Reserve your table allocation: ${tableLink}

#AbeokutaPolo2026 #CorporateHospitality #PoloFestival #TheBlueprint #ExecutiveLeadership`,
    },
    {
      title: "X (Twitter) Hype Post",
      channel: "X / Twitter",
      copyText: `The grandest polo spectacle in Ogun State history is here: 2026 Abeokuta Polo Festival (18–20 Dec)! 🐎✨

Day 1 & Day 2 Free Passes are open. Exclusive Day 3 VIP Tables of 10 (Kings, Royal, Queens & Premium Tables) now available.

Lock in your table before allocations close:
${tableLink}

#AbeokutaPolo2026 #PoloFestival`,
    },
    {
      title: "Instagram Caption & Bio Copy",
      channel: "Instagram",
      copyText: `Heritage. High Fashion. Royalty. 🐎🏆
Welcome to the 2026 Abeokuta Polo Festival — "The Blueprint" (18–20 December 2026).

Day 3 Grand Finale VIP Tables (10 Guests) are now open for reservation:
✨ The Kings Table · Kings Arena
✨ The Royal Table · Royal Pavilion
✨ The Queens Table · Society Pavilion
✨ The Premium Table · Clubhouse Terrace

Link in bio to reserve your VIP Table or claim complimentary Day 1 & 2 Passes! 
🔗 ${tableLink}

#AbeokutaPolo #PoloFestival2026 #RoyalCup #LuxuryLifestyle #Abeokuta`,
    },
  ];
}

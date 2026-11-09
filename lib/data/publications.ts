export const PUBLICATION_CATEGORIES = [
  "all",
  "programmes",
  "guides",
] as const;

export type PublicationCategory = (typeof PUBLICATION_CATEGORIES)[number];

export interface PublicationItem {
  id: string;
  category: PublicationCategory;
  categoryLabel: string;
  badge: string;
  title: string;
  subtitle: string;
  date: string;
  pages: number;
  format: string;
  summary: string;
  isFeatured?: boolean;
  chapters: string[];
  securityClearance?: string;
  downloadUrl?: string;
}

export const PUBLICATIONS_DATA: PublicationItem[] = [
  {
    id: "programme-schedule-2026",
    category: "programmes",
    categoryLabel: "Tournament Programme",
    badge: "Official Tournament Programme",
    title: "2026 Abeokuta Polo Festival Official 3-Day Programme",
    subtitle: "Approved Festival Itinerary (18–20 December 2026)",
    date: "December 2026",
    pages: 3,
    format: "Official PDF Document",
    isFeatured: true,
    securityClearance: "Public Secretariat Release",
    summary:
      "The official reference schedule for the 2026 festival season. Details the 3-day ceremonial calendar, daily admission guidelines, foundation-laying ceremonies, and the Royal Cup championship presentation under the auspices of HRM The Alake of Egbaland.",
    chapters: [
      "Day 1 (Friday 18 Dec): Media Conference, Tour & Festival Light-Up (100% Free Public Entry)",
      "Day 2 (Saturday 19 Dec): Royal Opening by HRM The Alake & Three Foundation-Layings (Through Ticket)",
      "Day 3 (Sunday 20 Dec): The Grand Finale, Royal Cup Championship & Awards Gala (Through Ticket / VVIP)",
      "Daily Gate Turnstile Hours: Ingress begins at 10:00 AM daily",
      "Venue: Abeokuta Polo Club & Country Resort, Kobape, Ogun State",
      "Secretariat Contact: +234 818 188 8884 · 0803 681 8916 · abeokutapolo@gmail.com",
    ],
    downloadUrl: "/api/programme/pdf",
  },
  {
    id: "corporate-blueprint",
    category: "programmes",
    categoryLabel: "Commercial Partnership",
    badge: "Commercial Prospectus",
    title: "The Blueprint: Sponsorship & Corporate Partnership Matrix",
    subtitle: "Commercial Investment & Activation Schedule",
    date: "2026 Season",
    pages: 12,
    format: "Commercial Document",
    securityClearance: "Corporate Secretariat",
    summary:
      "Official sponsorship properties, hospitality chalet allocations, branding tiers, and signature royal property naming rights for corporate partners and patrons.",
    chapters: [
      "Title Partner (₦75,000,000) & Presenting Partner (₦40,000,000)",
      "Royal Cup Partner (₦25,000,000) & Platinum Properties (₦15,000,000)",
      "Gold Properties (₦8,000,000) & Silver Partners (₦4,000,000)",
      "Official Category Partners (₦2,500,000)",
      "Hospitality Chalets (₦1,500,000) & Royal Patrons' Circle (₦500,000)",
      "Sponsorship Inquiries: abeokutapolo@gmail.com · +234 818 188 8884",
    ],
    downloadUrl: "/api/sponsorship/pdf",
  },
  {
    id: "visitor-protocol-guide",
    category: "guides",
    categoryLabel: "Spectator Guide & Entry",
    badge: "Visitor Protocol",
    title: "Visitor Protocol & Gate Entry Guidelines",
    subtitle: "Admission Policy, Kobape Grounds & Turnstile Access",
    date: "2026 Season",
    pages: 4,
    format: "Official Guidance",
    securityClearance: "Public Visitor Protocol",
    summary:
      "Essential visitor guidance for the 2026 festival covering contactless turnstile gate accreditation, Kobape grounds location along the Abeokuta–Sagamu Expressway, and parking protocols.",
    chapters: [
      "Day 1: Friday 18 Dec — 100% Free Public Entry with registered digital gate pass",
      "Day 2 & Day 3: Through-Ticket and VVIP Access Pass required at turnstiles",
      "Gate 1: Reserved for Royal Fathers, Diplomatic Delegations & VVIP Guests",
      "Gates 2 & 3: General Public & Hospitality Chalet Ingress",
      "Dress Code: African Regal Attire & Smart Casual (comfortable turf footwear recommended)",
      "Location: Abeokuta Polo Club Grounds, Abeokuta–Sagamu Expressway, Kobape, Ogun State",
    ],
    downloadUrl: "/visit",
  },
];

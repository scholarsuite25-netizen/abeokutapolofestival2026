export const PUBLICATION_CATEGORIES = [
  "all",
  "gazette",
  "guides",
  "programmes",
  "equine",
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
  fileSize: string;
  format: string;
  summary: string;
  isFeatured?: boolean;
  chapters: string[];
  securityClearance?: string;
  downloadUrl?: string;
}

export const PUBLICATIONS_DATA: PublicationItem[] = [
  {
    id: "programme-gazette-2026",
    category: "gazette",
    categoryLabel: "Tournament Gazettes",
    badge: "Official Tournament Gazette",
    title: "The 2026 Abeokuta Polo Festival Official Programme Gazette",
    subtitle: "Royal Edition · 68 Archival Pages",
    date: "December 2026",
    pages: 68,
    fileSize: "18.4 MB",
    format: "PDF & Interactive Folio",
    isFeatured: true,
    securityClearance: "Public Sovereign Release",
    summary:
      "The definitive sovereign record for the 2026 festival season. Contains the imperial order of chukkers, high-goal team delegations, royal ceremonial timelines, patron heraldry, and royal welcome addresses.",
    chapters: [
      "Imperial Foreword — His Royal Majesty, Oba Dr. Michael Aremu Gbadebo, CFR, The Alake of Egbaland",
      "Executive Statement — President & Tournament Directorate, Abeokuta Polo Club",
      "Official 3-Day Order of Chukkers & Match Rosters (18–20 December 2026)",
      "High-Goal Syndicate Profiles: Team Alake Strikers (+14) vs. Kobape Centurions (+12)",
      "The Queens Cup Invitational: Empowering Pan-African Women in Equestrian Sport",
      "Pageantry & Durbar Protocol: The Grand Cavalcade of 100 Traditional Monarchs",
      "Fieldboard Safety Guidelines & Equestrian Etiquette for Pavilion Guests",
    ],
    downloadUrl: "/api/programme/pdf",
  },
  {
    id: "corporate-blueprint",
    category: "programmes",
    categoryLabel: "Sovereign Match Programmes",
    badge: "Commercial Prospectus",
    title: "The Blueprint: Official Corporate Partnership Deck",
    subtitle: "Commercial Investment & Activation Matrix",
    date: "Q3 2026",
    pages: 42,
    fileSize: "12.2 MB",
    format: "Executive PDF",
    securityClearance: "Executive Commercial",
    summary:
      "Commercial investment matrix, hospitality pavilion tier pricing, digital broadcast reach, and signature royal property naming rights for corporate patrons and institutional sponsors.",
    chapters: [
      "Executive Summary: Aligning with Pan-African Royalty & Modern Sporting Prestige",
      "Audience Demographics: HNWIs, Diplomatic Envoys, Corporate Executives & Cultural Enthusiasts",
      "The 7 Sponsorship Tiers: From Principal Festival Sponsor to Chukker Co-Sponsors",
      "Chukker Terrace & Sovereign Chalet Hospitality Architectural Specifications",
      "Live Television, Digital Streaming & In-Paddock Brand Integration Rights",
      "Post-Tournament Commercial ROI Audits & Executive Secretariat Engagements",
    ],
    downloadUrl: "/api/sponsorship/pdf",
  },
  {
    id: "ground-map-guide",
    category: "guides",
    categoryLabel: "Spectator Guides & Maps",
    badge: "Spectator & Logistics",
    title: "Festival Ground Map & VIP Enclosure Guide",
    subtitle: "Kobape Grounds Masterplan & Gate Logistics",
    date: "November 2026",
    pages: 16,
    fileSize: "8.7 MB",
    format: "High-Res PDF Map",
    securityClearance: "Visitor Logistics",
    summary:
      "High-resolution layout of Kobape Turf, Sovereign Chalets, helicopter landing zone, VIP Gate 1–3 credentials, secure valet zones, and emergency paddock egress routes.",
    chapters: [
      "Arrival Routes: Access via the Abeokuta–Sagamu Expressway at Kobape",
      "Gate Credentials: Gate 1 (Royal Dais), Gate 2 (VIP Chalets), Gate 3 (General Ingress)",
      "Helipad Coordinates & Executive Aviation Landing Procedures",
      "Paddock Stables, Pony Warm-up Lines & Veterinary Isolation Zones",
      "Spectator Medical Stations, Emergency Egress & Security Checkpoints",
    ],
    downloadUrl: "#",
  },
  {
    id: "royal-cup-order",
    category: "programmes",
    categoryLabel: "Sovereign Match Programmes",
    badge: "Tournament Protocol",
    title: "Royal Cup Order of Play & Ceremonial Protocol",
    subtitle: "Sunday Championship Finale Playbook",
    date: "December 2026",
    pages: 28,
    fileSize: "6.5 MB",
    format: "PDF Document",
    securityClearance: "Royal Secretariat Release",
    summary:
      "Sunday championship order, grand arrival schedule for crowned monarchs, Alake trophy presentation court protocol, and royal anthem timings.",
    chapters: [
      "Arrival Timeline for Royal Monarchs, State Governors & Diplomatic Delegations",
      "The Royal Durbar Cavalcade: Traditional Drummers, Horse Regalia & Royal Greeting",
      "Chukker Rules of Play: High-Goal Handicap Calculation & Overtime Chukkers",
      "The Sovereign Trophy Presentation Court & Official Commemorative Medals",
      "The Twilight Light-Up & Royal Ball Ingress Verification",
    ],
    downloadUrl: "#",
  },
  {
    id: "equine-pedigree",
    category: "equine",
    categoryLabel: "Equine Care & Rosters",
    badge: "Equestrian Technical",
    title: "Equine Pedigree & Handicapping Gazette",
    subtitle: "Stables & Bloodlines Registry",
    date: "December 2026",
    pages: 36,
    fileSize: "14.1 MB",
    format: "Technical Folio",
    securityClearance: "Veterinary & Technical",
    summary:
      "Veterinary certification logs, Argentine and Northern Nigerian pony bloodlines, pony handicaps, and best-playing pony (BPP) criteria judged by international stewards.",
    chapters: [
      "Equine Biosecurity & Veterinary Protocols at Kobape Turf",
      "Argentine Thoroughbred & Criollo Pony Registrations",
      "Northern Nigerian Equestrian Bloodlines & High-Altitude Acclimatization",
      "Steward Inspection Log: Tack Regulations, Mouth Bit Guards & Bandaging Rules",
      "Best Playing Pony (BPP) Scoring Rubric & International Jury Panel",
    ],
    downloadUrl: "#",
  },
  {
    id: "sartorial-gazette",
    category: "guides",
    categoryLabel: "Spectator Guides & Maps",
    badge: "Style & Culture",
    title: "The Sartorial Gazette: Polo Style & Yoruba Textile Guide",
    subtitle: "Dress Protocol & Adire Heritage",
    date: "November 2026",
    pages: 24,
    fileSize: "11.3 MB",
    format: "Style Lookbook PDF",
    securityClearance: "Public Lifestyle",
    summary:
      "Curated etiquette for pavilion dressing, indigo Adire patterns, Aso Oke textures, bespoke millinery guidelines, and field divot stomping traditions.",
    chapters: [
      "Pavilion Style Codes: African Regal Attire, Linens & Contemporary Tailoring",
      "The Heritage of Abeokuta Adire on the Modern Polo Lawn",
      "Millinery, Parasols & Sunglasses: Practical Elegance under the Ogun Sun",
      "Footwear Protocols: Stiletto Restrictions for Turf Lawn Preservation",
      "The Half-time Divot Stomping Tradition: How to Tread-in with Champagne",
    ],
    downloadUrl: "#",
  },
  {
    id: "club-heritage",
    category: "gazette",
    categoryLabel: "Tournament Gazettes",
    badge: "Institutional History",
    title: "Abeokuta Polo Club: Foundation & Turf Retrospective",
    subtitle: "From May 17, 2025 to The 2026 Blueprint",
    date: "December 2026",
    pages: 48,
    fileSize: "16.8 MB",
    format: "Archival Monograph",
    securityClearance: "Club Historical Archive",
    summary:
      "A definitive retrospective chronicling the foundational groundbreaking on May 17, 2025, the maiden festival on December 21, 2025, and the contemporary sovereign tournaments.",
    chapters: [
      "Groundbreaking at Kobape: 17 May 2025 Landmark Inception",
      "The Maiden Polo Festival: 21 December 2025 Inaugural Matches",
      "Founding Patrons, Life Members & Executive Management Committee",
      "Architectural Evolution of the Clubhouse, Stables & Grass Turf",
      "Egba Royal Patronage: His Royal Majesty The Alake of Egbaland",
    ],
    downloadUrl: "#",
  },
  {
    id: "sovereign-form-guide",
    category: "programmes",
    categoryLabel: "Sovereign Match Programmes",
    badge: "Match Analysis",
    title: "The Sovereign Chukker Form Guide & Player Roster",
    subtitle: "Handicap Ratings & High-Goal Syndicates",
    date: "December 2026",
    pages: 32,
    fileSize: "7.9 MB",
    format: "Sporting Gazette",
    securityClearance: "Tournament Technical",
    summary:
      "Under the stewardship of the Tournament Technical Committee, this edition presents four premier high-goal syndicates battling for the venerable Abeokuta Royal Trophy.",
    chapters: [
      "Tournament Format: 4 Chukkers of 7.5 Minutes per Match",
      "Syndicate Roster: Team Alake Strikers (+14 Goal)",
      "Syndicate Roster: Kobape Centurions (+12 Goal)",
      "International Umpire Delegations & Pitch-side Technology",
      "Spectator Primer: Understanding Fouls, Line of the Ball & Right of Way",
    ],
    downloadUrl: "#",
  },
];

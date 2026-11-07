import { FESTIVAL_METADATA, OFFICIAL_PROGRAMME } from "@/lib/data/programme";

export const NEWS_CATEGORIES = [
  "Accreditation",
  "Programme",
  "Grounds",
  "Media",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export interface StandingNotice {
  id: string;
  category: NewsCategory;
  title: string;
  summary: string;
  points: string[];
  href: string;
  hrefLabel: string;
}

const [dayOne, dayTwo, dayThree] = OFFICIAL_PROGRAMME;

export const STANDING_NOTICES: StandingNotice[] = [
  {
    id: "gate-accreditation",
    category: "Accreditation",
    title: "A digital access card is required on every festival day",
    summary:
      "Registration is mandatory for 18, 19, and 20 December 2026. Day 1 is free entry. Days 2 and 3 are through-ticket days. No turnstile admission is permitted without an official digital access card.",
    points: [
      `${dayOne.dayName} ${dayOne.dateStr}: ${dayOne.admission}.`,
      `${dayTwo.dayName} ${dayTwo.dateStr}: ${dayTwo.admission}.`,
      `${dayThree.dayName} ${dayThree.dateStr}: ${dayThree.admission}.`,
      "Gate scanning begins at 10:00 AM. Gate 1 is reserved for royal and VIP accreditation. Gates 2 and 3 serve general guests.",
    ],
    href: "/register",
    hrefLabel: "Register for a pass",
  },
  {
    id: "three-day-programme",
    category: "Programme",
    title: "The published three-day programme is now the reference timetable",
    summary: `${FESTIVAL_METADATA.title}, “${FESTIVAL_METADATA.theme}”, runs ${FESTIVAL_METADATA.dates} at ${FESTIVAL_METADATA.venue}.`,
    points: OFFICIAL_PROGRAMME.map(
      (day) => `${day.badge}: ${day.theme}. ${day.leadSummary}`,
    ),
    href: "/programme",
    hrefLabel: "Open the programme",
  },
  {
    id: "grounds",
    category: "Grounds",
    title: "Kobape grounds, parking, and dress guidance",
    summary: `The festival is held at ${FESTIVAL_METADATA.venue}, on the Abeokuta–Sagamu Expressway at Kobape.`,
    points: [
      "General guests use the secure parking zones. Valet and priority parking are reserved for patrons, chalet guests, and tournament officials.",
      "Security is coordinated with the Ogun State Police Command and equestrian marshals.",
      "Dress is smart casual and African regal attire. Comfortable footwear is recommended for the grass lawns.",
    ],
    href: "/visit",
    hrefLabel: "Plan your visit",
  },
  {
    id: "media-day",
    category: "Media",
    title: "Day 1 opens with the press conference and media tour",
    summary:
      "Friday 18 December begins with the press conference and a guided tour of the club, followed by the evening festival light-up.",
    points: [
      "10:00 AM – 12:00 noon: press conference, club tour, interviews, and photography.",
      "Field-line credentials are issued only to accredited journalists and production crews.",
      "Unauthorised people are kept off the sideboards under the equestrian safety protocol.",
    ],
    href: "/press",
    hrefLabel: "Read media guidelines",
  },
];

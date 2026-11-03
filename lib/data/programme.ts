export interface ProgrammeDay {
  dayNumber: number;
  dateStr: string;
  dayName: string;
  theme: string;
  admission: "100% Free Entry" | "Through Ticket";
  badge: string;
  leadSummary: string;
  schedule: {
    time: string;
    title: string;
    highlight?: boolean;
    items: string[];
  }[];
}

export const FESTIVAL_METADATA = {
  title: "Abeokuta Polo Festival 2026",
  subTitle: "The Blueprint",
  theme: "Building the Future from Our Heritage",
  dates: "18–20 December 2026",
  venue: "Abeokuta Polo Club & Country Resort, Abeokuta, Ogun State, Nigeria",
  tagline: "WHERE ROYALTY MEETS SPORT. WHERE CULTURE MEETS EXCELLENCE. WHERE HERITAGE INSPIRES THE FUTURE.",
  patron: "His Royal Majesty, Oba Dr. Michael Aremu Gbadebo, CFR, the Alake and Paramount Ruler of Egbaland",
  president: "Dr. Sheriff Adams Abdulrahman, President of Abeokuta Polo Club",
};

export const OFFICIAL_PROGRAMME: ProgrammeDay[] = [
  {
    dayNumber: 1,
    dateStr: "18th December 2026",
    dayName: "Friday",
    theme: "MEDIA, TOUR & FESTIVAL LIGHT-UP",
    admission: "100% Free Entry",
    badge: "Day 1 · Media & Festival Light-Up",
    leadSummary:
      "The official opening day of the festival welcoming journalists, corporate delegations, players, and attendees with accredited gate registration.",
    schedule: [
      {
        time: "10:00 AM – 12:00 NOON",
        title: "Press Conference and Media Tour",
        items: [
          "Official press conference with members of the media.",
          "Guided tour of the Abeokuta Polo Club & Country Resort.",
          "Media interviews, photography and publicity engagements.",
        ],
      },
      {
        time: "EVENING",
        title: "Festival Light-Up and Welcome Dinner",
        highlight: true,
        items: [
          "Official festival light-up ceremony.",
          "Welcome dinner for participating polo players.",
          "Networking and informal interactions among players, invited guests and festival organisers.",
        ],
      },
    ],
  },
  {
    dayNumber: 2,
    dateStr: "19th December 2026",
    dayName: "Saturday",
    theme: "ROYAL OPENING, CULTURAL HERITAGE & POLO",
    admission: "Through Ticket",
    badge: "Day 2 · Royal Opening & Polo",
    leadSummary:
      "A landmark ceremonial day featuring royal declarations, major foundation-laying milestones, and multidisciplinary celebrations across sport, literature, art, and entertainment.",
    schedule: [
      {
        time: "12:00 NOON",
        title: "Official Opening Ceremony",
        highlight: true,
        items: [
          "Royal Declaration of the Festival Open — by His Royal Majesty, Oba Dr. Michael Aremu Gbadebo, CFR, the Alake and Paramount Ruler of Egbaland.",
          "Official Opening of the Festival Market Square — declared open by His Royal Majesty, the Alake of Egbaland.",
          "Foundation-Laying Ceremony for the Trauma Centre — advancing trauma care, wellness and community health services.",
          "Foundation-Laying Ceremony for the Festival Complex — supporting future cultural, sporting and tourism activities.",
          "Foundation-Laying Ceremony for the 500-Horse Stable — a major step towards world-class equestrian facilities.",
        ],
      },
      {
        time: "FESTIVAL ACTIVITIES",
        title: "Sport, Literature, Art & Entertainment",
        items: [
          "Queens Polo Match — celebrating women in polo, sporting excellence and inclusion.",
          "Literary Debate Competition (Two-Team Debate) — a contest of ideas, intellect and eloquence at the Festival Market Square.",
          "Poetry Recitation — celebrating literary expression, creativity and African cultural heritage at the Festival Market Square.",
          "Sip and Paint Experience — an interactive artistic experience at the Festival Market Square.",
          "DJ and Artistic Performances — music, creative showcases and live entertainment at the Festival Market Square and tournament grounds.",
          "Evening Polo Match — showcasing the skill, discipline and elegance of polo.",
        ],
      },
    ],
  },
  {
    dayNumber: 3,
    dateStr: "20th December 2026",
    dayName: "Sunday",
    theme: "THE GRAND FINALE — THE ROYAL CUP & QUEENS CUP",
    admission: "Through Ticket",
    badge: "Day 3 · Grand Finale & Aristos Band",
    leadSummary:
      "The pinnacle grand finale of the festival convening 100 Kings, championship matches for the Royal Cup and Queens Cup, and headline musical performances.",
    schedule: [
      {
        time: "12:00 NOON",
        title: "Grand Finale Begins",
        highlight: true,
        items: [
          "DJ Entertainment and Festival Atmosphere — music and entertainment as guests arrive.",
          "Arrival of Dignitaries and Royal Guests — traditional rulers, government officials, distinguished guests, sponsors, partners and invited dignitaries.",
          "Cultural Performances — celebrating the richness and diversity of African culture.",
          "Grand Finale Polo Matches: The Royal Cup Final Match and the Queens Cup Final Match.",
          "Festival Chairman’s Speech — address by the Chairman of the Abeokuta Polo Festival 2026.",
          "Presidential Address — address by Dr. Sheriff Adams Abdulrahman, President of Abeokuta Polo Club.",
          "Goodwill Messages — from distinguished dignitaries, government representatives, sponsors and strategic partners.",
          "First Performance by ARISTOS BAND — live musical entertainment.",
          "Player Decorations and Presentation of the Royal Cup — recognition of outstanding players, awards and presentation of the cup to the winning team.",
          "Second Performance by ARISTOS BAND — a further live performance during the celebration.",
          "Celebrating the 100 Kings — “ONE FIELD, ONE LEGACY”, honouring traditional rulers and their contributions to cultural preservation, unity and community leadership.",
          "Performance by BERRYOLA — headline musical performance to close the festival.",
        ],
      },
    ],
  },
];


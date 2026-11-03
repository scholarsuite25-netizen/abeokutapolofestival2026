export interface SponsorshipTier {
  id: string;
  name: string;
  amount: string;
  positioning: string;
  badge: string;
  description: string;
  deliverables: {
    category: string;
    items: string[];
  }[];
  isPrimary?: boolean;
}

export interface SpecialisedSponsor {
  id: string;
  name: string;
  desc: string;
  deliverables: string[];
}

export const CORPORATE_SPONSORSHIP_TIERS: SponsorshipTier[] = [
  {
    id: "title",
    name: "Title Sponsor",
    amount: "₦200 Million and Above",
    positioning: "Principal Festival Partner",
    badge: "Principal Festival Partner · Highest Prominence",
    isPrimary: true,
    description:
      "The Title Sponsor receives the highest level of brand prominence, exclusivity, and supreme association with the Abeokuta Polo Festival 2026.",
    deliverables: [
      {
        category: "Naming & Brand Recognition",
        items: [
          "Prominent designation as the Title Sponsor of the Abeokuta Polo Festival 2026.",
          "A polo team in the name of the Title Sponsor.",
          "Prominent logo placement on official festival key visuals, subject to agreed branding specifications.",
          "Highest-tier sponsor recognition across official festival publicity materials.",
          "Prominent placement in the official festival brochure, program and invitation materials.",
          "Recognition as Title Sponsor in official press releases and selected media communications.",
        ],
      },
      {
        category: "Venue & Physical Branding",
        items: [
          "Premium branding placement at the main festival entrance.",
          "Prominent logo placement at designated polo-field viewing and spectator areas.",
          "Branding on designated festival walkways, billboards and event installations.",
          "A premium corporate activation space at the festival venue.",
        ],
      },
      {
        category: "Digital & Media Visibility",
        items: [
          "Dedicated sponsor recognition across the festival's official social media platforms.",
          "Inclusion in selected promotional videos and digital publicity campaigns.",
          "Dedicated appreciation post recognizing the organisation's principal contribution.",
          "Recognition in official post-event communications and the festival's impact report.",
        ],
      },
      {
        category: "Premium Hospitality & Ceremonial Exclusivity",
        items: [
          "Twenty (20) VIP invitations for the festival's principal hospitality areas.",
          "Two reserved corporate tables for designated festival hospitality functions.",
          "Priority access to approved corporate networking opportunities.",
          "Invitation for a senior executive to participate in an agreed ceremonial programme.",
          "Presentation of a formal Title Sponsor recognition plaque.",
          "Opportunity for a designated executive to participate in an approved award presentation.",
          "Recognition at the festival's opening and grand finale.",
          "First consideration for category exclusivity, subject to contractual agreement.",
        ],
      },
    ],
  },
  {
    id: "platinum",
    name: "Platinum Sponsor",
    amount: "₦50 Million",
    positioning: "Premier Corporate Partner",
    badge: "Premier Corporate Partner",
    description:
      "Comprehensive corporate alignment offering high visibility across match turfs, executive activation, and premium hospitality tables.",
    deliverables: [
      {
        category: "Guaranteed Deliverables",
        items: [
          "Official recognition as a Platinum Sponsor.",
          "Prominent logo placement on approved festival publicity materials.",
          "Logo inclusion in the official festival brochure and program.",
          "Branding at designated polo-field viewing areas and festival installations.",
          "One designated corporate activation space.",
          "Inclusion in selected social media publicity and sponsor appreciation posts.",
          "Recognition in selected festival press releases and post-event communications.",
          "Fifteen (15) VIP invitations.",
          "One reserved corporate hospitality table, subject to venue arrangements.",
          "Opportunity for an executive representative to participate in an approved award presentation.",
          "Formal presentation of a Platinum Sponsor recognition plaque.",
          "Consideration for category exclusivity where agreed in writing.",
        ],
      },
    ],
  },
  {
    id: "gold",
    name: "Gold Sponsor",
    amount: "₦25 Million",
    positioning: "Major Festival Partner",
    badge: "Major Festival Partner",
    description:
      "Strategic brand placement targeting high-net-worth attendees, sovereign dignitaries, and corporate stakeholders.",
    deliverables: [
      {
        category: "Guaranteed Deliverables",
        items: [
          "Official recognition as a Gold Sponsor.",
          "Logo placement on designated festival publicity materials.",
          "Logo inclusion in the official festival brochure and program.",
          "Branding on selected venue installations or polo-field spectator areas.",
          "One designated product display or activation space, subject to availability.",
          "Inclusion in selected sponsor recognition posts on social media.",
          "Recognition in the festival's official sponsor acknowledgement.",
          "Ten (10) VIP invitations.",
          "One reserved hospitality table, subject to venue arrangements.",
          "Opportunity to participate in an approved sponsor engagement or ceremonial activity.",
          "Presentation of a Gold Sponsor recognition certificate or plaque.",
        ],
      },
    ],
  },
  {
    id: "silver",
    name: "Silver Sponsor",
    amount: "₦15 Million",
    positioning: "Premier Corporate Partner",
    badge: "Corporate Sponsor",
    description:
      "High-value corporate engagement package with prominent venue branding, VIP tickets, and digital visibility.",
    deliverables: [
      {
        category: "Guaranteed Deliverables",
        items: [
          "Official recognition as a Silver Sponsor.",
          "Logo placement on designated festival publicity materials.",
          "Logo inclusion in the official festival brochure and program.",
          "Branding on selected venue installations or polo field spectator areas.",
          "Inclusion in selected sponsor recognition posts on social media.",
          "Recognition in the festival's official sponsor acknowledgement.",
          "Five (5) VIP invitations.",
          "One reserved hospitality table, subject to venue arrangements.",
          "Opportunity to participate in an approved sponsor engagement or ceremonial activity.",
          "Presentation of a Silver Sponsor recognition certificate.",
        ],
      },
    ],
  },
  {
    id: "bronze",
    name: "Bronze Sponsor",
    amount: "₦5 Million",
    positioning: "Official Festival Supporter",
    badge: "Festival Supporter",
    description:
      "Targeted corporate endorsement package with collective social visibility and ceremonial participation.",
    deliverables: [
      {
        category: "Guaranteed Deliverables",
        items: [
          "Official recognition as a Bronze Sponsor.",
          "Logo inclusion on the designated sponsor recognition panel.",
          "Acknowledgement in the official festival brochure, subject to publication deadlines.",
          "Collective sponsor recognition on the festival's social media platforms.",
          "Three (3) VIP invitations.",
          "Inclusion in the official post-event appreciation communication.",
          "Presentation of a Bronze Sponsor recognition certificate.",
        ],
      },
    ],
  },
  {
    id: "supporting",
    name: "Supporting Sponsor",
    amount: "₦2 – ₦4 Million",
    positioning: "Festival Support Partner",
    badge: "Support Partner",
    description:
      "Accessible entry-level sponsorship for brands and institutions looking to support community heritage and equestrian development.",
    deliverables: [
      {
        category: "Guaranteed Deliverables",
        items: [
          "Official acknowledgement as a Supporting Sponsor.",
          "Name or logo inclusion on the designated supporting sponsors' recognition panel.",
          "Collective recognition on the festival's official digital platforms.",
          "Acknowledgement in the official festival brochure.",
          "Two (2) festival invitations.",
          "Inclusion in the official post-event appreciation communication.",
          "Presentation of a Supporting Sponsor recognition certificate.",
        ],
      },
    ],
  },
  {
    id: "patron",
    name: "Patron & Individual Sponsors",
    amount: "₦10 Million and Above",
    positioning: "Distinguished Festival Patron",
    badge: "Distinguished Festival Patron",
    description:
      "Recognises distinguished individuals, royal families, and alumni who contribute to the festival's development, cultural heritage objectives, and long-term sustainability.",
    deliverables: [
      {
        category: "Guaranteed Deliverables",
        items: [
          "Formal recognition as a Festival Patron or Individual Sponsor.",
          "Inclusion in the official festival patron recognition list, subject to consent.",
          "Acknowledgement in the festival brochure, subject to publication deadlines.",
          "Recognition through an appropriate sponsor appreciation communication.",
          "Invitations proportionate to the agreed contribution.",
          "A certificate or plaque of appreciation, depending on the level of contribution.",
        ],
      },
    ],
  },
];

export const SPECIALISED_SPONSORS: SpecialisedSponsor[] = [
  {
    id: "royal-cup-sponsor",
    name: "The Royal Cup Sponsor",
    desc: "Exclusive title sponsorship for the festival's historic pinnacle trophy presented alongside HRM The Alake of Egbaland.",
    deliverables: [
      "Recognition as the Official Royal Cup Sponsor.",
      "Branding on designated competition materials and pitch boards.",
      "Approved naming recognition in competition announcements.",
      "Opportunity to present the trophy during the grand finale ceremony.",
      "Agreed VIP hospitality allocation and post-event recognition.",
    ],
  },
  {
    id: "queens-polo-sponsor",
    name: "Queens Polo Team (All Female Team)",
    desc: "Empowering women in polo through direct team and match sponsorship celebrating leadership, elegance, and inclusion.",
    deliverables: [
      "Recognition as the Official Queens Polo Sponsor.",
      "Branding on designated competition materials and team jerseys.",
      "Approved visibility in promotional campaigns and social spotlights.",
      "Opportunity to support women's participation and empowerment messaging.",
      "Agreed hospitality and ceremonial recognition.",
    ],
  },
  {
    id: "governors-cup-sponsor",
    name: "Governor's Cup Sponsor",
    desc: "Official partnership celebrating state leadership, regional unity, and civic sportsmanship.",
    deliverables: [
      "Recognition as the Sponsor of the Governor's Cup, subject to official approval.",
      "Branding on approved competition materials.",
      "Inclusion in relevant publicity and ceremonial announcements.",
      "Opportunity for an approved trophy presentation.",
      "Agreed hospitality and media recognition.",
    ],
  },
  {
    id: "grand-finale-sponsor",
    name: "Grand Finale & Awards Sponsor",
    desc: "High-octane visibility anchoring the final day awards stage, concerts by ARISTOS BAND and BERRYOLA, and royal presentations.",
    deliverables: [
      "Recognition as the Grand Finale or Awards Sponsor.",
      "Branding on designated awards-stage materials and concert backdrops.",
      "Approved participation in prize presentations.",
      "Agreed VIP hospitality and event publicity.",
    ],
  },
];


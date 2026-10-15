import Link from "next/link";
import {
  Handshake,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnquiryDialog } from "@/components/design/public/enquiry-dialog";

export const metadata = {
  title: "Partnerships & Sponsorships — 2026 Abeokuta Polo Festival",
  description:
    "Official corporate sponsorship tiers, brand alignment packages, and partnership rights for the 2026 Abeokuta Polo Festival.",
};

interface SponsorshipTier {
  id: string;
  name: string;
  proposedAmount: string;
  badge: string;
  description: string;
  highlights: string[];
  isPrimary?: boolean;
}

const TIERS: SponsorshipTier[] = [
  {
    id: "headline",
    name: "Main Headline / Title Partner",
    proposedAmount: "₦75,000,000",
    badge: "Exclusive Title Integration",
    isPrimary: true,
    description:
      "Exclusive co-naming rights of the 2026 festival, supreme brand presence on all national broadcast media, Royal Cup ball branding, and premier field perimeter placement.",
    highlights: [
      "Exclusive '2026 Abeokuta Polo Festival presented by [Brand]' title rights",
      "Two private 30-person VIP Chukka Chalets on the main field boards",
      "40 VIP and All-Access credentials for executive brand guests",
      "Prime front-and-centre branding across player jerseys and tournament balls",
      "Keynote speaking and trophy co-presentation alongside HRM The Alake",
    ],
  },
  {
    id: "platinum",
    name: "Platinum Partner",
    proposedAmount: "₦50,000,000",
    badge: "Principal Brand Alignment",
    description:
      "Premier category exclusivity, major perimeter turf boards, dedicated hospitality chalet, and prominent inclusion in all national press and media.",
    highlights: [
      "Official Platinum Category Exclusivity (e.g. Official Bank / Telco / Energy)",
      "Dedicated 25-person VIP Chukka Chalet with full catering",
      "25 VIP and Hospitality credentials with clubhouse access",
      "Prominent perimeter field boards and digital screen advertising",
      "Official co-presentation of the Polo Queens Invitational Trophy",
    ],
  },
  {
    id: "gold",
    name: "Gold Partner",
    proposedAmount: "₦30,000,000",
    badge: "Major Tournament Sponsor",
    description:
      "High-visibility brand integration, exhibition pavilion spaces, executive box allocations, and official gazette features.",
    highlights: [
      "Category partner recognition across all festival communications",
      "One private 15-person field-side chalet",
      "15 VIP passes and priority car park allocations",
      "Two premier field-side banner positions along tournament chukkas",
      "Full-page feature in the official leather-bound 2026 Gazette",
    ],
  },
  {
    id: "silver",
    name: "Silver Partner",
    proposedAmount: "₦20,000,000",
    badge: "Associate Sponsor",
    description:
      "Targeted brand alignment, brand activation booth on the lifestyle lawn, and reserved VIP seating.",
    highlights: [
      "Branded exhibition lounge space in the festival lifestyle village",
      "10 VIP credentials with clubhouse and chukka terrace access",
      "Field-side perimeter banner board during all 3 tournament days",
      "Half-page color spread in the 2026 Tournament Gazette",
    ],
  },
  {
    id: "bronze",
    name: "Bronze Partner",
    proposedAmount: "₦10,000,000",
    badge: "Supporting Sponsor",
    description:
      "Essential visibility for growing corporate brands seeking association with prestigious equestrian heritage.",
    highlights: [
      "Official recognition on festival sponsor boards and web portals",
      "6 VIP credentials with dedicated parking access",
      "Perimeter banner display on secondary tournament chukka field",
      "Quarter-page inclusion in tournament gazette",
    ],
  },
  {
    id: "club",
    name: "Club Partner",
    proposedAmount: "₦5,000,000",
    badge: "Patron Enterprise",
    description:
      "Ideal for regional businesses and high-net-worth patron syndicates supporting Ogun State equestrian sports.",
    highlights: [
      "Official Club Partner listing on website and event program",
      "4 VIP hospitality credentials",
      "Tournament banner placement on clubhouse grounds",
    ],
  },
  {
    id: "supporter",
    name: "Festival Supporter",
    proposedAmount: "₦2,500,000",
    badge: "Heritage Contributor",
    description:
      "Direct patronage contribution supporting tournament logistics, youth polo clinics, and festival pageantry.",
    highlights: [
      "Supporter listing in the official commemorative gazette",
      "2 VIP passes with access to the Chukka Terrace",
      "Certificate of sovereign festival patronage",
    ],
  },
];

export default function SponsorshipPage() {
  return (
    <div className="flex w-full flex-col bg-ivory text-ink">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION                                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-forest text-ivory py-16 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-gold/10 blur-3xl"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold uppercase tracking-widest text-[11px]">
            Commercial & Strategic Partnerships
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl">
            Align Your Enterprise With <br />
            <span className="font-normal italic text-gold">West Africa&apos;s Sovereign Sport</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ivory/80 sm:text-lg">
            Connect directly with Royal Monarchs, Fortune 500 executives, diplomatic leadership, and high-net-worth patrons across three days of historic polo in Abeokuta.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <EnquiryDialog
              title="Corporate Sponsorship Inquiries"
              category="sponsorship"
              triggerText="Connect with Secretariat"
              className="bg-gold font-semibold text-forest-deep shadow hover:bg-gold/90"
            />
            <Button asChild variant="outline" className="border-ivory/30 text-ivory hover:bg-ivory/10 hover:text-ivory">
              <Link href="/programme">View Tournament Schedule</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. PROVISIONAL STATUS NOTICE (Decision D-13)                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="border-b border-line bg-sage/40 py-5">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8 text-xs text-forest-deep sm:text-sm">
          <ShieldAlert className="size-5 text-gold shrink-0" />
          <p>
            <strong>Official Transparency Notice:</strong> In accordance with festival governance, all monetary sponsorship figures displayed below represent proposed tier values from the Festival Blueprint. Packages and rights allocations are finalized upon bilateral approval with the Secretariat. No payments are accepted online.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. SPONSORSHIP TIERS MATRIX                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Proposed Investment Architecture
            </span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-forest sm:text-4xl">
              Sponsorship Tier Packages
            </h2>
            <p className="mt-2 text-sm text-muted-brand sm:text-base">
              Bespoke brand properties offering category exclusivity, luxury hospitality, and pan-African visibility.
            </p>
          </div>

          <div className="space-y-6">
            {TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`flex flex-col justify-between rounded-2xl border p-6 transition sm:p-8 ${
                  tier.isPrimary
                    ? "border-gold/60 bg-forest text-ivory shadow-xl"
                    : "border-line bg-card text-ink shadow-sm hover:shadow-md"
                }`}
              >
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
                  <div className="lg:col-span-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          tier.isPrimary
                            ? "border-gold bg-gold/20 text-gold font-semibold text-[11px]"
                            : "border-gold/50 bg-gold/10 text-forest font-semibold text-[11px]"
                        }
                      >
                        {tier.badge}
                      </Badge>
                      <Badge variant="outline" className="border-line/40 text-[10px] uppercase text-muted-brand">
                        Proposed · Pending Approval
                      </Badge>
                    </div>

                    <h3
                      className={`mt-3 font-display text-2xl font-semibold sm:text-3xl ${
                        tier.isPrimary ? "text-ivory" : "text-forest"
                      }`}
                    >
                      {tier.name}
                    </h3>
                    <p
                      className={`mt-2 font-display text-2xl font-bold tracking-tight ${
                        tier.isPrimary ? "text-gold" : "text-forest-interactive"
                      }`}
                    >
                      {tier.proposedAmount}
                    </p>
                    <p
                      className={`mt-3 text-sm leading-relaxed ${
                        tier.isPrimary ? "text-ivory/80" : "text-muted-brand"
                      }`}
                    >
                      {tier.description}
                    </p>
                  </div>

                  <div className="lg:col-span-4 border-t border-line/20 pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
                    <p
                      className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                        tier.isPrimary ? "text-gold" : "text-forest"
                      }`}
                    >
                      Key Rights & Entitlements:
                    </p>
                    <div className="space-y-2">
                      {tier.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                          <CheckCircle2
                            className={`size-4 shrink-0 mt-0.5 ${
                              tier.isPrimary ? "text-gold" : "text-forest-interactive"
                            }`}
                          />
                          <span className={tier.isPrimary ? "text-ivory/90" : "text-muted-brand"}>
                            {h}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-3 flex flex-col justify-center gap-2 border-t border-line/20 pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
                    <EnquiryDialog
                      title={`Inquire on ${tier.name}`}
                      category="sponsorship"
                      tierName={`${tier.name} (${tier.proposedAmount})`}
                      triggerText="Inquire on Package"
                      className={
                        tier.isPrimary
                          ? "w-full bg-gold font-semibold text-forest-deep shadow hover:bg-gold/90"
                          : "w-full bg-forest font-semibold text-ivory hover:bg-forest-interactive"
                      }
                    />
                    <p
                      className={`text-center text-[11px] ${
                        tier.isPrimary ? "text-ivory/60" : "text-muted-brand"
                      }`}
                    >
                      Custom activation riders available
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Partnership Direct Secretariat Box */}
          <div className="mt-16 rounded-2xl border border-line bg-sage/30 p-8 text-center sm:p-12">
            <Handshake className="size-10 text-gold mx-auto" />
            <h3 className="mt-4 font-display text-2xl font-semibold text-forest">
              Bespoke Commercial & Government Activations
            </h3>
            <p className="mt-2 text-sm text-muted-brand max-w-xl mx-auto">
              Our Finance, Sponsorship & Business Development Committee works directly with your brand team to structure bespoke product placements, lounge hosting, and media co-productions.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <EnquiryDialog
                title="Bespoke Partnership Inquiries"
                category="sponsorship"
                tierName="Bespoke Enterprise Activation"
                triggerText="Contact Sponsorship Committee"
                className="bg-forest font-semibold text-ivory hover:bg-forest-interactive"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

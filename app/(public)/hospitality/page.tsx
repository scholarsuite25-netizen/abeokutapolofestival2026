import Link from "next/link";
import {
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnquiryDialog } from "@/components/design/public/enquiry-dialog";

export const metadata = {
  title: "Hospitality & Enclosures — 2026 Abeokuta Polo Festival",
  description:
    "VIP chalets, Chukka Terrace, Royal Patrons Circle, and executive hospitality enclosures at the 2026 Abeokuta Polo Festival.",
};

const ENCLOSURES = [
  {
    id: "royal-patrons",
    title: "The Royal Patrons' Dais",
    badge: "Supreme Dignitary Protocol",
    description:
      "Exclusive elevated viewing enclosure reserved for Royal Obas, Emirs, Visiting Ambassadors, and Principal Festival Benefactors.",
    features: [
      "Front-row field viewing with unobstructed chukka lines",
      "Dedicated protocol liaison and royal security detail",
      "Executive dining & sommelier champagne service",
      "Direct accreditation access via Gate 1 Royal Boulevard",
      "Commemorative leather-bound 2026 Tournament Gazette",
    ],
  },
  {
    id: "private-chalet",
    title: "Private Chukka Chalets",
    badge: "Corporate & Private Hosting",
    description:
      "Custom branded field-side hospitality chalets designed for corporate entertainment, multinational delegations, and private family hosting.",
    features: [
      "Private marquee pavilion for up to 30 executive guests",
      "Bespoke branding and company livery displays",
      "Dedicated culinary staff, canapés, and bar stewards",
      "Private VIP credential allocations with express check-in",
      "Guaranteed VIP parking passes at the main clubhouse",
    ],
  },
  {
    id: "presidents-lounge",
    title: "President's Marquee & Club Lounge",
    badge: "Club Leadership & Invited Patrons",
    description:
      "The social epicenter of the Abeokuta Polo Club, uniting club trustees, patrons, tournament sponsors, and participating polo team captains.",
    features: [
      "Access to the air-conditioned clubhouse and lawn veranda",
      "All-day artisanal catering and afternoon high tea service",
      "Priority invitations to the post-match Aristos Gala",
      "Exclusive player & patron mixer access between chukkas",
      "Complimentary digital wallet credential issuance",
    ],
  },
  {
    id: "chukka-terrace",
    title: "The Chukka Terrace",
    badge: "Equestrian Style & Society",
    description:
      "A vibrant lifestyle terrace offering lawn seating, premium mixology, acoustic music, and golden-hour polo viewing.",
    features: [
      "Open-air shaded terrace overlooking the tournament boards",
      "Access to the fashion & equestrian lifestyle pavilion",
      "Signature festival cocktails and gourmet small plates",
      "Complimentary entry with prior digital registration",
      "Live match commentary and scoreboard analysis",
    ],
  },
];

export default function HospitalityPage() {
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
            VIP Hospitality & Royal Enclosures
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl">
            Where Royal Hospitality <br />
            <span className="font-normal italic text-gold">Meets Equestrian Prestige</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ivory/80 sm:text-lg">
            Experience the 2026 Abeokuta Polo Festival through curated corporate hospitality, sovereign viewing circles, and bespoke field-side chalets.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <EnquiryDialog
              title="Hospitality & Chalet Inquiries"
              category="hospitality"
              triggerText="Inquire on Hospitality"
              className="bg-gold font-semibold text-forest-deep shadow hover:bg-gold/90"
            />
            <Button asChild variant="outline" className="border-ivory/30 text-ivory hover:bg-ivory/10 hover:text-ivory">
              <Link href="/programme">View Tournament Schedule</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. NON-PAYMENT & ALLOCATION POLICY (Rule D-15)                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="border-b border-line bg-sage/40 py-5">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8 text-xs text-forest-deep sm:text-sm">
          <ShieldCheck className="size-5 text-forest shrink-0" />
          <p>
            <strong>Official Allocation Policy:</strong> In compliance with tournament governance, all private chalets and corporate suites are allocated strictly via the Festival Secretariat. No booking fees or ticket payments are processed online. Contact our liaison desk directly via WhatsApp or phone.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. ENCLOSURES GRID                                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Curated Enclosures
            </span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-forest sm:text-4xl">
              Distinguished Festival Suites
            </h2>
            <p className="mt-2 text-sm text-muted-brand sm:text-base">
              Tailored spaces designed for visiting monarchs, corporate delegations, and polo enthusiasts.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {ENCLOSURES.map((enclosure) => (
              <div
                key={enclosure.id}
                className="flex flex-col justify-between rounded-2xl border border-line bg-card p-8 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-gold/50 bg-gold/10 text-forest font-semibold text-[11px]">
                      {enclosure.badge}
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-semibold text-forest">
                    {enclosure.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-brand leading-relaxed">
                    {enclosure.description}
                  </p>

                  <div className="mt-6 space-y-2.5 border-t border-line/60 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-forest">
                      Included Privileges:
                    </p>
                    {enclosure.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-muted-brand">
                        <CheckCircle2 className="size-4 text-gold shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 border-t border-line/60 pt-5">
                  <EnquiryDialog
                    title={`Inquire on ${enclosure.title}`}
                    category="hospitality"
                    tierName={enclosure.title}
                    triggerText="Inquire on This Suite"
                    className="w-full bg-forest font-semibold text-ivory hover:bg-forest-interactive"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* General Admission Notice */}
          <div className="mt-16 rounded-2xl border border-gold/40 bg-forest p-8 text-ivory text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:p-10">
            <div>
              <Badge variant="outline" className="border-gold text-gold text-[11px] uppercase tracking-widest">
                Complimentary General Entry
              </Badge>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ivory">
                General Public Lawn Attendance
              </h3>
              <p className="mt-1 text-sm text-ivory/80 max-w-xl">
                Lawn attendance is free to the public. Pre-registration is mandatory for security credential accreditation and gate passage.
              </p>
            </div>
            <div className="mt-6 sm:mt-0 shrink-0">
              <Button asChild size="lg" className="bg-gold font-semibold text-forest-deep hover:bg-gold/90">
                <Link href="/register">Register For Free Pass →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

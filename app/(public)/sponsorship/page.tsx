import Link from "next/link";
import {
  Handshake,
  CheckCircle2,
  ShieldAlert,
  Crown,
  Building,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnquiryDialog } from "@/components/design/public/enquiry-dialog";
import { SponsorshipPdfButton } from "@/components/shared/sponsorship-pdf-button";
import {
  CORPORATE_SPONSORSHIP_TIERS,
  SPECIALISED_SPONSORS,
} from "@/lib/data/sponsorship";

export const metadata = {
  title: "Corporate Sponsorship & Partnerships — 2026 Abeokuta Polo Festival",
  description:
    "Official corporate sponsorship tiers, guaranteed deliverables, and bespoke rights for the 2026 Abeokuta Polo Festival under the Royal Patronage of HRM The Alake of Egbaland.",
};

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
          <Badge
            variant="outline"
            className="border-gold/40 bg-gold/10 text-gold uppercase tracking-widest text-[11px]"
          >
            Corporate &amp; Sovereign Partnerships
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl text-ivory">
            Align Your Enterprise With <br />
            <span className="font-normal italic text-gold">West Africa&apos;s Sovereign Sport</span>
          </h1>
          <p className="mt-4 max-w-3xl text-base text-ivory/80 sm:text-lg">
            Connect directly with Royal Monarchs, Fortune 500 executives, diplomatic leadership, and over 2,500 accredited patrons across three historic days at the Abeokuta Polo Club &amp; Country Resort.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <EnquiryDialog
              title="Corporate Sponsorship Inquiries"
              category="sponsorship"
              triggerText="Connect with Secretariat"
              className="bg-gold font-semibold text-forest-deep shadow hover:bg-gold/90 text-sm"
            />
            <SponsorshipPdfButton
              variant="outline"
              className="border-gold/50 bg-gold/10 text-gold hover:bg-gold/20 text-sm"
            />
            <Button asChild variant="ghost" className="text-ivory/80 hover:text-ivory text-xs">
              <Link href="/programme">View Tournament Schedule →</Link>
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
            <strong>Official Transparency Notice:</strong> In accordance with festival governance, all sponsorship figures displayed below represent tier values from the Festival Blueprint. Packages and rights allocations are finalized upon bilateral contract approval with the Festival Secretariat. No payments are accepted online.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. CORPORATE SPONSORSHIP TIERS MATRIX                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Guaranteed Deliverables &amp; Rights Architecture
            </span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-forest sm:text-4xl">
              Corporate Sponsorship Tiers
            </h2>
            <p className="mt-2 text-sm text-muted-brand sm:text-base">
              From Title Partner exclusivity to distinguished community patronage, each package delivers tangible corporate prestige and measurable return on brand investment.
            </p>
          </div>

          <div className="space-y-8">
            {CORPORATE_SPONSORSHIP_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`flex flex-col justify-between rounded-3xl border p-6 transition sm:p-8 ${
                  tier.isPrimary
                    ? "border-2 border-gold bg-forest text-ivory shadow-2xl relative overflow-hidden"
                    : "border-line bg-card text-ink shadow-sm hover:shadow-md"
                }`}
              >
                {tier.isPrimary && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-gold/15 blur-3xl"
                  />
                )}

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
                  {/* Left Column: Title, Tier Amount, Positioning */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          tier.isPrimary
                            ? "border-gold bg-gold/25 text-gold font-bold text-[11px]"
                            : "border-gold/50 bg-gold/10 text-forest font-semibold text-[11px]"
                        }
                      >
                        {tier.badge}
                      </Badge>
                      <Badge variant="outline" className="border-line/40 text-[10px] uppercase text-muted-brand">
                        Official Tier
                      </Badge>
                    </div>

                    <h3
                      className={`font-display text-2xl sm:text-3xl font-semibold ${
                        tier.isPrimary ? "text-ivory" : "text-forest"
                      }`}
                    >
                      {tier.name}
                    </h3>

                    <p
                      className={`font-mono text-2xl sm:text-3xl font-bold tracking-tight ${
                        tier.isPrimary ? "text-gold" : "text-forest-interactive"
                      }`}
                    >
                      {tier.amount}
                    </p>

                    <p
                      className={`text-xs sm:text-sm leading-relaxed ${
                        tier.isPrimary ? "text-ivory/80" : "text-muted-brand"
                      }`}
                    >
                      {tier.description}
                    </p>

                    <div className="pt-2">
                      <EnquiryDialog
                        title={`Inquire on ${tier.name}`}
                        category="sponsorship"
                        tierName={`${tier.name} (${tier.amount})`}
                        triggerText="Inquire on This Tier"
                        className={
                          tier.isPrimary
                            ? "w-full bg-gold font-semibold text-forest-deep shadow hover:bg-gold/90 text-sm"
                            : "w-full bg-forest font-semibold text-ivory hover:bg-forest-interactive text-xs"
                        }
                      />
                    </div>
                  </div>

                  {/* Right Column: Categorized Deliverables */}
                  <div className="lg:col-span-8 border-t border-line/20 pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider block mb-4 ${
                        tier.isPrimary ? "text-gold" : "text-forest"
                      }`}
                    >
                      Guaranteed Deliverables &amp; Entitlements:
                    </span>

                    <div className="space-y-5">
                      {tier.deliverables.map((categoryGroup, idx) => (
                        <div key={idx} className="space-y-2">
                          <h4
                            className={`text-xs font-bold uppercase tracking-wider ${
                              tier.isPrimary ? "text-gold/90" : "text-forest-deep"
                            }`}
                          >
                            {categoryGroup.category}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {categoryGroup.items.map((item, itemIdx) => (
                              <div
                                key={itemIdx}
                                className="flex items-start gap-2 text-xs leading-relaxed"
                              >
                                <CheckCircle2
                                  className={`size-4 shrink-0 mt-0.5 ${
                                    tier.isPrimary ? "text-gold" : "text-forest-interactive"
                                  }`}
                                />
                                <span
                                  className={
                                    tier.isPrimary ? "text-ivory/90" : "text-muted-brand"
                                  }
                                >
                                  {item}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Download Brochure Banner */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gold/40 bg-forest p-6 text-ivory shadow-lg">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold block">
                Official Document Archive
              </span>
              <h3 className="font-display text-xl font-semibold text-ivory">
                Download the Complete 6-Page Corporate Sponsorship Brochure
              </h3>
              <p className="text-xs text-ivory/70">
                Detailed deliverables, branding dimensions, VIP allocations, and hospitality riders in printable PDF format.
              </p>
            </div>
            <SponsorshipPdfButton
              className="bg-gold font-bold text-forest hover:bg-gold/90 shrink-0 text-xs py-3"
            />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. SPECIALISED EVENT SPONSORSHIPS                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-sage/20 py-20 border-t border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge
              variant="outline"
              className="border-gold bg-gold/15 text-forest font-semibold text-[11px] mb-2"
            >
              <Crown className="mr-1 size-3 text-gold" /> Exclusive Event Properties
            </Badge>
            <h2 className="font-display text-3xl font-semibold text-forest sm:text-4xl">
              Specialised Event Sponsors
            </h2>
            <p className="mt-2 text-sm text-muted-brand sm:text-base">
              Anchor key ceremonial properties of the festival with direct co-branding on historic trophies, female empowerment matches, and grand finale concerts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {SPECIALISED_SPONSORS.map((prop) => (
              <div
                key={prop.id}
                className="flex flex-col justify-between rounded-3xl border border-line bg-card p-7 shadow-sm transition hover:shadow-lg hover:border-gold/50"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-gold/50 bg-gold/10 text-forest text-[11px] font-bold">
                      Specialised Property
                    </Badge>
                    <span className="text-xs text-muted-brand font-semibold">18–20 Dec 2026</span>
                  </div>

                  <h3 className="mt-4 font-display text-2xl font-semibold text-forest">
                    {prop.name}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-brand leading-relaxed">
                    {prop.desc}
                  </p>

                  <div className="mt-5 border-t border-line/60 pt-4 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-forest block">
                      Guaranteed Rights:
                    </span>
                    {prop.deliverables.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-ink/80">
                        <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-forest-interactive" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-line/60 pt-4">
                  <EnquiryDialog
                    title={`Inquire on ${prop.name}`}
                    category="sponsorship"
                    tierName={prop.name}
                    triggerText="Inquire on This Property"
                    className="w-full bg-forest text-ivory hover:bg-forest-interactive font-semibold text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Bespoke Secretariat Box */}
          <div className="mt-16 rounded-3xl border-2 border-gold/40 bg-forest p-8 text-center text-ivory sm:p-12 shadow-2xl relative overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-20 -bottom-20 size-80 rounded-full bg-gold/10 blur-3xl"
            />
            <Handshake className="size-12 text-gold mx-auto" />
            <h3 className="mt-4 font-display text-2xl sm:text-3xl font-semibold text-ivory">
              Bespoke Commercial &amp; Government Activations
            </h3>
            <p className="mt-2 text-sm text-ivory/80 max-w-2xl mx-auto leading-relaxed">
              Our Sponsorship &amp; Business Development Team works directly with corporate leadership, public institutions, and brand marketing teams to structure bespoke lounges, broadcast integration, and experiential showcases.
            </p>

            <div className="mt-6 flex flex-wrap justify-center items-center gap-6 text-xs text-gold">
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5" />
                Secretariat Desk: +234 818 188 8884
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5" />
                0803 681 8916
              </span>
              <span className="flex items-center gap-1.5">
                <Building className="size-3.5" />
                Abeokuta Polo Club &amp; Country Resort
              </span>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <EnquiryDialog
                title="Bespoke Partnership Inquiries"
                category="sponsorship"
                tierName="Bespoke Enterprise Activation"
                triggerText="Contact Sponsorship Secretariat"
                className="bg-gold font-semibold text-forest-deep hover:bg-gold/90 text-sm"
              />
              <SponsorshipPdfButton
                variant="outline"
                className="border-ivory/30 text-ivory hover:bg-white/10 text-xs"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

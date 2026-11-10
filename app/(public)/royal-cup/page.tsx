import Link from "next/link";
import {
  Crown,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnquiryDialog } from "@/components/design/public/enquiry-dialog";
import { ReadMoreSection } from "@/components/shared/read-more-section";
import { SocialShareBar } from "@/components/shared/social-share-bar";
import { FESTIVAL_METADATA } from "@/lib/data/programme";

export const metadata = {
  title: "The Royal Cup & Queens Cup — 2026 Abeokuta Polo Festival",
  description:
    "Signature high-goal polo championship presented in honor of His Royal Majesty, Oba Dr. Michael Aremu Gbadebo, CFR, the Alake and Paramount Ruler of Egbaland.",
};

export default function RoyalCupPage() {
  return (
    <div className="flex w-full max-w-full flex-col bg-ivory text-ink overflow-x-clip min-w-0">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. ROYAL NOTIFICATION TICKER                                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="border-b border-gold/30 bg-forest-deep px-4 py-2.5 text-xs text-ivory sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-gold">
              <Crown className="size-3.5 text-gold" /> Regal Protocol Gazette
            </span>
            <span className="hidden text-ivory/40 md:inline">·</span>
            <span className="text-ivory/80">
              Under the Distinguished Auspices of {FESTIVAL_METADATA.patron}
            </span>
          </div>
          <div className="hidden items-center gap-3 text-gold lg:flex">
            <span>{FESTIVAL_METADATA.venue}</span>
            <span>•</span>
            <span>Sunday, 20 December 2026</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. REGAL HERO SECTION                                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ivory py-16 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 size-96 rounded-full bg-gold/10 blur-3xl"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-line bg-sage/50 text-forest font-semibold uppercase tracking-widest text-[11px]">
              Signature Finale · Sunday 20 Dec 2026
            </Badge>
            <Badge variant="outline" className="border-gold/50 bg-gold/15 text-forest font-semibold uppercase tracking-widest text-[11px]">
              <Crown className="mr-1 size-3 text-gold" />
              In Honour of HRM The Alake of Egbaland
            </Badge>
            <Badge variant="outline" className="border-line bg-sage/50 text-muted-brand font-semibold uppercase tracking-widest text-[11px]">
              Admission: Through Ticket
            </Badge>
          </div>

          <div className="mt-8 grid grid-cols-1 items-end gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                <span className="h-px w-8 bg-gold" />
                The Grand Sovereign Championship
              </span>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-forest sm:text-6xl lg:text-7xl">
                The Royal Cup &amp; <br />
                <span className="font-normal italic text-gold">Queens Cup Finals</span>
              </h1>
              <p className="mt-4 text-lg font-display text-gold italic">
                &ldquo;ONE FIELD, ONE LEGACY&rdquo;
              </p>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-brand sm:text-lg">
                West Africa’s most distinguished polo championship, convening sovereign rulers, state leadership, diplomatic missions, and premier equestrian sportsmanship at the {FESTIVAL_METADATA.venue}.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-card p-6 shadow-md lg:col-span-4">
              <div className="flex items-center gap-2 border-b border-line/60 pb-3">
                <Shield className="size-5 text-gold" />
                <span className="text-xs font-semibold uppercase tracking-wider text-forest">
                  Sovereign Confluence
                </span>
              </div>
              <p className="mt-3 text-xs italic leading-relaxed text-muted-brand">
                &ldquo;{FESTIVAL_METADATA.tagline}&rdquo;
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                <EnquiryDialog
                  category="sponsorship"
                  tierName="Royal Cup Naming Rights (Proposed ₦25M)"
                  triggerText="Inquire Royal Naming Rights"
                  className="w-full bg-forest font-semibold text-ivory hover:bg-forest-interactive"
                />
                <EnquiryDialog
                  category="hospitality"
                  tierName="Royal Patrons' Dais"
                  triggerText="Reserve Royal Patrons' Dais"
                  variant="outline"
                  className="w-full border-line bg-card text-forest hover:bg-sage"
                />
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-line bg-card p-5 shadow-sm">
              <span className="font-display text-3xl font-semibold text-forest">100+</span>
              <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-muted-brand">
                Crowned Monarchs
              </span>
              <span className="text-xs text-forest-interactive">Egbaland &amp; Southwest Royalty</span>
            </div>

            <div className="rounded-xl border border-line bg-card p-5 shadow-sm">
              <span className="font-display text-3xl font-semibold text-forest">2 Cups</span>
              <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-muted-brand">
                Final Matches
              </span>
              <span className="text-xs text-forest-interactive">The Royal Cup &amp; Queens Cup</span>
            </div>

            <div className="rounded-xl border border-line bg-card p-5 shadow-sm">
              <span className="font-display text-3xl font-semibold text-forest">2025</span>
              <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-muted-brand">
                Established
              </span>
              <span className="text-xs text-forest-interactive">Abeokuta Polo Club</span>
            </div>

            <div className="rounded-xl border border-line bg-card p-5 shadow-sm">
              <span className="font-display text-3xl font-semibold text-forest">Ticket</span>
              <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-muted-brand">
                Sunday Admission
              </span>
              <span className="text-xs text-forest-interactive">Through Ticket Required</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. SOVEREIGN PATRONAGE & DEDICATION                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-sage/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            <div className="rounded-2xl border border-line bg-card p-8 shadow-md lg:col-span-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-gold">
                The Sovereign Throne
              </span>
              <h2 className="mt-2 font-display text-2xl font-semibold text-forest sm:text-3xl">
                His Royal Majesty, The Alake of Egbaland
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-brand">
                {FESTIVAL_METADATA.patron} serves as the Supreme Royal Patron. The Royal Declaration opens the festival on Saturday 19th December, with the presentation of the prestigious Royal Cup on Sunday 20th December.
              </p>
              <div className="mt-6 flex items-center gap-3 rounded-lg border border-gold/40 bg-gold/10 p-4 text-xs font-medium text-forest">
                <CheckCircle2 className="size-5 text-gold shrink-0" />
                <span>Player decorations, awards &amp; presentation of the Royal Cup by HRM on Sunday, 20 December 2026.</span>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-7">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Championship Heritage
              </span>
              <h2 className="font-display text-3xl font-semibold text-forest sm:text-4xl">
                The Confluence of Royalty &amp; High-Goal Sportsmanship
              </h2>
              <ReadMoreSection
                variant="pill"
                moreText="Read Sovereign Protocol Details"
                lessText="Hide Protocol Details"
                summary={
                  <p className="text-sm leading-relaxed text-muted-brand sm:text-base">
                    Celebrating the 100 Kings under the banner &ldquo;ONE FIELD, ONE LEGACY&rdquo; honours traditional rulers and their monumental contributions to cultural preservation, unity, and community leadership.
                  </p>
                }
                details={
                  <div className="space-y-2.5 rounded-xl border border-line bg-card p-4 text-xs">
                    <p className="font-bold text-forest uppercase tracking-wider text-[11px]">
                      Sovereign Grand Finale Protocol &amp; Ceremony Order:
                    </p>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-gold shrink-0">1. Royal Procession:</span>
                      <span className="text-muted-brand">Grand Cavalcade and formal court arrival of HRM The Alake of Egbaland and Southwest Royal Monarchs.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-gold shrink-0">2. Championship Chukkers:</span>
                      <span className="text-muted-brand">The Queens Cup Final followed by the 6-chukker high-goal showdown for The Royal Cup.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-gold shrink-0">3. Sovereign Decoration:</span>
                      <span className="text-muted-brand">Personal presentation of trophies, equine awards, and imperial blessings by His Royal Majesty.</span>
                    </div>
                  </div>
                }
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4">
                <div className="rounded-xl border border-line bg-card p-5">
                  <h3 className="font-display text-base font-semibold text-forest">Presidential Address</h3>
                  <p className="mt-2 text-xs text-muted-brand">
                    Official address by {FESTIVAL_METADATA.president} during the Grand Finale ceremonies.
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-card p-5">
                  <h3 className="font-display text-base font-semibold text-forest">Live Musical Celebrations</h3>
                  <p className="mt-2 text-xs text-muted-brand">
                    Two live musical performances by ARISTOS BAND and grand finale headline show by BERRYOLA.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-gold font-bold text-forest-deep hover:bg-gold/90">
                  <Link href="/register">Register For Gate Pass</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-line text-forest hover:bg-sage">
                  <Link href="/programme">View 3-Day Programme Itinerary</Link>
                </Button>
              </div>

              {/* Social Share Bar */}
              <div className="pt-6">
                <SocialShareBar
                  title="The Royal Cup Championship — 2026 Abeokuta Polo Festival"
                  description="Presented in honour of HRM Oba Dr. Michael Aremu Gbadebo, CFR, the Alake of Egbaland. Experience high-goal polo and cultural majesty."
                  url="https://www.abeokutapolofestival2026.org.ng/royal-cup"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

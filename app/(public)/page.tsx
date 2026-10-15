import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  MapPin,
  Award,
  Crown,
  Sparkles,
  Users,
  Wine,
  Flame,
  Theater,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FAQAccordion } from "@/components/design/public/faq-accordion";
import { EnquiryDialog } from "@/components/design/public/enquiry-dialog";

export default function HomePage() {
  return (
    <div className="flex w-full flex-col bg-ivory text-ink">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION (Dark Heritage Forest Atmosphere)                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-forest text-ivory">
        {/* Ambient Radial Lights */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(198,166,107,0.3),transparent_60%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-forest-interactive/40 blur-3xl"
        />

        {/* 1928 Club Foundation Watermark */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-4 right-8 select-none opacity-5 lg:block hidden"
        >
          <span className="font-display text-[160px] font-bold leading-none tracking-tighter text-gold">
            1928
          </span>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-forest-deep/80 px-4 py-1.5 shadow-sm backdrop-blur-md">
            <span className="size-2 rounded-full bg-gold animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              THE BLUEPRINT · 2026 ABEOKUTA POLO FESTIVAL
            </span>
          </div>

          {/* Hero Main Lockup */}
          <div className="mt-8 grid grid-cols-1 items-end gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <h1 className="font-display text-4xl font-semibold leading-[1.08] sm:text-6xl lg:text-7xl">
                Abeokuta Polo <br />
                <span className="font-normal italic text-gold">Festival 2026</span>
              </h1>
              <p className="mt-6 max-w-2xl font-display text-2xl font-light text-ivory/90 sm:text-3xl">
                Where Heritage Meets Excellence.
              </p>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-ivory/80 sm:text-lg">
                Three ceremonial days of equestrian distinction, Yoruba royal pageantry, and pan-African splendour on the historic turf of Egbaland.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:flex-col">
              <Button
                asChild
                size="lg"
                className="bg-gold text-base font-semibold text-forest-deep shadow-xl hover:bg-gold/90"
              >
                <Link href="/register">
                  Register (Free Pass)
                  <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-ivory/30 bg-forest-deep/40 text-base text-ivory hover:bg-ivory/10 hover:text-ivory"
              >
                <Link href="/programme">
                  Explore Programme
                  <Calendar className="ml-2 size-4 text-gold" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Architectural Metadata Bar (Confirmed Specs) */}
          <div className="mt-14 grid grid-cols-1 gap-4 rounded-2xl border border-line/20 bg-forest-deep/70 p-6 shadow-2xl backdrop-blur-md md:grid-cols-3">
            <div className="flex items-start gap-4 p-2">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <Calendar className="size-6" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gold">Festival Dates</span>
                <p className="font-display text-lg font-semibold text-ivory">18–20 December 2026</p>
                <p className="text-xs text-ivory/60">3 Days of High-Goal Grandeur</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-2">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <MapPin className="size-6" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gold">Grounds & Pavilion</span>
                <p className="font-display text-lg font-semibold text-ivory">Abeokuta Polo Club</p>
                <p className="text-xs text-ivory/60">Kobape, Abeokuta-Sagamu Expressway, Ogun State</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-2">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <Award className="size-6" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gold">Tournament Host</span>
                <p className="font-display text-lg font-semibold text-ivory">Abeokuta Polo Club</p>
                <p className="text-xs text-ivory/60">Partner: Ogun State Government · Est. 1928</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. COMPLIMENTARY ACCESS BANNER (Decision D-01/D-03)                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-sage/40 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-6 text-forest shrink-0" />
            <div>
              <p className="text-sm font-semibold text-forest">
                Complimentary Pass System · Accredited Guest Policy
              </p>
              <p className="text-xs text-muted-brand">
                Attendance is free. Entry requires prior digital registration and an accredited QR credential. This website does not process or take payments.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="bg-forest text-xs font-semibold text-ivory hover:bg-forest-interactive">
            <Link href="/register">Claim Free Credential</Link>
          </Button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. FIVE PILLARS OF EXCELLENCE                                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-ivory py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Strategic Framework
              </span>
              <h2 className="mt-2 font-display text-3xl font-semibold text-forest sm:text-4xl">
                The Five Pillars of Excellence
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-brand sm:text-base">
                The cornerstone architecture shaping West Africa’s premier equestrian and cultural gathering.
              </p>
            </div>
            <span className="hidden text-xs font-semibold uppercase tracking-wider text-muted-brand md:block">
              Abeokuta Polo Club · Founded 1928
            </span>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                num: "01",
                name: "Sport",
                desc: "High-goal polo competition featuring distinguished players, 80+ thoroughbred ponies, and intense chukkas.",
                tag: "High-Goal Calibre",
              },
              {
                num: "02",
                name: "Heritage",
                desc: "The sacred traditions and sovereign history of Egbaland, commemorating royal lineage and centuries-old culture.",
                tag: "Royal Lineage",
              },
              {
                num: "03",
                name: "Tourism",
                desc: "A destination landmark welcoming royal rulers, diplomatic corps, regional tourists, and international visitors.",
                tag: "Destination Gateway",
              },
              {
                num: "04",
                name: "Lifestyle",
                desc: "Refined equestrian fashion, high-society lawn gatherings, chukka terraces, and twilight celebrations.",
                tag: "Equestrian Chic",
              },
              {
                num: "05",
                name: "Brand Reach",
                desc: "Strategic partner visibility connecting high-net-worth audiences through tailored physical and digital activations.",
                tag: "Strategic Impact",
              },
            ].map((pillar) => (
              <div
                key={pillar.num}
                className="group relative flex flex-col justify-between rounded-xl border border-line bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-md"
              >
                <div>
                  <span className="text-xs font-bold text-gold">{pillar.num}</span>
                  <h3 className="mt-2 font-display text-xl font-semibold text-forest">
                    {pillar.name}
                  </h3>
                  <p className="mt-3 text-xs leading-relaxed text-muted-brand sm:text-sm">
                    {pillar.desc}
                  </p>
                </div>
                <div className="mt-6 border-t border-line/60 pt-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-forest-interactive">
                    {pillar.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. PROGRAMME HIGHLIGHTS & TOURNAMENT SHOWCASES                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-sage/25 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Tournament Showcases
            </span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-forest sm:text-4xl">
              Signature Spectacles
            </h2>
            <p className="mt-2 text-sm text-muted-brand sm:text-base">
              The sporting pinnacle of the festival, combining historic trophies and sovereign ceremonies.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* The Royal Cup */}
            <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-8 shadow-sm transition hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-gold/60 bg-gold/15 text-forest font-semibold">
                    <Crown className="mr-1 size-3.5 text-gold" />
                    Signature Pinnacle
                  </Badge>
                  <span className="text-xs font-semibold text-muted-brand">Sunday, 20 Dec</span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold text-forest">
                  The Royal Cup
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-brand">
                  The premier heritage polo trophy presented in honor of His Royal Majesty, the Alake and Paramount Ruler of Egbaland, convening 100+ crowned monarchs.
                </p>
              </div>
              <div className="mt-8 border-t border-line/60 pt-4">
                <Button asChild variant="link" className="p-0 text-forest font-semibold hover:text-gold">
                  <Link href="/royal-cup">
                    Explore The Royal Cup Feature →
                  </Link>
                </Button>
              </div>
            </div>

            {/* Polo Queens Match */}
            <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-8 shadow-sm transition hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-line bg-sage/60 text-forest font-semibold">
                    <Sparkles className="mr-1 size-3.5 text-forest" />
                    All-Female Showcase
                  </Badge>
                  <span className="text-xs font-semibold text-muted-brand">Saturday, 19 Dec</span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold text-forest">
                  Polo Queens Invitational
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-brand">
                  An elite invitational celebrating the prowess, elegance, and distinction of women in polo, creating a landmark showcase for leadership in the sport.
                </p>
              </div>
              <div className="mt-8 border-t border-line/60 pt-4">
                <Button asChild variant="link" className="p-0 text-forest font-semibold hover:text-gold">
                  <Link href="/programme">
                    View Match Timelines →
                  </Link>
                </Button>
              </div>
            </div>

            {/* All-Stars International Game */}
            <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-8 shadow-sm transition hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-gold/60 bg-gold/15 text-forest font-semibold">
                    <Award className="mr-1 size-3.5 text-gold" />
                    King of Games
                  </Badge>
                  <span className="text-xs font-semibold text-muted-brand">18–20 Dec 2026</span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold text-forest">
                  All-Stars International
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-brand">
                  High-profile chukkas featuring Africa’s top professional players and distinguished patrons competing in a world-class equestrian exhibition.
                </p>
              </div>
              <div className="mt-8 border-t border-line/60 pt-4">
                <Button asChild variant="link" className="p-0 text-forest font-semibold hover:text-gold">
                  <Link href="/programme">
                    Tournament Schedule →
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. EXPERIENCES & HOSPITALITY (Deep Emerald Atmosphere)               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-forest text-ivory py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 size-80 rounded-full bg-gold/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Curated Prestige
              </span>
              <h2 className="mt-2 font-display text-3xl font-semibold text-ivory sm:text-4xl">
                Hospitality & Celebrations
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-ivory/80 sm:text-base">
                Immersive enclosures, private chukka chalets, cultural ceremonies, and night spectacles.
              </p>
            </div>
            <Button asChild variant="outline" className="border-gold text-gold hover:bg-gold/20 hover:text-ivory">
              <Link href="/hospitality">View All Enclosures</Link>
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Corporate Hospitality */}
            <div className="rounded-2xl border border-line/20 bg-forest-deep/60 p-8 shadow-xl backdrop-blur-sm">
              <div className="flex size-14 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <Wine className="size-7" />
              </div>
              <span className="mt-6 block text-xs font-semibold uppercase tracking-widest text-gold">
                Executive Enclosures
              </span>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ivory">
                Chalet & Corporate Suites
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ivory/80">
                Reserved field-side chukka chalets for executive delegations, private banking associates, and VIP patrons with bespoke culinary service.
              </p>
              <div className="mt-8 border-t border-line/20 pt-4">
                <EnquiryDialog
                  category="hospitality"
                  tierName="Private Chalet / Corporate Suite"
                  triggerText="Inquire on Chalets"
                  className="w-full bg-gold font-semibold text-forest-deep hover:bg-gold/90"
                />
              </div>
            </div>

            {/* Cultural Pageantry */}
            <div className="rounded-2xl border border-line/20 bg-forest-deep/60 p-8 shadow-xl backdrop-blur-sm">
              <div className="flex size-14 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <Theater className="size-7" />
              </div>
              <span className="mt-6 block text-xs font-semibold uppercase tracking-widest text-gold">
                Sovereign Heritage
              </span>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ivory">
                Kings Procession & Durbar
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ivory/80">
                A grand ceremonial procession of southwest royalty, ceremonial drumming, and traditional equestrian horsemanship celebrating Yoruba lineage.
              </p>
              <div className="mt-8 border-t border-line/20 pt-4">
                <Button asChild variant="outline" className="w-full border-ivory/30 text-ivory hover:bg-ivory/10">
                  <Link href="/experiences">Learn More</Link>
                </Button>
              </div>
            </div>

            {/* Bonfire & Fireworks */}
            <div className="rounded-2xl border border-line/20 bg-forest-deep/60 p-8 shadow-xl backdrop-blur-sm">
              <div className="flex size-14 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <Flame className="size-7" />
              </div>
              <span className="mt-6 block text-xs font-semibold uppercase tracking-widest text-gold">
                Festival Climax
              </span>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ivory">
                Bonfire Night & Fireworks
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ivory/80">
                Spectacular evening fireworks and grand lawn bonfire ushering in the year-end celebration under the starlit skies of Abeokuta.
              </p>
              <div className="mt-8 border-t border-line/20 pt-4">
                <Button asChild variant="outline" className="w-full border-ivory/30 text-ivory hover:bg-ivory/10">
                  <Link href="/programme">View Evening Schedule</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. CURATED FESTIVAL SHOWCASES (Gallery, Publications, Sponsorship)  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-ivory py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Archives & Engagement
            </span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-forest sm:text-4xl">
              Curated Festival Portals
            </h2>
            <p className="mt-2 text-sm text-muted-brand sm:text-base">
              Explore official gazettes, photographic archives, and corporate sponsorship tiers.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Gallery Portal */}
            <div className="flex flex-col justify-between rounded-xl border border-line bg-card p-6 shadow-sm hover:shadow-md">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-forest-interactive">
                  Photo Archive
                </span>
                <h3 className="mt-2 font-display text-xl font-semibold text-forest">
                  Media & Gallery Hub
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-brand sm:text-sm">
                  Curated photographic coverage from past chukkas, ceremonial gatherings, and tournament highlights.
                </p>
              </div>
              <div className="mt-6">
                <Button asChild variant="outline" size="sm" className="border-line text-forest hover:bg-sage">
                  <Link href="/gallery">Open Gallery →</Link>
                </Button>
              </div>
            </div>

            {/* Publications Portal */}
            <div className="flex flex-col justify-between rounded-xl border border-line bg-card p-6 shadow-sm hover:shadow-md">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-forest-interactive">
                  Official Gazette
                </span>
                <h3 className="mt-2 font-display text-xl font-semibold text-forest">
                  Publications & Gazette
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-brand sm:text-sm">
                  Official tournament gazette, festival guides, rules of play, and commemorative historical issues.
                </p>
              </div>
              <div className="mt-6">
                <Button asChild variant="outline" size="sm" className="border-line text-forest hover:bg-sage">
                  <Link href="/publications">View Publications →</Link>
                </Button>
              </div>
            </div>

            {/* Sponsorship Portal */}
            <div className="flex flex-col justify-between rounded-xl border border-line bg-card p-6 shadow-sm hover:shadow-md">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-forest-interactive">
                  Partnership Packages
                </span>
                <h3 className="mt-2 font-display text-xl font-semibold text-forest">
                  Sponsorship Tiers
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-brand sm:text-sm">
                  Proposed sponsorship tiers ranging from ₦2.5M to ₦75M headline partnership with verified brand rights.
                </p>
              </div>
              <div className="mt-6">
                <Button asChild variant="outline" size="sm" className="border-line text-forest hover:bg-sage">
                  <Link href="/sponsorship">Review Packages →</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. FREQUENTLY ASKED QUESTIONS                                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-sage/20 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Visitor Protocol
            </span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-forest sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-muted-brand sm:text-base">
              Key information regarding attendance, venue access, and festival regulations.
            </p>
          </div>

          <FAQAccordion />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 8. PRE-FOOTER REGISTRATION & INQUIRY INVITATION                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-ivory py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-forest-deep p-8 text-ivory shadow-2xl sm:p-12 lg:p-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -bottom-20 size-96 rounded-full bg-gold/10 blur-3xl"
            />

            <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <Badge variant="outline" className="border-gold/50 bg-gold/10 text-gold uppercase tracking-widest text-[11px]">
                  Royal Invitational · December 2026
                </Badge>
                <h2 className="mt-4 font-display text-3xl font-semibold text-ivory sm:text-4xl">
                  Secure Your Accredited Festival Pass
                </h2>
                <p className="mt-3 text-base text-ivory/80">
                  18–20 December 2026 at the Abeokuta Polo Club. Prior digital registration is mandatory for gate entrance.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-gold">
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    Helpline: +234 818 188 8884
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    0803 681 8916
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    @abeokuta_polofestival
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col shrink-0 w-full sm:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="bg-gold font-semibold text-forest-deep shadow hover:bg-gold/90"
                >
                  <Link href="/register">Register For Free Pass</Link>
                </Button>
                <EnquiryDialog
                  title="Festival Secretariat Inquiries"
                  triggerText="Protocol & Hospitality Inquiries"
                  variant="outline"
                  className="border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10 hover:text-ivory"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

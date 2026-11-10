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
  Phone,
  Ticket,
  Music,
  Film,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FAQAccordion } from "@/components/design/public/faq-accordion";
import { EnquiryDialog } from "@/components/design/public/enquiry-dialog";
import { FestivalCountdown } from "@/components/shared/festival-countdown";

import { AttendanceMilestoneWidget } from "@/components/shared/attendance-milestone-widget";
import { ReadMoreSection } from "@/components/shared/read-more-section";
import { SocialShareBar } from "@/components/shared/social-share-bar";
import { FESTIVAL_METADATA } from "@/lib/data/programme";
import { DAY3_VVIP_PRICE_DISPLAY } from "@/lib/config/checkout-config";

export default function HomePage() {
  return (
    <div className="flex w-full max-w-full flex-col bg-ivory text-ink overflow-x-clip min-w-0">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HERO SECTION WITH REGISTRATION PRIORITY & LIVE COUNTDOWN     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-black text-ivory">
        {/* Ambient Radial Lights safely clipped to prevent horizontal overflow */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,76,0.22),transparent_65%)]" />
          <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-gold/10 blur-3xl" />
        </div>

        {/* 2025 Foundation Watermark */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-4 right-8 select-none opacity-5 lg:block hidden"
        >
          <span className="font-display text-[160px] font-bold leading-none tracking-tighter text-gold">
            2025
          </span>
        </div>

        <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-14 sm:pb-20 min-w-0">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-neutral-900/90 px-4 py-1.5 shadow-sm backdrop-blur-md">
            <span className="size-2 rounded-full bg-gold animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {FESTIVAL_METADATA.title} · {FESTIVAL_METADATA.subTitle.toUpperCase()}
            </span>
          </div>

          {/* Hero Main Lockup */}
          <div className="mt-6 grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-4">
              <h1 className="font-display text-4xl font-semibold leading-[1.08] sm:text-6xl lg:text-7xl">
                Abeokuta Polo <br />
                <span className="font-display font-semibold not-italic text-gold">Festival 2026</span>
              </h1>

              <p className="font-display text-xl sm:text-2xl font-semibold not-italic text-gold">
                &ldquo;{FESTIVAL_METADATA.theme}&rdquo;
              </p>

              <p className="max-w-2xl text-base leading-relaxed text-ivory/80 sm:text-lg">
                Three ceremonial days of equestrian distinction, Yoruba royal pageantry, and pan-African splendour at the {FESTIVAL_METADATA.venue}.
              </p>

              {/* Architectural Metadata Bar */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
                <div className="flex items-center gap-3 rounded-xl border border-gold/25 bg-neutral-900/80 p-3 shadow-md backdrop-blur-sm">
                  <Calendar className="size-5 text-gold shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gold">Dates</span>
                    <p className="text-xs font-semibold text-ivory">{FESTIVAL_METADATA.dates}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-gold/25 bg-neutral-900/80 p-3 shadow-md backdrop-blur-sm">
                  <MapPin className="size-5 text-gold shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gold">Venue</span>
                    <p className="text-xs font-semibold text-ivory">Abeokuta Polo Club &amp; Country Resort</p>
                  </div>
                </div>
              </div>

              {/* Quick Hero Actions: Immediate Registration & Itinerary */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <Button asChild className="bg-gold font-bold text-black hover:bg-gold/90 text-xs shadow-md py-4 px-5">
                  <Link href="/register">Register Gate Pass (Days 1 &amp; 2 Free) →</Link>
                </Button>
                <Button asChild variant="outline" className="border-gold/50 bg-gold/15 text-gold hover:bg-gold/25 font-semibold text-xs py-4 px-5">
                  <Link href="/programme">View 3-Day Programme</Link>
                </Button>
                <Button asChild variant="ghost" className="text-ivory/80 hover:text-ivory text-xs">
                  <Link href="/royal-cup">The Royal Cup →</Link>
                </Button>
              </div>
            </div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* PRIORITY REGISTRATION COCKPIT (PRIMARY APP FOCUS) & COUNTDOWN */}
            {/* ───────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-5 rounded-3xl border-2 border-gold/50 bg-neutral-950/95 p-4 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-5 min-w-0">
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -right-12 -top-12 size-40 rounded-full bg-gold/15 blur-2xl" />
              </div>

              {/* 1. REGISTRATION MODULE CENTERPIECE */}
              <div className="relative z-10 rounded-2xl border border-gold/40 bg-neutral-900/90 p-3 sm:p-4 space-y-2.5 shadow-inner min-w-0">
                <div className="flex items-center justify-between">
                  <Badge className="bg-gold text-black font-bold text-[9px] px-2 py-0.5">
                    <Ticket className="mr-1 size-2.5" /> OFFICIAL GATE ACCREDITATION
                  </Badge>
                  <span className="text-[10px] text-white font-semibold">● Instant Digital Drop</span>
                </div>

                <div>
                  <h3 className="font-display text-sm sm:text-base font-semibold text-ivory">
                    Register for Your Festival Gate Pass
                  </h3>
                  <p className="text-[11px] text-ivory/70 mt-0.5 leading-relaxed">
                    Days 1 &amp; 2 are 100% Free Public Admission. Day 3 is Paid VVIP ({DAY3_VVIP_PRICE_DISPLAY}) or by Special Invitation. Combined pass for Days 1 &amp; 2; luxury deep-gold ID-card for Day 3.
                  </p>
                </div>

                {/* Mandatory Gate Protocol Callout */}
                <div className="rounded-xl border border-gold/60 bg-gold/10 p-2 text-[10px] text-ivory flex items-start gap-2">
                  <ShieldCheck className="size-3.5 text-gold shrink-0 mt-0.5" />
                  <p className="leading-snug text-[10px] text-ivory/90">
                    <strong className="text-gold font-bold uppercase tracking-wider">Mandatory Gate Protocol:</strong>{" "}
                    All attendees must be duly registered to attend any of the three festival days. No turnstile admission is permitted without an official digital access card.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] pt-0.5">
                  <div className="rounded bg-black/80 p-1 border border-white/40 text-white min-w-0">
                    <span className="block font-bold truncate">Day 1 (Fri 18)</span>
                    <span className="text-[8px] text-white/90 block truncate font-bold">100% FREE</span>
                  </div>
                  <div className="rounded bg-black/80 p-1 border border-white/40 text-white min-w-0">
                    <span className="block font-bold truncate">Day 2 (Sat 19)</span>
                    <span className="text-[8px] text-white/90 block truncate font-bold">100% FREE</span>
                  </div>
                  <div className="rounded bg-black/80 p-1 border border-gold/40 text-amber-300 min-w-0">
                    <span className="block font-bold truncate">Day 3 (Sun 20)</span>
                    <span className="text-[8px] text-gold block truncate font-bold">PAID VVIP</span>
                  </div>
                </div>

                {/* Un-cramped side-by-side or stacked grid with min-w-0 (Zero Overflow) */}
                <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    asChild
                    size="sm"
                    className="w-full min-w-0 bg-gold font-bold text-black hover:bg-gold/90 shadow-md text-xs py-2.5 px-2 text-center"
                  >
                    <Link href="/register" className="truncate">
                      Register Pass Now →
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="w-full min-w-0 border-ivory/30 bg-white/10 text-ivory hover:bg-white/20 text-xs py-2.5 px-2 text-center"
                  >
                    <Link href="/pass/lookup" className="truncate">Look Up Pass</Link>
                  </Button>
                </div>
              </div>

              {/* 2. LIVE COUNTDOWN COMPONENT IMMEDIATELY BELOW REGISTRATION */}
              <div className="relative z-10 pt-1">
                <FestivalCountdown variant="full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. OFFICIAL ACCREDITATION & GATE PASS MODULE (MOVED UPWARD)         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-ivory py-8 sm:py-10 border-b border-line">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 min-w-0">
          <div className="relative overflow-hidden rounded-2xl bg-black border border-gold/40 p-4 sm:p-6 lg:p-8 text-ivory shadow-xl min-w-0">
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -right-20 -bottom-20 size-96 rounded-full bg-gold/10 blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-2xl space-y-1.5">
                <Badge variant="outline" className="border-gold/50 bg-gold/10 text-gold uppercase tracking-widest text-[10px]">
                  Official Gate Accreditation · 18–20 December 2026
                </Badge>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-ivory">
                  Obtain Your Digital Access Card
                </h2>
                <p className="text-xs sm:text-sm text-ivory/80 leading-relaxed">
                  Day 1 &amp; Day 2 are 100% Free Public Admission (issued as separate individual passes). Day 3 is the Royal Cup Grand Finale &amp; VVIP Tables / Individual VIP Option ({DAY3_VVIP_PRICE_DISPLAY}), issued with cryptographic security features.
                </p>

                {/* Mandatory Turnstile Protocol Callout */}
                <div className="mt-2.5 rounded-xl border border-gold/50 bg-neutral-900 p-2.5 flex items-start gap-2.5">
                  <ShieldCheck className="size-4 text-gold shrink-0 mt-0.5" />
                  <div className="text-[11px] text-ivory">
                    <span className="font-bold text-gold uppercase tracking-wider text-[10px] block">
                      Mandatory Gate Protocol
                    </span>
                    <p className="text-ivory/90 leading-relaxed text-[11px] mt-0.5">
                      <strong>All attendees must be duly registered to attend any of the three festival days.</strong> No turnstile admission is permitted without an official digital access card.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gold">
                  <a
                    href="tel:+2348181888884"
                    className="flex items-center gap-1.5 hover:text-gold-light hover:underline transition-colors font-semibold"
                  >
                    <Phone className="size-3.5" />
                    Helpline: +234 818 188 8884
                  </a>
                  <a
                    href="tel:08036818916"
                    className="flex items-center gap-1.5 hover:text-gold-light hover:underline transition-colors font-semibold"
                  >
                    <Phone className="size-3.5" />
                    0803 681 8916
                  </a>
                  <a
                    href="https://wa.me/2348181888884?text=Hello%20Secretariat%2C%20I%20am%20enquiring%20about%20the%202026%20Abeokuta%20Polo%20Festival"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-gold-light hover:underline transition-colors font-semibold text-emerald-400"
                  >
                    <MessageCircle className="size-3.5" />
                    WhatsApp Secretariat
                  </a>
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Users className="size-3.5" />
                    @abeokuta_polofestival
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col shrink-0 w-full sm:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="bg-gold font-bold text-black shadow hover:bg-gold/90 text-sm py-5 px-6"
                >
                  <Link href="/register">Register For Gate Pass</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10 hover:text-ivory text-xs"
                >
                  <Link href="/pass/lookup">Retrieve My Digital Pass</Link>
                </Button>
                <EnquiryDialog
                  title="Festival Secretariat Inquiries"
                  triggerText="Secretariat & Protocol Inquiries"
                  variant="outline"
                  className="border-ivory/20 bg-transparent text-ivory/80 hover:bg-ivory/10 hover:text-ivory text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1B. OFFICIAL FESTIVAL TEASER & CINEMATIC SHOWCASE                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-black text-ivory py-16 border-b border-gold/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <Badge variant="outline" className="border-gold bg-gold/15 text-gold font-bold text-[11px]">
                <Film className="mr-1.5 size-3.5" /> CINEMATIC PREVIEW
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ivory leading-tight">
                Experience the Spirit of <br />
                <span className="text-gold italic font-normal">Abeokuta Polo 2026</span>
              </h2>
              <p className="text-sm leading-relaxed text-ivory/80">
                Witness high-speed equestrian thunder, sovereign Yoruba fanfare, and high-fashion society. Three historic days unfolding at Abeokuta Polo Club &amp; Country Resort.
              </p>
              <div className="space-y-2 pt-2 text-xs text-ivory/90">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-gold" />
                  <span>Day 1: 100% Free Public Entry &amp; Media Light-Up</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-gold" />
                  <span>Day 2: Royal Opening by HRM The Alake &amp; 3 Foundation-Layings</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-gold" />
                  <span>Day 3: Royal Cup Grand Finale, 100 Kings Celebration &amp; ARISTOS BAND</span>
                </div>
              </div>
              <div className="pt-4 flex flex-wrap gap-3">
                <Button asChild className="bg-gold font-bold text-forest hover:bg-gold/90 text-xs">
                  <Link href="/register">Claim Free Gate Pass</Link>
                </Button>
                <Button asChild className="bg-white text-forest font-bold border-2 border-gold/40 hover:bg-gold hover:text-forest text-xs shadow-md transition-all">
                  <Link href="/programme">View Tournament Schedule</Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-gold/40 bg-neutral-950 p-6 sm:p-8 text-ivory shadow-2xl relative overflow-hidden">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-gold/15 blur-2xl"
                />
                <div className="relative space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gold text-black text-[10px] font-bold uppercase tracking-wider">
                      Official Tournament Venue
                    </Badge>
                    <span className="text-xs text-gold/90 font-medium">18–20 December 2026</span>
                  </div>

                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-ivory">
                    Abeokuta Polo Club &amp; Country Resort
                  </h3>

                  <p className="text-xs sm:text-sm text-ivory/85 leading-relaxed">
                    Set across the scenic Kobape grounds along the Abeokuta–Sagamu Expressway in Ogun State,
                    convening traditional royalty, state dignitaries, and equestrian sportsmanship.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="rounded-xl border border-gold/20 bg-black/30 p-3.5">
                      <p className="text-gold font-bold text-[11px] uppercase tracking-wider">Royal Auspices</p>
                      <p className="text-ivory/80 text-[11px] mt-1">HRM Oba Dr. Adedotun Aremu Gbadebo CFR, Alake &amp; Paramount Ruler of Egbaland</p>
                    </div>
                    <div className="rounded-xl border border-gold/20 bg-black/30 p-3.5">
                      <p className="text-gold font-bold text-[11px] uppercase tracking-wider">Secretariat Desk</p>
                      <p className="text-ivory/80 text-[11px] mt-1">Direct Inquiries: +234 818 188 8884 · 0803 681 8916 · abeokutapolo@gmail.com</p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2.5">
                    <Button asChild size="sm" className="bg-gold text-black font-bold hover:bg-gold/90 text-xs">
                      <Link href="/register">Register Digital Pass →</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="border-gold/40 bg-white/10 text-ivory hover:bg-white/20 text-xs">
                      <Link href="/tables">Day 3 VIP Tables</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. THREE-DAY OFFICIAL PROGRAMME SECTION (Updated Build)              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-sage/25 py-20 border-b border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Official Festival Itinerary
              </span>
              <h2 className="mt-2 font-display text-3xl font-semibold text-forest sm:text-5xl">
                The 3-Day Programme
              </h2>
              <p className="mt-2 text-sm text-muted-brand sm:text-base max-w-2xl">
                Complete timetable and ceremonial events taking place at the Abeokuta Polo Club &amp; Country Resort.
              </p>
            </div>
            <Button asChild className="bg-forest text-ivory hover:bg-forest-interactive shrink-0">
              <Link href="/programme">
                Explore Detailed Programme <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>

          {/* Admission Rules Protocol Notice */}
          <div className="mb-8 rounded-2xl border-2 border-gold/40 bg-neutral-950 p-4 sm:p-5 text-ivory flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-gold text-black shrink-0">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold block">
                  Admission Rules &amp; Gate Protocol
                </span>
                <p className="text-xs sm:text-sm text-ivory/90 font-medium">
                  <strong>Mandatory Gate Protocol:</strong> All attendees must be duly registered to attend any of the three festival days. No turnstile admission is permitted without an official digital access card.
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="bg-gold font-bold text-black hover:bg-gold/90 text-xs shrink-0">
              <Link href="/register">Register Gate Pass →</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Day 1 Card */}
            <div className="flex flex-col justify-between rounded-3xl border border-line bg-card p-7 shadow-sm transition hover:shadow-lg hover:border-gold/50">
              <div>
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-800 text-ivory text-[10px]">100% FREE ENTRY</Badge>
                  <span className="text-xs font-semibold text-muted-brand">Fri 18 Dec 2026</span>
                </div>
                <h3 className="mt-3 font-display text-2xl font-semibold text-forest">
                  Day 1: Media, Tour &amp; Light-Up
                </h3>

                <ReadMoreSection
                  variant="pill"
                  moreText="Read More Itinerary"
                  lessText="Hide Itinerary"
                  summary={
                    <p className="mt-2 text-xs text-muted-brand">
                      Official commencement welcoming journalists, accredited delegates, and participating polo players for club inspections and evening gala.
                    </p>
                  }
                  details={
                    <div className="space-y-3 border-t border-line/60 pt-3 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gold-deep shrink-0">10:00 AM – 12:00 PM:</span>
                        <span className="text-ink/80">Press Conference and Media Tour of Abeokuta Polo Club &amp; Country Resort.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gold-deep shrink-0">EVENING:</span>
                        <span className="text-ink/80">Official Festival Light-Up Ceremony, Welcome Dinner &amp; Player Networking.</span>
                      </div>
                    </div>
                  }
                />
              </div>

              <div className="mt-6 border-t border-line/60 pt-4 flex items-center justify-between">
                <Button asChild variant="link" className="p-0 text-forest font-semibold hover:text-gold text-xs">
                  <Link href="/programme">View Day 1 Schedule →</Link>
                </Button>
                <Button asChild size="sm" className="bg-forest text-ivory hover:bg-forest-interactive text-[11px] h-7 px-2.5">
                  <Link href="/register?day=1">Get Free Pass</Link>
                </Button>
              </div>
            </div>

            {/* Day 2 Card */}
            <div className="flex flex-col justify-between rounded-3xl border border-line bg-card p-7 shadow-sm transition hover:shadow-lg hover:border-gold/50">
              <div>
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-800 text-ivory text-[10px]">100% FREE ENTRY</Badge>
                  <span className="text-xs font-semibold text-muted-brand">Sat 19 Dec 2026</span>
                </div>
                <h3 className="mt-3 font-display text-2xl font-semibold text-forest">
                  Day 2: Royal Opening &amp; Polo
                </h3>

                <ReadMoreSection
                  variant="pill"
                  moreText="Read More Itinerary"
                  lessText="Hide Itinerary"
                  summary={
                    <p className="mt-2 text-xs text-muted-brand">
                      Royal declarations, 3 foundation-laying milestones, literature, sip &amp; paint, and thrilling derby matches. Free admission with pass.
                    </p>
                  }
                  details={
                    <div className="space-y-3 border-t border-line/60 pt-3 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gold-deep shrink-0">12:00 NOON:</span>
                        <span className="text-ink/80">
                          Royal Declaration by HRM Oba Dr. Michael Aremu Gbadebo, CFR; Opening of Festival Market Square; Foundation-Laying for Trauma Centre, Festival Complex &amp; 500-Horse Stable.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gold-deep shrink-0">ACTIVITIES:</span>
                        <span className="text-ink/80">
                          Queens Polo Match, Literary Debate, Poetry Recitation, Sip and Paint, DJ &amp; Evening Polo Match.
                        </span>
                      </div>
                    </div>
                  }
                />
              </div>

              <div className="mt-6 border-t border-line/60 pt-4 flex items-center justify-between">
                <Button asChild variant="link" className="p-0 text-forest font-semibold hover:text-gold text-xs">
                  <Link href="/programme">View Day 2 Schedule →</Link>
                </Button>
                <Button asChild size="sm" className="bg-forest text-ivory hover:bg-forest-interactive text-[11px] h-7 px-2.5">
                  <Link href="/register?day=2">Get Free Pass</Link>
                </Button>
              </div>
            </div>

            {/* Day 3 Card */}
            <div className="flex flex-col justify-between rounded-3xl border-2 border-gold/40 bg-card p-7 shadow-sm transition hover:shadow-lg hover:border-gold">
              <div>
                <div className="flex items-center justify-between">
                  <Badge className="bg-amber-600 text-ivory text-[10px]">PAID VVIP / SPECIAL INVITATION</Badge>
                  <span className="text-xs font-semibold text-muted-brand">Sun 20 Dec 2026</span>
                </div>
                <h3 className="mt-3 font-display text-2xl font-semibold text-forest">
                  Day 3: The Grand Finale
                </h3>

                <ReadMoreSection
                  variant="pill"
                  moreText="Read More Itinerary"
                  lessText="Hide Itinerary"
                  summary={
                    <p className="mt-2 text-xs text-muted-brand">
                      The Royal Cup &amp; Queens Cup Finals, 100 Kings Celebration, ARISTOS BAND performances, and headline close by BERRYOLA.
                    </p>
                  }
                  details={
                    <div className="space-y-3 border-t border-line/60 pt-3 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gold-deep shrink-0">12:00 NOON:</span>
                        <span className="text-ink/80">
                          Grand Finale Begins. Arrival of Dignitaries, Cultural Performances, Royal Cup Final &amp; Queens Cup Final.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gold-deep shrink-0">HIGHLIGHTS:</span>
                        <span className="text-ink/80">
                          Speeches by Chairman &amp; Club President Dr. Sheriff Adams Abdulrahman; ARISTOS BAND performances; Celebrating the 100 Kings; Headline close by BERRYOLA.
                        </span>
                      </div>
                    </div>
                  }
                />
              </div>

              <div className="mt-6 border-t border-line/60 pt-4 flex items-center justify-between">
                <Button asChild variant="link" className="p-0 text-forest font-semibold hover:text-gold text-xs">
                  <Link href="/programme">View Day 3 Schedule →</Link>
                </Button>
                <Button asChild size="sm" className="bg-gold font-bold text-forest hover:bg-gold/90 text-[11px] h-7 px-2.5 shadow-xs">
                  <Link href="/tables">VIP Tables &amp; Passes →</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. SIGNATURE SPECTACLES & ROYAL CUP HIGHLIGHTS                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-ivory py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Tournament Showcases
            </span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-forest sm:text-4xl">
              Signature Spectacles
            </h2>
            <p className="mt-2 text-sm text-muted-brand sm:text-base">
              The sporting pinnacle of the festival combining historic championship trophies and sovereign ceremonies.
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

                <ReadMoreSection
                  variant="link"
                  moreText="Read More Details"
                  lessText="Show Less"
                  summary={
                    <p className="mt-3 text-sm leading-relaxed text-muted-brand">
                      The premier heritage polo trophy presented in honor of His Royal Majesty, the Alake and Paramount Ruler of Egbaland, convening crowned monarchs and distinguished leaders.
                    </p>
                  }
                  details={
                    <p className="text-xs leading-relaxed text-forest/80 border-t border-line/60 pt-2">
                      Established as the centerpiece trophy of Egbaland equestrian distinction. High-goal teams compete across intensive chukkas, culminating in the royal trophy presentation on Sunday afternoon by His Royal Majesty the Alake.
                    </p>
                  }
                />
              </div>
              <div className="mt-8 border-t border-line/60 pt-4">
                <Button asChild variant="link" className="p-0 text-forest font-semibold hover:text-gold">
                  <Link href="/royal-cup">
                    Explore The Royal Cup Feature →
                  </Link>
                </Button>
              </div>
            </div>

            {/* Queens Polo Match */}
            <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-8 shadow-sm transition hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-line bg-sage/60 text-forest font-semibold">
                    <Sparkles className="mr-1 size-3.5 text-forest" />
                    Women in Polo
                  </Badge>
                  <span className="text-xs font-semibold text-muted-brand">Saturday, 19 Dec</span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold text-forest">
                  Queens Polo Match
                </h3>

                <ReadMoreSection
                  variant="link"
                  moreText="Read More Details"
                  lessText="Show Less"
                  summary={
                    <p className="mt-3 text-sm leading-relaxed text-muted-brand">
                      Celebrating women in polo, sporting excellence, and inclusion with high-calibre chukkas leading to the Queens Cup Final on Sunday.
                    </p>
                  }
                  details={
                    <p className="text-xs leading-relaxed text-forest/80 border-t border-line/60 pt-2">
                      Spotlighting female high-goal polo players across West Africa and international guest competitors. High-tempo matches scheduled across Saturday and Sunday, championing sporting inclusion and equestrian distinction.
                    </p>
                  }
                />
              </div>
              <div className="mt-8 border-t border-line/60 pt-4">
                <Button asChild variant="link" className="p-0 text-forest font-semibold hover:text-gold">
                  <Link href="/programme">
                    View Match Timelines →
                  </Link>
                </Button>
              </div>
            </div>

            {/* Celebrating the 100 Kings */}
            <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-8 shadow-sm transition hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-gold/60 bg-gold/15 text-forest font-semibold">
                    <Award className="mr-1 size-3.5 text-gold" />
                    One Field, One Legacy
                  </Badge>
                  <span className="text-xs font-semibold text-muted-brand">Sunday, 20 Dec</span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold text-forest">
                  Celebrating the 100 Kings
                </h3>

                <ReadMoreSection
                  variant="link"
                  moreText="Read More Details"
                  lessText="Show Less"
                  summary={
                    <p className="mt-3 text-sm leading-relaxed text-muted-brand">
                      &ldquo;ONE FIELD, ONE LEGACY&rdquo; — honouring traditional rulers and their monumental contributions to cultural preservation, unity, and community leadership.
                    </p>
                  }
                  details={
                    <p className="text-xs leading-relaxed text-forest/80 border-t border-line/60 pt-2">
                      A sovereign convocation of 100 crowned monarchs and royal fathers from across Yorubaland and Nigeria gathering at the tournament grounds for a ceremonial grand salute, royal blessings, and cultural celebration.
                    </p>
                  }
                />
              </div>
              <div className="mt-8 border-t border-line/60 pt-4">
                <Button asChild variant="link" className="p-0 text-forest font-semibold hover:text-gold">
                  <Link href="/experiences">
                    Explore Royal Confluence →
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. HOSPITALITY & CULTURAL CELEBRATIONS                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-black text-ivory py-20 border-y border-gold/30">
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
                Hospitality, Culture &amp; Entertainment
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-ivory/80 sm:text-base">
                Festival Market Square, debate contests, poetry recitation, sip &amp; paint, live musical sets by ARISTOS BAND and BERRYOLA.
              </p>
            </div>
            <Button asChild variant="outline" className="border-gold text-gold hover:bg-gold/20 hover:text-ivory">
              <Link href="/hospitality">View All Enclosures</Link>
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Market Square & Arts */}
            <div className="rounded-2xl border border-gold/30 bg-neutral-950/80 p-8 shadow-xl backdrop-blur-sm flex flex-col justify-between">
              <div>
                <div className="flex size-14 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  <Sparkles className="size-7" />
                </div>
                <span className="mt-6 block text-xs font-semibold uppercase tracking-widest text-gold">
                  Culture &amp; Ideas
                </span>
                <h3 className="mt-2 font-display text-2xl font-semibold text-ivory">
                  Festival Market Square
                </h3>

                <ReadMoreSection
                  variant="link"
                  moreText="Read More Details"
                  lessText="Show Less"
                  summary={
                    <p className="mt-3 text-sm leading-relaxed text-ivory/80">
                      Official opening by His Royal Majesty the Alake. Featuring the two-team Literary Debate Competition, Poetry Recitation, and interactive Sip &amp; Paint.
                    </p>
                  }
                  details={
                    <p className="text-xs leading-relaxed text-ivory/70 border-t border-line/20 pt-2">
                      An immersive open-air cultural bazaar showcasing Yoruba arts, indigenous textiles, photography installations, gourmet food stands, and curated artisanal exhibitions open to all registered festival guests.
                    </p>
                  }
                />
              </div>
              <div className="mt-8 border-t border-line/20 pt-4">
                <Button asChild className="w-full bg-neutral-900 text-ivory border border-gold/40 hover:bg-gold hover:text-black font-bold text-xs shadow-sm transition-all">
                  <Link href="/experiences">Learn More</Link>
                </Button>
              </div>
            </div>

            {/* Corporate Chalets */}
            <div className="rounded-2xl border border-gold/30 bg-neutral-950/80 p-8 shadow-xl backdrop-blur-sm flex flex-col justify-between">
              <div>
                <div className="flex size-14 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  <Wine className="size-7" />
                </div>
                <span className="mt-6 block text-xs font-semibold uppercase tracking-widest text-gold">
                  Executive Enclosures
                </span>
                <h3 className="mt-2 font-display text-2xl font-semibold text-ivory">
                  Chalet &amp; Corporate Suites
                </h3>

                <ReadMoreSection
                  variant="link"
                  moreText="Read More Details"
                  lessText="Show Less"
                  summary={
                    <p className="mt-3 text-sm leading-relaxed text-ivory/80">
                      Reserved field-side chukka chalets for executive delegations, private banking associates, and VIP patrons with bespoke hospitality.
                    </p>
                  }
                  details={
                    <p className="text-xs leading-relaxed text-ivory/70 border-t border-line/20 pt-2">
                      Featuring private marquee pavilions for up to 30 corporate guests, customized company livery, bespoke dining with sommelier service, express Gate 1 credential lanes, and priority parking.
                    </p>
                  }
                />
              </div>
              <div className="mt-8 border-t border-line/20 pt-4">
                <EnquiryDialog
                  category="hospitality"
                  tierName="Private Chalet / Corporate Suite"
                  triggerText="Inquire on Chalets"
                  className="w-full bg-gold font-semibold text-black hover:bg-gold/90"
                />
              </div>
            </div>

            {/* Headline Musical Concerts */}
            <div className="rounded-2xl border border-gold/30 bg-neutral-950/80 p-8 shadow-xl backdrop-blur-sm flex flex-col justify-between">
              <div>
                <div className="flex size-14 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  <Music className="size-7" />
                </div>
                <span className="mt-6 block text-xs font-semibold uppercase tracking-widest text-gold">
                  Grand Celebration
                </span>
                <h3 className="mt-2 font-display text-2xl font-semibold text-ivory">
                  ARISTOS BAND &amp; BERRYOLA
                </h3>

                <ReadMoreSection
                  variant="link"
                  moreText="Read More Details"
                  lessText="Show Less"
                  summary={
                    <p className="mt-3 text-sm leading-relaxed text-ivory/80">
                      Electrifying live performances by ARISTOS BAND during the royal celebration and headline musical finale by BERRYOLA to close the festival.
                    </p>
                  }
                  details={
                    <p className="text-xs leading-relaxed text-ivory/70 border-t border-line/20 pt-2">
                      A celebration uniting timeless highlife elegance with contemporary musical energy. ARISTOS BAND headlines the afternoon Royal Cup banquet, followed by BERRYOLA commanding the twilight finale concert stage.
                    </p>
                  }
                />
              </div>
              <div className="mt-8 border-t border-line/20 pt-4">
                <Button asChild className="w-full bg-neutral-900 text-ivory border border-gold/40 hover:bg-gold hover:text-black font-bold text-xs shadow-sm transition-all">
                  <Link href="/programme">View Musical Schedule</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. OFFICIAL TAGLINE BANNER                                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-black text-gold py-8 border-y border-gold/30">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="font-display text-sm sm:text-base font-semibold tracking-widest uppercase">
            {FESTIVAL_METADATA.tagline}
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. FREQUENTLY ASKED QUESTIONS                                       */}
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
      {/* 6B. ATTENDANCE & VIRAL COMMUNITY ACCELERATOR                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-ivory pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AttendanceMilestoneWidget
            currentCount={1840}
            targetCount={2500}
            className="w-full"
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. PRE-FOOTER PROTOCOL ASSISTANCE & SECRETARIAT INQUIRIES           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-ivory py-16">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 min-w-0">
          <div className="relative overflow-hidden rounded-3xl bg-black border border-gold/40 p-4 sm:p-8 lg:p-16 text-ivory shadow-2xl min-w-0">
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -right-20 -bottom-20 size-96 rounded-full bg-gold/10 blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-2xl space-y-2">
                <Badge variant="outline" className="border-gold/50 bg-gold/10 text-gold uppercase tracking-widest text-[11px]">
                  Festival Secretariat &amp; Delegate Protocol
                </Badge>
                <h2 className="font-display text-3xl font-semibold text-ivory sm:text-4xl">
                  Connect With The Secretariat
                </h2>
                <p className="text-sm sm:text-base text-ivory/80 leading-relaxed">
                  For VIP enclosure allocations, corporate delegations, media accreditation, or hotel hospitality concierge assistance during the festival.
                </p>

                <div className="pt-3 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-gold">
                  <a
                    href="tel:+2348181888884"
                    className="flex items-center gap-1.5 hover:text-gold-light hover:underline transition-colors font-semibold"
                  >
                    <Phone className="size-3.5" />
                    Helpline: +234 818 188 8884
                  </a>
                  <a
                    href="tel:08036818916"
                    className="flex items-center gap-1.5 hover:text-gold-light hover:underline transition-colors font-semibold"
                  >
                    <Phone className="size-3.5" />
                    0803 681 8916
                  </a>
                  <a
                    href="https://wa.me/2348181888884?text=Hello%20Secretariat%2C%20I%20am%20enquiring%20about%20the%202026%20Abeokuta%20Polo%20Festival"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-gold-light hover:underline transition-colors font-semibold text-emerald-400"
                  >
                    <MessageCircle className="size-3.5" />
                    WhatsApp Secretariat
                  </a>
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Users className="size-3.5" />
                    @abeokuta_polofestival
                  </span>
                </div>

                {/* Global Social Sharing Widget */}
                <div className="pt-2">
                  <SocialShareBar />
                </div>

                {/* Pre-footer Gate Notice */}
                <div className="mt-4 rounded-xl border border-gold/50 bg-neutral-900 p-3.5 flex items-start gap-3">
                  <ShieldCheck className="size-5 text-gold shrink-0 mt-0.5" />
                  <div className="text-xs text-ivory">
                    <span className="font-bold text-gold uppercase tracking-wider text-[11px] block">
                      Pre-Footer Gate Protocol Notice
                    </span>
                    <p className="text-ivory/90 leading-relaxed text-xs mt-0.5">
                      <strong>Mandatory Gate Protocol:</strong> All attendees must be duly registered to attend any of the three festival days. No turnstile admission is permitted without an official digital access card.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col shrink-0 w-full sm:w-auto">
                <EnquiryDialog
                  title="Festival Secretariat Inquiries"
                  triggerText="Secretariat & Protocol Inquiries"
                  variant="default"
                  className="bg-gold font-bold text-black shadow hover:bg-gold/90 text-sm py-4 px-6"
                />
                <Button
                  asChild
                  variant="outline"
                  className="border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10 hover:text-ivory text-xs py-4 px-6"
                >
                  <Link href="/register">Register For Gate Pass →</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Crown,
  Sparkles,
  Award,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FestivalCountdown } from "@/components/shared/festival-countdown";
import { OFFICIAL_PROGRAMME, FESTIVAL_METADATA } from "@/lib/data/programme";

export const metadata = {
  title: "Official Tournament Programme — 2026 Abeokuta Polo Festival",
  description:
    "Official 3-day programme and daily schedule for the 2026 Abeokuta Polo Festival (18–20 December 2026) at Abeokuta Polo Club & Country Resort.",
};

export default function ProgrammePage() {
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
            Official 2026 Tournament Itinerary
          </Badge>

          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl text-ivory">
            {FESTIVAL_METADATA.title}: <br />
            <span className="font-normal italic text-gold">{FESTIVAL_METADATA.subTitle}</span>
          </h1>

          <p className="mt-3 text-lg sm:text-xl font-display text-gold/90 italic">
            &ldquo;{FESTIVAL_METADATA.theme}&rdquo;
          </p>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ivory/80 sm:text-base">
            Join royalty, high-goal competitors, corporate leaders, and equestrian enthusiasts from across Nigeria and the world at the {FESTIVAL_METADATA.venue}.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-gold">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              {FESTIVAL_METADATA.dates}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              Abeokuta Polo Club &amp; Country Resort
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="size-4" />
              Day 1 Free · Day 2 &amp; 3 Through Ticket
            </span>
          </div>

          {/* Live Countdown in Header */}
          <div className="mt-8 rounded-2xl border border-gold/30 bg-forest-deep/80 p-4 max-w-2xl backdrop-blur-md">
            <FestivalCountdown variant="banner" />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gold text-forest font-bold hover:bg-gold/90 shadow-lg">
              <Link href="/register">Get Gate Access Pass →</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-ivory/30 bg-white/10 text-ivory hover:bg-white/20"
            >
              <Link href="/pass/lookup">Look Up Stored Pass</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. PROGRAMME STATUS NOTICE & ADMISSION POLICY                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="border-b border-line bg-sage/40 py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="flex items-start gap-3 rounded-xl bg-card p-3.5 border border-line">
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800 shrink-0 font-bold">D1</div>
              <div>
                <strong className="text-forest block text-sm">Friday 18 Dec · Free Public Entry</strong>
                <p className="text-muted-brand mt-0.5">
                  Press Conference, Media Tour, Festival Light-Up &amp; Welcome Dinner. 100% Free upon registration.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-card p-3.5 border border-line">
              <div className="rounded-lg bg-amber-100 p-2 text-amber-800 shrink-0 font-bold">D2</div>
              <div>
                <strong className="text-forest block text-sm">Saturday 19 Dec · Through Ticket</strong>
                <p className="text-muted-brand mt-0.5">
                  Royal Opening by HRM The Alake, Market Square opening, 3 Foundation-Layings, Queens Polo &amp; Art.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-card p-3.5 border border-line">
              <div className="rounded-lg bg-amber-100 p-2 text-amber-800 shrink-0 font-bold">D3</div>
              <div>
                <strong className="text-forest block text-sm">Sunday 20 Dec · Through Ticket</strong>
                <p className="text-muted-brand mt-0.5">
                  Grand Finale, Royal Cup &amp; Queens Cup Finals, 100 Kings Celebration, ARISTOS BAND &amp; BERRYOLA.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. THREE-DAY PROGRAMME SCHEDULE                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="day-1" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl border border-line bg-sage/30 p-1.5 sm:max-w-xl mx-auto mb-10">
              <TabsTrigger
                value="day-1"
                className="rounded-xl font-display text-sm font-semibold py-2.5 data-[state=active]:bg-forest data-[state=active]:text-ivory"
              >
                Day 1 · Fri 18 Dec
              </TabsTrigger>
              <TabsTrigger
                value="day-2"
                className="rounded-xl font-display text-sm font-semibold py-2.5 data-[state=active]:bg-forest data-[state=active]:text-ivory"
              >
                Day 2 · Sat 19 Dec
              </TabsTrigger>
              <TabsTrigger
                value="day-3"
                className="rounded-xl font-display text-sm font-semibold py-2.5 data-[state=active]:bg-forest data-[state=active]:text-ivory"
              >
                Day 3 · Sun 20 Dec
              </TabsTrigger>
            </TabsList>

            {/* DAY 1 */}
            <TabsContent value="day-1" className="space-y-6">
              <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-6 gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                      Day 1: Friday, 18th December 2026
                    </span>
                    <h2 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-forest">
                      MEDIA, TOUR &amp; FESTIVAL LIGHT-UP
                    </h2>
                    <p className="mt-2 text-sm text-muted-brand max-w-2xl">
                      {OFFICIAL_PROGRAMME[0].leadSummary}
                    </p>
                  </div>
                  <Badge className="bg-emerald-800 text-ivory text-xs px-3 py-1 shrink-0 self-start sm:self-center">
                    100% FREE PUBLIC ENTRY
                  </Badge>
                </div>

                <div className="mt-8 space-y-8">
                  {OFFICIAL_PROGRAMME[0].schedule.map((block, idx) => (
                    <div
                      key={idx}
                      className={`rounded-2xl border p-6 transition-all ${
                        block.highlight
                          ? "border-gold/50 bg-gold/5 shadow-sm"
                          : "border-line bg-ivory"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-forest text-gold shrink-0">
                          <Clock className="size-4" />
                        </div>
                        <div>
                          <span className="font-mono text-xs font-bold text-gold-deep block uppercase">
                            {block.time}
                          </span>
                          <h3 className="font-display text-xl font-semibold text-forest">
                            {block.title}
                          </h3>
                        </div>
                      </div>

                      <ul className="mt-4 space-y-2.5 pl-4 sm:pl-12">
                        {block.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-2.5 text-sm text-ink/80">
                            <span className="size-1.5 rounded-full bg-forest mt-2 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* DAY 2 */}
            <TabsContent value="day-2" className="space-y-6">
              <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-6 gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                      Day 2: Saturday, 19th December 2026
                    </span>
                    <h2 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-forest">
                      ROYAL OPENING, CULTURAL HERITAGE &amp; POLO
                    </h2>
                    <p className="mt-2 text-sm text-muted-brand max-w-2xl">
                      {OFFICIAL_PROGRAMME[1].leadSummary}
                    </p>
                  </div>
                  <Badge className="bg-amber-800 text-ivory text-xs px-3 py-1 shrink-0 self-start sm:self-center">
                    ADMISSION THROUGH TICKET
                  </Badge>
                </div>

                <div className="mt-8 space-y-8">
                  {OFFICIAL_PROGRAMME[1].schedule.map((block, idx) => (
                    <div
                      key={idx}
                      className={`rounded-2xl border p-6 transition-all ${
                        block.highlight
                          ? "border-gold/50 bg-gold/5 shadow-sm"
                          : "border-line bg-ivory"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-forest text-gold shrink-0">
                          {block.highlight ? <Crown className="size-4" /> : <Sparkles className="size-4" />}
                        </div>
                        <div>
                          <span className="font-mono text-xs font-bold text-gold-deep block uppercase">
                            {block.time}
                          </span>
                          <h3 className="font-display text-xl font-semibold text-forest">
                            {block.title}
                          </h3>
                        </div>
                      </div>

                      <ul className="mt-4 space-y-2.5 pl-4 sm:pl-12">
                        {block.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-2.5 text-sm text-ink/80">
                            <span className="size-1.5 rounded-full bg-forest mt-2 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* DAY 3 */}
            <TabsContent value="day-3" className="space-y-6">
              <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-6 gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                      Day 3: Sunday, 20th December 2026
                    </span>
                    <h2 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-forest">
                      THE GRAND FINALE — THE ROYAL CUP &amp; QUEENS CUP
                    </h2>
                    <p className="mt-2 text-sm text-muted-brand max-w-2xl">
                      {OFFICIAL_PROGRAMME[2].leadSummary}
                    </p>
                  </div>
                  <Badge className="bg-amber-800 text-ivory text-xs px-3 py-1 shrink-0 self-start sm:self-center">
                    ADMISSION THROUGH TICKET
                  </Badge>
                </div>

                <div className="mt-8 space-y-8">
                  {OFFICIAL_PROGRAMME[2].schedule.map((block, idx) => (
                    <div
                      key={idx}
                      className={`rounded-2xl border p-6 transition-all ${
                        block.highlight
                          ? "border-gold/50 bg-gold/5 shadow-sm"
                          : "border-line bg-ivory"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-forest text-gold shrink-0">
                          <Award className="size-4" />
                        </div>
                        <div>
                          <span className="font-mono text-xs font-bold text-gold-deep block uppercase">
                            {block.time}
                          </span>
                          <h3 className="font-display text-xl font-semibold text-forest">
                            {block.title}
                          </h3>
                        </div>
                      </div>

                      <ul className="mt-4 space-y-2.5 pl-4 sm:pl-12">
                        {block.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-2.5 text-sm text-ink/80">
                            <span className="size-1.5 rounded-full bg-forest mt-2 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Official Tagline Banner */}
          <div className="mt-12 rounded-2xl bg-forest p-6 text-center text-ivory shadow-lg border border-gold/30">
            <p className="font-display text-sm sm:text-base font-semibold tracking-wider text-gold uppercase">
              {FESTIVAL_METADATA.tagline}
            </p>
          </div>

          {/* Registration CTA */}
          <div className="mt-8 flex flex-col items-center justify-between gap-6 rounded-2xl border-2 border-forest/20 bg-card p-6 sm:p-8 sm:flex-row shadow-md">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Ticket className="size-5 text-forest" />
                <h3 className="font-display text-xl font-semibold text-forest">
                  Register for Official Gate Access Pass
                </h3>
              </div>
              <p className="text-xs text-muted-brand max-w-xl">
                Pass is generated immediately and downloaded to your phone for offline gate entry. Day 1 is 100% Free Public Admission; Day 2 &amp; Day 3 admission is Through Ticket.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button asChild size="lg" className="bg-forest text-ivory hover:bg-forest-interactive shadow">
                <Link href="/register">Register Gate Pass →</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-line text-forest">
                <Link href="/pass/lookup">Look Up Pass</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

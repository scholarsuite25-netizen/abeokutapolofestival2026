import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Crown,
  Sparkles,
  Flame,
  Award,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = {
  title: "Tournament Programme — 2026 Abeokuta Polo Festival",
  description:
    "Official 3-day itinerary and match schedule for the 2026 Abeokuta Polo Festival (18–20 December 2026).",
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
          <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold uppercase tracking-widest text-[11px]">
            Official 2026 Tournament Itinerary
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl">
            The 2026 Festival Programme: <br />
            <span className="font-normal italic text-gold">3 Days of Sovereign Tradition</span> & High-Goal Power
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ivory/80 sm:text-lg">
            Witness eighty thoroughbred ponies, international players, and traditional sovereign ceremonies convening on the Kobape grounds from Friday 18 to Sunday 20 December 2026.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-gold">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              18–20 December 2026
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              Abeokuta Polo Club Grounds, Kobape
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4" />
              Free Entry with Registration
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. PROGRAMME STATUS NOTICE (Architectural Rule D-09)                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="border-b border-line bg-sage/40 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8 text-xs text-forest-deep sm:text-sm">
          <AlertCircle className="size-5 text-gold shrink-0" />
          <p>
            <strong>Official Scheduling Notice:</strong> The overall festival date range (18–20 December 2026) is confirmed. In accordance with festival governance, exact match clock times, team seedings, and player rosters are published in the Official Gazette as confirmed by the Tournament Committee.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. THREE-DAY PROGRAMME TABS                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="day-1" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-xl border border-line bg-sage/30 p-1.5 sm:max-w-xl">
              <TabsTrigger value="day-1" className="rounded-lg font-display text-sm font-semibold data-[state=active]:bg-forest data-[state=active]:text-ivory">
                Day 1 · Fri 18 Dec
              </TabsTrigger>
              <TabsTrigger value="day-2" className="rounded-lg font-display text-sm font-semibold data-[state=active]:bg-forest data-[state=active]:text-ivory">
                Day 2 · Sat 19 Dec
              </TabsTrigger>
              <TabsTrigger value="day-3" className="rounded-lg font-display text-sm font-semibold data-[state=active]:bg-forest data-[state=active]:text-ivory">
                Day 3 · Sun 20 Dec
              </TabsTrigger>
            </TabsList>

            {/* DAY 1 */}
            <TabsContent value="day-1" className="mt-8 space-y-6">
              <div className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gold">Day 01 · Inauguration</span>
                    <h2 className="font-display text-2xl font-semibold text-forest">Opening Pageantry & Bonfire Celebration</h2>
                  </div>
                  <Badge variant="outline" className="border-line bg-sage/50 text-forest">Friday, 18 Dec 2026</Badge>
                </div>

                <div className="mt-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sage text-forest">
                      <Clock className="size-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase text-gold">Morning</span>
                      <h3 className="font-display text-lg font-semibold text-forest">Accreditation Desk & Gate Opening</h3>
                      <p className="mt-1 text-sm text-muted-brand">
                        Registration desk opens for pass credential scanning and delegate badge issuance. Cultural village opens to public guests.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
                      <Crown className="size-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase text-gold">Afternoon</span>
                      <h3 className="font-display text-lg font-semibold text-forest">Opening Chukkas & Ceremonial Kings Procession</h3>
                      <p className="mt-1 text-sm text-muted-brand">
                        Preliminary tournament matches commenced under official federation umpires, followed by the ceremonial arrival of Southwest Royal Monarchs.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-forest/15 text-forest">
                      <Flame className="size-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase text-gold">Twilight</span>
                      <h3 className="font-display text-lg font-semibold text-forest">Grand Bonfire & Fireworks Display</h3>
                      <p className="mt-1 text-sm text-muted-brand">
                        Ceremonial bonfire lighting and spectacular night fireworks on the polo grounds ushering in the year-end celebration.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* DAY 2 */}
            <TabsContent value="day-2" className="mt-8 space-y-6">
              <div className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gold">Day 02 · Showcase</span>
                    <h2 className="font-display text-2xl font-semibold text-forest">Polo Queens Invitational & All-Stars</h2>
                  </div>
                  <Badge variant="outline" className="border-line bg-sage/50 text-forest">Saturday, 19 Dec 2026</Badge>
                </div>

                <div className="mt-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sage text-forest">
                      <Sparkles className="size-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase text-gold">Morning & Midday</span>
                      <h3 className="font-display text-lg font-semibold text-forest">Equestrian Style Lounge & Intermediate Chukkas</h3>
                      <p className="mt-1 text-sm text-muted-brand">
                        Fashion, culinary exhibitions, and intermediate trophy chukkas across both tournament fields.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
                      <Award className="size-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase text-gold">Afternoon Feature</span>
                      <h3 className="font-display text-lg font-semibold text-forest">Polo Queens Invitational Championship</h3>
                      <p className="mt-1 text-sm text-muted-brand">
                        All-female championship chukkas celebrating leadership and competitive prowess in Nigerian and international women&apos;s polo.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-forest/15 text-forest">
                      <Crown className="size-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase text-gold">Evening</span>
                      <h3 className="font-display text-lg font-semibold text-forest">All-Stars International Exhibition</h3>
                      <p className="mt-1 text-sm text-muted-brand">
                        Special high-goal exhibition chukkas featuring top African and international players under stadium floodlights.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* DAY 3 */}
            <TabsContent value="day-3" className="mt-8 space-y-6">
              <div className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gold">Day 03 · Grand Sovereign Finale</span>
                    <h2 className="font-display text-2xl font-semibold text-forest">The Royal Cup Championship & Sovereign Banquet</h2>
                  </div>
                  <Badge variant="outline" className="border-gold/60 bg-gold/15 text-forest">Sunday, 20 Dec 2026</Badge>
                </div>

                <div className="mt-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
                      <Crown className="size-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase text-gold">Early Afternoon</span>
                      <h3 className="font-display text-lg font-semibold text-forest">100 Kings Confluence & Royal Procession</h3>
                      <p className="mt-1 text-sm text-muted-brand">
                        Ceremonial arrival of His Royal Majesty the Alake of Egbaland, Paramount Rulers, State Governors, and Diplomatic Observers.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-forest text-gold">
                      <Award className="size-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase text-gold">Championship Match</span>
                      <h3 className="font-display text-lg font-semibold text-forest">The Royal Cup Final Chukkas</h3>
                      <p className="mt-1 text-sm text-muted-brand">
                        The tournament climax. The top finalist squads compete for the historic 2026 Abeokuta Royal Cup trophy.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sage text-forest">
                      <Sparkles className="size-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase text-gold">Night</span>
                      <h3 className="font-display text-lg font-semibold text-forest">Trophy Presentation & Aristos Gala</h3>
                      <p className="mt-1 text-sm text-muted-brand">
                        Official trophy presentation by HRM The Alake of Egbaland followed by the closing celebration with ARISTOS BAND.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-xl border border-line bg-card p-6 sm:flex-row">
            <div>
              <p className="font-display text-lg font-semibold text-forest">Ready to experience the tournament?</p>
              <p className="text-xs text-muted-brand">Register for your free digital QR credential to access all three days of match chukkas.</p>
            </div>
            <Button asChild size="lg" className="bg-gold font-semibold text-forest-deep hover:bg-gold/90">
              <Link href="/register">Register Free Entry Pass →</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

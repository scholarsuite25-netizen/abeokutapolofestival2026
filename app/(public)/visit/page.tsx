import Link from "next/link";
import {
  Car,
  Shield,
  MapPin,
  Clock,
  Compass,
  Plane,
  HeartPulse,
  ArrowRight,
  Shirt,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReadMoreSection } from "@/components/shared/read-more-section";

export const metadata = {
  title: "Plan Your Visit — 2026 Abeokuta Polo Festival",
  description:
    "Location, travel directions, hotel accommodations, parking, security, and gate protocols for the Abeokuta Polo Club grounds in Kobape.",
};

const TRAVEL_TIMES = [
  { origin: "Lagos (Ikeja / Mainland)", duration: "45–55 mins", route: "Via Lagos–Ibadan Expressway to Sagamu Interchange" },
  { origin: "Lagos (Victoria Island / Lekki)", duration: "75–90 mins", route: "Via Third Mainland Bridge to Lagos–Ibadan Expressway" },
  { origin: "Ibadan (Ring Road / Bodija)", duration: "40–50 mins", route: "Via Ibadan–Abeokuta Road or Sagamu Expressway" },
  { origin: "Abeokuta City (Ake / Ibara)", duration: "12–15 mins", route: "Direct along Abeokuta–Sagamu Expressway into Kobape" },
];

const HOTEL_PARTNERS = [
  {
    name: "Park Inn by Radisson Abeokuta",
    category: "Luxury Partner Hotel",
    distance: "14 mins from Kobape Turf",
    description: "Full-service 4-star hotel in Ibara featuring executive suites, resort pool, and festival concierge desk.",
  },
  {
    name: "Green Legacy Resort (OOPL)",
    category: "Executive Cultural Resort",
    distance: "16 mins from Kobape Turf",
    description: "Located within the Olusegun Obasanjo Presidential Library complex, offering luxury rooms and cultural tours.",
  },
  {
    name: "Mitros Luxury Residences",
    category: "Boutique Suites",
    distance: "12 mins from Kobape Turf",
    description: "Exclusive government-enclave boutique suites favored by visiting diplomats and tournament patrons.",
  },
];

export default function VisitPage() {
  return (
    <div className="flex w-full max-w-full flex-col bg-ivory text-ink overflow-x-clip min-w-0">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION                                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-forest py-16 text-ivory sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-gold/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-gold/40 bg-gold/10 text-[11px] tracking-widest text-gold uppercase"
            >
              Grounds &amp; Logistics Guide
            </Badge>
            <Badge className="bg-gold text-forest font-bold text-[10px]">
              KOBAPE TURF · OGUN STATE
            </Badge>
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight font-semibold text-balance text-ivory sm:text-6xl">
            Visiting Abeokuta <span className="font-normal text-gold italic">Polo Club</span>
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ivory/80 sm:text-lg">
            Essential visitor guidelines for attending the 2026 festival at the Kobape grounds along the
            Abeokuta–Sagamu Expressway. Travel times, parking, partner accommodations, and gate protocols.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              className="h-11 bg-gold px-4 font-semibold text-forest-deep hover:bg-gold/90"
            >
              <Link href="/register">
                Register for Free Access Card
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 border-gold/40 bg-white/10 px-4 text-ivory hover:bg-white/20 hover:text-ivory"
            >
              <a href="#directions">
                <Compass className="mr-2 size-4 text-gold" />
                Directions &amp; Travel Times
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. VENUE HIGHLIGHT & GATE INFORMATION                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Left 7 Cols: Location & Overview */}
            <div className="space-y-8 lg:col-span-7">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gold-dim">
                  Venue &amp; Accessibility
                </span>
                <h2 className="mt-2 font-display text-3xl font-semibold text-forest">
                  Abeokuta Polo Club Grounds
                </h2>
                <p className="mt-3 text-sm text-muted-brand leading-relaxed">
                  Located strategically on the Abeokuta–Sagamu Expressway at Kobape, Ogun State. The
                  championship grounds are accessible within 45 minutes from Lagos via the Lagos–Ibadan
                  expressway interchange and 15 minutes from downtown Abeokuta.
                </p>
              </div>

              {/* Quick Facility Cards */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
                  <Car className="size-6 text-gold mb-3" />
                  <h3 className="font-display text-lg font-semibold text-forest">Parking &amp; Valet</h3>
                  <p className="mt-2 text-xs text-muted-brand leading-relaxed">
                    Dedicated secure parking zones with shuttle golf-cart escorts for general attendees.
                    Complimentary valet for Patrons, VIP Chalets, and Tournament Officials.
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
                  <Shield className="size-6 text-forest mb-3" />
                  <h3 className="font-display text-lg font-semibold text-forest">Security &amp; Safety</h3>
                  <p className="mt-2 text-xs text-muted-brand leading-relaxed">
                    Integrated security protocols coordinated with the Ogun State Police Command, DSS, and
                    certified equestrian marshals controlling horse safety perimeters.
                  </p>
                </div>
              </div>

              {/* Dress Code Callout */}
              <div className="rounded-2xl border border-gold/40 bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-dim">
                  <Shirt className="size-4 text-gold" />
                  <span>Sartorial Etiquette &amp; Dress Code</span>
                </div>
                <h3 className="mt-2 font-display text-xl font-semibold text-forest">
                  Smart Casual &amp; African Regal Attire
                </h3>
                <p className="mt-2 text-xs text-muted-brand leading-relaxed">
                  Traditional Yoruba agbada, refined linens, blazers, and chic garden dresses are strongly
                  celebrated. <strong>Footwear Note:</strong> As matches take place on grass lawns, comfortable
                  wedges, loafers, or flat shoes are recommended over stilettos to protect the turf.
                </p>
              </div>

              {/* Emergency & First Aid */}
              <div className="rounded-2xl border border-line bg-sage/20 p-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest">
                  <HeartPulse className="size-4 text-danger" />
                  <span>Medical &amp; Veterinary Readiness</span>
                </div>
                <p className="mt-2 text-xs text-muted-brand leading-relaxed">
                  A fully equipped mobile emergency clinic, paramedic ambulance corps, and veterinary
                  equine triage tent operate continuously on-site throughout all tournament chukkers.
                </p>
              </div>
            </div>

            {/* Right 5 Cols: Gate Protocols Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <h3 className="font-display text-xl font-semibold text-forest">
                    Gate Protocols &amp; Hours
                  </h3>
                  <Badge className="bg-forest text-ivory text-[10px]">
                    18–20 DEC 2026
                  </Badge>
                </div>

                <div className="mt-6 space-y-4 text-xs">
                  <div>
                    <span className="font-semibold text-forest block">Tournament Dates:</span>
                    <span className="text-muted-brand">Friday 18 – Sunday 20 December 2026</span>
                  </div>

                  <div>
                    <span className="font-semibold text-forest block">Gate Ingress Commences:</span>
                    <span className="text-muted-brand">10:00 AM Daily (Turnstile QR scanning active)</span>
                  </div>

                  <div>
                    <span className="font-semibold text-forest block">Gate Designations:</span>
                    <div className="mt-1 space-y-1 text-muted-brand">
                      <p>● <strong>Gate 1:</strong> Royal Fathers, Diplomats &amp; VVIP Chalets</p>
                      <p>● <strong>Gate 2:</strong> Players, Tournament Stewards &amp; Patrons</p>
                      <p>● <strong>Gate 3:</strong> Accredited General Guests &amp; Media Crew</p>
                    </div>
                  </div>

                  {/* Mandatory Registration Alert */}
                  <div className="rounded-xl border border-gold/50 bg-forest/5 p-4 space-y-1.5">
                    <span className="font-bold text-forest uppercase tracking-wider text-[11px] block">
                      Mandatory Digital Pass Entry
                    </span>
                    <p className="text-muted-brand text-xs leading-relaxed">
                      <strong>All attendees must register before arriving at the grounds.</strong> Turnstile
                      access cards will be scanned digitally at the gates. Days 1 &amp; 2 (18 &amp; 19 Dec) are
                      100% free complimentary admission; Day 3 (20 Dec) requires a ₦50,000 VVIP Pass or verified
                      Special Invitation.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-line space-y-2">
                  <Button asChild className="w-full bg-gold font-semibold text-forest-deep hover:bg-gold/90 shadow">
                    <Link href="/register">Register For Free Entry Pass →</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full border-line text-forest">
                    <Link href="/register/poster">
                      <QrCode className="mr-1.5 size-4 text-gold" /> View Venue QR Standee / Poster
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full text-forest/80 hover:text-forest text-xs">
                    <Link href="/pass/lookup">Retrieve My Existing Pass</Link>
                  </Button>
                </div>
              </div>

              {/* Helicopter Aviation Card */}
              <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Plane className="size-5 text-forest" />
                  <h4 className="font-display text-base font-semibold text-forest">
                    Executive Aviation &amp; Helipad
                  </h4>
                </div>
                <p className="mt-2 text-xs text-muted-brand leading-relaxed">
                  A certified temporary helipad is operational at Kobape for visiting governors, dignitaries, and patrons.
                  Flight clearances must be logged 48 hours prior with the Secretariat.
                </p>
                <div className="mt-3 text-[11px] text-forest-interactive font-medium">
                  Helipad Coordinates: 7.0754° N, 3.4418° E
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. DIRECTIONS & TRAVEL TIME MATRIX                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="directions" className="bg-sage/20 py-16 sm:py-20 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-dim">
              Transit Matrix
            </span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-forest">
              Travel Times &amp; Arterial Routes
            </h2>
            <p className="mt-2 text-sm text-muted-brand max-w-2xl">
              Kobape Turf is seamlessly connected to major commercial and political hubs in Southwest Nigeria.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRAVEL_TIMES.map((tt, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-line bg-card p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <MapPin className="size-5 text-gold mb-2" />
                  <h3 className="font-display text-lg font-semibold text-forest">{tt.origin}</h3>
                  <p className="mt-2 font-display text-2xl font-bold text-forest-interactive">
                    {tt.duration}
                  </p>
                  <p className="mt-2 text-xs text-muted-brand leading-relaxed">{tt.route}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-line text-[11px] text-muted-brand">
                  Smooth dual-carriage highway
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. HOTEL & HOSPITALITY PARTNERS                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-line pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-gold-dim">
                Curated Accommodations
              </span>
              <h2 className="mt-2 font-display text-3xl font-semibold text-forest">
                Recommended Partner Hotels
              </h2>
            </div>
            <p className="text-xs text-muted-brand">
              Preferential tournament booking rates for accredited festival guests
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {HOTEL_PARTNERS.map((hotel, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-line bg-card p-6 shadow-sm flex flex-col justify-between hover:border-gold/50 transition"
              >
                <div>
                  <Badge variant="outline" className="border-gold/40 bg-gold/10 text-forest text-[10px] font-semibold">
                    {hotel.category}
                  </Badge>
                  <h3 className="mt-3 font-display text-xl font-semibold text-forest">
                    {hotel.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-gold-dim font-medium">
                    <Clock className="size-3.5" />
                    <span>{hotel.distance}</span>
                  </div>
                  <ReadMoreSection
                    variant="link"
                    moreText="View Guest Amenities & Perks"
                    lessText="Hide Amenities"
                    summary={
                      <p className="mt-3 text-xs text-muted-brand leading-relaxed">
                        {hotel.description}
                      </p>
                    }
                    details={
                      <div className="mt-2 rounded-lg bg-sage/30 p-2.5 text-[11px] text-forest space-y-1 border border-line/60">
                        <div className="font-semibold text-forest">Attendee Hospitality Perks:</div>
                        <div className="text-muted-brand">• Dedicated tournament shuttle route directly to Kobape Turf</div>
                        <div className="text-muted-brand">• Early breakfast for morning chukkers &amp; late check-out</div>
                        <div className="text-muted-brand">• Priority hotel concierge for accreditation pass assistance</div>
                      </div>
                    }
                  />
                </div>

                <div className="mt-6 pt-4 border-t border-line flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-forest-interactive">
                    Concierge Shuttle Available
                  </span>
                  <Button asChild size="sm" variant="outline" className="text-xs border-line">
                    <Link href="/hospitality">Hospitality Details →</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

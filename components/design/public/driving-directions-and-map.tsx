"use client";

import { useState } from "react";
import {
  Car,
  MapPin,
  Navigation,
  Compass,
  ExternalLink,
  Building2,
  CheckCircle2,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RouteStep {
  title: string;
  detail: string;
}

interface RouteGuide {
  id: "lagos" | "ibadan" | "abeokuta";
  origin: string;
  duration: string;
  highway: string;
  distance: string;
  badge: string;
  summary: string;
  steps: RouteStep[];
}

const ROUTE_GUIDES: RouteGuide[] = [
  {
    id: "lagos",
    origin: "From Lagos (Mainland, Ikeja, Island)",
    duration: "45–55 mins",
    highway: "Lagos–Ibadan Expressway → Sagamu–Abeokuta Expressway",
    distance: "Approx. 72 km from Berger",
    badge: "Most Popular Expressway Route",
    summary:
      "A swift, direct drive along Nigeria's premier arterial corridor transitioning onto the dual-carriage Sagamu–Abeokuta Expressway into Kobape.",
    steps: [
      {
        title: "1. Depart Lagos onto Lagos–Ibadan Expressway",
        detail:
          "Depart Lagos via Berger / Ojodu corridor onto the main Lagos–Ibadan Expressway heading outbound towards Sagamu.",
      },
      {
        title: "2. Exit at Sagamu Interchange",
        detail:
          "At the major Sagamu Interchange flyover (past RCCG camp & Sagamu toll corridor), take the dedicated exit slip road looping onto the Sagamu–Abeokuta Expressway heading towards Abeokuta.",
      },
      {
        title: "3. Cruise through Siun Corridor",
        detail:
          "Maintain speed on the smooth dual-carriage highway passing Siun junction. The road is well-paved, multi-lane, and clear.",
      },
      {
        title: "4. Arrive at Kobape Turf Entrance",
        detail:
          "At Kobape, look for the prominent Abeokuta Polo Club & Country Resort highway pylon and festival directional arches on your right-hand side. Decelerate into the dedicated entrance lane.",
      },
      {
        title: "5. Gate Marshals Checkpoint",
        detail:
          "Follow turnstile lane markers: Gate 1 for Royal Dignitaries & VVIPs, Gate 2 for Players & Officials, Gate 3 for General Attendees & Media with QR credentials.",
      },
    ],
  },
  {
    id: "ibadan",
    origin: "From Ibadan (Ring Road, Bodija, Oluyole)",
    duration: "40–50 mins",
    highway: "Lagos–Ibadan Expressway → Sagamu–Abeokuta Expressway (or Direct Abeokuta Rd)",
    distance: "Approx. 65 km",
    badge: "Dual Corridor Options",
    summary:
      "Travel southwards along the expressway to Sagamu Interchange or take the scenic Ibadan–Abeokuta inter-state corridor into the Kobape bypass.",
    steps: [
      {
        title: "1. Route A (Fastest Dual Carriageway): Via Sagamu Interchange",
        detail:
          "Depart Ibadan via Lagos–Ibadan Expressway southbound towards Sagamu. At Sagamu Interchange, loop onto the Sagamu–Abeokuta Expressway heading west towards Abeokuta.",
      },
      {
        title: "2. Pass Siun into Kobape",
        detail:
          "Continue approx. 25 minutes down the Sagamu–Abeokuta Expressway directly into Kobape, where the tournament grounds are signposted on your right.",
      },
      {
        title: "3. Route B (Scenic Heritage Route): Via Bakatari",
        detail:
          "Take the Ibadan–Abeokuta Highway through Omi Adio and Bakatari into Abeokuta city. Connect through the Presidential Boulevard / Oke-Mosan bypass onto the Sagamu–Abeokuta Expressway outbound towards Sagamu. At Kobape, turn into the club access corridor.",
      },
    ],
  },
  {
    id: "abeokuta",
    origin: "From Abeokuta Central (Oke-Mosan, Ibara, Ake)",
    duration: "10–15 mins",
    highway: "Sagamu–Abeokuta Expressway (Outbound South)",
    distance: "Approx. 12 km from Conference Hotel",
    badge: "Direct Downtown Corridor",
    summary:
      "A quick 12-minute sprint from downtown Abeokuta and the Secretariat at Conference Hotel straight onto the Sagamu-Abeokuta Expressway into Kobape.",
    steps: [
      {
        title: "1. Depart from Conference Hotel / Oke-Mosan",
        detail:
          "From the Abeokuta Polo Club Secretariat at 4th Floor, Conference Hotel, proceed onto Presidential Boulevard towards the Governor's Office roundabout.",
      },
      {
        title: "2. Join the Sagamu–Abeokuta Expressway",
        detail:
          "Join the dual-carriage Sagamu–Abeokuta Expressway heading outbound south towards Kobape, Sagamu, and Lagos.",
      },
      {
        title: "3. Kobape Turn-Off & Entrance",
        detail:
          "Drive for 10–12 minutes. At the Kobape festival junction, follow the festival marshals and signboards on your left into the Abeokuta Polo Club & Country Resort grounds.",
      },
    ],
  },
];

const GOOGLE_MAPS_EMBED_URL =
  "https://maps.google.com/maps?q=Kobape%20Abeokuta%20Ogun%20State%20Nigeria&t=&z=13&ie=UTF8&iwloc=&output=embed";

const GOOGLE_MAPS_DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=Abeokuta+Polo+Club,+Kobape,+Ogun+State,+Nigeria&travelmode=driving";

const APPLE_MAPS_URL =
  "https://maps.apple.com/?daddr=Abeokuta+Polo+Club,Kobape,Ogun+State,Nigeria";

export function DrivingDirectionsAndMap() {
  const [selectedRoute, setSelectedRoute] = useState<"lagos" | "ibadan" | "abeokuta">("lagos");
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const activeRoute = ROUTE_GUIDES.find((r) => r.id === selectedRoute) || ROUTE_GUIDES[0];

  return (
    <div className="space-y-10">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECRETARIAT GENERAL ENQUIRIES SPOTLIGHT                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-forest-deep via-forest to-forest-deep p-6 sm:p-8 text-ivory shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-gold text-forest font-bold text-[10px] tracking-wider uppercase">
                Official Club Headquarters
              </Badge>
              <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold text-[10px]">
                General Enquiries &amp; Protocol
              </Badge>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-ivory">
              Abeokuta Polo Club Secretariat
            </h3>
            <p className="text-sm leading-relaxed text-ivory/85">
              For general enquiries, royal box reservations, corporate affiliations, and physical
              accreditation enquiries prior to the tournament:
            </p>
            <div className="rounded-xl border border-gold/30 bg-white/5 p-4 space-y-2">
              <div className="flex items-start gap-3">
                <Building2 className="size-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-ivory text-sm sm:text-base">
                    4th Floor, Conference Hotel, Presidential Boulevard, Oke-Mosan, Abeokuta, Ogun State
                  </p>
                  <p className="text-xs text-gold-light mt-0.5">
                    Official Administrative Hub · Mon–Fri 9:00 AM – 5:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
            <Button
              asChild
              className="bg-gold hover:bg-gold/90 text-forest-deep font-bold shadow-md w-full"
            >
              <a href="https://wa.me/2348181888884?text=Hello%20Abeokuta%20Polo%20Club%20Secretariat%2C%20I%20have%20an%20enquiry" target="_blank" rel="noopener noreferrer">
                Contact Secretariat on WhatsApp →
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-gold/40 bg-white/10 text-ivory hover:bg-white/20 w-full"
            >
              <a href="tel:+2348181888884">
                Call Secretariat: +234 818 188 8884
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* DRIVING ROUTE SELECTOR & INTERACTIVE MAP                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-line bg-card p-6 sm:p-8 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-dim">
              Sagamu–Abeokuta Expressway Corridor
            </span>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-forest">
              How to Reach Kobape Polo Grounds
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-brand">
              Detailed driving navigation from Lagos, Ibadan, and central Abeokuta. Click to view driving map.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsMapModalOpen(true)}
              className="bg-gold text-forest-deep hover:bg-gold/90 font-semibold shadow text-xs sm:text-sm"
            >
              <Navigation className="mr-2 size-4" />
              View Driving Map Automatically
            </Button>
          </div>
        </div>

        {/* Route Selection Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ROUTE_GUIDES.map((route) => {
            const isSelected = selectedRoute === route.id;
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => setSelectedRoute(route.id)}
                className={`text-left rounded-xl p-4 transition-all border ${
                  isSelected
                    ? "border-gold bg-forest text-ivory shadow-md ring-2 ring-gold/30"
                    : "border-line bg-surface hover:bg-sage/40 text-ink"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      isSelected
                        ? "border-gold/50 text-gold bg-gold/10"
                        : "border-line text-muted-brand bg-card"
                    }`}
                  >
                    {route.duration}
                  </Badge>
                  {isSelected && <CheckCircle2 className="size-4 text-gold shrink-0" />}
                </div>
                <h3 className={`mt-2 font-display text-base font-semibold ${isSelected ? "text-ivory" : "text-forest"}`}>
                  {route.origin}
                </h3>
                <p className={`mt-1 text-xs line-clamp-2 ${isSelected ? "text-ivory/80" : "text-muted-brand"}`}>
                  {route.highway}
                </p>
              </button>
            );
          })}
        </div>

        {/* Selected Route Turn-By-Turn Breakdown & Embedded Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Turn-by-Turn Steps (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-xl border border-line bg-surface p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-forest text-sm">{activeRoute.origin}</span>
                <span className="text-xs font-bold text-forest-interactive">{activeRoute.distance}</span>
              </div>
              <p className="text-xs text-muted-brand leading-relaxed">{activeRoute.summary}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                <Compass className="size-4 text-gold" />
                Turn-by-Turn Driving Instructions:
              </h4>

              <div className="space-y-3">
                {activeRoute.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-line/80 bg-card p-4 shadow-xs"
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-forest text-gold text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-forest text-sm">{step.title}</p>
                      <p className="text-xs text-muted-brand leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Navigation Links */}
            <div className="pt-2 flex flex-wrap gap-2.5">
              <Button
                asChild
                className="bg-forest text-ivory hover:bg-forest/90 text-xs font-semibold"
              >
                <a href={GOOGLE_MAPS_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer">
                  <Navigation className="mr-1.5 size-3.5 text-gold" />
                  Start Google Maps Driving Navigation
                  <ExternalLink className="ml-1.5 size-3" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-line text-forest text-xs"
              >
                <a href={APPLE_MAPS_URL} target="_blank" rel="noopener noreferrer">
                  Open in Apple Maps
                </a>
              </Button>
            </div>
          </div>

          {/* Interactive Embedded Map Preview (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative rounded-2xl border-2 border-line bg-surface overflow-hidden shadow-sm group">
              <div className="flex items-center justify-between p-3 bg-forest text-ivory border-b border-line">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-gold" />
                  <span className="font-semibold text-xs truncate">
                    Kobape Turf · Sagamu-Abeokuta Expressway
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                  className="flex items-center gap-1 text-[11px] text-gold hover:text-gold-light font-medium"
                >
                  <Maximize2 className="size-3.5" />
                  Expand
                </button>
              </div>

              {/* Map Iframe */}
              <div className="aspect-[4/3] w-full bg-slate-100">
                <iframe
                  title="Kobape Polo Grounds Driving Map"
                  src={GOOGLE_MAPS_EMBED_URL}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                />
              </div>

              <div className="p-4 bg-card border-t border-line space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-brand font-medium">GPS Coordinates:</span>
                  <span className="font-mono text-forest font-semibold">7.0754° N, 3.4418° E</span>
                </div>
                <Button
                  onClick={() => setIsMapModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="w-full border-gold/40 text-forest text-xs hover:bg-gold/10"
                >
                  <Navigation className="mr-1.5 size-3.5 text-gold" />
                  Click to Expand Interactive Driving Map
                </Button>
              </div>
            </div>

            {/* Highway Tip Callout */}
            <div className="rounded-xl border border-line bg-sage/30 p-4 text-xs text-forest space-y-1">
              <div className="font-semibold text-forest flex items-center gap-1.5">
                <Car className="size-4 text-gold" />
                <span>Expressway Driving Note:</span>
              </div>
              <p className="text-muted-brand text-[11px] leading-relaxed">
                The Sagamu–Abeokuta Expressway is a high-speed multi-lane highway. Please look out for the
                official tournament traffic marshals and electronic advisory signs 1km prior to the Kobape turn-off.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: FULLSCREEN DRIVING MAP                                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
        <DialogContent className="border-line bg-ivory text-ink w-full max-w-4xl p-4 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-forest text-gold text-[10px]">LIVE NAVIGATION</Badge>
              <Badge variant="outline" className="text-[10px] border-line">SAGAMU-ABEOKUTA EXPRESSWAY</Badge>
            </div>
            <DialogTitle className="font-display text-2xl text-forest mt-1">
              Abeokuta Polo Club Grounds Driving Map
            </DialogTitle>
            <DialogDescription className="text-muted-brand text-xs">
              Kobape Turf, Sagamu–Abeokuta Expressway, Ogun State, Nigeria · Coordinates: 7.0754° N, 3.4418° E
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-[350px] sm:min-h-[460px] rounded-xl overflow-hidden border border-line mt-3 relative">
            <iframe
              title="Expanded Kobape Polo Grounds Map"
              src={GOOGLE_MAPS_EMBED_URL}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full absolute inset-0"
            />
          </div>

          <div className="mt-4 pt-3 border-t border-line flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-brand">
              <span>Arrive easily from Lagos, Ibadan, or Abeokuta via Sagamu Interchange</span>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="bg-forest text-ivory hover:bg-forest/90 text-xs">
                <a href={GOOGLE_MAPS_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer">
                  <Navigation className="mr-1.5 size-3.5 text-gold" />
                  Launch Google Maps Navigation
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-line text-xs">
                <a href={APPLE_MAPS_URL} target="_blank" rel="noopener noreferrer">
                  Launch Apple Maps
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


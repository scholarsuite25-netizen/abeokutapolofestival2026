import Link from "next/link";
import { Car, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Plan Your Visit — 2026 Abeokuta Polo Festival",
  description:
    "Location, travel directions, parking, security, and gate protocols for the Abeokuta Polo Club grounds in Kobape.",
};

export default function VisitPage() {
  return (
    <div className="flex w-full flex-col bg-ivory text-ink">
      <section className="relative overflow-hidden bg-forest text-ivory py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold uppercase tracking-widest text-[11px]">
            Grounds & Logistics Guide
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl">
            Visiting Abeokuta Polo Club
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ivory/80 sm:text-lg">
            Essential visitor guidelines for attending the 2026 festival at the Kobape grounds along the Abeokuta-Sagamu Expressway.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-7">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gold">Location & Address</span>
                <h2 className="mt-2 font-display text-3xl font-semibold text-forest">
                  Abeokuta Polo Club Grounds
                </h2>
                <p className="mt-3 text-sm text-muted-brand leading-relaxed">
                  Located strategically on the Abeokuta-Sagamu Expressway at Kobape, Ogun State. The grounds are easily accessible within 45 minutes from Lagos via the Lagos-Ibadan expressway interchange and 15 minutes from downtown Abeokuta.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-card p-6">
                  <Car className="size-6 text-gold mb-3" />
                  <h3 className="font-display text-lg font-semibold text-forest">Parking & Valet</h3>
                  <p className="mt-2 text-xs text-muted-brand leading-relaxed">
                    Dedicated secure parking zones for general guests. Valet and priority parking available for Patrons, VIP Chalets, and Committee Officers.
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-card p-6">
                  <Shield className="size-6 text-forest mb-3" />
                  <h3 className="font-display text-lg font-semibold text-forest">Security & Safety</h3>
                  <p className="mt-2 text-xs text-muted-brand leading-relaxed">
                    Coordinated security protocols with Ogun State Police Command and certified private equestrian marshals.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-sage/30 p-6">
                <h3 className="font-display text-lg font-semibold text-forest">Dress Code Guidelines</h3>
                <p className="mt-2 text-xs text-muted-brand leading-relaxed">
                  Smart Casual & African Regal Attire. Traditional Yoruba agbada, linens, garden dresses, and comfortable footwear suitable for grass lawns are strongly encouraged.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8">
                <h3 className="font-display text-xl font-semibold text-forest border-b border-line pb-3">
                  Gate Protocol & Hours
                </h3>
                <div className="mt-4 space-y-4 text-xs">
                  <div>
                    <span className="font-semibold text-forest block">Tournament Dates:</span>
                    <span className="text-muted-brand">18–20 December 2026</span>
                  </div>
                  <div>
                    <span className="font-semibold text-forest block">Gates Open Daily:</span>
                    <span className="text-muted-brand">10:00 AM (Accreditation scanning commences)</span>
                  </div>
                  <div>
                    <span className="font-semibold text-forest block">Entry Requirement:</span>
                    <span className="text-forest-interactive font-medium">Free Digital QR Pass (Prior registration mandatory)</span>
                  </div>
                  <div>
                    <span className="font-semibold text-forest block">Gate Locations:</span>
                    <span className="text-muted-brand">Gate 1 (Royal & VIP) · Gate 2 & 3 (General Guests & Accreditations)</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-line">
                  <Button asChild className="w-full bg-gold font-semibold text-forest-deep hover:bg-gold/90">
                    <Link href="/register">Register For Free Entry Pass →</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { Camera, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Press & Media Accreditation — 2026 Abeokuta Polo Festival",
  description:
    "Accreditation and media guidelines for press agencies, photographers, and broadcast creators.",
};

export default function PressPage() {
  return (
    <div className="flex w-full flex-col bg-ivory text-ink">
      <section className="relative overflow-hidden bg-forest text-ivory py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold uppercase tracking-widest text-[11px]">
            Media Operations & Broadcast Desk
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl">
            Press & Media Center
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ivory/80 sm:text-lg">
            Guidelines and credential accreditation for national, regional, and international media covering the 2026 tournament.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-line bg-card p-8 shadow-sm">
            <h2 className="font-display text-2xl font-semibold text-forest">Media Accreditation Guidelines</h2>
            <p className="mt-3 text-sm text-muted-brand leading-relaxed">
              Official press vests and field-line photography credentials are provided exclusively to accredited journalists and production crews. Due to equestrian horse safety protocols, unauthorized persons are strictly barred from the tournament sideboards.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-sage/20 p-5">
                <Camera className="size-6 text-forest mb-2" />
                <h3 className="font-display text-lg font-semibold text-forest">Photojournalists</h3>
                <p className="mt-1 text-xs text-muted-brand leading-relaxed">
                  Designated photo pits along the western boards for match coverage, royal arrivals, and trophy ceremonies.
                </p>
              </div>

              <div className="rounded-xl border border-line bg-sage/20 p-5">
                <Radio className="size-6 text-gold mb-2" />
                <h3 className="font-display text-lg font-semibold text-forest">Broadcast & Digital TV</h3>
                <p className="mt-1 text-xs text-muted-brand leading-relaxed">
                  Elevated commentary platform access and live broadcast signal coordination with the Media & ICT Committee.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-forest text-sm">Ready to apply for press access?</p>
                <p className="text-xs text-muted-brand">Submit your credential request under Media Accreditation category.</p>
              </div>
              <Button asChild className="bg-gold font-semibold text-forest-deep hover:bg-gold/90">
                <Link href="/register">Apply for Media Pass →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

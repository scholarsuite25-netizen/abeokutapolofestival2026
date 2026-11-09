import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Accessibility Statement — 2026 Abeokuta Polo Festival",
  description: "Accessibility accommodations, physical grounds accessibility, and assistive services.",
};

export default function AccessibilityPage() {
  return (
    <div className="flex w-full max-w-full flex-col bg-ivory text-ink overflow-x-clip min-w-0">
      <section className="relative overflow-hidden bg-forest py-14 text-ivory sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold uppercase tracking-widest text-[11px]">
            Inclusion &amp; Accommodations
          </Badge>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-5xl text-ivory">
            Accessibility Statement
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ivory/80 sm:text-base">
            Our commitment to ensuring all guests, royal dignitaries, and visitors enjoy safe and barrier-free access.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8 text-sm leading-relaxed text-muted-brand">
          <div className="rounded-2xl border border-line bg-card p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="font-display text-xl font-semibold text-forest">1. Digital Accessibility</h2>
            <p>
              This web portal is developed following W3C Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards, featuring keyboard navigation, high-contrast color ratios, semantic landmarks, and screen-reader compatible turnstile access cards.
            </p>

            <h2 className="font-display text-xl font-semibold text-forest pt-4">2. Physical Grounds &amp; Pavilion Access</h2>
            <p>
              Kobape Turf provides step-free ramp access to the main pavilion terraces, priority parking bays adjacent to Gate 1 and Gate 3, dedicated accessible restrooms, and motorized golf-cart shuttle assistance from parking lots to seating enclosures.
            </p>

            <h2 className="font-display text-xl font-semibold text-forest pt-4">3. Special Accommodations Request</h2>
            <p>
              Guests requiring personal mobility assistance, dedicated companion seating, or medical equipment access may notify the Secretariat prior to arrival via{" "}
              <a href="mailto:abeokutapolo@gmail.com" className="text-forest font-semibold underline">
                abeokutapolo@gmail.com
              </a>.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-line">
            <Button asChild variant="outline" size="sm" className="border-line text-forest">
              <Link href="/">
                <ArrowLeft className="mr-1.5 size-3.5" /> Back to Home
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-gold font-semibold text-forest-deep hover:bg-gold/90">
              <Link href="/register">Register for Pass</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}


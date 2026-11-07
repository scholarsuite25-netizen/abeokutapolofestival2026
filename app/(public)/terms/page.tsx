import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Terms of Entry — 2026 Abeokuta Polo Festival",
  description: "Official conditions of entry, spectator rules, dress codes, and equestrian safety protocols.",
};

export default function TermsPage() {
  return (
    <div className="flex w-full flex-col bg-ivory text-ink">
      <section className="relative overflow-hidden bg-forest py-14 text-ivory sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold uppercase tracking-widest text-[11px]">
            Attendee Regulations &amp; Safety
          </Badge>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-5xl text-ivory">
            Terms &amp; Conditions of Entry
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ivory/80 sm:text-base">
            Official regulations governing admission to the Abeokuta Polo Club grounds in Kobape during the 2026 festival.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8 text-sm leading-relaxed text-muted-brand">
          <div className="rounded-2xl border border-line bg-card p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="font-display text-xl font-semibold text-forest">1. Digital Accreditation Mandatory</h2>
            <p>
              Admission to Kobape Turf requires an official digital access card on all three days (18, 19, and 20 December 2026). Day 1 is free entry; Days 2 &amp; 3 require verified through-ticket credentials. No turnstile entry is permitted without scanning an authenticated pass.
            </p>

            <h2 className="font-display text-xl font-semibold text-forest pt-4">2. Equestrian Turf Safety</h2>
            <p>
              Polo is a high-speed collision equestrian sport. Spectators must remain behind wooden sideboards at all times while the ball is in play. Crossing the pitch boundary during active chukkers is strictly prohibited and subject to immediate eviction.
            </p>

            <h2 className="font-display text-xl font-semibold text-forest pt-4">3. Dress Code Compliance</h2>
            <p>
              Smart Casual and African Regal attire is required across all pavilions. Flat shoes, loafers, or block heels are strongly recommended on turf lawns; thin stilettos are prohibited on playing fields to preserve the sod.
            </p>

            <h2 className="font-display text-xl font-semibold text-forest pt-4">4. Photography &amp; Drone Regulations</h2>
            <p>
              Flash photography during active chukkers is strictly forbidden to protect horses from startling. Drone flights over the grounds require certified Ogun State airspace clearance and Tournament Secretariat written permits.
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


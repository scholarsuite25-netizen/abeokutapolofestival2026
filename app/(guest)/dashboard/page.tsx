import Link from "next/link";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Guest Pass Dashboard — 2026 Abeokuta Polo Festival",
  description:
    "Personalized attendee dashboard, digital QR credentials, and festival itinerary.",
};

export default function GuestDashboardPage() {
  return (
    <div className="flex w-full flex-col bg-ivory text-ink py-10 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Top Welcome Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-end">
          <div>
            <Badge variant="outline" className="border-gold/50 bg-gold/15 text-forest font-semibold uppercase tracking-widest text-[11px]">
              Guest Portal · 2026 Edition
            </Badge>
            <h1 className="mt-2 font-display text-3xl font-semibold text-forest sm:text-4xl">
              Personalized Guest Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-brand">
              Abeokuta Polo Club Grounds · 18–20 December 2026
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild className="bg-gold font-semibold text-forest-deep hover:bg-gold/90">
              <Link href="/dashboard/pass">
                <QrCode className="mr-2 size-4" /> View Digital Pass
              </Link>
            </Button>
          </div>
        </div>

        {/* 3-Card Summary Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card 1: Pass Status */}
          <div className="rounded-2xl border border-line bg-card p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">Accreditation</span>
              <h2 className="mt-2 font-display text-xl font-semibold text-forest">Digital Pass Active</h2>
              <p className="mt-2 text-xs text-muted-brand leading-relaxed">
                Your entry credential is valid for all three days of tournament match chukkas.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-line flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                ● Ready for Gate Scanning
              </span>
              <Link href="/dashboard/pass" className="font-semibold text-forest hover:text-gold">
                Open Pass →
              </Link>
            </div>
          </div>

          {/* Card 2: Festival Countdown */}
          <div className="rounded-2xl border border-line bg-card p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">Tournament Countdown</span>
              <h2 className="mt-2 font-display text-xl font-semibold text-forest">18–20 December 2026</h2>
              <p className="mt-2 text-xs text-muted-brand leading-relaxed">
                Gates open daily at 10:00 AM on the Kobape grounds along the Abeokuta-Sagamu Expressway.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-line flex items-center justify-between text-xs">
              <span className="text-muted-brand">Kobape, Ogun State</span>
              <Link href="/visit" className="font-semibold text-forest hover:text-gold">
                Directions →
              </Link>
            </div>
          </div>

          {/* Card 3: Free Admission Notice */}
          <div className="rounded-2xl border border-line bg-card p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">Policy Notice</span>
              <h2 className="mt-2 font-display text-xl font-semibold text-forest">Free Public Entry</h2>
              <p className="mt-2 text-xs text-muted-brand leading-relaxed">
                No tickets or payments are required. Show your QR badge at Gate 2 or Gate 3.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-line flex items-center justify-between text-xs">
              <span className="text-forest font-semibold">Free Credential</span>
              <Link href="/faq" className="font-semibold text-forest hover:text-gold">
                Entry Rules →
              </Link>
            </div>
          </div>
        </div>

        {/* Pass Preview Banner & Features */}
        <div className="rounded-3xl border border-gold/40 bg-forest p-8 text-ivory shadow-xl sm:p-10">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-4">
              <Badge variant="outline" className="border-gold bg-gold/15 text-gold text-xs uppercase tracking-widest">
                Official Credential Wallet
              </Badge>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                Ready for the Grand Tournament
              </h2>
              <p className="text-sm text-ivory/80 leading-relaxed max-w-xl">
                Present your digital pass on your mobile device upon arrival at the security turnstiles. For faster access, you can download a print copy or save the credential to your device.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Button asChild className="bg-gold font-semibold text-forest-deep hover:bg-gold/90">
                  <Link href="/dashboard/pass">Open Full Screen Pass</Link>
                </Button>
                <Button asChild variant="outline" className="border-ivory/30 text-ivory hover:bg-ivory/10">
                  <Link href="/programme">View 3-Day Match Schedule</Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-ivory p-6 text-forest shadow-md w-full max-w-xs">
                <QrCode className="size-32 text-forest" />
                <p className="mt-3 font-mono text-xs font-bold uppercase tracking-widest text-forest">
                  ABK-2026-PASS
                </p>
                <span className="mt-1 text-[11px] text-muted-brand">
                  Scan at Gate 1, 2 or 3
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

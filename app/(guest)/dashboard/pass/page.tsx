import Link from "next/link";
import { QrCode, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Official Digital Pass — 2026 Abeokuta Polo Festival",
  description:
    "Accredited digital QR entry pass for the 2026 Abeokuta Polo Festival.",
};

export default function DigitalPassPage() {
  return (
    <div className="flex w-full flex-col bg-ivory text-ink py-10 sm:py-16">
      <div className="mx-auto max-w-xl px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="text-muted-brand hover:text-forest">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 size-4" /> Back to Dashboard
            </Link>
          </Button>
          <Badge variant="outline" className="border-gold/50 bg-gold/10 text-forest text-[10px] uppercase tracking-wider">
            Gate Credential
          </Badge>
        </div>

        {/* Digital Pass Card */}
        <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-2xl">
          {/* Royal Card Top Header */}
          <div className="bg-forest p-6 text-ivory text-center relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 size-32 rounded-full bg-gold/15 blur-2xl" />
            <Badge variant="outline" className="border-gold bg-gold/20 text-gold text-[10px] uppercase tracking-widest mb-2">
              Official Entry Pass
            </Badge>
            <h1 className="font-display text-2xl font-semibold sm:text-3xl text-ivory">
              Abeokuta Polo Festival 2026
            </h1>
            <p className="mt-1 text-xs text-ivory/80">
              Where Heritage Meets Excellence · Est. 1928
            </p>
          </div>

          {/* QR Code Container */}
          <div className="p-8 flex flex-col items-center justify-center bg-ivory border-y border-line/60">
            <div className="flex size-48 items-center justify-center rounded-2xl border-4 border-dashed border-forest/30 bg-card p-4 shadow-inner">
              <QrCode className="size-40 text-forest" />
            </div>
            <p className="mt-4 font-mono text-base font-bold tracking-widest text-forest">
              ABK-2026-VIP-9182
            </p>
            <span className="mt-1 text-xs font-semibold text-emerald-700 flex items-center gap-1">
              ● Active &amp; Valid For Gate Access
            </span>
          </div>

          {/* Pass Details Breakdown */}
          <div className="p-6 bg-card space-y-4 text-xs">
            <div className="flex justify-between border-b border-line pb-2.5">
              <span className="text-muted-brand font-medium">Attendee Name:</span>
              <span className="font-semibold text-forest text-sm">Honoured Guest</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2.5">
              <span className="text-muted-brand font-medium">Pass Type:</span>
              <span className="font-semibold text-gold text-sm">General Admission / Patron Guest</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2.5">
              <span className="text-muted-brand font-medium">Tournament Dates:</span>
              <span className="font-semibold text-forest">18–20 December 2026</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2.5">
              <span className="text-muted-brand font-medium">Grounds:</span>
              <span className="font-semibold text-forest">Abeokuta Polo Club, Kobape</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-brand font-medium">Zone Entitlements:</span>
              <span className="font-semibold text-forest-interactive">Tournament Lawn, Pavilion &amp; Cultural Village</span>
            </div>
          </div>

          {/* Card Footer */}
          <div className="bg-sage/40 p-4 text-center border-t border-line text-[11px] text-muted-brand">
            Present this QR pass on your mobile device at Turnstile Gate 1, 2 or 3. Valid photo identification may be requested.
          </div>
        </div>
      </div>
    </div>
  );
}

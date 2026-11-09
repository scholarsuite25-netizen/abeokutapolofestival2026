import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileBindingStation } from "@/components/shared/pass-device-guard";

interface ConfirmationPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata = {
  title: "Registration Confirmed — 2026 Abeokuta Polo Festival",
  description: "Official Registration Confirmation & Mobile Device Binding Station.",
};

export default function RegisterConfirmationPage({ searchParams }: ConfirmationPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory flex items-center justify-center p-8 text-forest font-serif">
          Loading confirmation...
        </div>
      }
    >
      <ConfirmationContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ConfirmationContent({ searchParams }: ConfirmationPageProps) {
  const sp = searchParams ? await searchParams : {};
  const code = typeof sp.code === "string" ? sp.code : "ABK-2026-D1PASS";
  const name = typeof sp.name === "string" ? sp.name : "Esteemed Attendee";
  const phone = typeof sp.phone === "string" ? sp.phone : "+234 818 188 8884";
  const email = typeof sp.email === "string" ? sp.email : "";
  const category = typeof sp.category === "string" ? sp.category : "Festival Pass";

  return (
    <div className="flex w-full max-w-full flex-col bg-ivory text-ink py-8 sm:py-16 overflow-x-clip min-w-0">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 space-y-8">
        {/* Navigation & Header */}
        <div className="text-center space-y-3">
          <Badge
            variant="outline"
            className="border-gold/50 bg-gold/10 text-forest font-semibold uppercase tracking-widest text-[11px]"
          >
            Abeokuta Polo Festival 2026 · 18–20 December
          </Badge>
          <div className="inline-flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 mx-auto">
            <CheckCircle2 className="size-8" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
            Registration Confirmed
          </h1>
          <p className="text-sm text-muted-brand max-w-md mx-auto">
            Your registration is confirmed. Please bind your pass to your smartphone before
            arriving at the Kobape Grounds turnstiles.
          </p>
        </div>

        {/* Mobile Binding Station */}
        <MobileBindingStation
          passCode={code}
          holderName={name}
          phone={phone}
          email={email}
          category={category}
        />

        {/* Action Link Back */}
        <div className="flex justify-center gap-4 pt-4">
          <Button asChild variant="outline" className="border-line text-forest text-xs">
            <Link href="/register">
              <ArrowLeft className="mr-1.5 size-3.5" /> Back to Registration
            </Link>
          </Button>
          <Button asChild className="bg-forest hover:bg-forest/90 text-ivory text-xs font-semibold">
            <Link href={`/pass/${encodeURIComponent(code)}`}>
              <Ticket className="mr-1.5 size-3.5" /> View Pass Page →
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

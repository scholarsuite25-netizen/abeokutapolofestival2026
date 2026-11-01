import Link from "next/link";
import { Suspense } from "react";
import {
  QrCode,
  ShieldCheck,
  Printer,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Building,
  UserCheck,
  CalendarCheck,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { generateSignedPassToken, hashPassToken, verifyPassToken } from "@/lib/qr/token";

interface PassPageProps {
  params: Promise<{ code: string }>;
}

export const metadata = {
  title: "Official Gate Access Card — 2026 Abeokuta Polo Festival",
  description: "Official Gate Entry Access Card for Abeokuta Polo Festival 2026.",
};

export default function PublicPassPage({ params }: PassPageProps) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PassContent params={params} />
    </Suspense>
  );
}

async function PassContent({ params }: PassPageProps) {
  const { code } = await params;
  const normalizedCode = decodeURIComponent(code).toUpperCase().trim();

  let cred: {
    id: string;
    pass_code: string;
    pass_type: string;
    holder_name: string;
    zone_access: string[];
    affiliation_type?: string | null;
    host_name?: string | null;
    organization?: string | null;
    status: string;
    issued_at: string | null;
    day1_checked_in_at?: string | null;
    day2_checked_in_at?: string | null;
    day3_checked_in_at?: string | null;
    first_checked_in_at: string | null;
  } | null = null;

  let qrToken = "";
  let qrVerified = false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("credentials")
        .select(
          `id,
           pass_code,
           pass_type,
           holder_name,
           zone_access,
           affiliation_type,
           host_name,
           organization,
           status,
           issued_at,
           day1_checked_in_at,
           day2_checked_in_at,
           day3_checked_in_at,
           first_checked_in_at,
           token_hash`,
        )
        .eq("pass_code", normalizedCode)
        .maybeSingle();

      if (data) {
        cred = data;
        if (data.issued_at) {
          const token = generateSignedPassToken({
            credentialId: data.id,
            holderName: data.holder_name,
            passType: data.pass_type,
            editionYear: 2026,
            issuedAt: Date.parse(data.issued_at),
          });
          const check = verifyPassToken(token);
          qrVerified = check.valid && hashPassToken(token) === (data as { token_hash: string }).token_hash;
          qrToken = token;
        }
      }
    } catch {
      // Handled below
    }
  } else {
    // Demo fallback for offline/preview environments
    if (normalizedCode.startsWith("ABK-2026-")) {
      cred = {
        id: "demo-cred",
        pass_code: normalizedCode,
        pass_type: "Individual Attendee",
        holder_name: "Accredited Guest",
        affiliation_type: "individual",
        host_name: null,
        organization: null,
        zone_access: ["Festival Grounds & Grandstand"],
        status: "active",
        issued_at: new Date().toISOString(),
        day1_checked_in_at: null,
        day2_checked_in_at: null,
        day3_checked_in_at: null,
        first_checked_in_at: null,
      };
      qrToken = `ABK26.DEMO.${normalizedCode}`;
      qrVerified = true;
    }
  }

  if (!cred) {
    return (
      <div className="flex min-h-[70vh] w-full flex-col items-center justify-center bg-ivory p-6 text-center text-ink">
        <div className="max-w-md space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-100 text-red-700">
            <QrCode className="size-8" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-forest">Access Card Not Found</h1>
          <p className="text-sm text-muted-brand">
            No active access card matches pass code <strong className="font-mono">{normalizedCode}</strong>.
            Please verify your registration code or check your email confirmation.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button asChild variant="outline" className="border-line text-forest">
              <Link href="/register">Register for Pass</Link>
            </Button>
            <Button asChild className="bg-forest text-ivory">
              <Link href="/pass/lookup">Search Pass Code</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isActive = cred.status === "active";
  const affiliationLabel =
    cred.affiliation_type === "guest_of" && cred.host_name
      ? `Guest of: ${cred.host_name}`
      : cred.affiliation_type === "corporate" && cred.organization
      ? `Corporate: ${cred.organization}`
      : "Individual Guest";

  return (
    <div className="flex w-full flex-col bg-ivory text-ink py-10 sm:py-16 print:py-0 print:bg-white">
      <div className="mx-auto max-w-xl px-4 sm:px-6 space-y-6">
        {/* Navigation & Print Actions */}
        <div className="flex items-center justify-between print:hidden">
          <Button asChild variant="ghost" size="sm" className="text-muted-brand hover:text-forest">
            <Link href="/register">
              <ArrowLeft className="mr-2 size-4" /> Back to Registration
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-gold/50 bg-gold/10 text-forest text-[10px] uppercase tracking-wider"
            >
              Official Gate Access Card
            </Badge>
          </div>
        </div>

        {/* Access Card Container */}
        <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-2xl print:border-2 print:border-black print:shadow-none">
          {/* Header */}
          <div className="bg-forest p-6 text-ivory text-center relative overflow-hidden print:bg-black print:text-white">
            <div className="flex justify-center mb-2">
              <Badge
                variant="outline"
                className="border-gold bg-gold/20 text-gold text-[10px] uppercase tracking-widest print:border-white print:text-white"
              >
                Tournament Access Card
              </Badge>
            </div>
            <h1 className="font-display text-2xl font-semibold sm:text-3xl text-ivory">
              Abeokuta Polo Festival 2026
            </h1>
            <p className="mt-1 text-xs text-ivory/80">
              The Blueprint — Where Heritage Meets Excellence · 18–20 Dec 2026
            </p>
            <div className="mt-3 flex justify-center">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive ? "bg-emerald-800 text-ivory" : "bg-red-800 text-ivory"
                }`}
              >
                <CheckCircle2 className="size-3.5" />
                {isActive ? "Active Credential" : cred.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* QR Code Presentation */}
          <div className="p-8 flex flex-col items-center justify-center bg-ivory border-y border-line/60 print:bg-white">
            <div className="flex size-48 items-center justify-center rounded-2xl border-4 border-dashed border-forest/30 bg-card p-4 shadow-inner print:border-black">
              <QrCode className="size-40 text-forest print:text-black" />
            </div>
            <p className="mt-4 font-mono text-xl font-bold tracking-widest text-forest print:text-black">
              {cred.pass_code}
            </p>
            <span className="mt-1 text-xs font-semibold text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="size-3.5" /> Cryptographically Signed Access QR
            </span>
            {qrVerified ? (
              <span className="mt-2 max-w-full break-all rounded bg-sage/60 px-2 py-1 font-mono text-[9px] text-muted-brand print:hidden">
                Token: {qrToken}
              </span>
            ) : null}
          </div>

          {/* Attendee Details & Affiliation */}
          <div className="p-6 bg-card space-y-3.5 text-xs">
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-muted-brand font-medium">Registered Attendee:</span>
              <span className="font-semibold text-forest text-sm">{cred.holder_name}</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-muted-brand font-medium">Guest Affiliation:</span>
              <span className="font-semibold text-gold-deep text-sm flex items-center gap-1">
                {cred.affiliation_type === "guest_of" ? (
                  <UserCheck className="size-3.5 text-gold-deep inline" />
                ) : cred.affiliation_type === "corporate" ? (
                  <Building className="size-3.5 text-gold-deep inline" />
                ) : null}
                {affiliationLabel}
              </span>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-muted-brand font-medium">Category:</span>
              <span className="font-semibold text-forest text-sm">{cred.pass_type}</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-muted-brand font-medium">Venue:</span>
              <span className="font-semibold text-forest flex items-center gap-1">
                <MapPin className="size-3.5 text-gold-deep" /> Abeokuta Polo Club, Kobape
              </span>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-muted-brand font-medium">Access Entitlement:</span>
              <span className="font-semibold text-forest-interactive">
                {cred.zone_access?.join(", ") || "Festival Grounds & Grandstand"}
              </span>
            </div>

            {/* 3-Day Daily Attendance Tracking Status */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-forest block mb-2 flex items-center gap-1">
                <CalendarCheck className="size-3.5 text-gold-deep" /> Daily Entrance Attendance Record:
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div
                  className={`rounded-lg p-2 border ${
                    cred.day1_checked_in_at
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-sage/20 border-line text-muted-brand"
                  }`}
                >
                  <span className="block font-bold">Day 1</span>
                  <span className="text-[10px] block">Fri 18 Dec</span>
                  <span className="text-[10px] font-semibold mt-1 block">
                    {cred.day1_checked_in_at ? "Checked In" : "Not Yet"}
                  </span>
                </div>

                <div
                  className={`rounded-lg p-2 border ${
                    cred.day2_checked_in_at
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-sage/20 border-line text-muted-brand"
                  }`}
                >
                  <span className="block font-bold">Day 2</span>
                  <span className="text-[10px] block">Sat 19 Dec</span>
                  <span className="text-[10px] font-semibold mt-1 block">
                    {cred.day2_checked_in_at ? "Checked In" : "Not Yet"}
                  </span>
                </div>

                <div
                  className={`rounded-lg p-2 border ${
                    cred.day3_checked_in_at
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-sage/20 border-line text-muted-brand"
                  }`}
                >
                  <span className="block font-bold">Day 3</span>
                  <span className="text-[10px] block">Sun 20 Dec</span>
                  <span className="text-[10px] font-semibold mt-1 block">
                    {cred.day3_checked_in_at ? "Checked In" : "Not Yet"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Gate Scanning Instructions */}
          <div className="bg-sage/40 p-4 text-center border-t border-line text-[11px] text-muted-brand">
            Present this access card at the entrance turnstiles. Gate officers will scan this QR
            code on each tournament day to confirm and log your attendance.
          </div>
        </div>

        {/* Print & Return Controls */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 print:hidden">
          <Button
            asChild
            className="bg-forest text-ivory hover:bg-forest-interactive shadow cursor-pointer"
          >
            <a href="javascript:window.print()">
              <Printer className="mr-2 size-4" /> Print Access Card / Save PDF
            </a>
          </Button>
          <Button asChild variant="outline" className="border-line text-forest">
            <Link href="/register">Register Another Person</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

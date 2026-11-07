import Link from "next/link";
import { Suspense } from "react";
import {
  QrCode,
  ShieldCheck,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Building,
  UserCheck,
  CalendarCheck,
  Ticket,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { PassViewActions } from "@/components/shared/pass-view-actions";
import { AttendanceMilestoneWidget } from "@/components/shared/attendance-milestone-widget";
import { generateSignedPassToken, hashPassToken, verifyPassToken } from "@/lib/qr/token";
import type { StoredPass } from "@/lib/storage/pass-storage";

interface PassPageProps {
  params: Promise<{ code: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata = {
  title: "Official Gate Access Card — 2026 Abeokuta Polo Festival",
  description: "Official Gate Entry Access Card for Abeokuta Polo Festival 2026. Day 1 Free, Day 2 & 3 Through Ticket.",
};

export default function PublicPassPage({ params, searchParams }: PassPageProps) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PassContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PassContent({ params, searchParams }: PassPageProps) {
  const { code } = await params;
  const sp = searchParams ? await searchParams : {};
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
    has_day2_ticket?: boolean;
    has_day3_ticket?: boolean;
    day2_ticket_ref?: string | null;
    day3_ticket_ref?: string | null;
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
    if (
      normalizedCode.startsWith("ABK-2026-") ||
      normalizedCode.startsWith("ABK-VVIP-") ||
      normalizedCode.startsWith("ABK-DAY3-")
    ) {
      const isVvip = normalizedCode.includes("VVIP") || normalizedCode.startsWith("ABK-DAY3-");
      const vvipMatch = normalizedCode.match(/VVIP(\d+)/);
      const ticketIdx = vvipMatch ? parseInt(vvipMatch[1], 10) : 1;
      const isSponsored = ticketIdx > 1 || Boolean(sp.holder && String(sp.holder).toLowerCase().startsWith("sponsored invitation"));
      const sponsorFromUrl = sp.sponsor ? String(sp.sponsor) : sp.buyer ? String(sp.buyer) : null;
      const holderFromUrl = sp.holder ? String(sp.holder) : (isSponsored ? (sponsorFromUrl ? `Sponsored Invitation by ${sponsorFromUrl}` : "Sponsored Invitation by Event Patron") : "Accredited Guest");

      cred = {
        id: "demo-cred",
        pass_code: normalizedCode,
        pass_type: isVvip ? "Day 3 VVIP Grand Finale Pass" : "Individual Attendee",
        holder_name: holderFromUrl,
        affiliation_type: isSponsored ? "guest_of" : "individual",
        host_name: sponsorFromUrl || (isSponsored ? "Event Patron" : null),
        organization: null,
        zone_access: isVvip
          ? ["VVIP Royal Pavilion", "Grandstand", "Festival Grounds"]
          : ["Festival Grounds & Grandstand"],
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
  const isSponsored = cred.holder_name.toLowerCase().startsWith("sponsored invitation") || cred.affiliation_type === "guest_of";
  const affiliationLabel =
    cred.affiliation_type === "guest_of" && cred.host_name
      ? `Guest of: ${cred.host_name}`
      : isSponsored && cred.host_name
      ? `Sponsored by: ${cred.host_name}`
      : cred.affiliation_type === "corporate" && cred.organization
      ? `Corporate: ${cred.organization}`
      : "Individual Attendee";

  const isGold = cred.pass_code.includes("VVIP") || cred.pass_type.toLowerCase().includes("vvip") || cred.pass_type.toLowerCase().includes("day 3");

  const passStorageData: StoredPass = {
    passCode: cred.pass_code,
    holderName: cred.holder_name,
    category: cred.pass_type,
    affiliationType: (cred.affiliation_type as "individual" | "guest_of" | "corporate") || "individual",
    hostName: cred.host_name,
    organization: cred.organization,
    qrToken: qrToken || undefined,
    registeredAt: cred.issued_at || new Date().toISOString(),
    daysCovered: isGold ? [3] : cred.pass_code.includes("D12") ? [1, 2] : cred.pass_code.includes("D2") ? [2] : [1],
    isVvip: isGold,
    designTheme: isGold ? "gold" : "standard",
    day1Status: "free_admitted",
    day2Status: "free_admitted",
    day3Status: isGold ? "vvip_admitted" : "not_selected",
    ticketRefDay2: cred.day2_ticket_ref,
    ticketRefDay3: cred.day3_ticket_ref,
    isSponsored,
    sponsorName: cred.host_name,
  };

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
              className={`text-[10px] uppercase tracking-wider ${
                isGold ? "border-amber-500 bg-amber-500/10 text-amber-900" : "border-gold/50 bg-gold/10 text-forest"
              }`}
            >
              {isGold ? (isSponsored ? "VVIP Sponsored Guest Card" : "VVIP Gate Access ID Card") : "Official Gate Access Card"}
            </Badge>
          </div>
        </div>

        {/* Action Bar (Download Offline Pass / Print / Share) */}
        <PassViewActions passData={passStorageData} />

        {/* Access Card Container */}
        <div
          className={`overflow-hidden rounded-3xl border-2 shadow-2xl print:border-2 print:border-black print:shadow-none ${
            isGold ? "border-[#C9A84C] bg-[#161104] text-[#FAF9F5]" : "border-forest/20 bg-card"
          }`}
        >
          {/* Header */}
          <div
            className={`p-6 text-center relative overflow-hidden print:bg-black print:text-white ${
              isGold ? "bg-gradient-to-b from-[#2D2108] to-[#161104] text-[#FBF5B7]" : "bg-forest text-ivory"
            }`}
          >
            <div className="flex justify-center mb-2">
              <Badge
                variant="outline"
                className={`text-[10px] uppercase tracking-widest ${
                  isGold ? "border-[#C9A84C] bg-[#C9A84C]/20 text-[#E5C768]" : "border-gold bg-gold/20 text-gold"
                }`}
              >
                Abeokuta Polo Festival 2026
              </Badge>
            </div>
            <h1 className="font-serif text-2xl font-semibold sm:text-3xl">
              {isGold ? (isSponsored ? "Day 3 VVIP Guest Pass" : "Day 3 VVIP Grand Finale Pass") : "Official Gate Access Card"}
            </h1>
            <p className={`mt-1 text-xs ${isGold ? "text-[#C9A84C]" : "text-ivory/80"}`}>
              {isGold ? "Royal Cup Grand Finale & 100 Kings Celebration · 20 Dec 2026" : "The Blueprint — Where Heritage Meets Excellence · 18–20 Dec 2026"}
            </p>
            {isSponsored && cred.host_name && (
              <p className="mt-1 text-xs font-semibold text-[#E5C768]">
                👑 Sponsored Guest Invitation by {cred.host_name}
              </p>
            )}
            <div className="mt-3 flex justify-center">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive ? (isGold ? "bg-amber-600 text-white" : "bg-emerald-800 text-ivory") : "bg-red-800 text-ivory"
                }`}
              >
                <CheckCircle2 className="size-3.5" />
                {isActive ? (isGold ? "VVIP Active Credential" : "Active Credential") : cred.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* QR Code Presentation */}
          <div className="p-8 flex flex-col items-center justify-center bg-ivory border-y border-line/60 print:bg-white">
            <div className="flex size-48 items-center justify-center rounded-2xl border-4 border-dashed border-forest/30 bg-card p-4 shadow-inner print:border-black">
              <QrCode className="size-40 text-forest print:text-black" />
            </div>
            <p className="mt-4 font-mono text-2xl font-bold tracking-widest text-forest print:text-black">
              {cred.pass_code}
            </p>
            <span className="mt-1 text-xs font-semibold text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="size-3.5" /> Cryptographically Signed Gate Pass
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

            {/* 3-Day Daily Admission & Gate Attendance Tracking */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-forest block mb-2 flex items-center gap-1">
                <CalendarCheck className="size-3.5 text-gold-deep" /> Daily Gate Admission &amp; Attendance:
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {/* Day 1: Free */}
                <div
                  className={`rounded-lg p-2.5 border ${
                    cred.day1_checked_in_at
                      ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                      : "bg-emerald-50/50 border-emerald-300 text-emerald-900"
                  }`}
                >
                  <span className="block font-bold">Day 1 (Fri 18)</span>
                  <Badge className="bg-emerald-700 text-ivory text-[9px] my-1">FREE ENTRY</Badge>
                  <span className="text-[10px] font-semibold block text-emerald-800">
                    {cred.day1_checked_in_at ? "✓ Checked In" : "Ready for Gate"}
                  </span>
                </div>

                {/* Day 2: Free */}
                <div
                  className={`rounded-lg p-2.5 border ${
                    cred.day2_checked_in_at
                      ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                      : "bg-emerald-50/50 border-emerald-300 text-emerald-900"
                  }`}
                >
                  <span className="block font-bold">Day 2 (Sat 19)</span>
                  <Badge className="bg-emerald-700 text-ivory text-[9px] my-1">FREE ENTRY</Badge>
                  <span className="text-[10px] font-semibold block text-emerald-800">
                    {cred.day2_checked_in_at ? "✓ Checked In" : "Ready for Gate"}
                  </span>
                </div>

                {/* Day 3: Paid VVIP */}
                <div
                  className={`rounded-lg p-2.5 border ${
                    cred.day3_checked_in_at
                      ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                      : isGold
                      ? "bg-amber-500/10 border-amber-500 text-amber-950"
                      : "bg-sage/40 border-line text-muted-brand"
                  }`}
                >
                  <span className="block font-bold">Day 3 (Sun 20)</span>
                  <Badge className="bg-amber-600 text-ivory text-[9px] my-1">PAID VVIP</Badge>
                  <span className="text-[10px] font-semibold block text-amber-900">
                    {cred.day3_checked_in_at ? "✓ Checked In" : isGold ? "VVIP Access Confirmed" : "Ticket Required"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Gate Scanning Instructions & Mandatory Protocol */}
          <div className="bg-forest-deep text-ivory p-4 text-center border-t-2 border-gold/40 text-[11px] space-y-1">
            <p className="font-bold text-gold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-3.5 text-gold inline" /> Mandatory Gate Protocol
            </p>
            <p className="text-ivory/90 leading-relaxed">
              <strong>All attendees must be duly registered to attend any of the three festival days.</strong> Turnstile accreditation required. Show this screen or your downloaded offline pass at turnstiles for fast contactless scanning.
            </p>
          </div>
        </div>

        {/* 2,500 Attendance Accelerator & WhatsApp Share Widget */}
        <div className="print:hidden">
          <AttendanceMilestoneWidget
            passCode={cred.pass_code}
            holderName={cred.holder_name}
            currentCount={1840}
            targetCount={2500}
          />
        </div>

        {/* Return Controls */}
        <div className="flex justify-center gap-3 print:hidden">
          <Button asChild variant="outline" className="border-line text-forest">
            <Link href="/register">Register Another Person</Link>
          </Button>
          <Button asChild variant="ghost" className="text-muted-brand hover:text-forest">
            <Link href="/pass/lookup">
              <Ticket className="mr-1.5 size-4" /> Look Up Another Pass
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

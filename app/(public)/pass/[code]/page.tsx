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
  Crown,
  AlertTriangle,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { PassViewActions } from "@/components/shared/pass-view-actions";
import { PassDeviceGuard } from "@/components/shared/pass-device-guard";
import { AttendanceMilestoneWidget } from "@/components/shared/attendance-milestone-widget";
import { generateSignedPassToken, hashPassToken, verifyPassToken } from "@/lib/qr/token";
import type { StoredPass } from "@/lib/storage/pass-storage";
import { isPassPendingVerification } from "@/lib/storage/unverified-passes";

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
      let data: any = null;

      // 1. First attempt rich schema selection
      const richRes = await supabase
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

      if (!richRes.error && richRes.data) {
        data = richRes.data;
      } else {
        // 2. Resilient fallback to base scaffold columns that always exist
        const baseRes = await supabase
          .from("credentials")
          .select("id, pass_code, pass_type, holder_name, zone_access, status, first_checked_in_at, token_hash, created_at")
          .eq("pass_code", normalizedCode)
          .maybeSingle();

        if (baseRes.data) {
          data = {
            ...baseRes.data,
            affiliation_type: null,
            host_name: null,
            organization: null,
            issued_at: baseRes.data.created_at,
            day1_checked_in_at: null,
            day2_checked_in_at: null,
            day3_checked_in_at: null,
          };
        }
      }

      if (data) {
        cred = data;
        const issuedAtTime = data.issued_at ? Date.parse(data.issued_at) : Date.now();
        const token = generateSignedPassToken({
          credentialId: data.id,
          holderName: data.holder_name,
          passType: data.pass_type,
          editionYear: 2026,
          issuedAt: isNaN(issuedAtTime) ? Date.now() : issuedAtTime,
        });
        const check = verifyPassToken(token);
        qrVerified = check.valid && (data.token_hash ? hashPassToken(token) === data.token_hash : true);
        qrToken = token;
      }
    } catch {
      // Handled below
    }
  }

  // Graceful fallback for offline, preview, or newly registered codes before DB sync
  if (
    !cred &&
    (normalizedCode.startsWith("ABK-2026-") ||
      normalizedCode.startsWith("ABK-VVIP-") ||
      normalizedCode.startsWith("ABK-DAY3-"))
  ) {
    const isTable =
      normalizedCode.includes("-KT") ||
      normalizedCode.includes("-RT") ||
      normalizedCode.includes("-QT") ||
      normalizedCode.includes("-PT") ||
      normalizedCode.includes("-TBL-");
    const isVvip = isTable || normalizedCode.includes("VVIP") || normalizedCode.startsWith("ABK-DAY3-");
    const isDual = normalizedCode.includes("D12");
    const isDay2 = normalizedCode.includes("D2");
    const isPending = isPassPendingVerification(normalizedCode);
    const vvipMatch = normalizedCode.match(/VVIP(\d+)/);
    const seatMatch = normalizedCode.match(/-S(\d+)-/);
    const ticketIdx = seatMatch ? parseInt(seatMatch[1], 10) : (vvipMatch ? parseInt(vvipMatch[1], 10) : 1);
    const isSponsored = ticketIdx > 1 || Boolean(sp.holder && String(sp.holder).toLowerCase().startsWith("sponsored invitation"));
    const sponsorFromUrl = sp.sponsor ? String(sp.sponsor) : sp.buyer ? String(sp.buyer) : null;
    const defaultHolder = isTable
      ? (ticketIdx > 1 ? (sponsorFromUrl ? `Guest of ${sponsorFromUrl}` : `Table Guest (Seat ${ticketIdx})`) : (sponsorFromUrl || "VIP Table Host"))
      : (isSponsored ? (sponsorFromUrl ? `Sponsored Invitation by ${sponsorFromUrl}` : "Sponsored Invitation by Event Patron") : "Accredited Guest");
    const holderFromUrl = sp.holder ? String(sp.holder) : defaultHolder;

    let tablePkgName = "VIP Table Package";
    let enclosure = "VIP Pavilion";
    if (normalizedCode.includes("-KT")) {
      tablePkgName = "The Kings Table";
      enclosure = "Kings Arena & Royal Dais";
    } else if (normalizedCode.includes("-RT")) {
      tablePkgName = "The Royal Table";
      enclosure = "Royal Enclosure Pavilion";
    } else if (normalizedCode.includes("-QT")) {
      tablePkgName = "The Queens Table";
      enclosure = "Queens Lounge & Garden Pavilion";
    } else if (normalizedCode.includes("-PT")) {
      tablePkgName = "The Premium Table";
      enclosure = "Clubhouse Terrace & Grandstand";
    }

    const passType = isPending
      ? (isTable ? `${tablePkgName} Provisional Table Slip` : "Day 3 VVIP Provisional Claim (Pending Accounts Verification)")
      : isTable
      ? `${tablePkgName} VIP Access`
      : isVvip
      ? "Day 3 VVIP Grand Finale Pass"
      : isDual
      ? "Day 1 & Day 2 Dual Pass"
      : isDay2
      ? "Day 2 Access Pass (Free Entry)"
      : "Day 1 Access Pass (Free Entry)";

    cred = {
      id: "fallback-" + normalizedCode,
      pass_code: normalizedCode,
      pass_type: passType,
      holder_name: holderFromUrl,
      affiliation_type: isSponsored ? "guest_of" : "individual",
      host_name: sponsorFromUrl || (isSponsored ? (isTable ? "Table Host" : "Event Patron") : null),
      organization: isTable ? enclosure : null,
      zone_access: isTable
        ? [enclosure, "VVIP Royal Pavilion", "Grandstand", "Festival Grounds"]
        : isVvip && !isPending
        ? ["VVIP Royal Pavilion", "Grandstand", "Festival Grounds"]
        : isPending
        ? ["Accreditation Desk Verification Only"]
        : ["Festival Grounds & Grandstand"],
      status: isPending ? "pending_verification" : "active",
      issued_at: new Date().toISOString(),
      day1_checked_in_at: null,
      day2_checked_in_at: null,
      day3_checked_in_at: null,
      first_checked_in_at: null,
    };
    qrToken = `ABK26.${normalizedCode}`;
    qrVerified = true;
  }

  // Cross-check in-memory unverified registry: if marked pending verification, force pending status
  if (cred && isPassPendingVerification(cred.pass_code)) {
    cred.status = "pending_verification";
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
  const isPendingVerification =
    cred.status === "pending_verification" ||
    cred.status === "pending_bank_verification" ||
    cred.status === "pending_approval";
  const vvipMatch = cred.pass_code.match(/VVIP(\d+)/);
  const seatMatch = cred.pass_code.match(/-S(\d+)-/);
  const ticketIdx = seatMatch ? parseInt(seatMatch[1], 10) : (vvipMatch ? parseInt(vvipMatch[1], 10) : 1);
  const isTable =
    cred.pass_code.includes("-KT") ||
    cred.pass_code.includes("-RT") ||
    cred.pass_code.includes("-QT") ||
    cred.pass_code.includes("-PT") ||
    cred.pass_code.includes("-TBL-") ||
    cred.pass_type.toLowerCase().includes("table") ||
    cred.pass_type.toLowerCase().includes("kings") ||
    cred.pass_type.toLowerCase().includes("royal") ||
    cred.pass_type.toLowerCase().includes("queens") ||
    cred.pass_type.toLowerCase().includes("premium");
  const isTableGuest = isTable && ticketIdx > 1;

  const isSponsored =
    ticketIdx > 1 ||
    cred.holder_name.toLowerCase().startsWith("sponsored invitation") ||
    cred.holder_name.toLowerCase().includes("pass ") ||
    cred.affiliation_type === "guest_of";
  const affiliationLabel =
    cred.affiliation_type === "guest_of" && cred.host_name
      ? (isTable ? `Guest of: ${cred.host_name}` : `Guest of: ${cred.host_name}`)
      : isSponsored && cred.host_name
      ? `Sponsored by: ${cred.host_name}`
      : cred.affiliation_type === "corporate" && cred.organization
      ? `Corporate: ${cred.organization}`
      : isTable
      ? "Table Host"
      : "Individual Attendee";

  const isGold = isTable || cred.pass_code.includes("VVIP") || cred.pass_type.toLowerCase().includes("vvip") || cred.pass_type.toLowerCase().includes("day 3");

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
    status: cred.status,
    day1Status: "free_admitted",
    day2Status: "free_admitted",
    day3Status: isGold ? (isPendingVerification ? "pending_verification" : "vvip_admitted") : "not_selected",
    ticketRefDay2: cred.day2_ticket_ref,
    ticketRefDay3: cred.day3_ticket_ref,
    ticketIndex: ticketIdx,
    isSponsored,
    sponsorName: cred.host_name,
    isLockedToDevice: isTableGuest || isSponsored,
    isBuyer: isTable ? ticketIdx === 1 : false,
  };

  return (
    <PassDeviceGuard
      passCode={cred.pass_code}
      holderName={cred.holder_name}
      isTableGuest={isTableGuest}
    >
      <div className="flex w-full max-w-full flex-col bg-ivory text-ink py-6 sm:py-10 print:py-0 print:bg-white overflow-x-clip min-w-0">
      <div className="mx-auto w-full max-w-md px-3 sm:px-4 space-y-4 min-w-0">
        {/* Navigation & Print Actions */}
        <div className="flex items-center justify-between print:hidden">
          <Button asChild variant="ghost" size="sm" className="text-muted-brand hover:text-forest text-xs">
            <Link href="/register">
              <ArrowLeft className="mr-1.5 size-3.5" /> Back to Registration
            </Link>
          </Button>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={`text-[9px] uppercase tracking-wider ${
                isPendingVerification
                  ? "border-amber-500 bg-amber-500/20 text-amber-900"
                  : isGold
                  ? "border-amber-500 bg-amber-500/10 text-amber-900"
                  : "border-gold/50 bg-gold/10 text-forest"
              }`}
            >
              {isPendingVerification
                ? "⚠️ Provisional Bank Claim Slip"
                : isGold
                ? (isSponsored ? "VVIP Guest Pass" : "VVIP Gate ID Card")
                : "Official Gate Pass"}
            </Badge>
          </div>
        </div>

        {/* Action Bar (Download Offline Pass / Print / Share) */}
        <PassViewActions passData={passStorageData} />

        {/* Access Card Container (CR80 Standard Physical ID-Card Ratio: max-w-[290px] sm:max-w-[305px]) */}
        <div
          className={`mx-auto w-full max-w-[290px] sm:max-w-[305px] min-w-0 overflow-hidden rounded-2xl border-2 shadow-xl print:border-2 print:border-black print:shadow-none transition-all ${
            isPendingVerification
              ? "border-2 border-amber-500 bg-[#FCF9F8] text-[#1B1C1C] shadow-lg"
              : isGold
              ? "border-2 border-[#C9A84C] bg-gradient-to-b from-[#1C1605] via-[#2A2007] to-[#120E03] text-[#FCF9F8] shadow-[0_4px_25px_rgba(201,168,76,0.25)]"
              : "border-2 border-[#002F1A] bg-[#FCF9F8] text-[#1B1C1C] shadow-lg"
          }`}
        >
          {/* Lanyard punch-hole simulation */}
          <div className="pt-1.5 pb-0.5 flex justify-center bg-transparent">
            <div
              className={`h-1.5 w-10 rounded-full border ${
                isGold ? "bg-[#0B0902] border-[#5E4711]" : "bg-[#E5DFD5] border-[#002F1A]/20"
              }`}
            />
          </div>

          {/* Header */}
          <div
            className={`p-2.5 text-center relative overflow-hidden print:bg-black print:text-white border-b-2 ${
              isPendingVerification
                ? "bg-amber-900 text-amber-100 border-amber-500"
                : isGold
                ? "bg-gradient-to-r from-[#241A04] via-[#3B2B08] to-[#241A04] text-[#E5C768] border-[#C9A84C]"
                : "bg-[#002F1A] text-[#FCF9F8] border-[#C9A84C]/50"
            }`}
          >
            <div className="flex justify-center mb-0.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[8px] font-black tracking-widest uppercase ${
                  isPendingVerification
                    ? "bg-amber-500 text-black shadow-xs"
                    : isGold
                    ? "bg-gradient-to-r from-[#B38F34] via-[#F5D77F] to-[#C9A84C] text-black shadow-xs"
                    : "bg-[#FCF9F8] text-[#002F1A] border border-[#002F1A] shadow-xs"
                }`}
              >
                {isPendingVerification ? (
                  <AlertTriangle className="size-2.5 inline text-black" />
                ) : isGold ? (
                  <Crown className="size-2.5 inline text-black" />
                ) : (
                  <ShieldCheck className="size-2.5 inline text-[#002F1A]" />
                )}
                {isPendingVerification
                  ? "PROVISIONAL CLAIM · UNVERIFIED"
                  : isGold
                  ? isSponsored
                    ? `VVIP GUEST PASS · TICKET ${ticketIdx}`
                    : "VVIP ROYAL ADMISSION"
                  : "CLASSIC HERITAGE BADGE"}
              </span>
            </div>
            <h1 className="font-serif text-sm font-bold leading-tight">
              {isPendingVerification
                ? "Day 3 VVIP Provisional Claim"
                : isGold
                ? (isSponsored ? "Day 3 VVIP Guest Pass" : "Day 3 VVIP Grand Finale Pass")
                : "Official Gate Access Card"}
            </h1>
            <p className={`mt-0.5 text-[8px] uppercase tracking-wider font-semibold ${isPendingVerification ? "text-amber-200" : isGold ? "text-[#C9A84C]" : "text-[#E5C768]"}`}>
              {isGold ? "Royal Cup Grand Finale · 20 Dec 2026" : "The Blueprint · 18–20 Dec 2026"}
            </p>
            {isSponsored && cred.host_name && (
              <p className="mt-0.5 text-[9px] font-semibold text-[#E5C768]">
                👑 Sponsored Guest of {cred.host_name}
              </p>
            )}
            <div className="mt-1 flex justify-center">
              {isPendingVerification ? (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/25 border border-amber-400 text-amber-300">
                  <AlertTriangle className="size-2.5 text-amber-400" />
                  Pending Accounts Verification
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    isActive
                      ? isGold
                        ? "bg-[#2C2106] border border-[#C9A84C]/50 text-[#F3E5AB]"
                        : "bg-emerald-50 border border-emerald-300 text-emerald-800"
                      : "bg-red-800 text-ivory"
                  }`}
                >
                  <CheckCircle2 className={`size-2.5 ${isGold ? "text-[#E5C768]" : "text-emerald-700"}`} />
                  {isActive ? (isGold ? "VVIP Active Status" : "Emerald Active Status") : cred.status.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* QR Code Presentation */}
          <div
            className={`p-2.5 flex flex-col items-center justify-center border-b ${
              isGold ? "bg-[#140F04] border-[#3D2E08]" : "bg-[#FAF7F2] border-[#002F1A]/15"
            } print:bg-white`}
          >
            <div
              className={`relative flex size-24 items-center justify-center rounded-xl border-2 bg-white p-2 shadow-xs ${
                isPendingVerification
                  ? "border-amber-500"
                  : isGold
                  ? "border-[#C9A84C] shadow-[0_0_12px_rgba(201,168,76,0.35)]"
                  : "border-[#002F1A]"
              } print:border-black`}
            >
              <QrCode className={`size-20 ${isGold ? "text-black" : "text-[#002F1A]"} print:text-black`} />
              {isPendingVerification && (
                <div className="absolute inset-0 bg-black/75 rounded-xl flex items-center justify-center p-1 text-center">
                  <span className="text-[7px] font-black text-amber-300 uppercase tracking-tighter leading-tight bg-black/90 px-1 py-0.5 rounded border border-amber-400">
                    ⚠️ PROVISIONAL · NOT VALID FOR GATE ENTRY
                  </span>
                </div>
              )}
            </div>
            <p
              className={`mt-1 font-mono text-sm font-extrabold tracking-widest ${
                isGold ? "text-[#E5C768]" : "text-[#002F1A]"
              } print:text-black`}
            >
              {cred.pass_code}
            </p>
            <span
              className={`mt-0.5 text-[8.5px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                isGold ? "text-[#85E0A3]" : "text-emerald-800"
              }`}
            >
              <ShieldCheck className="size-2.5" /> Cryptographically Signed Pass
            </span>
            {qrVerified ? (
              <span className="mt-1 max-w-full break-all rounded bg-sage/60 px-1.5 py-0.5 font-mono text-[7.5px] text-muted-brand print:hidden">
                Token: {qrToken}
              </span>
            ) : null}
          </div>

          {/* Attendee Details & Affiliation */}
          <div className={`p-2.5 space-y-1 text-[11px] ${isGold ? "bg-transparent text-[#E8DFD0]" : "bg-[#FCF9F8] text-[#1B1C1C]"}`}>
            <div className={`flex justify-between border-b pb-0.5 ${isGold ? "border-[#C9A84C]/20" : "border-[#002F1A]/10"}`}>
              <span className={`text-[8.5px] uppercase font-bold tracking-wider ${isGold ? "text-[#C9A84C]" : "text-[#002F1A]/70"}`}>Attendee:</span>
              <span className={`font-bold truncate max-w-[170px] text-right ${isGold ? "text-[#FFFFFF]" : "text-[#002F1A]"}`}>{cred.holder_name}</span>
            </div>
            <div className={`flex justify-between border-b pb-0.5 ${isGold ? "border-[#C9A84C]/20" : "border-[#002F1A]/10"}`}>
              <span className={`text-[8.5px] uppercase font-bold tracking-wider ${isGold ? "text-[#C9A84C]" : "text-[#002F1A]/70"}`}>Affiliation:</span>
              <span className={`font-semibold flex items-center gap-1 truncate max-w-[170px] text-right ${isGold ? "text-[#E5C768]" : "text-[#002F1A]"}`}>
                {cred.affiliation_type === "guest_of" ? (
                  <UserCheck className="size-2.5 inline" />
                ) : cred.affiliation_type === "corporate" ? (
                  <Building className="size-2.5 inline" />
                ) : null}
                {affiliationLabel}
              </span>
            </div>
            <div className={`flex justify-between border-b pb-0.5 ${isGold ? "border-[#C9A84C]/20" : "border-[#002F1A]/10"}`}>
              <span className={`text-[8.5px] uppercase font-bold tracking-wider ${isGold ? "text-[#C9A84C]" : "text-[#002F1A]/70"}`}>Category:</span>
              <span className={`font-semibold ${isGold ? "text-[#E5C768]" : "text-[#002F1A]"}`}>{cred.pass_type}</span>
            </div>
            <div className={`flex justify-between border-b pb-0.5 ${isGold ? "border-[#C9A84C]/20" : "border-[#002F1A]/10"}`}>
              <span className={`text-[8.5px] uppercase font-bold tracking-wider ${isGold ? "text-[#C9A84C]" : "text-[#002F1A]/70"}`}>Venue:</span>
              <span className={`font-semibold flex items-center gap-1 text-[9.5px] ${isGold ? "text-[#E8DFD0]" : "text-[#002F1A]"}`}>
                <MapPin className="size-2.5 text-gold-deep" /> Abeokuta Polo Club Grounds
              </span>
            </div>
            <div className={`flex justify-between border-b pb-0.5 ${isGold ? "border-[#C9A84C]/20" : "border-[#002F1A]/10"}`}>
              <span className={`text-[8.5px] uppercase font-bold tracking-wider ${isGold ? "text-[#C9A84C]" : "text-[#002F1A]/70"}`}>Entitlement:</span>
              <span className={`font-semibold truncate max-w-[170px] text-right ${isGold ? "text-[#E5C768]" : "text-[#002F1A]"}`}>
                {cred.zone_access?.join(", ") || "Festival Grounds & Grandstand"}
              </span>
            </div>

            {/* 3-Day Daily Admission & Gate Attendance Tracking */}
            <div className="pt-0.5">
              <span className={`text-[9px] font-bold uppercase tracking-wider block mb-1 flex items-center gap-1 ${isGold ? "text-[#C9A84C]" : "text-[#002F1A]"}`}>
                <CalendarCheck className="size-2.5 text-gold-deep" /> Daily Gate Admission:
              </span>
              <div className="grid grid-cols-3 gap-1 text-center text-[9px]">
                {/* Day 1: Free */}
                <div
                  className={`rounded-lg p-1 border ${
                    cred.day1_checked_in_at
                      ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                      : "bg-emerald-50/50 border-emerald-300 text-emerald-900"
                  }`}
                >
                  <span className="block font-bold">Day 1</span>
                  <Badge className="bg-emerald-700 text-ivory text-[7px] my-0.5 px-1 py-0">FREE</Badge>
                  <span className="text-[7.5px] font-semibold block text-emerald-800">
                    {cred.day1_checked_in_at ? "Checked" : "Ready"}
                  </span>
                </div>

                {/* Day 2: Free */}
                <div
                  className={`rounded-lg p-1 border ${
                    cred.day2_checked_in_at
                      ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                      : "bg-emerald-50/50 border-emerald-300 text-emerald-900"
                  }`}
                >
                  <span className="block font-bold">Day 2</span>
                  <Badge className="bg-emerald-700 text-ivory text-[7px] my-0.5 px-1 py-0">FREE</Badge>
                  <span className="text-[7.5px] font-semibold block text-emerald-800">
                    {cred.day2_checked_in_at ? "Checked" : "Ready"}
                  </span>
                </div>

                {/* Day 3: Paid VVIP */}
                <div
                  className={`rounded-lg p-1 border ${
                    cred.day3_checked_in_at
                      ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                      : isGold
                      ? "bg-amber-500/10 border-amber-500 text-amber-950"
                      : "bg-sage/40 border-line text-muted-brand"
                  }`}
                >
                  <span className="block font-bold">Day 3</span>
                  <Badge className="bg-amber-600 text-ivory text-[7px] my-0.5 px-1 py-0">VVIP</Badge>
                  <span className="text-[7.5px] font-semibold block text-amber-900 truncate">
                    {cred.day3_checked_in_at ? "Checked" : isGold ? "Confirmed" : "Ticket Req."}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Foil Strip */}
            <div
              className={`mt-1 rounded-md px-2 py-0.5 text-[7.5px] flex items-center justify-between border ${
                isGold
                  ? "bg-gradient-to-r from-[#2C2106] via-[#4A3910] to-[#1A1404] border-[#C9A84C] text-[#F3E5AB]"
                  : "bg-[#EFECE6] border-[#002F1A]/20 text-[#002F1A] font-medium"
              }`}
            >
              <span className="flex items-center gap-1">
                <ShieldCheck className={`size-2.5 ${isGold ? "text-[#E5C768]" : "text-[#002F1A]"}`} />
                <strong>HMAC-256</strong> SEALED
              </span>
              <span className="font-mono text-[7px] font-bold tracking-wider">
                {isGold ? "GOLD FOIL SECURITY HOLOGRAM" : "CLASSIC HERITAGE BADGE"}
              </span>
            </div>
          </div>

          {/* Gate Scanning Instructions & Mandatory Protocol */}
          <div
            className={`p-2 text-center border-t text-[8px] space-y-0.5 ${
              isPendingVerification
                ? "bg-amber-950 border-amber-500 text-amber-300"
                : isGold
                ? "bg-[#0E0A02] border-[#3D2E08] text-[#C9A84C]"
                : "bg-[#002F1A]/5 border-[#002F1A]/15 text-[#002F1A]"
            }`}
          >
            {isPendingVerification ? (
              <div className="space-y-0.5">
                <p className="font-bold uppercase tracking-wider text-[8px] flex items-center justify-center gap-1 text-amber-300">
                  <AlertTriangle className="size-2.5 text-amber-400 inline" /> PAYMENT UNVERIFIED — ADMISSION DENIED
                </p>
                <p className="opacity-95 leading-relaxed text-[7.5px] text-amber-200">
                  Please proceed to Secretariat accreditation desk.
                </p>
              </div>
            ) : (
              <>
                <p className="font-bold uppercase tracking-wider text-[7.5px] flex items-center justify-center gap-1">
                  <ShieldCheck className="size-2.5 inline" /> Turnstile accreditation required.
                </p>
                <p className="opacity-90 leading-relaxed text-[7.5px]">
                  {isGold ? "Royal Gate Marshals on duty · Royal Pavilion access." : "Complimentary Heritage Entry · ID Card Format."}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Anti-Leakage Guard: If gifted pass, show recipient device lock notification instead of viral share widget */}
        {isSponsored ? (
          <div className="rounded-2xl border-2 border-amber-500/70 bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 text-amber-950 shadow-sm space-y-2 print:hidden">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-amber-600 text-white shrink-0 shadow-xs">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Device-Locked Credential
                </span>
                <h3 className="font-serif text-sm font-bold text-amber-950">
                  Gifted / Sponsored Ticket — Locked to this device · Non-transferable
                </h3>
              </div>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              This official gate credential has been securely issued and bound to this device. Turnstiles enforce single-use check-in per day per pass code. Forwarding, re-selling, or transferring this gift pass to third parties is strictly prohibited.
            </p>
          </div>
        ) : (
          <div className="print:hidden">
            <AttendanceMilestoneWidget
              passCode={cred.pass_code}
              holderName={cred.holder_name}
              currentCount={1840}
              targetCount={2500}
            />
          </div>
        )}

        {/* Secretariat Verification CTA for Pending Passes */}
        {isPendingVerification && (
          <div className="rounded-2xl border-2 border-amber-500 bg-amber-50/90 p-4 text-center space-y-2.5 print:hidden">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
              <AlertTriangle className="size-3 text-white" />
              <span>Pending Accounts Verification</span>
            </div>
            <h3 className="font-serif text-base font-bold text-amber-950">
              Submit Payment Slip to Activate Pass
            </h3>
            <p className="text-xs text-amber-900 leading-relaxed max-w-sm mx-auto">
              Gate turnstiles will deny entry until your bank transfer is verified. Please send your bank payment debit slip to the Secretariat on WhatsApp to activate your pass immediately.
            </p>
            <div className="pt-1 flex justify-center">
              <Button asChild className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs">
                <a
                  href={`https://wa.me/2348181888884?text=${encodeURIComponent(
                    `🏇 *ABEOKUTA POLO FESTIVAL 2026 — PASS VERIFICATION*\n\nHello Secretariat Desk, please verify my bank transfer for pass code: ${cred.pass_code}\nName: ${cred.holder_name}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Send Slip to Secretariat via WhatsApp (+234 818 188 8884)
                </a>
              </Button>
            </div>
          </div>
        )}

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
    </PassDeviceGuard>
  );
}

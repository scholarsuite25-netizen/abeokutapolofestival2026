"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Download,
  Calendar,
  Sparkles,
  Crown,
  FileDown,
  RotateCcw,
  Check,
  KeyRound,
  ExternalLink,
  Share2,
  QrCode,
  Printer,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteOrigin } from "@/lib/site";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  submitRegistration,
  recordAffiliateClick,
  type RegisterResult,
} from "./actions";
import {
  persistRegisteredPass,
  useStoredPasses,
  forceDownloadAllPasses,
  type StoredPass,
} from "@/lib/storage/pass-storage";
import { MobileBindingStation, isMobileBrowser } from "@/components/shared/pass-device-guard";
import { downloadProgrammePDF } from "@/lib/pdf/programme-pdf";
import { downloadFestivalCalendar } from "@/lib/calendar/event-ics";
import { IdAccessCard } from "@/components/shared/id-access-card";
import {
  DAY3_VVIP_OFFICIAL_PRICE_NGN,
  DAY3_VVIP_OFFICIAL_PRICE_DISPLAY,
} from "@/lib/config/checkout-config";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import {
  validateWhatsAppPhone,
  formatWhatsAppUrl,
  buildAttendeePassWhatsAppMessage,
} from "@/lib/utils/phone";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory flex items-center justify-center p-8 text-forest font-serif">Loading registration...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const searchParams = useSearchParams();
  const isVenueScan = searchParams.get("ref") === "venue_poster";
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegisterResult | null>(null);
  const [issuedPasses, setIssuedPasses] = useState<StoredPass[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadTriggered, setDownloadTriggered] = useState(false);
  const [dismissExisting, setDismissExisting] = useState(false);

  // Stored passes from device
  const savedPasses = useStoredPasses();

  // Day Selection States (Registration by ticking the button for each day)
  const [day1, setDay1] = useState(true);
  const [day2, setDay2] = useState(true);
  const [day3, setDay3] = useState(false);
  const day3TicketCount = 1;

  // Simple Form Data (Single registration only)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    affiliationType: "individual" as "individual" | "guest_of" | "corporate",
    hostName: "",
    organization: "",
  });

  // Day 3 Grand Finale admission is issued with a VIP Table package (each
  // table includes a Day-3 VVIP credential for every seat). The only Day 3
  // route left on this page is a complimentary Special VIP Invitation Code —
  // paid Day-3 admission happens on the VIP Tables page.
  const hasInviteCode = true;
  const [invitationCode, setInvitationCode] = useState("");
  const [affiliateCode, setAffiliateCode] = useState<string>("");

  const activeDay3UnitPriceNgn = DAY3_VVIP_OFFICIAL_PRICE_NGN;
  const activeDay3UnitPriceDisplay = DAY3_VVIP_OFFICIAL_PRICE_DISPLAY;

  // Track affiliate referral code from URL search param e.g. /register?ref=AFF-...
  useEffect(() => {
    const refParam = searchParams.get("ref");
    if (refParam && refParam !== "venue_poster") {
      const code = refParam.toUpperCase().trim();
      setAffiliateCode(code);
      recordAffiliateClick(code).catch(() => {});
      try {
        localStorage.setItem("abk_affiliate_ref", code);
      } catch {
        // Non-blocking
      }
    } else {
      try {
        const stored = localStorage.getItem("abk_affiliate_ref");
        if (stored) setAffiliateCode(stored);
      } catch {
        // Non-blocking
      }
    }
  }, [searchParams]);

  // Listen for deep-linked query parameters (e.g. ?day=3 or ?tier=vvip or ?day=1 or ?day=2)
  useEffect(() => {
    const dayParam = searchParams.get("day");
    const tierParam = searchParams.get("tier");
    if (dayParam === "3" || tierParam === "vvip") {
      // Day 3 is strictly VVIP Tables & Individual Option -> resolve to /tables
      window.location.href = "/tables";
    } else if (dayParam === "1") {
      setDay1(true);
      setDay2(false);
      setDay3(false);
    } else if (dayParam === "2") {
      setDay1(false);
      setDay2(true);
      setDay3(false);
    } else if (dayParam === "1,2" || dayParam === "both" || dayParam === "dual") {
      setDay1(true);
      setDay2(true);
      setDay3(false);
    } else if (dayParam === "all") {
      setDay1(true);
      setDay2(true);
      setDay3(true);
    }
  }, [searchParams]);

  const handlePrimaryNameChange = (field: "firstName" | "lastName", val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate that at least one day is ticked
    if (!day1 && !day2 && !day3) {
      setErrorMsg("Please tick at least one festival day to register.");
      return;
    }

    // Strict WhatsApp Phone Number Validation
    const phoneCheck = validateWhatsAppPhone(formData.phone);
    if (!phoneCheck.isValid) {
      setErrorMsg(
        phoneCheck.error ||
          "Please enter a valid WhatsApp phone number (e.g. 0803 123 4567 or +234 803 123 4567).",
      );
      return;
    }

    // Day 3 admission is issued with a VIP Table package. On this page it can
    // only be claimed with a complimentary Special VIP Invitation Code.
    if (day3 && !invitationCode.trim()) {
      setErrorMsg(
        "Please enter your Special VIP Invitation Code. To purchase Day 3 Grand Finale admission, reserve a VIP Table.",
      );
      return;
    }

    // Direct registration (Free Days 1/2 or Day 3 with Special Invitation)
    setLoading(true);
    const res = await submitRegistration({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      day1,
      day2,
      day3,
      day3TicketCount: 1,
      day3InvitationCode: invitationCode.trim() || undefined,
      affiliationType: formData.affiliationType,
      hostName: formData.hostName,
      organization: formData.organization,
      affiliateCode: affiliateCode || undefined,
    });

    setLoading(false);
    if (res.success && res.passes && res.passes.length > 0) {
      setResult(res);
      setIssuedPasses(res.passes);

      if (isMobileBrowser()) {
        // 1. Persist to mobile phone storage (localStorage, sessionStorage, and 365-day cookie)
        persistRegisteredPass(res.passes);

        // 2. Automatically download offline ID Card HTML pass(es) on mobile
        forceDownloadAllPasses(res.passes);
        setDownloadTriggered(true);
      } else {
        // Desktop session: pass remains UNBOUND to laptop browser session
        setDownloadTriggered(false);
      }
    } else {
      setErrorMsg(res.error || "Failed to process registration.");
    }
  };

  return (
    <div className="flex w-full max-w-full flex-col bg-ivory text-ink py-6 sm:py-14 overflow-x-clip min-w-0">
      <div className="mx-auto w-full max-w-5xl px-3 sm:px-6 lg:px-8 min-w-0">
        {/* Header Breadcrumb */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <Badge
            variant="outline"
            className="border-gold/50 bg-gold/10 text-forest font-semibold uppercase tracking-widest text-[11px]"
          >
            Abeokuta Polo Festival 2026 — The Blueprint
          </Badge>
          <h1 className="mt-2.5 font-serif text-2xl font-semibold text-forest sm:text-3xl lg:text-4xl">
            Event Registration &amp; ID Pass
          </h1>
          <p className="mt-1.5 text-xs text-muted-brand sm:text-sm max-w-xl mx-auto">
            Select your attendance days below. All official gate ID cards are instantly issued,
            downloaded to your phone, and saved for contactless turnstile access.
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Link
              href="/register/poster"
              className="inline-flex items-center gap-1.5 rounded-full border border-forest/20 bg-forest/5 px-3 py-1 text-xs font-semibold text-forest hover:bg-forest/10 transition-colors"
            >
              <Printer className="size-3.5 text-gold-deep" />
              <span>Looking for printable entrance signage? Venue QR Poster &amp; Standee →</span>
            </Link>
          </div>
        </div>

        {/* On-site Venue Scan Welcome Notification */}
        {isVenueScan && (
          <div className="mb-6 rounded-2xl border-2 border-emerald-600 bg-emerald-950 p-4 sm:p-5 text-ivory shadow-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gold text-forest shrink-0 font-bold shadow-md">
                <QrCode className="size-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold block">
                  Kobape Grounds · Scanned at Venue Gate
                </span>
                <p className="font-semibold text-sm sm:text-base text-white">
                  Welcome to Abeokuta Polo Club! Complete your registration below.
                </p>
                <p className="text-xs text-emerald-200/90">
                  Your official gate pass will be issued and downloaded to your phone immediately.
                </p>
              </div>
            </div>
            <Link
              href="/register/poster"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gold hover:underline font-semibold shrink-0"
            >
              <Printer className="size-3.5" /> View Poster
            </Link>
          </div>
        )}

        {/* Existing Passes Detected Notification (Device Persistence) */}
        {savedPasses.length > 0 && !result?.success && !dismissExisting && (
          <div className="mb-8 rounded-2xl border-2 border-forest/30 bg-forest p-4 sm:p-5 text-ivory shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 min-w-0 max-w-full">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gold text-forest shrink-0">
                <Crown className="size-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold block">
                  Active ID Pass Found On This Device
                </span>
                <p className="font-semibold text-base text-ivory truncate">
                  Welcome back, {savedPasses[0].holderName}!
                </p>
                <p className="text-xs text-ivory/70 truncate">
                  {savedPasses.length} Active Pass{savedPasses.length > 1 ? "es" : ""}:{" "}
                  {savedPasses.map((p) => p.passCode).join(" · ")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <Button
                size="sm"
                onClick={() => forceDownloadAllPasses(savedPasses)}
                className="bg-gold text-forest font-bold hover:bg-gold/90 text-xs w-full sm:w-auto"
              >
                <Download className="mr-1.5 size-3.5" /> Re-Download Pass{savedPasses.length > 1 ? "es" : ""}
              </Button>
              <Button
                size="sm"
                variant="outline"
                asChild
                className="border-ivory/30 bg-white/10 text-ivory hover:bg-white/20 text-xs w-full sm:w-auto"
              >
                <Link href={`/pass/${savedPasses[0].passCode}`}>
                  <ExternalLink className="mr-1.5 size-3.5" /> View First Pass
                </Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDismissExisting(true)}
                className="text-ivory/60 hover:text-ivory text-xs w-full sm:w-auto"
              >
                Register Another Person
              </Button>
            </div>
          </div>
        )}

        {/* Mandatory Gate Protocol Callout */}
        <div className="mb-6 rounded-2xl border-2 border-gold/70 bg-gradient-to-r from-forest via-forest-deep to-forest p-4 sm:p-5 text-ivory shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-gold text-forest shrink-0 shadow-sm">
              <ShieldCheck className="size-6 text-forest" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-gold text-forest font-black uppercase tracking-wider text-[10px] px-2.5 py-0.5 shadow-xs">
                  Mandatory Gate Protocol
                </Badge>
                <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">
                  Accreditation Rule
                </span>
              </div>
              <p className="text-xs sm:text-sm text-ivory font-medium leading-relaxed">
                <strong>All attendees must be duly registered to attend any of the three festival days.</strong> No turnstile admission is permitted without an official digital access card.
              </p>
            </div>
          </div>
        </div>

        {/* Schedule & Programme CTA */}
        <div className="mb-8 rounded-2xl border border-line bg-card p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-forest shrink-0" />
            <span className="font-serif text-sm font-semibold text-forest">
              Official 3-Day Tournament Protocol (18–20 Dec 2026 · Abeokuta Polo Club)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => downloadProgrammePDF()}
              className="bg-gold font-bold text-forest hover:bg-gold/90 text-xs cursor-pointer"
            >
              <FileDown className="mr-1.5 size-3.5" /> Schedule PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadFestivalCalendar()}
              className="border-line text-forest text-xs cursor-pointer hover:bg-sage/40"
            >
              <Calendar className="mr-1.5 size-3.5 text-gold-deep" /> Calendar
            </Button>
          </div>
        </div>

        {/* ── SUCCESS STATE: ISSUED ID PASSES (PERSISTED ON PAGE) ── */}
        {result?.success && issuedPasses.length > 0 ? (
          <div className="space-y-8 py-4">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <div
                className={`mx-auto flex size-14 items-center justify-center rounded-full ${
                  result.paymentMethod === "bank_transfer"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {result.paymentMethod === "bank_transfer" ? (
                  <AlertTriangle className="size-8" />
                ) : (
                  <CheckCircle2 className="size-8" />
                )}
              </div>
              <Badge
                className={
                  result.paymentMethod === "bank_transfer"
                    ? "bg-amber-600 text-white text-xs"
                    : "bg-emerald-800 text-ivory text-xs"
                }
              >
                {result.paymentMethod === "bank_transfer"
                  ? "⚠️ Pending Bursary Verification"
                  : issuedPasses.length === 1
                  ? "ID Pass Issued & Saved"
                  : `${issuedPasses.length} ID Passes Issued & Saved`}
              </Badge>
              <h2 className="font-serif text-3xl font-semibold text-forest">
                {result.paymentMethod === "bank_transfer"
                  ? "Bank Transfer Claim Registered"
                  : "Your Gate Passes Are Ready!"}
              </h2>
              <p className="text-sm text-muted-brand">
                {result.paymentMethod === "bank_transfer" ? (
                  <>
                    Welcome, <strong className="text-forest">{result.holderName}</strong>. Your bank wire payment claim (Ref: <strong className="font-mono text-amber-900">{result.bankTransferRef}</strong>) has been registered. Passes remain in <strong className="text-amber-900">pending_verification</strong> status until reconciled by Bursary.
                  </>
                ) : (
                  <>
                    Welcome, <strong className="text-forest">{result.holderName}</strong>. Your ID card passes have
                    been generated with full security credentials and downloaded to your device for gate turnstile entry.
                  </>
                )}
              </p>

              {downloadTriggered && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 p-3 text-xs text-emerald-900 flex items-center justify-center gap-2">
                  <Download className="size-4 text-emerald-700 shrink-0" />
                  <span>
                    <strong>Saved to your device:</strong> Your offline ID pass files have been automatically downloaded for contactless turnstile access.
                  </span>
                </div>
              )}

              {/* ── OPTION 1 PRIMARY ACTION: OPEN & SAVE PASS ON WHATSAPP ── */}
              {(() => {
                if (result.paymentMethod === "bank_transfer") {
                  const waReceiptText =
                    `🏇 *ABEOKUTA POLO FESTIVAL 2026 — BANK TRANSFER RECEIPT*\n\n` +
                    `Hello Secretariat Desk, I have completed a direct bank wire transfer to Abeokuta Polo Club (Wema Bank):\n\n` +
                    `• *Reference Code / Narration:* ${result.bankTransferRef}\n` +
                    `• *Buyer Name:* ${result.holderName}\n` +
                    `• *Phone:* ${formData.phone}\n` +
                    `• *Email:* ${formData.email}\n` +
                    `• *Quantity Claimed:* ${issuedPasses.length} Day 3 VVIP Ticket(s)\n` +
                    `• *Amount Transferred:* ₦${((issuedPasses.length || 1) * activeDay3UnitPriceNgn).toLocaleString()}\n\n` +
                    `📎 *Attached:* My bank debit payment advice/slip. Please verify and release my Day 3 VVIP passes.\n\n` +
                    `_Abeokuta Polo Club Secretariat_`;
                  const waReceiptUrl = formatWhatsAppUrl("2348181888884", waReceiptText);

                  return (
                    <div className="rounded-2xl border-2 border-amber-500 bg-amber-50/80 p-5 shadow-sm text-center space-y-3">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 text-white px-3 py-1 text-[11px] font-bold tracking-wide uppercase shadow-xs">
                        <AlertTriangle className="size-3.5 text-white" />
                        <span>Action Required · Submit Transfer Receipt</span>
                      </div>

                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-amber-950">
                        Verify Your Wema Bank Transfer
                      </h3>

                      <p className="text-xs sm:text-sm text-amber-900 max-w-md mx-auto leading-relaxed">
                        In accordance with Anti-Fraud protocol, passes strictly remain in <strong className="font-mono">pending_verification</strong> status and turnstiles will deny gate admission until confirmed by the Secretariat. Send your debit payment slip via WhatsApp to activate your credentials immediately.
                      </p>

                      <div className="pt-1 flex justify-center">
                        <Button
                          asChild
                          size="lg"
                          className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer w-full sm:w-auto"
                        >
                          <a href={waReceiptUrl} target="_blank" rel="noopener noreferrer">
                            <WhatsAppIcon className="mr-2 size-5" />
                            Send Receipt to Secretariat via WhatsApp
                          </a>
                        </Button>
                      </div>

                      <div className="text-[11px] text-amber-800 flex items-center justify-center gap-1.5 pt-1">
                        <Mail className="size-3 text-amber-700" />
                        <span>
                          Debit instructions and reconciliation link dispatched to{" "}
                          <strong>{formData.email}</strong>
                        </span>
                      </div>
                    </div>
                  );
                }

                const appOrigin =
                  typeof window !== "undefined"
                    ? window.location.origin
                    : getSiteOrigin();
                const primaryPass = issuedPasses[0];
                const primaryPassUrl = primaryPass
                  ? `${appOrigin}/pass/${primaryPass.passCode}`
                  : appOrigin;
                const whatsappSaveMessage = primaryPass
                  ? buildAttendeePassWhatsAppMessage({
                      holderName:
                        result.holderName || `${formData.firstName} ${formData.lastName}`.trim(),
                      phone: formData.phone,
                      passCode: primaryPass.passCode,
                      category: primaryPass.category,
                      passUrl: primaryPassUrl,
                      isMultiple: issuedPasses.length > 1,
                      totalPasses: issuedPasses.length,
                    })
                  : "";
                const whatsappSaveUrl = formatWhatsAppUrl(formData.phone, whatsappSaveMessage);

                return (
                  <div className="space-y-4">
                    {/* Desktop Mobile Binding Station (Scan to bind to your mobile phone) */}
                    <MobileBindingStation
                      passCode={primaryPass ? primaryPass.passCode : ""}
                      holderName={
                        result.holderName || `${formData.firstName} ${formData.lastName}`.trim()
                      }
                      phone={formData.phone}
                      email={formData.email}
                      category={primaryPass ? primaryPass.category : "Festival Pass"}
                    />
                  </div>
                );
              })()}
            </div>

            {/* Guest Forwarding Management Station (When multiple tickets are issued) */}
            {issuedPasses.some((p) => p.isSponsored || (p.totalTickets && p.totalTickets > 1)) && (
              <div className="rounded-2xl border-2 border-amber-400/80 bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-amber-500/10 p-5 text-forest shadow-sm max-w-3xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Share2 className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-bold text-amber-950">
                        Guest Forwarding &amp; Anti-Leakage Guard
                      </h3>
                      <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                        Ticket 1 is in your name (<strong>{result.holderName}</strong>).
                        Subsequent passes are distinct, HMAC-256 sealed guest tickets.
                        You can forward each guest pass to your invitees using the <strong>WhatsApp to Guest</strong> or <strong>Copy Guest Link</strong> buttons below.
                      </p>
                      <p className="text-[11px] text-amber-800 font-semibold mt-1 flex items-center gap-1">
                        <ShieldCheck className="size-3.5 text-amber-700 shrink-0" />
                        <strong>Device-Locking Security:</strong> When your guest opens their ticket, it binds permanently to their phone. Recipient forwarding is disabled so it cannot be transferred to a third party.
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-amber-600 bg-white/80 text-amber-900 text-[10px] font-bold shrink-0 uppercase">
                    {issuedPasses.length} Total Passes
                  </Badge>
                </div>
              </div>
            )}

            {/* Issued Passes Grid: 1 or multiple ID Cards */}
            <div
              className={`grid gap-6 justify-center ${
                issuedPasses.length > 1
                  ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto"
                  : "grid-cols-1 max-w-sm mx-auto"
              }`}
            >
              {issuedPasses.map((pass) => (
                <div key={pass.passCode} className="flex justify-center">
                  <IdAccessCard pass={pass} isBuyer={true} />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-3">
              {(() => {
                const appOrigin =
                  typeof window !== "undefined"
                    ? window.location.origin
                    : getSiteOrigin();
                const primaryPass = issuedPasses[0];
                const primaryPassUrl = primaryPass
                  ? `${appOrigin}/pass/${primaryPass.passCode}`
                  : appOrigin;
                const whatsappSaveMessage = primaryPass
                  ? buildAttendeePassWhatsAppMessage({
                      holderName:
                        result.holderName || `${formData.firstName} ${formData.lastName}`.trim(),
                      phone: formData.phone,
                      passCode: primaryPass.passCode,
                      category: primaryPass.category,
                      passUrl: primaryPassUrl,
                      isMultiple: issuedPasses.length > 1,
                      totalPasses: issuedPasses.length,
                    })
                  : "";
                const whatsappSaveUrl = formatWhatsAppUrl(formData.phone, whatsappSaveMessage);

                return (
                  <Button
                    asChild
                    className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs px-5 py-2.5 shadow-sm cursor-pointer"
                  >
                    <a href={whatsappSaveUrl} target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon className="mr-1.5 size-4" /> Save Pass on WhatsApp
                    </a>
                  </Button>
                );
              })()}
              <Button
                onClick={() => forceDownloadAllPasses(issuedPasses)}
                variant="outline"
                className="border-line text-forest font-semibold text-xs px-5 py-2.5 hover:bg-sage/40"
              >
                <Download className="mr-2 size-4 text-forest" /> Re-Download All Cards
              </Button>
              <Button
                onClick={() => {
                  setResult(null);
                  setIssuedPasses([]);
                  setDownloadTriggered(false);
                }}
                variant="outline"
                className="border-line text-forest text-xs hover:bg-sage/40"
              >
                <RotateCcw className="mr-1.5 size-4" /> Register Another Person
              </Button>
            </div>
          </div>
        ) : (
          /* ── REGISTRATION FORM (SIMPLIFIED & STREAMLINED) ── */
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start min-w-0 max-w-full">
            <div className="rounded-2xl border border-line bg-card p-4 sm:p-8 lg:col-span-7 max-w-full min-w-0 overflow-hidden shadow-sm">
              {errorMsg && (
                <div className="mb-5 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Attendee Details */}
                <div>
                  <h2 className="font-serif text-xl font-semibold text-forest border-b border-line pb-2.5">
                    1. Attendee Information
                  </h2>
                  <p className="text-xs text-muted-brand mt-1 mb-4">
                    Single registration only. Each person receives individual gate ID credentials.
                  </p>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-xs font-semibold text-forest">
                        First Name *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 size-4 text-muted-brand" />
                        <Input
                          id="firstName"
                          required
                          placeholder="e.g. Adebayo"
                          className="pl-9 bg-ivory"
                          value={formData.firstName}
                          onChange={(e) => handlePrimaryNameChange("firstName", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-xs font-semibold text-forest">
                        Last Name *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 size-4 text-muted-brand" />
                        <Input
                          id="lastName"
                          required
                          placeholder="e.g. Adeleke"
                          className="pl-9 bg-ivory"
                          value={formData.lastName}
                          onChange={(e) => handlePrimaryNameChange("lastName", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold text-forest">
                        Email Address *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 size-4 text-muted-brand" />
                        <Input
                          id="email"
                          type="email"
                          required
                          placeholder="name@example.com"
                          className="pl-9 bg-ivory"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="phone" className="text-xs font-semibold text-forest flex items-center gap-1.5">
                          <WhatsAppIcon className="size-4 text-[#25D366]" />
                          <span>WhatsApp Phone Number *</span>
                        </Label>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          Option 1 Primary Channel
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-[#25D366] pointer-events-none">
                          <WhatsAppIcon className="size-4" />
                        </span>
                        <Input
                          id="phone"
                          type="tel"
                          required
                          placeholder="e.g. 0803 123 4567 or +234 803 123 4567"
                          className="pl-9 bg-ivory border-emerald-800/30 focus-visible:ring-emerald-600"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <p className="text-[11px] text-emerald-900/90 font-medium flex items-center gap-1 pt-0.5">
                        <span className="inline-block size-1.5 rounded-full bg-emerald-600 shrink-0" />
                        Required: Active WhatsApp number for instant gate pass delivery &amp; morning tournament dispatches.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Three-Day Event Tick Selection */}
                <div className="pt-2">
                  <div className="flex items-center justify-between border-b border-line pb-2.5">
                    <h2 className="font-serif text-xl font-semibold text-forest">
                      2. Choose Your Event Days
                    </h2>
                    <span className="text-[11px] text-muted-brand">
                      Tick all days you plan to attend
                    </span>
                  </div>

                  <div className="mt-2 mb-4 rounded-xl border border-gold/50 bg-forest/5 p-3 flex items-start gap-2.5">
                    <ShieldCheck className="size-4 text-forest shrink-0 mt-0.5" />
                    <p className="text-[11px] text-forest leading-snug">
                      <strong className="text-forest font-bold uppercase tracking-wider">Gate Protocol:</strong> All attendees must be duly registered to attend any of the three festival days. Turnstiles enforce cryptographic authentication.
                    </p>
                  </div>

                  {/* ── PART A: COMPLIMENTARY ADMISSION (DAYS 1 & 2 — 100% FREE) ── */}
                  <div className="rounded-2xl border-2 border-emerald-600/30 bg-emerald-50/40 p-4 sm:p-5 space-y-3.5 mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-2.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Badge className="bg-emerald-700 text-ivory text-[10px] font-bold uppercase tracking-wider">
                            100% Free Entry
                          </Badge>
                          <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider">
                            Part 1: Complimentary Days
                          </span>
                        </div>
                        <h3 className="font-serif text-base font-bold text-forest mt-0.5">
                          Friday 18 &amp; Saturday 19 December 2026
                        </h3>
                      </div>

                      {/* 1-Click Dual Pass Button */}
                      <Button
                        type="button"
                        onClick={() => {
                          if (day1 && day2) {
                            setDay1(false);
                            setDay2(false);
                          } else {
                            setDay1(true);
                            setDay2(true);
                          }
                        }}
                        size="sm"
                        className={`font-bold text-xs cursor-pointer shadow-xs transition-all w-full sm:w-auto whitespace-normal h-auto py-1.5 px-3 text-center ${
                          day1 && day2
                            ? "bg-emerald-700 hover:bg-emerald-800 text-ivory"
                            : "bg-forest hover:bg-forest-interactive text-ivory"
                        }`}
                      >
                        {day1 && day2 ? (
                          <span className="inline-flex items-center justify-center gap-1.5">
                            <Check className="size-3.5 stroke-[3] shrink-0" />
                            <span className="sm:hidden">Combined Day 1 &amp; 2 Pass</span>
                            <span className="hidden sm:inline">1 Combined Day 1 &amp; Day 2 Pass Selected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-1.5">
                            <Sparkles className="size-3.5 text-gold shrink-0" />
                            <span className="sm:hidden">Select Both Days</span>
                            <span className="hidden sm:inline">Select Both Days (1 Combined Pass)</span>
                          </span>
                        )}
                      </Button>
                    </div>

                    <p className="text-xs text-muted-brand">
                      Attendees attending <strong>Day 1 only</strong> or <strong>Day 2 only</strong> receive a gate pass for that specified day. Anyone choosing to attend <strong>Day 1 and Day 2 together</strong> receives <strong>one combined pass</strong> covering both days. Day 3 is separate.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Day 1 Button */}
                      <button
                        type="button"
                        onClick={() => setDay1(!day1)}
                        className={`w-full text-left cursor-pointer rounded-xl border-2 p-3.5 transition-all duration-200 flex items-start gap-3 ${
                          day1
                            ? "border-forest bg-card shadow-xs"
                            : "border-line bg-card/60 hover:border-forest/40 opacity-80"
                        }`}
                      >
                        <div
                          className={`size-5 rounded-md flex items-center justify-center shrink-0 border mt-0.5 transition-colors ${
                            day1 ? "bg-forest border-forest text-ivory" : "border-line bg-ivory"
                          }`}
                        >
                          {day1 && <Check className="size-3.5 stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs sm:text-sm text-forest truncate">
                              Day 1: Fri 18 Dec
                            </span>
                            <Badge className="bg-emerald-700 text-ivory text-[9px] font-bold px-1.5 py-0">
                              FREE
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-brand mt-0.5 line-clamp-2">
                            Media Tour, Light-Up Ceremony &amp; Welcome Dinner.
                          </p>
                        </div>
                      </button>

                      {/* Day 2 Button */}
                      <button
                        type="button"
                        onClick={() => setDay2(!day2)}
                        className={`w-full text-left cursor-pointer rounded-xl border-2 p-3.5 transition-all duration-200 flex items-start gap-3 ${
                          day2
                            ? "border-forest bg-card shadow-xs"
                            : "border-line bg-card/60 hover:border-forest/40 opacity-80"
                        }`}
                      >
                        <div
                          className={`size-5 rounded-md flex items-center justify-center shrink-0 border mt-0.5 transition-colors ${
                            day2 ? "bg-forest border-forest text-ivory" : "border-line bg-ivory"
                          }`}
                        >
                          {day2 && <Check className="size-3.5 stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs sm:text-sm text-forest truncate">
                              Day 2: Sat 19 Dec
                            </span>
                            <Badge className="bg-emerald-700 text-ivory text-[9px] font-bold px-1.5 py-0">
                              FREE
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-brand mt-0.5 line-clamp-2">
                            HRM Royal Opening, Queens Polo, Sip &amp; Paint.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* ── PART B: SEPARATE REGISTRATION — DAY 3 VVIP GRAND FINALE (PAID ₦50,000 OR SPECIAL INVITE) ── */}
                  <div id="day3-section" className="rounded-2xl border-2 border-amber-500/70 bg-gradient-to-br from-amber-500/10 via-amber-400/10 to-amber-500/5 p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-300/70 pb-2.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Badge className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[10px] font-bold uppercase tracking-wider">
                            Separate Day 3 Pass
                          </Badge>
                          <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                            Following Day 1 &amp; Day 2
                          </span>
                        </div>
                        <h3 className="font-serif text-base font-bold text-amber-950 mt-0.5 flex items-center gap-1.5">
                          <Crown className="size-4 text-amber-600" />
                          Day 3: Sunday 20 Dec 2026 (Royal Cup Grand Finale)
                        </h3>
                      </div>

                      <Badge variant="outline" className="border-amber-600 bg-white/90 text-amber-900 text-[10px] font-bold self-start sm:self-auto">
                        {activeDay3UnitPriceDisplay} / Ticket or VIP Table
                      </Badge>
                    </div>

                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      <strong>Important Notice:</strong> Day 3 takes place after Day 1 (Fri 18 Dec) and Day 2 (Sat 19 Dec). Admission to Day 3 is completely separate and requires its own dedicated gate pass. Attendees receive their access pass according to the Day 3 option selected below (Individual VIP Table Seat or Dedicated VIP Table Enclosure).
                    </p>

                    {/* Day 3 Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setDay3(!day3)}
                      className={`w-full text-left cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 flex items-start gap-3.5 ${
                        day3
                          ? "border-amber-600 bg-white shadow-sm"
                          : "border-line bg-white/60 hover:border-amber-500/50"
                      }`}
                    >
                      <div
                        className={`size-6 rounded-md flex items-center justify-center shrink-0 border mt-0.5 transition-colors ${
                          day3 ? "bg-amber-600 border-amber-600 text-white" : "border-line bg-ivory"
                        }`}
                      >
                        {day3 && <Check className="size-4 stroke-[3]" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-amber-950">
                            Register for Day 3 Grand Finale
                          </span>
                          <span className="text-xs font-bold text-amber-700">
                            {day3 ? "✓ Selected" : "Click to Add"}
                          </span>
                        </div>
                        <p className="text-xs text-amber-900 mt-0.5">
                          Royal Cup Grand Final, 100 Kings Celebration, Aristos Band &amp; Berryola Concert. Distinct Deep Gold ID Card.
                        </p>
                      </div>
                    </button>

                    {/* Dynamic Day 3 Payment / Special Invitation Options */}
                    {day3 && (
                      <div className="rounded-xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-50/90 to-amber-100/60 p-4 space-y-4 text-xs text-amber-950 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-amber-900">
                            <Crown className="size-4 text-amber-600" />
                            <span>VVIP Access Verification Tier</span>
                          </div>
                          <Badge variant="outline" className="border-amber-500 text-amber-800 text-[10px] bg-white">
                            Distinct Deep Gold Pass
                          </Badge>
                        </div>

                        {/* Day 3 admission is issued with a VIP Table package */}
                        <div className="rounded-xl border border-gold/40 bg-gradient-to-r from-[#1B1608] via-[#2A2007] to-[#1B1608] p-3.5 text-ivory space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="font-display font-bold text-xs text-gold">
                              Day 3 Grand Finale Admission
                            </span>
                            <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-extrabold text-gold border border-gold/40">
                              Included with a VIP Table
                            </span>
                          </div>
                          <p className="text-[10px] text-ivory/80 leading-tight">
                            The Grand Finale (20 Dec 2026) is a table-only event. Every Day 3 VVIP
                            credential is issued as part of a VIP Table package — each table includes
                            a sealed Day 3 pass for every seat.
                          </p>
                          <div className="pt-1.5 border-t border-gold/20 flex flex-wrap items-center justify-between gap-1">
                            <span className="text-[10px] text-gold/90 font-medium">
                              Kings ₦5,000,000 · Royal ₦3,000,000 · Queens ₦2,000,000 · Premium ₦500,000 · Regular Section seat ₦50,000
                            </span>
                            <Link href="/tables" className="text-[10px] font-bold text-gold underline hover:text-white flex items-center gap-1">
                              Reserve a VIP Table <ArrowRight className="size-2.5" />
                            </Link>
                          </div>
                        </div>

                        {affiliateCode && (
                          <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-2.5 flex items-center justify-between text-xs text-emerald-900">
                            <span className="font-semibold flex items-center gap-1.5">
                              <Sparkles className="size-3.5 text-emerald-600" />
                              Partner Referral: <strong className="font-mono">{affiliateCode}</strong>
                            </span>
                            <Badge className="bg-emerald-600 text-white text-[9px] uppercase font-bold">
                              10% Commission Active
                            </Badge>
                          </div>
                        )}

                        {hasInviteCode && (
                          <div className="space-y-1.5 pt-2 border-t border-amber-300/60">
                            <Label htmlFor="inviteCode" className="text-xs font-bold text-amber-950">
                              Enter Special VIP Invitation Code *
                            </Label>
                            <Input
                              id="inviteCode"
                              placeholder="Enter the code from your invitation"
                              autoComplete="off"
                              className="bg-white border-amber-300 uppercase font-mono tracking-wider text-xs"
                              value={invitationCode}
                              onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                            />
                            <p className="text-[10px] text-amber-800">
                              Your code is printed on your official invitation. Verified single-use code admits one VIP guest.
                            </p>
                          </div>
                        )}

                        {/* Optional Affiliate / Referral Code Input */}
                        <div className="rounded-xl border border-amber-300/80 bg-white/95 p-3 space-y-1.5">
                          <Label htmlFor="regAffiliateCode" className="text-xs font-bold text-amber-950 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="size-3 text-amber-600" />
                              Affiliate Partner / Referral Code (Optional)
                            </span>
                            <span className="text-[10px] text-amber-800 font-normal">Earn 10% on confirmed tickets</span>
                          </Label>
                          <Input
                            id="regAffiliateCode"
                            value={affiliateCode}
                            onChange={(e) => setAffiliateCode(e.target.value.toUpperCase().trim())}
                            placeholder="e.g. AFF-POLO-8472"
                            className="font-mono text-xs h-8 border-amber-300 bg-white uppercase placeholder:text-muted-brand/60"
                          />
                          <p className="text-[10px] text-amber-800">
                            If you were referred by an authorized partner or ticketing promoter, enter their code here.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit CTA */}
                <div className="pt-4 border-t border-line">
                  <Button
                    type="submit"
                    disabled={loading || (day3 && !invitationCode.trim())}
                    className={`w-full font-semibold py-3.5 sm:py-5 px-3 text-sm sm:text-base cursor-pointer shadow-md transition-all whitespace-normal h-auto leading-tight text-center ${
                      day3
                        ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:opacity-95"
                        : "bg-forest text-ivory hover:bg-forest-interactive"
                    }`}
                  >
                    {loading ? (
                      "Processing Pass Issuance..."
                    ) : day3 ? (
                      <span className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                        <KeyRound className="size-4 sm:size-5 shrink-0" />
                        <span>Redeem Special VIP Invitation Code</span>
                      </span>
                    ) : (
                      "Complete Registration & Get ID Pass →"
                    )}
                  </Button>
                  <p className="text-center text-[11px] text-muted-brand mt-2">
                    ID cards are immediately downloaded to your phone and saved on this page.
                  </p>
                </div>
              </form>
            </div>

            {/* Side Live Card Preview */}
            <div className="space-y-6 lg:col-span-5 max-w-full min-w-0">
              <div className="rounded-2xl border border-line bg-card p-4 sm:p-6 shadow-sm min-w-0 max-w-full overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold block mb-1.5">
                  Live Pass Issuance Rule
                </span>
                <h3 className="font-serif text-lg font-semibold text-forest mb-3">
                  Passes To Be Generated
                </h3>

                <div className="space-y-3 text-xs">
                  {/* Status Indicator of what will be generated */}
                  {day1 && day2 && !day3 && (
                    <div className="rounded-xl border border-emerald-400 bg-emerald-50/60 p-3.5 text-emerald-950 space-y-1">
                      <span className="font-bold block text-sm">✓ 1 Combined ID Pass</span>
                      <p className="text-[11px] text-emerald-800">
                        Day 1 &amp; Day 2 are combined onto a <strong>single pass</strong> covering both Friday 18 and Saturday 19 Dec (100% Free).
                      </p>
                    </div>
                  )}

                  {day1 && !day2 && !day3 && (
                    <div className="rounded-xl border border-emerald-400 bg-emerald-50/60 p-3.5 text-emerald-950 space-y-1">
                      <span className="font-bold block text-sm">✓ 1 ID Pass (Day 1 Alone)</span>
                      <p className="text-[11px] text-emerald-800">
                        Valid for Friday 18 Dec (100% Free Public Admission).
                      </p>
                    </div>
                  )}

                  {!day1 && day2 && !day3 && (
                    <div className="rounded-xl border border-emerald-400 bg-emerald-50/60 p-3.5 text-emerald-950 space-y-1">
                      <span className="font-bold block text-sm">✓ 1 ID Pass (Day 2 Alone)</span>
                      <p className="text-[11px] text-emerald-800">
                        Valid for Saturday 19 Dec (100% Free Admission).
                      </p>
                    </div>
                  )}

                  {!day1 && !day2 && day3 && (
                    <div className="rounded-xl border-2 border-amber-500 bg-amber-50 p-3.5 text-amber-950 space-y-1">
                      <span className="font-bold block text-sm text-amber-900 flex items-center gap-1.5">
                        <Crown className="size-4 text-amber-600" />{" "}
                        {day3TicketCount > 1 && !hasInviteCode
                          ? `${day3TicketCount} Distinct Deep Gold VVIP Passes`
                          : "1 Distinct Deep Gold VVIP Pass (Day 3 Alone)"}
                      </span>
                      <p className="text-[11px] text-amber-800">
                        {day3TicketCount > 1 && !hasInviteCode
                          ? `1 Primary Pass for yourself plus ${day3TicketCount - 1} serialized guest passes. You can forward guest tickets once via WhatsApp or link.`
                          : "Issued separately with classic gold styling upon Paystack payment or Special VIP Invitation."}
                      </p>
                    </div>
                  )}

                  {(day1 || day2) && day3 && (
                    <div className="rounded-xl border-2 border-gold/70 bg-gold/10 p-3.5 text-forest space-y-2">
                      <span className="font-bold block text-sm text-forest flex items-center gap-1.5">
                        <Sparkles className="size-4 text-gold-deep" />{" "}
                        {day3TicketCount > 1 && !hasInviteCode
                          ? `${1 + day3TicketCount} Distinct ID Passes Will Be Issued:`
                          : "2 Distinct ID Passes Will Be Issued:"}
                      </span>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] text-muted-brand">
                        <li>
                          <strong>Card 1:</strong> {day1 && day2 ? "Day 1 & 2 Combined Pass (Free)" : day1 ? "Day 1 Free Pass" : "Day 2 Free Pass"} (Forest Green / Ivory standard card).
                        </li>
                        <li>
                          <strong>{day3TicketCount > 1 && !hasInviteCode ? `Cards 2 to ${1 + day3TicketCount}:` : "Card 2:"}</strong> Day 3 VVIP Grand Finale {day3TicketCount > 1 && !hasInviteCode ? `(${day3TicketCount} passes: 1 personal + ${day3TicketCount - 1} guest passes)` : "Pass"} (Distinct classic Deep Gold luxury card).
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Live Card Preview Box */}
                <div className="mt-5 pt-4 border-t border-line">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-brand block mb-2">
                    Card Preview Format (ID Card Size)
                  </span>

                  <IdAccessCard
                    pass={{
                      passCode: day3
                        ? "ABK-2026-VVIP-PREVIEW"
                        : day1 && day2
                        ? "ABK-2026-D12-PREVIEW"
                        : day2
                        ? "ABK-2026-D2-PREVIEW"
                        : "ABK-2026-D1-PREVIEW",
                      holderName:
                        formData.firstName || formData.lastName
                          ? `${formData.firstName} ${formData.lastName}`.trim()
                          : "Your Full Name",
                      category: day3
                        ? "Day 3 VVIP Grand Finale Pass"
                        : day1 && day2
                        ? "Day 1 & Day 2 Dual Pass"
                        : day2
                        ? "Day 2 Free Gate Pass"
                        : "Day 1 Free Gate Pass",
                      affiliationType: formData.affiliationType,
                      registeredAt: new Date().toISOString(),
                      daysCovered: day3 ? [3] : day1 && day2 ? [1, 2] : day2 ? [2] : [1],
                      isVvip: day3,
                      designTheme: day3 ? "gold" : "standard",
                    }}
                    showActions={false}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

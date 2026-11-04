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
  CreditCard,
  KeyRound,
  ExternalLink,
  Share2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { submitRegistration, type RegisterResult } from "./actions";
import {
  persistRegisteredPass,
  useStoredPasses,
  forceDownloadAllPasses,
  type StoredPass,
} from "@/lib/storage/pass-storage";
import { downloadProgrammePDF } from "@/lib/pdf/programme-pdf";
import { downloadFestivalCalendar } from "@/lib/calendar/event-ics";
import { IdAccessCard } from "@/components/shared/id-access-card";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory flex items-center justify-center p-8 text-forest font-serif">Loading registration...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const searchParams = useSearchParams();
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

  // Day 3 VVIP Options: Special Invite or Paystack Payment
  const [hasInviteCode, setHasInviteCode] = useState(false);
  const [invitationCode, setInvitationCode] = useState("");

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

  // Handle return from Paystack redirect
  useEffect(() => {
    const paymentRef = searchParams.get("payment_ref") || searchParams.get("reference");
    const isPaid = searchParams.get("paid") === "true" || searchParams.get("status") === "success";

    if (paymentRef && isPaid && !result?.success) {
      const fn = searchParams.get("fn") || "";
      const ln = searchParams.get("ln") || "";
      const em = searchParams.get("em") || "";
      const ph = searchParams.get("ph") || "";
      const d1 = searchParams.get("day1") === "1";
      const d2 = searchParams.get("day2") === "1";
      const d3 = true;

      void Promise.resolve().then(async () => {
        setLoading(true);
        const res = await submitRegistration({
          firstName: fn || "VVIP",
          lastName: ln || "Guest",
          email: em || "guest@abeokutapolofestival.com",
          phone: ph || "+2348000000000",
          day1: d1,
          day2: d2,
          day3: d3,
          day3PaymentRef: paymentRef,
        });

        setLoading(false);
        if (res.success && res.passes && res.passes.length > 0) {
          setResult(res);
          setIssuedPasses(res.passes);
          persistRegisteredPass(res.passes);
          forceDownloadAllPasses(res.passes);
          setDownloadTriggered(true);
        }
      });
    }
  }, [searchParams, result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate that at least one day is ticked
    if (!day1 && !day2 && !day3) {
      setErrorMsg("Please tick at least one festival day to register.");
      return;
    }

    // If Day 3 is ticked without an invitation code, redirect directly to Paystack payment gateway
    if (day3 && (!hasInviteCode || !invitationCode.trim())) {
      setLoading(true);
      try {
        const response = await fetch("/api/paystack/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            day1,
            day2,
            day3: true,
          }),
        });

        const data = await response.json();
        if (data.authorization_url) {
          // Redirect to Paystack gateway
          window.location.href = data.authorization_url;
          return;
        } else {
          setErrorMsg(data.error || "Could not connect to Paystack gateway.");
          setLoading(false);
          return;
        }
      } catch {
        setErrorMsg("Network error connecting to payment gateway.");
        setLoading(false);
        return;
      }
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
      day3InvitationCode: hasInviteCode ? invitationCode.trim() : undefined,
      affiliationType: formData.affiliationType,
      hostName: formData.hostName,
      organization: formData.organization,
    });

    setLoading(false);
    if (res.success && res.passes && res.passes.length > 0) {
      setResult(res);
      setIssuedPasses(res.passes);

      // 1. Persist to phone storage (localStorage, sessionStorage, and 365-day cookie)
      persistRegisteredPass(res.passes);

      // 2. Automatically download offline ID Card HTML pass(es)
      forceDownloadAllPasses(res.passes);
      setDownloadTriggered(true);
    } else {
      setErrorMsg(res.error || "Failed to process registration.");
    }
  };

  return (
    <div className="flex w-full flex-col bg-ivory text-ink py-8 sm:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <Badge
            variant="outline"
            className="border-gold/50 bg-gold/10 text-forest font-semibold uppercase tracking-widest text-[11px]"
          >
            Abeokuta Polo Festival 2026 — The Blueprint
          </Badge>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-forest sm:text-5xl">
            Event Registration &amp; ID Pass
          </h1>
          <p className="mt-2 text-sm text-muted-brand sm:text-base">
            Select your attendance days below. All official gate ID cards are instantly issued,
            downloaded to your phone, and saved for contactless turnstile access.
          </p>
        </div>

        {/* Existing Passes Detected Notification (Device Persistence) */}
        {savedPasses.length > 0 && !result?.success && !dismissExisting && (
          <div className="mb-8 rounded-2xl border-2 border-forest/30 bg-forest p-5 text-ivory shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gold text-forest shrink-0">
                <Crown className="size-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold block">
                  Active ID Pass Found On This Device
                </span>
                <p className="font-semibold text-base text-ivory">
                  Welcome back, {savedPasses[0].holderName}!
                </p>
                <p className="text-xs text-ivory/70">
                  {savedPasses.length} Active Pass{savedPasses.length > 1 ? "es" : ""}:{" "}
                  {savedPasses.map((p) => p.passCode).join(" · ")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <Button
                size="sm"
                onClick={() => forceDownloadAllPasses(savedPasses)}
                className="bg-gold text-forest font-bold hover:bg-gold/90 text-xs"
              >
                <Download className="mr-1.5 size-3.5" /> Re-Download Pass{savedPasses.length > 1 ? "es" : ""}
              </Button>
              <Button
                size="sm"
                variant="outline"
                asChild
                className="border-ivory/30 bg-white/10 text-ivory hover:bg-white/20 text-xs"
              >
                <Link href={`/pass/${savedPasses[0].passCode}`}>
                  <ExternalLink className="mr-1.5 size-3.5" /> View First Pass
                </Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDismissExisting(true)}
                className="text-ivory/60 hover:text-ivory text-xs"
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
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="size-8" />
              </div>
              <Badge className="bg-emerald-800 text-ivory text-xs">
                {issuedPasses.length === 1 ? "ID Pass Issued & Saved" : `${issuedPasses.length} ID Passes Issued & Saved`}
              </Badge>
              <h2 className="font-serif text-3xl font-semibold text-forest">
                Your Gate Passes Are Ready!
              </h2>
              <p className="text-sm text-muted-brand">
                Welcome, <strong className="text-forest">{result.holderName}</strong>. Your ID card passes have
                been generated with full security credentials and downloaded to your device for gate turnstile entry.
              </p>

              {downloadTriggered && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 p-3 text-xs text-emerald-900 flex items-center justify-center gap-2">
                  <Download className="size-4 text-emerald-700 shrink-0" />
                  <span>
                    <strong>Saved to your device:</strong> Your offline ID pass files have been automatically downloaded for contactless turnstile access.
                  </span>
                </div>
              )}
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
                        Guest Forwarding &amp; Serialized Passes
                      </h3>
                      <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                        Ticket 1 is in your name (<strong>{result.holderName}</strong>).
                        Subsequent tickets are serialized as <strong>&ldquo;Sponsored Invitation by {result.holderName}&rdquo;</strong>.
                        Use the 1-click <strong>WhatsApp</strong> or <strong>Copy Ticket Link</strong> buttons below each pass to forward them directly to your invited guests. Each pass link directs to <code>/pass/[code]</code> so your guest can open and save their own card.
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-amber-600 bg-white/80 text-amber-900 text-[10px] font-bold shrink-0 uppercase">
                    1-Click Forwarding Ready
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
                  <IdAccessCard pass={pass} />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-3">
              <Button
                onClick={() => forceDownloadAllPasses(issuedPasses)}
                className="bg-forest text-ivory hover:bg-forest-interactive font-semibold text-xs px-5 py-2.5 shadow-sm"
              >
                <Download className="mr-2 size-4" /> Re-Download All Cards
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
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
            <div className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8 lg:col-span-7">
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
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                      <Label htmlFor="phone" className="text-xs font-semibold text-forest">
                        Mobile Phone Number *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 size-4 text-muted-brand" />
                        <Input
                          id="phone"
                          type="tel"
                          required
                          placeholder="+234 800 000 0000"
                          className="pl-9 bg-ivory"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
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

                  <div className="mt-2 mb-3.5 rounded-xl border border-gold/50 bg-forest/5 p-3 flex items-start gap-2.5">
                    <ShieldCheck className="size-4 text-forest shrink-0 mt-0.5" />
                    <p className="text-[11px] text-forest leading-snug">
                      <strong className="text-forest font-bold uppercase tracking-wider">Gate Protocol:</strong> All attendees must be duly registered to attend any of the three festival days. No turnstile admission is permitted without an official digital access card.
                    </p>
                  </div>

                  <p className="text-xs text-muted-brand mt-1.5 mb-3.5">
                    <strong>Rule:</strong> Days 1 and 2 are 100% Free Entry. Ticking both gives you a single
                    combined 2-day pass. Day 3 is paid VVIP admission (₦50,000) or by Special Invitation, issued as a separate distinct deep-gold ID pass.
                  </p>

                  <div className="space-y-3">
                    {/* Day 1 Button */}
                    <div
                      onClick={() => setDay1(!day1)}
                      className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 flex items-start gap-3.5 ${
                        day1
                          ? "border-forest bg-forest/5 shadow-xs"
                          : "border-line bg-card hover:border-forest/40"
                      }`}
                    >
                      <div
                        className={`size-6 rounded-md flex items-center justify-center shrink-0 border mt-0.5 transition-colors ${
                          day1 ? "bg-forest border-forest text-ivory" : "border-line bg-ivory"
                        }`}
                      >
                        {day1 && <Check className="size-4 stroke-[3]" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-forest">
                            Day 1: Friday 18 Dec 2026
                          </span>
                          <Badge className="bg-emerald-700 text-ivory text-[10px] font-bold">
                            100% FREE ENTRY
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-brand mt-0.5">
                          Media Tour, Festival Light-Up Ceremony &amp; Welcome Dinner.
                        </p>
                      </div>
                    </div>

                    {/* Day 2 Button */}
                    <div
                      onClick={() => setDay2(!day2)}
                      className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 flex items-start gap-3.5 ${
                        day2
                          ? "border-forest bg-forest/5 shadow-xs"
                          : "border-line bg-card hover:border-forest/40"
                      }`}
                    >
                      <div
                        className={`size-6 rounded-md flex items-center justify-center shrink-0 border mt-0.5 transition-colors ${
                          day2 ? "bg-forest border-forest text-ivory" : "border-line bg-ivory"
                        }`}
                      >
                        {day2 && <Check className="size-4 stroke-[3]" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-forest">
                            Day 2: Saturday 19 Dec 2026
                          </span>
                          <Badge className="bg-emerald-700 text-ivory text-[10px] font-bold">
                            100% FREE ENTRY
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-brand mt-0.5">
                          Royal Opening by HRM Oba Dr. Gbadebo CFR, Foundation Layings, Queens Polo, Sip &amp; Paint.
                        </p>
                      </div>
                    </div>

                    {/* Day 3 Button (Paid VVIP / Special Invitation) */}
                    <div
                      onClick={() => setDay3(!day3)}
                      className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 flex items-start gap-3.5 ${
                        day3
                          ? "border-amber-600 bg-amber-500/10 shadow-sm"
                          : "border-line bg-card hover:border-amber-500/50"
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
                          <span className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
                            <Crown className="size-4 text-amber-600 inline" />
                            Day 3: Sunday 20 Dec 2026 (Grand Finale)
                          </span>
                          <Badge className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[10px] font-bold">
                            PAID VVIP (₦50,000) OR INVITE
                          </Badge>
                        </div>
                        <p className="text-xs text-amber-900 mt-0.5">
                          Royal Cup Grand Final, Queens Cup, 100 Kings Celebration, Aristos Band &amp; Berryola Concert.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Day 3 Payment / Special Invitation Options */}
                  {day3 && (
                    <div className="mt-4 rounded-xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-50/80 to-amber-100/40 p-4 space-y-3.5 text-xs text-amber-950 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <Crown className="size-4 text-amber-600" />
                          <span>Day 3 VVIP Access Verification</span>
                        </div>
                        <Badge variant="outline" className="border-amber-500 text-amber-800 text-[10px]">
                          Distinct Deep Gold Pass
                        </Badge>
                      </div>

                      <p className="text-[11px] leading-relaxed text-amber-900">
                        Day 3 is dedicated to royal patrons and invited dignitaries. Choose how you will access the Grand Finale:
                      </p>

                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setHasInviteCode(false)}
                          className={`flex-1 rounded-lg p-2.5 text-left border transition-all cursor-pointer ${
                            !hasInviteCode
                              ? "bg-amber-600 text-white border-amber-600 font-bold shadow-xs"
                              : "bg-white/80 text-amber-950 border-amber-300 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-semibold text-xs">
                            <CreditCard className="size-3.5" /> Paystack Gateway (₦50,000)
                          </div>
                          <span className="text-[10px] opacity-90 block mt-0.5">
                            Instant online redirect to Paystack
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setHasInviteCode(true)}
                          className={`flex-1 rounded-lg p-2.5 text-left border transition-all cursor-pointer ${
                            hasInviteCode
                              ? "bg-amber-600 text-white border-amber-600 font-bold shadow-xs"
                              : "bg-white/80 text-amber-950 border-amber-300 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-semibold text-xs">
                            <KeyRound className="size-3.5" /> Special Invitation Code
                          </div>
                          <span className="text-[10px] opacity-90 block mt-0.5">
                            Claim complimentary VIP guest pass
                          </span>
                        </button>
                      </div>

                      {hasInviteCode && (
                        <div className="space-y-1.5 pt-2 border-t border-amber-300/60">
                          <Label htmlFor="inviteCode" className="text-xs font-bold text-amber-950">
                            Enter Special VIP Invitation Code *
                          </Label>
                          <Input
                            id="inviteCode"
                            placeholder="e.g. ROYAL-VIP, PRESIDENTIAL, VIP2026"
                            className="bg-white border-amber-300 uppercase font-mono tracking-wider text-xs"
                            value={invitationCode}
                            onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                          />
                          <p className="text-[10px] text-amber-800">
                            Authorized codes: <code>ROYAL-VIP</code>, <code>PRESIDENTIAL</code>, <code>VIP2026</code>, <code>SPECIAL-GUEST</code>, etc.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit CTA */}
                <div className="pt-4 border-t border-line">
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`w-full font-semibold py-6 text-base cursor-pointer shadow-md transition-all ${
                      day3 && (!hasInviteCode || !invitationCode.trim())
                        ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:opacity-95"
                        : "bg-forest text-ivory hover:bg-forest-interactive"
                    }`}
                  >
                    {loading ? (
                      "Processing Pass Issuance..."
                    ) : day3 && (!hasInviteCode || !invitationCode.trim()) ? (
                      <span className="flex items-center justify-center gap-2">
                        <CreditCard className="size-5" /> Proceed to Paystack Payment (₦50,000) →
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
            <div className="space-y-6 lg:col-span-5">
              <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
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
                        <Crown className="size-4 text-amber-600" /> 1 Distinct Deep Gold VVIP Pass (Day 3 Alone)
                      </span>
                      <p className="text-[11px] text-amber-800">
                        Issued separately with classic gold styling upon Paystack payment or Special VIP Invitation.
                      </p>
                    </div>
                  )}

                  {(day1 || day2) && day3 && (
                    <div className="rounded-xl border-2 border-gold/70 bg-gold/10 p-3.5 text-forest space-y-2">
                      <span className="font-bold block text-sm text-forest flex items-center gap-1.5">
                        <Sparkles className="size-4 text-gold-deep" /> 2 Distinct ID Passes Will Be Issued:
                      </span>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] text-muted-brand">
                        <li>
                          <strong>Card 1:</strong> {day1 && day2 ? "Day 1 & 2 Combined Pass (Free)" : day1 ? "Day 1 Free Pass" : "Day 2 Free Pass"} (Forest Green / Ivory standard card).
                        </li>
                        <li>
                          <strong>Card 2:</strong> Day 3 VVIP Grand Finale Pass (Distinct classic Deep Gold luxury card).
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
                      passCode: day3 ? "ABK-2026-VVIP-PREVIEW" : day1 && day2 ? "ABK-2026-D12-PREVIEW" : "ABK-2026-D1-PREVIEW",
                      holderName: formData.firstName || formData.lastName
                        ? `${formData.firstName} ${formData.lastName}`.trim()
                        : "Your Full Name",
                      category: day3 ? "Day 3 VVIP Grand Finale Pass" : day1 && day2 ? "Day 1 & Day 2 Dual Pass" : "Day 1 Free Gate Pass",
                      affiliationType: formData.affiliationType,
                      registeredAt: new Date().toISOString(),
                      daysCovered: day3 ? [3] : day1 && day2 ? [1, 2] : [1],
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

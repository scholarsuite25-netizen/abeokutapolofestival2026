"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  QrCode,
  CheckCircle2,
  Printer,
  User,
  Mail,
  Phone,
  Building,
  UserCheck,
  CalendarCheck,
  Download,
  Ticket,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { submitRegistration, type RegisterResult } from "./actions";
import {
  persistRegisteredPass,
  useStoredPass,
  forceDownloadOfflinePassCard,
  type StoredPass,
} from "@/lib/storage/pass-storage";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegisterResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadTriggered, setDownloadTriggered] = useState(false);
  const existingPass = useStoredPass();
  const [dismissExisting, setDismissExisting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    groupCount: "0",
    affiliationType: "individual" as "individual" | "guest_of" | "corporate",
    hostName: "",
    organization: "",
    hasDay2Ticket: false,
    day2TicketRef: "",
    hasDay3Ticket: false,
    day3TicketRef: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const res = await submitRegistration({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      groupSize: parseInt(formData.groupCount, 10) + 1,
      affiliationType: formData.affiliationType,
      hostName: formData.hostName,
      organization: formData.organization,
      hasDay2Ticket: formData.hasDay2Ticket,
      day2TicketRef: formData.day2TicketRef,
      hasDay3Ticket: formData.hasDay3Ticket,
      day3TicketRef: formData.day3TicketRef,
    });

    setLoading(false);
    if (res.success && res.passCode) {
      setResult(res);

      const passData: StoredPass = {
        passCode: res.passCode,
        holderName: res.holderName || `${formData.firstName} ${formData.lastName}`.trim(),
        category: res.category || affiliationLabel,
        affiliationType: formData.affiliationType,
        hostName: formData.hostName || null,
        organization: formData.organization || null,
        email: formData.email,
        phone: formData.phone,
        qrToken: res.qrToken,
        registeredAt: new Date().toISOString(),
        day1Status: "free_admitted",
        day2Status: formData.hasDay2Ticket ? "ticket_verified" : "ticket_required",
        day3Status: formData.hasDay3Ticket ? "ticket_verified" : "ticket_required",
        ticketRefDay2: formData.day2TicketRef || null,
        ticketRefDay3: formData.day3TicketRef || null,
      };

      // 1. Persist to phone storage (localStorage, sessionStorage, and 365-day cookie)
      persistRegisteredPass(passData);

      // 2. Forcibly trigger automatic download of standalone offline pass HTML card onto phone
      forceDownloadOfflinePassCard(passData);
      setDownloadTriggered(true);
    } else {
      setErrorMsg(res.error || "Failed to process registration.");
    }
  };

  const affiliationLabel =
    formData.affiliationType === "guest_of"
      ? `Guest of: ${formData.hostName || "Host Member"}`
      : formData.affiliationType === "corporate"
      ? `Corporate: ${formData.organization || "Company Delegation"}`
      : "Individual Attendee";

  return (
    <div className="flex w-full flex-col bg-ivory text-ink py-10 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <Badge
            variant="outline"
            className="border-gold/50 bg-gold/10 text-forest font-semibold uppercase tracking-widest text-[11px]"
          >
            Abeokuta Polo Festival 2026 — The Blueprint
          </Badge>
          <h1 className="mt-3 font-display text-3xl font-semibold text-forest sm:text-5xl">
            Event Registration &amp; Gate Access Card
          </h1>
          <p className="mt-2 text-sm text-muted-brand sm:text-base">
            Register to generate your official tournament gate card. Your digital pass is saved
            directly to your phone and automatically downloaded for offline turnstile access.
          </p>
        </div>

        {/* Existing Pass Detected Notification (Device Persistence) */}
        {existingPass && !result?.success && !dismissExisting && (
          <div className="mb-8 rounded-2xl border-2 border-forest/30 bg-forest p-5 text-ivory shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gold text-forest shrink-0">
                <Ticket className="size-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold block">
                  Active Pass Found On This Phone
                </span>
                <p className="font-semibold text-base text-ivory">
                  Welcome back, {existingPass.holderName}!
                </p>
                <p className="text-xs text-ivory/70">
                  Pass Code: <strong className="font-mono text-gold">{existingPass.passCode}</strong> · {existingPass.category}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <Button asChild size="sm" className="bg-gold text-forest font-bold hover:bg-gold/90">
                <Link href={`/pass/${existingPass.passCode}`}>
                  <ExternalLink className="mr-1.5 size-3.5" /> View My Access Card
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => forceDownloadOfflinePassCard(existingPass)}
                className="border-ivory/30 bg-white/10 text-ivory hover:bg-white/20"
              >
                <Download className="mr-1.5 size-3.5" /> Re-Download Pass
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

        {/* Admission Policy Highlights */}
        <div className="mb-8 rounded-2xl border border-line bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="size-5 text-forest shrink-0" />
            <h3 className="font-display text-base font-semibold text-forest">
              Tournament Admission &amp; Attendance Rules (18–20 Dec 2026)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/60 p-3.5 text-emerald-900">
              <Badge className="bg-emerald-700 text-ivory text-[10px] mb-1 font-bold">100% FREE ENTRY</Badge>
              <h4 className="font-semibold text-sm text-emerald-950">Day 1: Friday 18 Dec</h4>
              <p className="text-[11px] text-emerald-800 mt-1">
                Complimentary public admission for all registered participants. Simply show your digital access card at the gate turnstiles.
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-50/60 p-3.5 text-amber-900">
              <Badge className="bg-amber-700 text-ivory text-[10px] mb-1 font-bold">THROUGH TICKET</Badge>
              <h4 className="font-semibold text-sm text-amber-950">Day 2: Saturday 19 Dec</h4>
              <p className="text-[11px] text-amber-800 mt-1">
                Semi-Finals &amp; Polo Derby Day. Gate admission is strictly through ticket. You can link your ticket below or present it at turnstiles.
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-50/60 p-3.5 text-amber-900">
              <Badge className="bg-amber-700 text-ivory text-[10px] mb-1 font-bold">THROUGH TICKET</Badge>
              <h4 className="font-semibold text-sm text-amber-950">Day 3: Sunday 20 Dec</h4>
              <p className="text-[11px] text-amber-800 mt-1">
                Royal Grand Finals &amp; Trophy Presentation. Gate admission is strictly through ticket. Check in with your digital pass &amp; ticket.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* Registration Form / Success State */}
          <div className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8 lg:col-span-7">
            {errorMsg ? (
              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800">
                {errorMsg}
              </div>
            ) : null}

            {result?.success ? (
              /* Instant Auto-Issued Access Card with Automatic Phone Drop */
              <div className="py-4 text-center space-y-5">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="size-8" />
                </div>
                <div>
                  <Badge className="bg-emerald-800 text-ivory text-xs mb-2">Access Card Issued &amp; Saved</Badge>
                  <h2 className="font-display text-2xl font-semibold text-forest">
                    Gate Access Card Ready
                  </h2>
                  <p className="text-sm text-muted-brand mt-1">
                    Welcome, <strong className="text-forest">{result.holderName || formData.firstName}</strong>.
                    Your access card is registered for all three festival days.
                  </p>
                </div>

                {/* Drop Notification Alert */}
                {downloadTriggered && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 p-3 text-xs text-emerald-900 flex items-center justify-center gap-2">
                    <Download className="size-4 text-emerald-700 shrink-0" />
                    <span>
                      <strong>Downloaded to your phone:</strong> An offline pass card file (<code>Abeokuta_Polo_Pass_{result.passCode}.html</code>) has been saved to your downloads for offline gate entry.
                    </span>
                  </div>
                )}

                {/* Access Card Box */}
                <div className="rounded-2xl border-2 border-forest/30 bg-forest p-6 text-ivory shadow-xl text-left relative overflow-hidden">
                  <div className="flex justify-between items-start border-b border-white/20 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gold">
                        Gate Access Card
                      </span>
                      <p className="font-mono text-2xl font-bold tracking-wider text-ivory mt-0.5">
                        {result.passCode}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-gold text-gold text-[10px]">
                      OFFICIAL PASS
                    </Badge>
                  </div>

                  <div className="py-4 flex items-center gap-4 border-b border-white/20">
                    <div className="rounded-xl bg-white p-2 text-forest shadow">
                      <QrCode className="size-16" />
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-base text-ivory">
                        {result.holderName || `${formData.firstName} ${formData.lastName}`}
                      </p>
                      <p className="text-gold font-medium">
                        {result.affiliationType === "guest_of"
                          ? `Guest of: ${result.hostName || formData.hostName}`
                          : result.affiliationType === "corporate"
                          ? `Corporate: ${result.organization || formData.organization}`
                          : "Individual Attendee"}
                      </p>
                      <p className="text-ivory/70 text-[11px]">
                        Scan at turnstiles on each festival day (18, 19, 20 Dec 2026).
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 grid grid-cols-2 gap-2 text-xs border-b border-white/20 pb-3">
                    <div>
                      <span className="text-ivory/60 text-[11px] block">Category</span>
                      <span className="font-semibold text-ivory">
                        {result.category || affiliationLabel}
                      </span>
                    </div>
                    <div>
                      <span className="text-ivory/60 text-[11px] block">Access Entitlement</span>
                      <span className="font-semibold text-ivory">Festival Grounds &amp; Grandstand</span>
                    </div>
                  </div>

                  {/* 3-Day Attendance & Ticket Policy Grid */}
                  <div className="pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ivory/70 block mb-1.5 flex items-center gap-1">
                      <CalendarCheck className="size-3.5 text-gold" /> Daily Gate Admission Status:
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="rounded bg-emerald-900/60 p-2 border border-emerald-400/40">
                        <span className="block font-bold text-emerald-300">Day 1 (Fri 18)</span>
                        <span className="text-ivory/90 font-semibold">FREE ENTRY</span>
                      </div>
                      <div className="rounded bg-amber-900/50 p-2 border border-amber-400/40">
                        <span className="block font-bold text-amber-300">Day 2 (Sat 19)</span>
                        <span className="text-ivory/90 font-semibold">THROUGH TICKET</span>
                      </div>
                      <div className="rounded bg-amber-900/50 p-2 border border-amber-400/40">
                        <span className="block font-bold text-amber-300">Day 3 (Sun 20)</span>
                        <span className="text-ivory/90 font-semibold">THROUGH TICKET</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                  {result.passCode ? (
                    <Button asChild className="bg-forest text-ivory hover:bg-forest-interactive">
                      <Link href={`/pass/${result.passCode}`} target="_blank">
                        <Printer className="mr-2 size-4" /> Open Full Access Card &amp; Print
                      </Link>
                    </Button>
                  ) : null}

                  <Button
                    onClick={() => {
                      if (result.passCode) {
                        const passData: StoredPass = {
                          passCode: result.passCode,
                          holderName: result.holderName || `${formData.firstName} ${formData.lastName}`.trim(),
                          category: result.category || affiliationLabel,
                          affiliationType: formData.affiliationType,
                          hostName: formData.hostName || null,
                          organization: formData.organization || null,
                          email: formData.email,
                          phone: formData.phone,
                          qrToken: result.qrToken,
                          registeredAt: new Date().toISOString(),
                          day1Status: "free_admitted",
                          day2Status: formData.hasDay2Ticket ? "ticket_verified" : "ticket_required",
                          day3Status: formData.hasDay3Ticket ? "ticket_verified" : "ticket_required",
                        };
                        forceDownloadOfflinePassCard(passData);
                      }
                    }}
                    variant="outline"
                    className="border-gold text-forest hover:bg-gold/10"
                  >
                    <Download className="mr-2 size-4" /> Re-Download Pass File
                  </Button>

                  <Button
                    onClick={() => {
                      setResult(null);
                      setDownloadTriggered(false);
                    }}
                    variant="ghost"
                    className="text-muted-brand"
                  >
                    <RotateCcw className="mr-1.5 size-4" /> Register Another Person
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="font-display text-xl font-semibold text-forest border-b border-line pb-3">
                  1. Attendee Information
                </h2>

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
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
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
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
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
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Guest Affiliation / Category Section */}
                <h2 className="font-display text-xl font-semibold text-forest border-b border-line pt-2 pb-3">
                  2. Attendance &amp; Guest Affiliation
                </h2>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-forest">
                      How are you attending the 2026 Abeokuta Polo Festival? *
                    </Label>
                    <Select
                      value={formData.affiliationType}
                      onValueChange={(val: "individual" | "guest_of" | "corporate") =>
                        setFormData({ ...formData, affiliationType: val })
                      }
                    >
                      <SelectTrigger className="bg-ivory">
                        <SelectValue placeholder="Select attendance category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">
                          Individual Attendee (Independent Registration)
                        </SelectItem>
                        <SelectItem value="guest_of">
                          Guest of a Member / Patron / Dignitary
                        </SelectItem>
                        <SelectItem value="corporate">
                          Corporate Guest / Corporate Sponsor Delegation
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dynamic conditional input for Guest Of */}
                  {formData.affiliationType === "guest_of" && (
                    <div className="space-y-1.5 rounded-lg border border-gold/40 bg-gold/10 p-4">
                      <Label htmlFor="hostName" className="text-xs font-semibold text-forest">
                        Host / Inviting Person Name * (Who are you a guest of?)
                      </Label>
                      <div className="relative">
                        <UserCheck className="absolute left-3 top-3 size-4 text-gold-deep" />
                        <Input
                          id="hostName"
                          required
                          placeholder="e.g. Chief Olumide, Patron Bello, Diplomatic Host"
                          className="pl-9 bg-ivory"
                          value={formData.hostName}
                          onChange={(e) =>
                            setFormData({ ...formData, hostName: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Dynamic conditional input for Corporate Guest */}
                  {formData.affiliationType === "corporate" && (
                    <div className="space-y-1.5 rounded-lg border border-gold/40 bg-gold/10 p-4">
                      <Label htmlFor="organization" className="text-xs font-semibold text-forest">
                        Company or Corporate Organization Name *
                      </Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 size-4 text-gold-deep" />
                        <Input
                          id="organization"
                          required
                          placeholder="e.g. First Bank of Nigeria, Dangote Group, Ogun State Govt"
                          className="pl-9 bg-ivory"
                          value={formData.organization}
                          onChange={(e) =>
                            setFormData({ ...formData, organization: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Group Count */}
                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs font-semibold text-forest">
                      Additional Accompanying Passes
                    </Label>
                    <Select
                      value={formData.groupCount}
                      onValueChange={(val) =>
                        setFormData({ ...formData, groupCount: val })
                      }
                    >
                      <SelectTrigger className="bg-ivory">
                        <SelectValue placeholder="Accompanying passes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Just Myself (1 Pass)</SelectItem>
                        <SelectItem value="1">+1 Accompanying Guest (2 Passes)</SelectItem>
                        <SelectItem value="2">+2 Accompanying Guests (3 Passes)</SelectItem>
                        <SelectItem value="3">+3 Accompanying Guests (4 Passes)</SelectItem>
                        <SelectItem value="4">+4 Accompanying Guests (5 Passes)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Day 2 & Day 3 Admission Through Ticket Section */}
                <h2 className="font-display text-xl font-semibold text-forest border-b border-line pt-2 pb-3">
                  3. Day 2 &amp; Day 3 Tournament Ticket Status
                </h2>

                <div className="rounded-xl border border-line bg-sage/30 p-4 space-y-4">
                  <p className="text-xs text-muted-brand">
                    <strong>Notice:</strong> Day 1 (Fri 18 Dec) is 100% Free Public Admission. Day 2 (Sat 19 Dec) and Day 3 (Sun 20 Dec) require tournament tickets. You may enter your ticket references below or purchase/verify them at the gate box office.
                  </p>

                  {/* Day 2 Checkbox */}
                  <div className="space-y-2 rounded-lg border border-line bg-card p-3">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasDay2Ticket}
                        onChange={(e) =>
                          setFormData({ ...formData, hasDay2Ticket: e.target.checked })
                        }
                        className="mt-1 size-4 rounded border-line text-forest focus:ring-forest"
                      />
                      <div>
                        <span className="font-semibold text-xs text-forest block">
                          Day 2 (Sat 19 Dec) — I have / will hold a ticket
                        </span>
                        <span className="text-[11px] text-muted-brand">
                          Semi-Finals &amp; Polo Derby matches.
                        </span>
                      </div>
                    </label>

                    {formData.hasDay2Ticket && (
                      <div className="pt-2 pl-6">
                        <Label htmlFor="day2Ref" className="text-[11px] text-forest font-medium">
                          Ticket Reference / Booking Code (Optional)
                        </Label>
                        <Input
                          id="day2Ref"
                          placeholder="e.g. TCK-SAT-1092"
                          value={formData.day2TicketRef}
                          onChange={(e) =>
                            setFormData({ ...formData, day2TicketRef: e.target.value })
                          }
                          className="mt-1 text-xs bg-ivory"
                        />
                      </div>
                    )}
                  </div>

                  {/* Day 3 Checkbox */}
                  <div className="space-y-2 rounded-lg border border-line bg-card p-3">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasDay3Ticket}
                        onChange={(e) =>
                          setFormData({ ...formData, hasDay3Ticket: e.target.checked })
                        }
                        className="mt-1 size-4 rounded border-line text-forest focus:ring-forest"
                      />
                      <div>
                        <span className="font-semibold text-xs text-forest block">
                          Day 3 (Sun 20 Dec) — I have / will hold a ticket
                        </span>
                        <span className="text-[11px] text-muted-brand">
                          Royal Cup Grand Finals &amp; Trophy Ceremony.
                        </span>
                      </div>
                    </label>

                    {formData.hasDay3Ticket && (
                      <div className="pt-2 pl-6">
                        <Label htmlFor="day3Ref" className="text-[11px] text-forest font-medium">
                          Ticket Reference / Booking Code (Optional)
                        </Label>
                        <Input
                          id="day3Ref"
                          placeholder="e.g. TCK-SUN-8841"
                          value={formData.day3TicketRef}
                          onChange={(e) =>
                            setFormData({ ...formData, day3TicketRef: e.target.value })
                          }
                          className="mt-1 text-xs bg-ivory"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-line">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-forest text-ivory hover:bg-forest-interactive font-semibold py-6 text-base cursor-pointer shadow-md"
                  >
                    {loading ? "Generating & Saving Access Card..." : "Complete Registration & Get Access Card →"}
                  </Button>
                  <p className="text-center text-[11px] text-muted-brand mt-2">
                    Your digital pass will be saved automatically to your phone for offline turnstile presentation.
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Side Info Panel */}
          <div className="space-y-6 lg:col-span-5">
            {/* Live Access Card Preview */}
            <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold block mb-2">
                Digital Pass Live Preview
              </span>
              <h3 className="font-display text-lg font-semibold text-forest mb-3">
                Your Gate Access Pass
              </h3>

              <div className="rounded-xl border border-dashed border-forest/30 bg-ivory p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-brand block">
                      Attendee Name
                    </span>
                    <p className="font-semibold text-forest text-sm">
                      {formData.firstName || formData.lastName
                        ? `${formData.firstName} ${formData.lastName}`.trim()
                        : "Your Full Name"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-card p-1.5 border border-line">
                    <QrCode className="size-8 text-forest" />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-brand block">
                    Stated Affiliation
                  </span>
                  <span className="font-medium text-gold-deep text-xs flex items-center gap-1 mt-0.5">
                    {formData.affiliationType === "guest_of" ? (
                      <UserCheck className="size-3 text-gold-deep inline" />
                    ) : formData.affiliationType === "corporate" ? (
                      <Building className="size-3 text-gold-deep inline" />
                    ) : null}
                    {affiliationLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-line/60">
                  <div>
                    <span className="text-muted-brand block">Venue</span>
                    <span className="font-semibold text-forest">Abeokuta Polo Club</span>
                  </div>
                  <div>
                    <span className="text-muted-brand block">Dates</span>
                    <span className="font-semibold text-forest">18–20 Dec 2026</span>
                  </div>
                </div>

                {/* 3-day indicator */}
                <div className="pt-2 border-t border-line/60">
                  <span className="text-[10px] font-semibold text-muted-brand block mb-1">
                    Daily Gate Scan (Fri / Sat / Sun):
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-300 rounded py-1 font-medium">
                      Day 1: Free
                    </div>
                    <div className={`rounded py-1 font-medium border ${formData.hasDay2Ticket ? "bg-amber-100 text-amber-900 border-amber-300" : "bg-sage/40 text-forest border-line"}`}>
                      Day 2: Ticket
                    </div>
                    <div className={`rounded py-1 font-medium border ${formData.hasDay3Ticket ? "bg-amber-100 text-amber-900 border-amber-300" : "bg-sage/40 text-forest border-line"}`}>
                      Day 3: Ticket
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Protocol Info */}
            <div className="rounded-2xl border border-line bg-sage/30 p-6 space-y-3 text-xs text-forest-deep">
              <h4 className="font-display text-sm font-semibold text-forest">
                Gate Entry &amp; Turnstile Protocol
              </h4>
              <ul className="space-y-2 list-disc pl-4 text-muted-brand">
                <li>
                  <strong className="text-forest">Show at the Gate:</strong> Present your digital pass on your smartphone. The offline pass works even without cell signal.
                </li>
                <li>
                  <strong className="text-forest">Day 1 Free:</strong> Friday 18 Dec is completely free for all registered guests.
                </li>
                <li>
                  <strong className="text-forest">Day 2 &amp; Day 3 Through Ticket:</strong> Saturday and Sunday require valid tournament tickets along with your access card.
                </li>
                <li>
                  <strong className="text-forest">Daily Scan:</strong> Gate attendants scan your pass QR code on each day you attend to log attendance.
                </li>
              </ul>
              <div className="pt-2 border-t border-line/60">
                <Link
                  href="/pass/lookup"
                  className="font-semibold text-forest hover:text-gold-deep inline-flex items-center gap-1"
                >
                  Already registered? Look up your existing Access Card →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegisterResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    groupCount: "0",
    affiliationType: "individual" as "individual" | "guest_of" | "corporate",
    hostName: "",
    organization: "",
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
    });

    setLoading(false);
    if (res.success) {
      setResult(res);
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
    <div className="flex w-full flex-col bg-ivory text-ink py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge
            variant="outline"
            className="border-gold/50 bg-gold/10 text-forest font-semibold uppercase tracking-widest text-[11px]"
          >
            Official Gate Accreditation
          </Badge>
          <h1 className="mt-3 font-display text-3xl font-semibold text-forest sm:text-5xl">
            Event Registration &amp; Access Card
          </h1>
          <p className="mt-2 text-sm text-muted-brand sm:text-base">
            Register to obtain your official gate access card. Present and scan your QR code at the
            entrance turnstiles to indicate attendance on each day of the three-day festival (18–20 December 2026).
          </p>
        </div>

        {/* Notice on Free Attendance */}
        <div className="mb-10 rounded-xl border border-line bg-sage/40 p-4 text-xs text-forest-deep sm:text-sm flex items-center gap-3">
          <ShieldCheck className="size-5 text-forest shrink-0" />
          <p>
            <strong>Zero Payment Policy:</strong> Attendance is 100% complimentary upon registration. Your
            digital access card is issued immediately with your credentials, guest affiliation, and 3-day daily
            attendance tracking.
          </p>
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
              /* Instant Auto-Issued Access Card */
              <div className="py-6 text-center space-y-5">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="size-8" />
                </div>
                <div>
                  <Badge className="bg-emerald-800 text-ivory text-xs mb-2">Access Card Issued</Badge>
                  <h2 className="font-display text-2xl font-semibold text-forest">
                    Digital Gate Access Card Ready
                  </h2>
                  <p className="text-sm text-muted-brand mt-1">
                    Welcome, <strong className="text-forest">{result.holderName || formData.firstName}</strong>.
                    Your access card is active for all three days of the festival.
                  </p>
                </div>

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
                      FREE ENTRY
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
                      <span className="text-ivory/60 text-[11px] block">Access</span>
                      <span className="font-semibold text-ivory">Festival Grounds &amp; Grandstand</span>
                    </div>
                  </div>

                  {/* 3-Day Attendance Tracker Indicator */}
                  <div className="pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ivory/70 block mb-1.5 flex items-center gap-1">
                      <CalendarCheck className="size-3.5 text-gold" /> 3-Day Gate Attendance Tracker:
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="rounded bg-white/10 p-1.5 border border-white/10">
                        <span className="block font-semibold text-gold">Day 1</span>
                        <span className="text-ivory/80">Fri 18 Dec</span>
                      </div>
                      <div className="rounded bg-white/10 p-1.5 border border-white/10">
                        <span className="block font-semibold text-gold">Day 2</span>
                        <span className="text-ivory/80">Sat 19 Dec</span>
                      </div>
                      <div className="rounded bg-white/10 p-1.5 border border-white/10">
                        <span className="block font-semibold text-gold">Day 3</span>
                        <span className="text-ivory/80">Sun 20 Dec</span>
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
                    onClick={() => setResult(null)}
                    variant="outline"
                    className="border-line text-forest"
                  >
                    Register Another Person
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
                    <p className="text-[11px] text-muted-brand">
                      Complimentary passes will be issued for all accompanying guests under your primary registration.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-line">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-forest text-ivory hover:bg-forest-interactive font-semibold py-6 text-base"
                  >
                    {loading ? "Generating Access Card..." : "Complete Registration & Get Access Card →"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Side Info Panel */}
          <div className="space-y-6 lg:col-span-5">
            {/* Live Access Card Preview */}
            <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold block mb-2">
                Digital Pass Preview
              </span>
              <h3 className="font-display text-lg font-semibold text-forest mb-3">
                Your Official Gate Entry Card
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
                    <div className="bg-sage/40 rounded py-1 font-medium text-forest">Day 1</div>
                    <div className="bg-sage/40 rounded py-1 font-medium text-forest">Day 2</div>
                    <div className="bg-sage/40 rounded py-1 font-medium text-forest">Day 3</div>
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
                  <strong className="text-forest">Show at the Gate:</strong> Present your digital pass or printout on your smartphone at the entrance.
                </li>
                <li>
                  <strong className="text-forest">Daily Scan:</strong> Gate attendants scan your pass QR code on each day you attend (18, 19, or 20 Dec 2026).
                </li>
                <li>
                  <strong className="text-forest">No Entry Fees:</strong> All registered participants enjoy complimentary access throughout the 3-day tournament.
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

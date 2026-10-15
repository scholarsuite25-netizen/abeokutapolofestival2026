"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  QrCode,
  CheckCircle2,
  User,
  Mail,
  Phone,
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
    category: "General Public Admission",
    groupCount: "0",
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
      category: formData.category,
      groupSize: parseInt(formData.groupCount, 10) + 1,
    });

    setLoading(false);
    if (res.success) {
      setResult(res);
    } else {
      setErrorMsg(res.error || "Failed to process registration.");
    }
  };

  return (
    <div className="flex w-full flex-col bg-ivory text-ink py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="outline" className="border-gold/50 bg-gold/10 text-forest font-semibold uppercase tracking-widest text-[11px]">
            Official Accreditation Portal
          </Badge>
          <h1 className="mt-3 font-display text-3xl font-semibold text-forest sm:text-5xl">
            Free Digital Pass Registration
          </h1>
          <p className="mt-2 text-sm text-muted-brand sm:text-base">
            Attendance is free for all three tournament days (18–20 December 2026). Prior digital registration is mandatory for gate entrance.
          </p>
        </div>

        {/* Notice on Free Attendance */}
        <div className="mb-10 rounded-xl border border-line bg-sage/40 p-4 text-xs text-forest-deep sm:text-sm flex items-center gap-3">
          <ShieldCheck className="size-5 text-forest shrink-0" />
          <p>
            <strong>Zero Payment Policy:</strong> This website does not process, solicit, or collect payments. Your pass is issued upon registration and delivered directly to your email.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* Registration Form */}
          <div className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8 lg:col-span-7">
            {errorMsg ? (
              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800">
                {errorMsg}
              </div>
            ) : null}

            {result?.success ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="size-8" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-forest">
                  Registration Successfully Confirmed!
                </h2>
                <div className="inline-block rounded-lg border border-gold/40 bg-gold/15 px-4 py-2 font-mono text-lg font-bold text-forest">
                  {result.passCode}
                </div>
                <p className="text-sm text-muted-brand max-w-md mx-auto">
                  Welcome to the 2026 Abeokuta Polo Festival,{" "}
                  <strong className="text-forest">{formData.firstName}</strong>. Your credential record has been generated and dispatched to{" "}
                  <strong className="text-forest">{formData.email}</strong>.
                </p>

                <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-xs text-forest text-left">
                  <p className="font-semibold text-forest">Next Steps for Entry:</p>
                  <ul className="mt-2 list-disc list-inside space-y-1 text-muted-brand">
                    <li>Present your pass code <strong>{result.passCode}</strong> or your QR pass on your smartphone at Gate 2 or Gate 3.</li>
                    <li>Ensure you bring valid identification matching this name.</li>
                    <li>Gates open daily from 10:00 AM (18–20 December 2026).</li>
                  </ul>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                  <Button
                    onClick={() => setResult(null)}
                    variant="outline"
                    className="border-line text-forest"
                  >
                    Register Another Guest
                  </Button>
                  <Button asChild className="bg-forest text-ivory hover:bg-forest-interactive">
                    <Link href="/programme">Explore Tournament Schedule →</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="font-display text-xl font-semibold text-forest border-b border-line pb-3">
                  Attendee Credentials
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

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-forest">
                    Email Address * (For Digital QR Pass Delivery)
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-forest">Pass Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(val) =>
                        setFormData({ ...formData, category: val })
                      }
                    >
                      <SelectTrigger className="bg-ivory">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General Public Admission">
                          General Public Lawn Pass
                        </SelectItem>
                        <SelectItem value="Patron / VIP Guest">
                          Patron / Dignitary Guest
                        </SelectItem>
                        <SelectItem value="Committee / Officer Guest">
                          Committee / Officer Guest
                        </SelectItem>
                        <SelectItem value="Media & Press Accreditation">
                          Media & Press Accreditation
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-forest">
                      Additional Group Guests
                    </Label>
                    <Select
                      value={formData.groupCount}
                      onValueChange={(val) =>
                        setFormData({ ...formData, groupCount: val })
                      }
                    >
                      <SelectTrigger className="bg-ivory">
                        <SelectValue placeholder="Additional guests" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Just Myself (1 Pass)</SelectItem>
                        <SelectItem value="1">+1 Guest (2 Passes)</SelectItem>
                        <SelectItem value="2">+2 Guests (3 Passes)</SelectItem>
                        <SelectItem value="3">+3 Guests (4 Passes)</SelectItem>
                        <SelectItem value="4">+4 Guests (5 Passes)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2 text-xs text-muted-brand leading-relaxed">
                  By clicking Register, you confirm agreement to tournament entry protocols, equestrian safety rules, and NDPA personal data processing.
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="w-full bg-gold font-semibold text-forest-deep shadow hover:bg-gold/90 disabled:opacity-50"
                >
                  {loading ? "Processing Registration..." : "Confirm Registration & Generate Free Pass →"}
                </Button>
              </form>
            )}
          </div>

          {/* Interactive Digital Pass Wallet Simulation */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-gold/40 bg-forest p-6 text-ivory shadow-xl sm:p-8">
              <div className="flex items-center justify-between border-b border-line/20 pb-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gold">
                    Accredited Guest Pass
                  </span>
                  <h3 className="font-display text-lg font-semibold text-ivory">
                    Abeokuta Polo Festival 2026
                  </h3>
                </div>
                <Badge variant="outline" className="border-gold bg-gold/15 text-gold text-[10px]">
                  VERIFIED
                </Badge>
              </div>

              <div className="my-6 flex flex-col items-center justify-center rounded-xl bg-ivory p-6 text-forest">
                <div className="flex size-36 items-center justify-center rounded-lg border-2 border-dashed border-forest/30 bg-sage/30">
                  <QrCode className="size-28 text-forest" />
                </div>
                <p className="mt-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-brand">
                  ABK-2026-PASS-SECURE
                </p>
                <span className="text-[10px] text-emerald-700 font-medium">
                  ● Ready for Gate Scanning
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-line/10 pb-1.5">
                  <span className="text-ivory/60">Holder:</span>
                  <span className="font-semibold text-ivory">
                    {formData.firstName || formData.lastName
                      ? `${formData.firstName} ${formData.lastName}`
                      : "Registered Guest"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-line/10 pb-1.5">
                  <span className="text-ivory/60">Category:</span>
                  <span className="font-semibold text-gold">{formData.category}</span>
                </div>
                <div className="flex justify-between border-b border-line/10 pb-1.5">
                  <span className="text-ivory/60">Valid Dates:</span>
                  <span className="font-semibold text-ivory">18–20 Dec 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ivory/60">Venue Access:</span>
                  <span className="font-semibold text-ivory">Abeokuta Polo Club Grounds</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-card p-5 text-xs text-muted-brand">
              <p className="font-semibold text-forest">Need Dignitary or Royal Protocol?</p>
              <p className="mt-1">
                For Royal Box seating, private diplomatic aircraft landing coordination, or VIP chalet reservations, please contact protocol directly via WhatsApp at +234 818 188 8884.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

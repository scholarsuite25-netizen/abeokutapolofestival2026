"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Crown,
  Download,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { IdAccessCard } from "@/components/shared/id-access-card";
import { submitRegistration } from "@/app/(public)/register/actions";
import {
  forceDownloadAllPasses,
  type StoredPass,
} from "@/lib/storage/pass-storage";
import {
  buildAttendeePassWhatsAppMessage,
  formatWhatsAppUrl,
  validateWhatsAppPhone,
} from "@/lib/utils/phone";
import { getSiteOrigin } from "@/lib/site";

/**
 * Day 3 only: complimentary Special VIP Invitation Code redemption.
 * Paid Day 3 admission is sold exclusively through the VIP Tables page.
 */
export function InvitationRedemptionClient() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [passes, setPasses] = useState<StoredPass[]>([]);
  const [holderName, setHolderName] = useState("");
  const [code, setCode] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!code.trim()) {
      setErrorMsg("Please enter the Special VIP Invitation Code printed on your invitation.");
      return;
    }

    const phoneCheck = validateWhatsAppPhone(formData.phone);
    if (!phoneCheck.isValid) {
      setErrorMsg(
        phoneCheck.error ||
          "Please enter a valid WhatsApp phone number (e.g. 0803 123 4567 or +234 803 123 4567).",
      );
      return;
    }

    setLoading(true);
    const res = await submitRegistration({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      day1: false,
      day2: false,
      day3: true,
      day3InvitationCode: code.trim(),
    });
    setLoading(false);

    if (res.success && res.passes && res.passes.length > 0) {
      setPasses(res.passes);
      setHolderName(
        res.holderName || `${formData.firstName} ${formData.lastName}`.trim(),
      );
    } else {
      setErrorMsg(res.error || "Could not redeem this invitation code.");
    }
  };

  const appOrigin =
    typeof window !== "undefined" ? window.location.origin : getSiteOrigin();
  const primaryPass = passes[0];
  const passUrl = primaryPass ? `${appOrigin}/pass/${primaryPass.passCode}` : appOrigin;
  const whatsappMessage = primaryPass
    ? buildAttendeePassWhatsAppMessage({
        holderName,
        phone: formData.phone,
        passCode: primaryPass.passCode,
        category: primaryPass.category,
        passUrl,
        isMultiple: passes.length > 1,
        totalPasses: passes.length,
      })
    : "";
  const whatsappUrl = formatWhatsAppUrl(formData.phone, whatsappMessage);

  return (
    <div className="w-full bg-black text-ivory py-10 sm:py-16 px-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Back link */}
        <Link
          href="/tables"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-gold-light transition"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Day 3 VIP Tables</span>
        </Link>

        {/* Header */}
        <div className="rounded-3xl border-2 border-gold-deep/80 bg-black p-6 sm:p-10 text-center space-y-4 shadow-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-deep/80 bg-gold-deep/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold">
            <Crown className="size-4 text-gold" />
            <span>Day 3 · Sunday 20 December 2026 · Royal Cup Grand Finale</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-black text-ivory tracking-tight">
            Redeem Special VIP Invitation Code
          </h1>
          <p className="text-sm text-ivory/75 max-w-xl mx-auto leading-relaxed">
            Enter the code printed on your official invitation to receive your complimentary
            Day 3 VVIP gate pass. Paid Day 3 admission and VIP Tables are reserved on the{" "}
            <Link href="/tables" className="text-gold underline hover:text-gold-light">
              VIP Tables page
            </Link>
            .
          </p>
        </div>

        {passes.length > 0 ? (
          /* ── SUCCESS: DAY 3 VVIP PASS ISSUED ── */
          <div className="space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
              <CheckCircle2 className="size-4" />
              Day 3 VVIP Pass Issued &amp; Saved
            </div>
            <div className="grid gap-6 justify-center grid-cols-1 max-w-sm mx-auto">
              {passes.map((pass) => (
                <div key={pass.passCode} className="flex justify-center">
                  <IdAccessCard pass={pass} isBuyer={true} />
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
              <Button
                asChild
                className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs px-5 py-2.5 shadow-sm cursor-pointer"
              >
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="mr-1.5 size-4" /> Save Pass on WhatsApp
                </a>
              </Button>
              <Button
                onClick={() => forceDownloadAllPasses(passes)}
                variant="outline"
                className="border-gold/50 text-gold font-semibold text-xs px-5 py-2.5 hover:bg-gold/10 cursor-pointer"
              >
                <Download className="mr-2 size-4" /> Re-Download All Cards
              </Button>
              <Button
                onClick={() => {
                  setPasses([]);
                  setCode("");
                  setHolderName("");
                }}
                variant="outline"
                className="border-line text-ivory text-xs px-5 py-2.5 hover:bg-white/10 cursor-pointer"
              >
                Redeem Another Code
              </Button>
            </div>
          </div>
        ) : (
          /* ── REDEMPTION FORM ── */
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border-2 border-gold/50 bg-[#1C1605] p-5 sm:p-8 space-y-6 shadow-2xl"
          >
            {errorMsg && (
              <div className="rounded-lg border border-red-500/60 bg-red-950/60 p-3 text-xs text-red-100">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center gap-2">
              <KeyRound className="size-5 text-gold" />
              <h2 className="font-display text-lg sm:text-xl font-bold text-ivory">
                Invitation &amp; Guest Details
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="invFirstName" className="text-xs font-semibold text-gold">
                  First Name *
                </Label>
                <Input
                  id="invFirstName"
                  required
                  placeholder="e.g. Adebayo"
                  className="bg-black border-gold/30 text-ivory placeholder:text-ivory/40"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invLastName" className="text-xs font-semibold text-gold">
                  Last Name *
                </Label>
                <Input
                  id="invLastName"
                  required
                  placeholder="e.g. Adeleke"
                  className="bg-black border-gold/30 text-ivory placeholder:text-ivory/40"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="invEmail" className="text-xs font-semibold text-gold">
                  Email Address *
                </Label>
                <Input
                  id="invEmail"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="bg-black border-gold/30 text-ivory placeholder:text-ivory/40"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invPhone" className="text-xs font-semibold text-gold">
                  WhatsApp Phone Number *
                </Label>
                <Input
                  id="invPhone"
                  type="tel"
                  required
                  placeholder="e.g. 0803 123 4567"
                  className="bg-black border-gold/30 text-ivory placeholder:text-ivory/40"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-4 border-t border-gold/25">
              <Label htmlFor="invCode" className="text-xs font-semibold text-gold">
                Special VIP Invitation Code *
              </Label>
              <Input
                id="invCode"
                required
                autoComplete="off"
                placeholder="Enter the code printed on your invitation"
                className="bg-black border-gold/40 text-ivory uppercase font-mono tracking-wider placeholder:text-ivory/40"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().trim())}
              />
              <p className="text-[11px] text-ivory/60">
                Your code is printed on the official invitation. It is verified on our servers and
                admits one guest to the Day 3 Grand Finale.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-deep text-black hover:bg-gold-light font-display text-sm font-black py-4 rounded-xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 border-2 border-gold-deep"
            >
              {loading ? (
                "Verifying Invitation Code..."
              ) : (
                <>
                  <ShieldCheck className="size-4" />
                  <span>Redeem Code &amp; Issue Day 3 VVIP Pass →</span>
                </>
              )}
            </Button>

            <p className="text-center text-[11px] text-ivory/60">
              Passes are immediately downloaded to your phone and saved on this page. Device-locked
              and non-transferable.
            </p>

            <div className="flex items-center justify-center gap-2 pt-1">
              <Badge
                variant="outline"
                className="border-gold/50 text-gold text-[10px] uppercase"
              >
                Complimentary Day 3 Admission
              </Badge>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

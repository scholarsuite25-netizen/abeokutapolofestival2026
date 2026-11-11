"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Globe,
  DollarSign,
  TrendingUp,
  Share2,
  Copy,
  Check,
  Building2,
  Users,
  Award,
  Crown,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  Smartphone,
  Send,
  HelpCircle,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AFFILIATE_COMMISSION_RATE,
  AFFILIATE_COMMISSION_TIERS,
  SUPPORTED_AFFILIATE_COUNTRIES,
  TICKETING_AGENCIES,
  getPromoTemplates,
} from "@/lib/config/affiliates-config";
import { submitAffiliateRegistration } from "@/app/(public)/register/actions";

export function AffiliatesCentreClient() {
  const router = useRouter();

  // Registration Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [payoutChannel, setPayoutChannel] = useState<"nuban" | "wire_iban" | "paypal">("nuban");

  // Payout Details
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [swiftBic, setSwiftBic] = useState("");
  const [iban, setIban] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Commission Calculator State
  const [calcKings, setCalcKings] = useState(1);
  const [calcRoyal, setCalcRoyal] = useState(2);
  const [calcQueens, setCalcQueens] = useState(2);
  const [calcPremium, setCalcPremium] = useState(3);
  const [calcIndividual, setCalcIndividual] = useState(10);

  // Calculate projected earnings (10% of official brochure values: 5M, 3M, 2M, 500K, 50K)
  const projectedEarningsNgn =
    calcKings * 500_000 +
    calcRoyal * 300_000 +
    calcQueens * 200_000 +
    calcPremium * 50_000 +
    calcIndividual * 5_000;

  const samplePromoCode = "AFF-POLO-SAMPLE";
  const siteUrl = typeof window !== "undefined"
    ? window.location.origin
    : "https://abeokuta-polo-festival-2026.vercel.app";
  const promoTemplates = getPromoTemplates(samplePromoCode, siteUrl);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage("Please complete all required contact fields.");
      return;
    }

    setLoading(true);
    const res = await submitAffiliateRegistration({
      fullName,
      email,
      phone,
      country,
      payoutChannel,
      bankName,
      accountNumber,
      accountName: accountName || fullName,
      swiftBic,
      iban,
      paypalEmail,
    });

    setLoading(false);
    if (res.success && res.affiliateCode) {
      try {
        localStorage.setItem("abk_affiliate_code", res.affiliateCode);
        localStorage.setItem("abk_affiliate_name", res.fullName || fullName);
      } catch {
        // Non-blocking
      }
      router.push(`/affiliates/dashboard?code=${res.affiliateCode}`);
    } else {
      setErrorMessage(res.error || "Failed to register affiliate account.");
    }
  };

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(id);
      setTimeout(() => setCopiedItem(null), 2500);
    } catch {
      // Non-blocking
    }
  };

  return (
    <div className="w-full bg-[#001A0E] text-ivory py-10 sm:py-16 px-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-12 sm:space-y-16">
        {/* ── 1. Hero Section (Solid Black Luxury Card) ────────────────────── */}
        <div className="rounded-3xl border-2 border-gold-deep/80 bg-black p-6 sm:p-12 text-center space-y-5 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-deep/80 bg-gold-deep/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold shadow-sm">
            <Globe className="size-4 text-gold" />
            <span>International Affiliate & Ambassador Network</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-ivory tracking-tight leading-tight">
            Earn 10% Commission on Every Confirmed Pass & VIP Table
          </h1>

          <p className="text-sm sm:text-base text-ivory/80 leading-relaxed max-w-2xl mx-auto">
            Welcome to the official <strong>Abeokuta Polo Festival 2026 International Affiliate Centre</strong>. 
            Partner with Nigeria&apos;s most prestigious cultural and sporting showcase. Monetize your diaspora network, corporate relationships, and social audience with guaranteed 10% payouts.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="bg-gold-deep text-black font-bold hover:bg-gold-light px-6 py-2.5 text-sm border border-gold-deep shadow-md">
              <a href="#register-section">
                Register as an Affiliate →
              </a>
            </Button>
            <Button asChild className="bg-gold-deep hover:bg-gold-light text-black font-bold px-5 py-2.5 text-sm border border-gold-deep shadow-md">
              <Link href="/affiliates/dashboard">
                Existing Affiliate Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Golden Demarcation Line */}
        <div className="w-full my-6 sm:my-8">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-deep to-transparent" />
          <div className="h-px w-full bg-gold/30 mt-0.5" />
        </div>

        {/* ── 2. Commission Value Matrix ────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-ivory flex items-center gap-2">
                <Crown className="size-5 text-gold" />
                <span>10% Commission Matrix Across All Categories</span>
              </h2>
              <p className="text-xs text-ivory/70">
                You earn a direct 10% commission on any category of confirmed tickets or private tables sold through your referral link.
              </p>
            </div>
            <Badge className="bg-gold-deep text-black font-bold text-xs uppercase self-start sm:self-auto border border-gold-deep">
              Guaranteed 10% Rate
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AFFILIATE_COMMISSION_TIERS.map((tier) => (
              <div
                key={tier.categoryName}
                className="rounded-2xl border border-gold/40 bg-[#062415] p-5 space-y-3 hover:border-gold transition-colors flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gold-deep">
                      Category
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      10% Payout
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-ivory">
                    {tier.categoryName}
                  </h3>
                  <p className="text-[11px] text-ivory/70 leading-snug">
                    {tier.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-line/30 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ivory/60">Official Value:</span>
                    <strong className="text-ivory font-mono">
                      ₦{tier.officialPackageValueNgn.toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gold font-bold">Your 10% Commission:</span>
                    <strong className="text-gold font-mono text-base font-black">
                      ₦{tier.officialCommissionNgn.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Golden Demarcation Line */}
        <div className="w-full my-6 sm:my-8">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-deep to-transparent" />
          <div className="h-px w-full bg-gold/30 mt-0.5" />
        </div>

        {/* ── 3. Interactive Earnings Calculator ────────────────────────────── */}
        <div className="rounded-2xl border-2 border-gold/50 bg-[#1C1605] p-5 sm:p-8 space-y-6 shadow-2xl">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-gold text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="size-4" />
              <span>Projected Earnings Calculator</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-ivory">
              Estimate Your Total Affiliate Earnings
            </h2>
            <p className="text-xs text-ivory/70">
              Adjust the sliders below to see your potential 10% commission across confirmed table packages and VIP passes.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Kings Table Slider */}
            <div className="space-y-2 bg-[#00210E] p-4 rounded-xl border border-line/40">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-ivory">The Kings Table (₦5M)</span>
                <span className="font-mono text-gold font-bold">{calcKings} Sold</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={calcKings}
                onChange={(e) => setCalcKings(Number(e.target.value))}
                className="w-full accent-[#C9A84C]"
              />
              <span className="text-[10px] text-ivory/60 block">₦500,000 comm. each (10 Guests)</span>
            </div>

            {/* Royal Table Slider */}
            <div className="space-y-2 bg-[#00210E] p-4 rounded-xl border border-line/40">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-ivory">The Royal Table (₦3M)</span>
                <span className="font-mono text-gold font-bold">{calcRoyal} Sold</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={calcRoyal}
                onChange={(e) => setCalcRoyal(Number(e.target.value))}
                className="w-full accent-[#C9A84C]"
              />
              <span className="text-[10px] text-ivory/60 block">₦300,000 comm. each (8 Guests)</span>
            </div>

            {/* Queens Table Slider */}
            <div className="space-y-2 bg-[#00210E] p-4 rounded-xl border border-line/40">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-ivory">The Queens Table (₦2M)</span>
                <span className="font-mono text-gold font-bold">{calcQueens} Sold</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={calcQueens}
                onChange={(e) => setCalcQueens(Number(e.target.value))}
                className="w-full accent-[#C9A84C]"
              />
              <span className="text-[10px] text-ivory/60 block">₦200,000 comm. each (6 Guests)</span>
            </div>

            {/* Premium Table Slider */}
            <div className="space-y-2 bg-[#00210E] p-4 rounded-xl border border-line/40">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-ivory">The Premium Table (₦500K)</span>
                <span className="font-mono text-gold font-bold">{calcPremium} Sold</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={calcPremium}
                onChange={(e) => setCalcPremium(Number(e.target.value))}
                className="w-full accent-[#C9A84C]"
              />
              <span className="text-[10px] text-ivory/60 block">₦50,000 comm. each (5 Guests)</span>
            </div>

            {/* Regular Section Slider */}
            <div className="space-y-2 bg-[#00210E] p-4 rounded-xl border border-line/40">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-ivory">The Regular Section (₦50K)</span>
                <span className="font-mono text-gold font-bold">{calcIndividual} Sold</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={calcIndividual}
                onChange={(e) => setCalcIndividual(Number(e.target.value))}
                className="w-full accent-[#C9A84C]"
              />
              <span className="text-[10px] text-ivory/60 block">₦5,000 comm. each (Per Person)</span>
            </div>

            {/* Total Projected Earnings Display Box */}
            <div className="bg-gradient-to-br from-gold/25 to-gold/10 p-5 rounded-xl border-2 border-gold flex flex-col justify-center text-center">
              <span className="text-[11px] uppercase font-black text-gold tracking-widest">
                Projected 10% Earnings
              </span>
              <p className="font-display text-2xl sm:text-3xl font-black text-ivory mt-1">
                ₦{projectedEarningsNgn.toLocaleString()}
              </p>
              <span className="text-[10px] text-ivory/70 mt-1">
                Disbursed directly via your preferred payout method
              </span>
            </div>
          </div>
        </div>

        {/* Golden Demarcation Line */}
        <div className="w-full my-6 sm:my-8">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-deep to-transparent" />
          <div className="h-px w-full bg-gold/30 mt-0.5" />
        </div>

        {/* ── 4. Affiliate Registration & Onboarding Form ─────────────────── */}
        <div id="register-section" className="rounded-2xl border-2 border-gold/50 bg-[#062415] p-5 sm:p-8 space-y-6 shadow-2xl scroll-mt-24">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-gold text-xs font-bold uppercase tracking-wider">
              <Award className="size-4" />
              <span>International Onboarding</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ivory">
              Register for Your Official Affiliate Tracking Code
            </h2>
            <p className="text-xs text-ivory/70">
              Immediate activation. Upon submission, you will receive your unique tracking code and personalized referral links.
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-500 bg-red-950/80 p-3.5 text-red-200 text-xs flex items-start gap-2.5">
              <span className="text-red-400 font-bold">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="aff-fn" className="text-xs font-semibold text-ivory">
                  Full Name / Organization *
                </Label>
                <Input
                  id="aff-fn"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Chief Adeleke Johnson"
                  className="bg-[#001A0E] border-line text-ivory focus:border-gold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="aff-em" className="text-xs font-semibold text-ivory">
                  Email Address *
                </Label>
                <Input
                  id="aff-em"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. adeleke@affiliate.com"
                  className="bg-[#001A0E] border-line text-ivory focus:border-gold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="aff-ph" className="text-xs font-semibold text-ivory">
                  WhatsApp Phone Number *
                </Label>
                <Input
                  id="aff-ph"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +234 803 123 4567 or +44 7911 123456"
                  className="bg-[#001A0E] border-line text-ivory focus:border-gold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="aff-country" className="text-xs font-semibold text-ivory">
                  Country / Operating Territory *
                </Label>
                <select
                  id="aff-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-md border border-line bg-[#001A0E] px-3 py-2 text-xs text-ivory focus:border-gold outline-none"
                >
                  {SUPPORTED_AFFILIATE_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name} className="bg-[#00210E] text-ivory">
                      {c.name} ({c.currency})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payout Channel Selection */}
            <div className="space-y-3 pt-2">
              <Label className="text-xs font-bold text-gold uppercase tracking-wider block">
                Preferred Payout Channel for 10% Commissions
              </Label>
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setPayoutChannel("nuban")}
                  className={`rounded-xl p-3 text-left border transition-all cursor-pointer ${
                    payoutChannel === "nuban"
                      ? "border-gold bg-gold/15 font-bold"
                      : "border-line/40 bg-[#001A0E] hover:border-gold/40"
                  }`}
                >
                  <span className="text-xs text-ivory block">Nigerian Bank (NUBAN)</span>
                  <span className="text-[10px] text-ivory/60 block mt-0.5">NGN Direct Settlement</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutChannel("wire_iban")}
                  className={`rounded-xl p-3 text-left border transition-all cursor-pointer ${
                    payoutChannel === "wire_iban"
                      ? "border-gold bg-gold/15 font-bold"
                      : "border-line/40 bg-[#001A0E] hover:border-gold/40"
                  }`}
                >
                  <span className="text-xs text-ivory block">International Wire / IBAN</span>
                  <span className="text-[10px] text-ivory/60 block mt-0.5">USD, GBP, EUR Wire Transfer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutChannel("paypal")}
                  className={`rounded-xl p-3 text-left border transition-all cursor-pointer ${
                    payoutChannel === "paypal"
                      ? "border-gold bg-gold/15 font-bold"
                      : "border-line/40 bg-[#001A0E] hover:border-gold/40"
                  }`}
                >
                  <span className="text-xs text-ivory block">PayPal Global</span>
                  <span className="text-[10px] text-ivory/60 block mt-0.5">Instant PayPal Email Remittance</span>
                </button>
              </div>

              {/* Dynamic Payout Fields */}
              {payoutChannel === "nuban" && (
                <div className="grid gap-3 sm:grid-cols-3 pt-2 bg-[#001A0E] p-4 rounded-xl border border-line/40">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-ivory">Bank Name</Label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Access Bank / GTBank"
                      className="bg-[#062415] border-line text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-ivory">Account Number (10 Digits)</Label>
                    <Input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="0123456789"
                      maxLength={10}
                      className="bg-[#062415] border-line font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-ivory">Account Name</Label>
                    <Input
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="e.g. Adeleke Johnson"
                      className="bg-[#062415] border-line text-xs"
                    />
                  </div>
                </div>
              )}

              {payoutChannel === "wire_iban" && (
                <div className="grid gap-3 sm:grid-cols-3 pt-2 bg-[#001A0E] p-4 rounded-xl border border-line/40">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-ivory">Beneficiary Bank Name</Label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Barclays / Chase"
                      className="bg-[#062415] border-line text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-ivory">SWIFT / BIC Code</Label>
                    <Input
                      value={swiftBic}
                      onChange={(e) => setSwiftBic(e.target.value.toUpperCase())}
                      placeholder="BARCGB22"
                      className="bg-[#062415] border-line font-mono text-xs uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-ivory">IBAN / Account Number</Label>
                    <Input
                      value={iban}
                      onChange={(e) => setIban(e.target.value.toUpperCase())}
                      placeholder="GB29BARC20201531488526"
                      className="bg-[#062415] border-line font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {payoutChannel === "paypal" && (
                <div className="space-y-1 pt-2 bg-[#001A0E] p-4 rounded-xl border border-line/40">
                  <Label className="text-[11px] text-ivory">PayPal Account Email</Label>
                  <Input
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="paypal@yourbusiness.com"
                    className="bg-[#062415] border-line text-xs"
                  />
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-deep text-black hover:bg-gold-light font-display text-base font-black py-6 rounded-xl shadow-xl transition-all cursor-pointer border-2 border-gold-deep"
            >
              {loading ? "Generating Your Affiliate Portal..." : "Join International Affiliate Centre →"}
            </Button>
          </form>
        </div>

        {/* Golden Demarcation Line */}
        <div className="w-full my-6 sm:my-8">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-deep to-transparent" />
          <div className="h-px w-full bg-gold/30 mt-0.5" />
        </div>

        {/* ── 5. Ticket Sales Promotion & Advertising Kit ─────────────────── */}
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-gold text-xs font-bold uppercase tracking-wider">
              <Megaphone className="size-4" />
              <span>Marketing & Sales Enablement</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ivory">
              Ticket Sales Promotion & Advertising Kit
            </h2>
            <p className="text-xs text-ivory/70">
              Ready-made promotional materials to share with high-net-worth individuals, polo enthusiasts, and corporate leaders.
            </p>
          </div>

          <Tabs defaultValue="whatsapp" className="w-full">
            <TabsList className="bg-[#062415] border border-line/50 p-1 flex flex-wrap gap-1">
              <TabsTrigger value="whatsapp" className="text-xs data-[state=active]:bg-gold data-[state=active]:text-forest">
                WhatsApp Broadcasts
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="text-xs data-[state=active]:bg-gold data-[state=active]:text-forest">
                LinkedIn Executive
              </TabsTrigger>
              <TabsTrigger value="social" className="text-xs data-[state=active]:bg-gold data-[state=active]:text-forest">
                X / Instagram
              </TabsTrigger>
              <TabsTrigger value="banners" className="text-xs data-[state=active]:bg-gold data-[state=active]:text-forest">
                Digital Banners & Embeds
              </TabsTrigger>
            </TabsList>

            {/* WhatsApp Templates */}
            <TabsContent value="whatsapp" className="pt-4 space-y-4">
              <div className="rounded-2xl border border-line/40 bg-[#062415] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-ivory">
                    WhatsApp VIP Table Broadcast Template
                  </h3>
                  <Button
                    onClick={() => copyText(promoTemplates[0].copyText, "wa-promo")}
                    size="sm"
                    className="bg-gold-deep hover:bg-gold-light text-black font-bold text-xs h-8 border border-gold-deep px-3 shadow-sm"
                  >
                    {copiedItem === "wa-promo" ? (
                      <>
                        <Check className="size-3 mr-1 text-black font-bold" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3 mr-1" /> Copy Broadcast
                      </>
                    )}
                  </Button>
                </div>
                <pre className="rounded-xl bg-[#001A0E] p-4 font-sans text-xs text-ivory/90 whitespace-pre-wrap leading-relaxed border border-line/30 overflow-x-auto">
                  {promoTemplates[0].copyText}
                </pre>
              </div>
            </TabsContent>

            {/* LinkedIn Templates */}
            <TabsContent value="linkedin" className="pt-4 space-y-4">
              <div className="rounded-2xl border border-line/40 bg-[#062415] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-ivory">
                    LinkedIn Executive Invitation Template
                  </h3>
                  <Button
                    onClick={() => copyText(promoTemplates[1].copyText, "li-promo")}
                    size="sm"
                    className="bg-gold-deep hover:bg-gold-light text-black font-bold text-xs h-8 border border-gold-deep px-3 shadow-sm"
                  >
                    {copiedItem === "li-promo" ? (
                      <>
                        <Check className="size-3 mr-1 text-black font-bold" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3 mr-1" /> Copy Text
                      </>
                    )}
                  </Button>
                </div>
                <pre className="rounded-xl bg-[#001A0E] p-4 font-sans text-xs text-ivory/90 whitespace-pre-wrap leading-relaxed border border-line/30 overflow-x-auto">
                  {promoTemplates[1].copyText}
                </pre>
              </div>
            </TabsContent>

            {/* Social Media Templates */}
            <TabsContent value="social" className="pt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-line/40 bg-[#062415] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-ivory">X (Twitter) Post</h3>
                    <Button
                      onClick={() => copyText(promoTemplates[2].copyText, "x-promo")}
                      size="sm"
                      className="bg-gold-deep hover:bg-gold-light text-black font-bold text-xs h-8 border border-gold-deep px-3 shadow-sm"
                    >
                      {copiedItem === "x-promo" ? <Check className="size-3 text-black font-bold" /> : <Copy className="size-3" />}
                    </Button>
                  </div>
                  <pre className="rounded-xl bg-[#001A0E] p-3 font-sans text-xs text-ivory/90 whitespace-pre-wrap border border-line/30">
                    {promoTemplates[2].copyText}
                  </pre>
                </div>

                <div className="rounded-2xl border border-line/40 bg-[#062415] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-ivory">Instagram Caption</h3>
                    <Button
                      onClick={() => copyText(promoTemplates[3].copyText, "ig-promo")}
                      size="sm"
                      className="bg-gold-deep hover:bg-gold-light text-black font-bold text-xs h-8 border border-gold-deep px-3 shadow-sm"
                    >
                      {copiedItem === "ig-promo" ? <Check className="size-3 text-black font-bold" /> : <Copy className="size-3" />}
                    </Button>
                  </div>
                  <pre className="rounded-xl bg-[#001A0E] p-3 font-sans text-xs text-ivory/90 whitespace-pre-wrap border border-line/30">
                    {promoTemplates[3].copyText}
                  </pre>
                </div>
              </div>
            </TabsContent>

            {/* Banners & Embeds */}
            <TabsContent value="banners" className="pt-4 space-y-4">
              <div className="rounded-2xl border border-line/40 bg-[#062415] p-5 space-y-4">
                <h3 className="font-display text-base font-bold text-ivory">
                  Embeddable Promo Badge Widget
                </h3>
                <p className="text-xs text-ivory/70">
                  Embed this responsive tournament badge directly on your blog, personal website, or media publication:
                </p>

                {/* Live Badge Preview */}
                <div className="p-4 rounded-xl border border-gold/40 bg-[#1C1605] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-gold-deep text-black flex items-center justify-center font-bold">
                      <Crown className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-bold text-ivory">
                        Abeokuta Polo Festival 2026 — The Blueprint
                      </h4>
                      <p className="text-[11px] text-gold font-medium">
                        18–20 Dec 2026 · Exclusive VIP Table Enclosures Open
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" className="bg-gold-deep hover:bg-gold-light text-black font-bold text-xs border border-gold-deep shadow-sm">
                    <Link href="/tables">Reserve VIP Table →</Link>
                  </Button>
                </div>

                {/* HTML Snippet */}
                <div className="space-y-1">
                  <Label className="text-[11px] text-ivory/70">HTML Embed Snippet</Label>
                  <pre className="rounded-xl bg-[#001A0E] p-3 font-mono text-[11px] text-gold/90 whitespace-pre-wrap border border-line/30">
{`<a href="${siteUrl}/tables?ref=${samplePromoCode}" target="_blank" style="display:inline-flex;align-items:center;padding:12px 20px;background:#002F1A;color:#C9A84C;border:2px solid #C9A84C;border-radius:12px;font-family:sans-serif;font-weight:bold;text-decoration:none;">
  👑 Reserve VIP Tables — Abeokuta Polo Festival 2026
</a>`}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Golden Demarcation Line */}
        <div className="w-full my-6 sm:my-8">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-deep to-transparent" />
          <div className="h-px w-full bg-gold/30 mt-0.5" />
        </div>

        {/* ── 6. Ticketing Agencies Directory (Nigeria & International) ────── */}
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-gold text-xs font-bold uppercase tracking-wider">
              <Building2 className="size-4" />
              <span>Global Industry Landscape</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ivory">
              Ticket Sales Agencies Directory (Nigeria & International)
            </h2>
            <p className="text-xs text-ivory/70">
              Comprehensive identification of leading ticket sales platforms, partner distributors, and box office networks.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TICKETING_AGENCIES.map((agency) => (
              <div
                key={agency.id}
                className="rounded-2xl border border-line/40 bg-[#062415] p-5 space-y-3 hover:border-gold transition-colors flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 border ${
                        agency.scope === "Nigeria"
                          ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                          : "bg-amber-950 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      {agency.scope} Agency
                    </Badge>
                    <span className="text-[10px] text-ivory/60">{agency.headquarters}</span>
                  </div>

                  <div>
                    <h3 className="font-display text-base font-bold text-ivory">{agency.name}</h3>
                    <p className="text-[11px] text-ivory/70 leading-snug mt-0.5">{agency.tagline}</p>
                  </div>

                  <ul className="space-y-1 pt-1 text-[11px] text-ivory/80">
                    {agency.keyStrengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-snug">
                        <CheckCircle2 className="size-3 text-gold shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-line/20 space-y-2">
                  <p className="text-[10px] text-gold-deep italic leading-tight">
                    💡 {agency.integrationNote}
                  </p>
                  <Button asChild size="sm" className="w-full bg-gold-deep hover:bg-gold-light text-black font-bold text-xs h-8 border border-gold-deep shadow-sm">
                    <a href={agency.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                      <span>Visit Agency Portal</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

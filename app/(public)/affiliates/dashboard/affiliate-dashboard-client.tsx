"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Crown,
  Globe,
  TrendingUp,
  DollarSign,
  Copy,
  Check,
  Share2,
  Users,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getAffiliateDashboardData,
  requestAffiliatePayout,
} from "@/app/(public)/register/actions";

export function AffiliateDashboardClient() {
  const searchParams = useSearchParams();

  const [affiliateCode, setAffiliateCode] = useState<string>("");
  const [codeInput, setCodeInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Initialize affiliate code from URL or localStorage
  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (codeParam) {
      setAffiliateCode(codeParam.toUpperCase().trim());
      setCodeInput(codeParam.toUpperCase().trim());
    } else {
      try {
        const stored = localStorage.getItem("abk_affiliate_code");
        if (stored) {
          setAffiliateCode(stored.toUpperCase().trim());
          setCodeInput(stored.toUpperCase().trim());
        }
      } catch {
        // Non-blocking
      }
    }
  }, [searchParams]);

  // Fetch dashboard data whenever affiliateCode changes
  useEffect(() => {
    if (!affiliateCode) return;
    setLoading(true);
    setErrorMessage(null);

    getAffiliateDashboardData(affiliateCode)
      .then((res) => {
        setLoading(false);
        if (res.success) {
          setDashboardData(res);
        } else {
          setErrorMessage(res.error || "Failed to load affiliate portal.");
        }
      })
      .catch((err) => {
        setLoading(false);
        setErrorMessage((err as Error)?.message || "Failed to load dashboard.");
      });
  }, [affiliateCode]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    const cleanCode = codeInput.trim().toUpperCase();
    setAffiliateCode(cleanCode);
    try {
      localStorage.setItem("abk_affiliate_code", cleanCode);
    } catch {
      // Non-blocking
    }
  };

  const handleRequestPayout = async () => {
    if (!affiliateCode || !dashboardData) return;
    const amount = dashboardData.metrics?.availableBalanceNgn || 0;
    if (amount <= 0) {
      setPayoutMessage("Your current confirmed balance is ₦0.00. Commissions become available once sales are confirmed.");
      return;
    }

    setLoading(true);
    const res = await requestAffiliatePayout(affiliateCode, amount);
    setLoading(false);
    if (res.success) {
      setPayoutMessage(res.message);
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLabel(label);
      setTimeout(() => setCopiedLabel(null), 2500);
    } catch {
      // Non-blocking
    }
  };

  const siteUrl = typeof window !== "undefined"
    ? window.location.origin
    : "https://abeokuta-polo-festival-2026.vercel.app";

  const tableReferralLink = `${siteUrl}/tables?ref=${affiliateCode || "AFF-POLO"}`;
  const registerReferralLink = `${siteUrl}/register?ref=${affiliateCode || "AFF-POLO"}`;

  return (
    <div className="w-full bg-[#001A0E] text-ivory py-10 sm:py-16 px-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10 sm:space-y-12">
        {/* Top Header - Solid Black Luxury Banner */}
        <div className="rounded-3xl border-2 border-gold-deep/80 bg-black p-6 sm:p-10 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-deep/80 bg-gold-deep/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
              <Globe className="size-4" />
              <span>International Affiliate Portal</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-black text-ivory">
              Affiliate Partner Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-ivory/80">
              Real-time referral performance, 10% commission ledger, and Secretariat bursary disbursements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button asChild className="bg-gold-deep hover:bg-gold-light text-black font-bold text-xs border border-gold-deep px-4 py-2 shadow-sm">
              <Link href="/affiliates">Affiliate Info & Promo Kit</Link>
            </Button>
            <Button asChild className="bg-gold-deep hover:bg-gold-light text-black font-bold text-xs border border-gold-deep px-4 py-2 shadow-sm">
              <Link href="/tables">VIP Tables</Link>
            </Button>
          </div>
        </div>

        {/* Golden Demarcation Line */}
        <div className="w-full my-4 sm:my-6">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-deep to-transparent" />
          <div className="h-px w-full bg-gold/30 mt-0.5" />
        </div>

        {/* Affiliate Code Lookup Bar (if not set or switching) */}
        <form onSubmit={handleLookup} className="rounded-2xl border border-gold-deep/40 bg-[#062415] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 text-xs text-ivory/90 w-full sm:w-auto">
            <span className="font-bold text-gold">Active Tracking Code:</span>
            <span className="font-mono font-bold text-gold bg-[#001A0E] px-2.5 py-1 rounded border border-gold-deep/50">
              {affiliateCode || "Not Connected"}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="Enter AFF-POLO-XXXX"
              className="font-mono text-xs uppercase bg-[#001A0E] border-line w-full sm:w-48 text-center"
            />
            <Button type="submit" size="sm" className="bg-gold-deep hover:bg-gold-light text-black font-bold text-xs shrink-0 border border-gold-deep px-3 shadow-sm">
              Switch Code
            </Button>
          </div>
        </form>

        {errorMessage && (
          <div className="rounded-xl border border-red-500 bg-red-950/80 p-4 text-red-200 text-xs flex items-center gap-2.5">
            <AlertTriangle className="size-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ── KPI Cards Grid ──────────────────────────────────────────────── */}
        {dashboardData && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Link Clicks */}
            <div className="rounded-2xl border border-line/40 bg-[#062415] p-5 space-y-2">
              <div className="flex items-center justify-between text-ivory/60 text-xs">
                <span>Unique Link Clicks</span>
                <Globe className="size-4 text-gold" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-black text-ivory">
                {dashboardData.metrics?.totalClicks ?? 0}
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold block">
                Tracked across all referral links
              </span>
            </div>

            {/* Confirmed Sales */}
            <div className="rounded-2xl border border-line/40 bg-[#062415] p-5 space-y-2">
              <div className="flex items-center justify-between text-ivory/60 text-xs">
                <span>Confirmed Referrals</span>
                <Users className="size-4 text-gold" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-black text-ivory">
                {dashboardData.metrics?.confirmedSalesCount ?? 0}
              </p>
              <span className="text-[10px] text-ivory/60 block">
                VIP Tables & Individual Passes
              </span>
            </div>

            {/* Total Sales Volume */}
            <div className="rounded-2xl border border-line/40 bg-[#062415] p-5 space-y-2">
              <div className="flex items-center justify-between text-ivory/60 text-xs">
                <span>Gross Volume Generated</span>
                <TrendingUp className="size-4 text-gold" />
              </div>
              <p className="font-display text-xl sm:text-2xl font-black text-gold">
                ₦{(dashboardData.metrics?.totalSalesVolumeNgn ?? 0).toLocaleString()}
              </p>
              <span className="text-[10px] text-ivory/60 block">
                Official package values credited
              </span>
            </div>

            {/* Confirmed 10% Commission */}
            <div className="rounded-2xl border-2 border-gold bg-[#1C1605] p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-gold text-xs font-bold uppercase tracking-wider">
                <span>10% Earned Commission</span>
                <Sparkles className="size-4 text-gold" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-black text-ivory">
                ₦{(dashboardData.metrics?.confirmedCommissionNgn ?? 0).toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-400 font-bold block">
                Ready for Secretariat Bursary payout
              </span>
            </div>
          </div>
        )}

        {/* ── Your Unique Referral Links ───────────────────────────────────── */}
        <div className="rounded-2xl border border-gold/40 bg-[#062415] p-5 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/20 pb-3">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-ivory flex items-center gap-2">
                <Share2 className="size-5 text-gold" />
                <span>Your Personalized 10% Referral Links</span>
              </h2>
              <p className="text-xs text-ivory/70">
                Share these links on WhatsApp, LinkedIn, email, or your social bio. Anyone purchasing through your link earns you 10%!
              </p>
            </div>
            <Badge className="bg-gold text-forest font-bold text-xs uppercase self-start sm:self-auto">
              10% Commission Coded
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* VIP Tables Link */}
            <div className="space-y-2 rounded-xl bg-[#001A0E] p-4 border border-line/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gold flex items-center gap-1.5">
                  <Crown className="size-4" /> VIP Table Packages (₦1.5M – ₦10M)
                </span>
                <span className="text-[10px] text-ivory/60">10% comm: ₦150k – ₦1M</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={tableReferralLink}
                  className="bg-[#062415] border-line font-mono text-xs text-ivory/90 truncate"
                />
                <Button
                  onClick={() => copyText(tableReferralLink, "tbl-link")}
                  size="sm"
                  className="bg-gold-deep hover:bg-gold-light text-black font-bold text-xs h-9 px-3 shrink-0 border border-gold-deep shadow-sm"
                >
                  {copiedLabel === "tbl-link" ? <Check className="size-3.5 text-black font-bold" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
            </div>

            {/* General Pass Link */}
            <div className="space-y-2 rounded-xl bg-[#001A0E] p-4 border border-line/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gold flex items-center gap-1.5">
                  <ShieldCheck className="size-4" /> Passes & Day 3 VVIP (₦50,000)
                </span>
                <span className="text-[10px] text-ivory/60">10% comm: ₦5,000</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={registerReferralLink}
                  className="bg-[#062415] border-line font-mono text-xs text-ivory/90 truncate"
                />
                <Button
                  onClick={() => copyText(registerReferralLink, "reg-link")}
                  size="sm"
                  className="bg-gold-deep hover:bg-gold-light text-black font-bold text-xs h-9 px-3 shrink-0 border border-gold-deep shadow-sm"
                >
                  {copiedLabel === "reg-link" ? <Check className="size-3.5 text-black font-bold" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Golden Demarcation Line */}
        <div className="w-full my-4 sm:my-6">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-deep to-transparent" />
          <div className="h-px w-full bg-gold/30 mt-0.5" />
        </div>

        {/* ── Commission Payout Card ───────────────────────────────────────── */}
        <div className="rounded-2xl border-2 border-gold/40 bg-[#1C1605] p-5 sm:p-7 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gold-deep">
                Available Commission Balance
              </span>
              <p className="font-display text-2xl sm:text-3xl font-black text-ivory">
                ₦{(dashboardData?.metrics?.availableBalanceNgn ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-ivory/70">
                Disbursements are processed directly by the Abeokuta Polo Club Secretariat Bursary.
              </p>
            </div>

            <Button
              onClick={handleRequestPayout}
              disabled={loading || (dashboardData?.metrics?.availableBalanceNgn ?? 0) <= 0}
              className="bg-gold-deep hover:bg-gold-light text-black font-bold px-6 py-2.5 text-sm shrink-0 border border-gold-deep shadow-md"
            >
              <Wallet className="mr-2 size-4" /> Request Commission Payout
            </Button>
          </div>

          {payoutMessage && (
            <div className="rounded-xl border border-emerald-500 bg-emerald-950/80 p-3.5 text-emerald-200 text-xs">
              {payoutMessage}
            </div>
          )}
        </div>

        {/* Golden Demarcation Line */}
        <div className="w-full my-4 sm:my-6">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-deep to-transparent" />
          <div className="h-px w-full bg-gold/30 mt-0.5" />
        </div>

        {/* ── Commission Ledger (Recent Referral Transactions) ────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-ivory flex items-center gap-2">
              <Clock className="size-5 text-gold" />
              <span>Commission Referral Ledger</span>
            </h2>
            <Badge className="bg-forest text-gold border border-gold/40 text-xs font-bold">
              10% Guaranteed
            </Badge>
          </div>

          <div className="rounded-2xl border border-line/40 bg-[#062415] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#00210E] text-gold uppercase tracking-wider text-[10px] font-bold border-b border-line/40">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category / Item</th>
                    <th className="py-3 px-4">Buyer Affiliation</th>
                    <th className="py-3 px-4">Sale Value</th>
                    <th className="py-3 px-4">10% Commission</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/20 text-ivory/90">
                  {dashboardData?.referrals?.map((item: any, idx: number) => {
                    const isConfirmed = item.status === "confirmed";
                    return (
                      <tr key={item.id || idx} className="hover:bg-[#0B2C1B] transition-colors">
                        <td className="py-3 px-4 text-ivory/60 font-mono">
                          {new Date(item.created_at).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-ivory">
                          {item.category}
                        </td>
                        <td className="py-3 px-4 text-ivory/80">
                          {item.buyer_name}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          ₦{(item.official_value_ngn || item.sale_amount_ngn || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-gold">
                          +₦{(item.commission_amount_ngn || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            className={`text-[9px] uppercase font-bold tracking-wider ${
                              isConfirmed
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-500/50"
                                : "bg-amber-950 text-amber-300 border border-amber-500/50"
                            }`}
                          >
                            {isConfirmed ? "Confirmed ✓" : "Pending Verification"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Golden Demarcation Line */}
        <div className="w-full my-4 sm:my-6">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-deep to-transparent" />
          <div className="h-px w-full bg-gold/30 mt-0.5" />
        </div>

        {/* ── Quick Links to Marketing Kit & Agencies Directory ─────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="rounded-2xl border border-line/40 bg-[#062415] p-5 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-ivory">
                Promotional & Advertising Kit
              </h3>
              <p className="text-xs text-ivory/70">
                Ready-to-use WhatsApp templates, executive LinkedIn copies, and embeddable digital banners.
              </p>
            </div>
            <div className="pt-2">
              <Button asChild size="sm" className="bg-gold-deep hover:bg-gold-light text-black font-bold text-xs border border-gold-deep px-4 py-2 shadow-sm">
                <Link href="/affiliates#promo-section">Open Marketing Kit →</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-line/40 bg-[#062415] p-5 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-ivory">
                Ticketing Agencies Directory
              </h3>
              <p className="text-xs text-ivory/70">
                Explore profiles of leading ticketing agencies in Nigeria (Nairabox, Ariiya, Tix Africa) and Internationally (Eventbrite, Ticketmaster).
              </p>
            </div>
            <div className="pt-2">
              <Button asChild size="sm" className="bg-gold-deep hover:bg-gold-light text-black font-bold text-xs border border-gold-deep px-4 py-2 shadow-sm">
                <Link href="/affiliates#agencies-section">View Agency Directory →</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

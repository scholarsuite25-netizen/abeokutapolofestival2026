"use client";

import { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  ShieldCheck,
  Download,
  Printer,
  Sparkles,
  ExternalLink,
  Crown,
  CheckCircle2,
  Calendar,
  MapPin,
  MessageCircle,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { forceDownloadOfflinePassCard, type StoredPass } from "@/lib/storage/pass-storage";

interface IdAccessCardProps {
  pass: StoredPass;
  showActions?: boolean;
  className?: string;
}

export function IdAccessCard({ pass, showActions = true, className = "" }: IdAccessCardProps) {
  const [downloaded, setDownloaded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isGold = pass.isVvip || pass.designTheme === "gold" || pass.passTier === "vvip_day3";
  const isSponsored = Boolean(pass.isSponsored || pass.holderName.toLowerCase().startsWith("sponsored invitation"));
  const serialText = pass.serialLabel || (pass.totalTickets && pass.totalTickets > 1 && pass.ticketIndex ? `Ticket ${pass.ticketIndex} of ${pass.totalTickets}` : "");

  const handleDownload = () => {
    forceDownloadOfflinePassCard(pass);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleCopyGuestLink = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://abeokuta-polo-festival-2026.vercel.app";
    const passUrl = `${origin}/pass/${pass.passCode}`;
    try {
      await navigator.clipboard.writeText(passUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "https://abeokuta-polo-festival-2026.vercel.app";
  const passUrl = `${origin}/pass/${pass.passCode}`;
  const whatsappShareText = isSponsored
    ? `👑 *Official VVIP Guest Invitation — 2026 Abeokuta Polo Festival*\n\nYou have been gifted a sponsored VVIP gate access ticket to the Royal Cup Grand Finale (Day 3 — Sunday 20 Dec 2026) at Abeokuta Polo Club!\n\n🎟️ *Pass Serial:* ${serialText || "VIP Invitation"}\n👤 *${pass.holderName}*\n🔑 *Pass Code:* ${pass.passCode}\n\n👉 *Click to open and save your digital gate card directly to your phone:* ${passUrl}`
    : `🏇 *Official Gate Access Card — 2026 Abeokuta Polo Festival*\n\nGate accreditation pass for *${pass.holderName}* (${serialText || "Official Pass"}).\n🔑 *Pass Code:* ${pass.passCode}\n\n👉 *Open and save your pass:* ${passUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappShareText)}`;

  const daysLabel = pass.daysCovered && pass.daysCovered.length === 2
    ? "Day 1 & Day 2 (18–19 Dec)"
    : pass.daysCovered?.includes(3)
    ? "Day 3 (Sun 20 Dec 2026)"
    : pass.daysCovered?.includes(2)
    ? "Day 2 (Sat 19 Dec 2026)"
    : "Day 1 (Fri 18 Dec 2026)";

  const cardTitle = isGold
    ? isSponsored
      ? "Day 3 VVIP Guest Pass"
      : "Day 3 VVIP Grand Finale"
    : pass.daysCovered && pass.daysCovered.length === 2
    ? "Day 1 & 2 Dual Access Pass"
    : pass.daysCovered?.includes(2)
    ? "Day 2 Gate Access Pass"
    : "Day 1 Gate Access Pass";

  const admissionBadge = isGold
    ? isSponsored
      ? (serialText ? `SPONSORED GUEST · ${serialText}` : "SPONSORED GUEST")
      : (serialText ? `VVIP ADMISSION · ${serialText}` : "VVIP ROYAL ADMISSION")
    : pass.daysCovered && pass.daysCovered.length === 2
    ? "100% FREE · DUAL PASS"
    : "100% FREE ADMISSION";

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* ── REALISTIC COMPACT ID CARD (CR80 ID BADGE RATIO & SIZING) ── */}
      <div
        className={`relative w-full max-w-[300px] rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${
          isGold
            ? "border-2 border-[#C9A84C] bg-gradient-to-b from-[#1C1605] via-[#2A2007] to-[#120E03] text-[#FCF9F8]"
            : "border-2 border-forest/30 bg-card text-ink"
        }`}
      >
        {/* Lanyard punch-hole simulation */}
        <div className="pt-2 pb-0.5 flex justify-center">
          <div
            className={`h-1.5 w-10 rounded-full border ${
              isGold
                ? "bg-[#0B0902] border-[#5E4711]"
                : "bg-muted border-line"
            }`}
          />
        </div>

        {/* Card Header */}
        <div
          className={`px-3 py-2 text-center border-b ${
            isGold
              ? "bg-gradient-to-r from-[#241A04] via-[#3B2B08] to-[#241A04] border-[#C9A84C]/40 text-[#E5C768]"
              : "bg-forest border-gold/40 text-ivory"
          }`}
        >
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-black tracking-widest uppercase ${
                isGold
                  ? "bg-gradient-to-r from-[#B38F34] to-[#C9A84C] text-black shadow-xs"
                  : "bg-gold text-forest font-bold"
              }`}
            >
              {isGold && <Crown className="size-2 inline" />}
              {admissionBadge}
            </span>
          </div>
          <h3
            className={`font-serif text-sm font-bold leading-tight ${
              isGold ? "text-[#FDF6D8] tracking-wide" : "text-ivory"
            }`}
          >
            {cardTitle}
          </h3>
          <p
            className={`text-[9px] uppercase tracking-wider font-semibold mt-0.5 ${
              isGold ? "text-[#C9A84C]" : "text-gold"
            }`}
          >
            Abeokuta Polo Festival 2026
          </p>
        </div>

        {/* High-Security QR Presentation & Hologram */}
        <div
          className={`p-3 flex flex-col items-center justify-center text-center relative ${
            isGold ? "bg-[#140F04] border-b border-[#3D2E08]" : "bg-ivory border-b border-line/60"
          }`}
        >
          {/* Subtle Security Guilloche Background Watermark */}
          <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
            <Sparkles className="size-28 text-gold" />
          </div>

          <div
            className={`relative rounded-lg p-2 shadow-sm bg-white border-2 ${
              isGold ? "border-[#C9A84C]" : "border-forest"
            }`}
          >
            <QrCode className="size-24 text-black" />
            <div className="absolute -top-1.5 -right-1.5 rounded-full bg-emerald-600 text-white p-0.5 shadow">
              <CheckCircle2 className="size-3" />
            </div>
          </div>

          <div
            className={`font-mono text-sm font-extrabold tracking-widest mt-1.5 ${
              isGold ? "text-[#E5C768]" : "text-forest"
            }`}
          >
            {pass.passCode}
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            <ShieldCheck className={`size-3 ${isGold ? "text-[#85E0A3]" : "text-emerald-700"}`} />
            <span
              className={`text-[9px] font-bold tracking-wider uppercase ${
                isGold ? "text-[#85E0A3]" : "text-emerald-800"
              }`}
            >
              Verified Digital ID
            </span>
          </div>
        </div>

        {/* Card Holder Details */}
        <div className={`px-3 py-2 space-y-1 text-[11px] ${isGold ? "text-[#E8DFD0]" : "text-ink"}`}>
          <div
            className={`flex justify-between items-center pb-1 border-b ${
              isGold ? "border-[#D4AF37]/20" : "border-line/60"
            }`}
          >
            <span
              className={`text-[9px] uppercase font-bold tracking-wider ${
                isGold ? "text-[#B8A375]" : "text-muted-brand"
              }`}
            >
              Pass Holder
            </span>
            <span className={`font-bold truncate max-w-[170px] text-right ${isGold ? "text-[#FFFFFF]" : "text-forest"}`}>
              {pass.holderName}
            </span>
          </div>

          {serialText && (
            <div
              className={`flex justify-between items-center pb-1 border-b ${
                isGold ? "border-[#D4AF37]/20" : "border-line/60"
              }`}
            >
              <span
                className={`text-[9px] uppercase font-bold tracking-wider ${
                  isGold ? "text-[#B8A375]" : "text-muted-brand"
                }`}
              >
                Pass Serial
              </span>
              <span className={`font-mono font-bold ${isGold ? "text-[#E5C768]" : "text-forest"}`}>
                {serialText}
              </span>
            </div>
          )}

          {(pass.sponsorName || (isSponsored && pass.hostName)) && (
            <div
              className={`flex justify-between items-center pb-1 border-b ${
                isGold ? "border-[#D4AF37]/20" : "border-line/60"
              }`}
            >
              <span
                className={`text-[9px] uppercase font-bold tracking-wider ${
                  isGold ? "text-[#B8A375]" : "text-muted-brand"
                }`}
              >
                Sponsored By
              </span>
              <span className={`font-bold truncate max-w-[170px] text-right ${isGold ? "text-[#FFFFFF]" : "text-forest"}`}>
                {pass.sponsorName || pass.hostName}
              </span>
            </div>
          )}

          <div
            className={`flex justify-between items-center pb-1 border-b ${
              isGold ? "border-[#D4AF37]/20" : "border-line/60"
            }`}
          >
            <span
              className={`text-[9px] uppercase font-bold tracking-wider ${
                isGold ? "text-[#B8A375]" : "text-muted-brand"
              }`}
            >
              Days
            </span>
            <span className={`font-semibold flex items-center gap-1 ${isGold ? "text-[#E5C768]" : "text-forest"}`}>
              <Calendar className="size-2.5 text-gold-deep" />
              {daysLabel}
            </span>
          </div>

          <div
            className={`flex justify-between items-center pb-1 border-b ${
              isGold ? "border-[#C9A84C]/20" : "border-line/60"
            }`}
          >
            <span
              className={`text-[9px] uppercase font-bold tracking-wider ${
                isGold ? "text-[#C9A84C]" : "text-muted-brand"
              }`}
            >
              Access
            </span>
            <span className={`font-bold truncate max-w-[170px] text-right ${isGold ? "text-[#E5C768]" : "text-forest-interactive"}`}>
              {isGold ? "Royal Pavilion & Grandstand" : "Festival Grounds & Grandstand"}
            </span>
          </div>

          <div className="flex justify-between items-center pt-0.5">
            <span
              className={`text-[9px] uppercase font-bold tracking-wider ${
                isGold ? "text-[#C9A84C]" : "text-muted-brand"
              }`}
            >
              Venue
            </span>
            <span className="font-medium flex items-center gap-1 text-[10px]">
              <MapPin className="size-2.5 text-gold-deep" /> Abeokuta Polo Club Grounds
            </span>
          </div>

          {/* Security Foil Strip */}
          <div
            className={`mt-1.5 rounded-md px-2 py-1 text-[8px] flex items-center justify-between border ${
              isGold
                ? "bg-gradient-to-r from-[#2C2106] to-[#1A1404] border-[#B38F34]/60 text-[#E5C768]"
                : "bg-sage/40 border-line text-forest font-medium"
            }`}
          >
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-2.5 text-gold" />
              <strong>HMAC-256</strong> SEALED
            </span>
            <span className="font-mono text-[7px] opacity-80">
              {isSponsored ? "SPONSORED GUEST TICKET" : "EST. 2025 · ID-CARD FORMAT"}
            </span>
          </div>
        </div>

        {/* Card Footer & Security Footnote */}
        <div
          className={`px-2.5 py-1.5 text-center text-[8px] leading-tight border-t ${
            isGold
              ? "bg-[#0E0A02] border-[#3D2E08] text-[#E5C768]"
              : "bg-forest/5 border-line text-forest font-medium"
          }`}
        >
          <span className="font-semibold text-gold">Turnstile accreditation required.</span> All attendees must register.
        </div>
      </div>

      {/* Card Action Buttons & 1-Click Guest Forwarding */}
      {showActions && (
        <div className="mt-3 space-y-1.5 w-full max-w-[300px]">
          {/* Primary Operations (Download & Full View) */}
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              onClick={handleDownload}
              className={`flex-1 text-xs font-bold cursor-pointer shadow-xs h-8 ${
                isGold
                  ? "bg-gradient-to-r from-[#C9A84C] to-[#B38F34] text-black hover:opacity-95"
                  : "bg-forest text-ivory hover:bg-forest-interactive"
              }`}
            >
              <Download className="mr-1 size-3.5" />
              {downloaded ? "Saved!" : "Save ID Card"}
            </Button>

            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-line text-forest text-xs cursor-pointer hover:bg-sage/40 h-8 px-2.5"
            >
              <Link href={`/pass/${pass.passCode}`} target="_blank">
                <ExternalLink className="mr-1 size-3 text-gold-deep" /> Open
              </Link>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.print()}
              className="text-muted-brand hover:text-forest text-xs p-1.5 h-8"
              title="Print ID Card"
            >
              <Printer className="size-3.5" />
            </Button>
          </div>

          {/* 1-Click Guest Forwarding Capabilities */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <Button
              size="sm"
              asChild
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] h-7 px-2 shadow-xs cursor-pointer"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-1 size-3" />
                {isSponsored ? "WhatsApp Pass" : "Share WhatsApp"}
              </a>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyGuestLink}
              className="border-forest/20 text-forest hover:bg-sage/40 text-[10px] h-7 px-2 font-medium cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="mr-1 size-3 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="mr-1 size-3 text-gold-deep" />
                  <span>Copy Ticket Link</span>
                </>
              )}
            </Button>
          </div>

          {/* Helper Caption */}
          {isSponsored && (
            <p className="text-[10px] text-center text-amber-900/80 font-medium pt-0.5">
              👑 1-click forward this ticket link so your guest can open and save it to their phone.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

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
  isBuyer?: boolean;
  className?: string;
}

export function IdAccessCard({ pass, showActions = true, isBuyer = false, className = "" }: IdAccessCardProps) {
  const [downloaded, setDownloaded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isGold = pass.isVvip || pass.designTheme === "gold" || pass.passTier === "vvip_day3";
  const isSponsored = Boolean(pass.isSponsored || pass.holderName.toLowerCase().startsWith("sponsored invitation") || (pass.ticketIndex && pass.ticketIndex > 1));
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
    <div className={`flex flex-col items-center w-full max-w-full min-w-0 ${className}`}>
      {/* ── REALISTIC COMPACT ID CARD (CR80 ID BADGE RATIO & SIZING: max-w-[290px] sm:max-w-[305px]) ── */}
      <div
        className={`relative w-full max-w-[290px] sm:max-w-[305px] rounded-2xl overflow-hidden shadow-xl transition-all duration-300 min-w-0 ${
          isGold
            ? "border-2 border-[#C9A84C] bg-gradient-to-b from-[#1C1605] via-[#2A2007] to-[#120E03] text-[#FCF9F8] shadow-[0_4px_25px_rgba(201,168,76,0.25)]"
            : "border-2 border-[#002F1A] bg-[#FCF9F8] text-[#1B1C1C] shadow-lg"
        }`}
      >
        {/* Lanyard punch-hole simulation */}
        <div className="pt-1.5 pb-0.5 flex justify-center">
          <div
            className={`h-1.5 w-10 rounded-full border ${
              isGold
                ? "bg-[#0B0902] border-[#5E4711]"
                : "bg-[#E5DFD5] border-[#002F1A]/20"
            }`}
          />
        </div>

        {/* Card Header */}
        <div
          className={`px-3 py-1.5 text-center border-b-2 ${
            isGold
              ? "bg-gradient-to-r from-[#241A04] via-[#3B2B08] to-[#241A04] border-[#C9A84C] text-[#E5C768]"
              : "bg-[#002F1A] border-[#C9A84C]/50 text-[#FCF9F8]"
          }`}
        >
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[8px] font-black tracking-widest uppercase ${
                isGold
                  ? "bg-gradient-to-r from-[#B38F34] via-[#F5D77F] to-[#C9A84C] text-black shadow-xs"
                  : "bg-[#FCF9F8] text-[#002F1A] border border-[#002F1A] shadow-xs"
              }`}
            >
              {isGold ? (
                <Crown className="size-2.5 inline text-black" />
              ) : (
                <ShieldCheck className="size-2.5 inline text-[#002F1A]" />
              )}
              {admissionBadge}
            </span>
          </div>
          <h3
            className={`font-serif text-sm font-bold leading-tight ${
              isGold ? "text-[#FDF6D8] tracking-wide" : "text-[#FCF9F8]"
            }`}
          >
            {cardTitle}
          </h3>
          <p
            className={`text-[8px] uppercase tracking-wider font-semibold mt-0.5 ${
              isGold ? "text-[#C9A84C]" : "text-[#E5C768]"
            }`}
          >
            Abeokuta Polo Festival 2026
          </p>
        </div>

        {/* High-Security QR Presentation & Hologram */}
        <div
          className={`p-2.5 flex flex-col items-center justify-center text-center relative ${
            isGold ? "bg-[#140F04] border-b border-[#3D2E08]" : "bg-[#FAF7F2] border-b border-[#002F1A]/15"
          }`}
        >
          {/* Subtle Security Guilloche Background Watermark */}
          <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
            {isGold ? (
              <Sparkles className="size-24 text-[#C9A84C]" />
            ) : (
              <ShieldCheck className="size-24 text-[#002F1A]" />
            )}
          </div>

          <div
            className={`relative rounded-lg p-1.5 shadow-sm bg-white border-2 ${
              isGold ? "border-[#C9A84C] shadow-[0_0_12px_rgba(201,168,76,0.35)]" : "border-[#002F1A]"
            }`}
          >
            <QrCode className={`size-20 ${isGold ? "text-black" : "text-[#002F1A]"}`} />
            <div className="absolute -top-1.5 -right-1.5 rounded-full bg-emerald-600 text-white p-0.5 shadow">
              <CheckCircle2 className="size-3" />
            </div>
          </div>

          <div
            className={`font-mono text-sm font-extrabold tracking-widest mt-1 ${
              isGold ? "text-[#E5C768]" : "text-[#002F1A]"
            }`}
          >
            {pass.passCode}
          </div>

          <div className="mt-0.5">
            {isGold ? (
              <div className="flex items-center justify-center gap-1 px-2 py-0.5 rounded-full bg-[#2C2106] border border-[#C9A84C]/50">
                <Crown className="size-2.5 text-[#E5C768]" />
                <span className="text-[8px] font-bold tracking-wider uppercase text-[#F3E5AB]">
                  VVIP Active Status · Royal Admission
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300">
                <CheckCircle2 className="size-2.5 text-emerald-700" />
                <span className="text-[8px] font-bold tracking-wider uppercase text-emerald-800">
                  Emerald Active Status · Heritage Admission
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card Holder Details */}
        <div className={`px-3 py-1.5 space-y-1 text-[11px] ${isGold ? "text-[#E8DFD0]" : "text-[#1B1C1C]"}`}>
          <div
            className={`flex justify-between items-center pb-0.5 border-b ${
              isGold ? "border-[#C9A84C]/20" : "border-[#002F1A]/10"
            }`}
          >
            <span
              className={`text-[8.5px] uppercase font-bold tracking-wider ${
                isGold ? "text-[#C9A84C]" : "text-[#002F1A]/70"
              }`}
            >
              Pass Holder
            </span>
            <span className={`font-bold truncate max-w-[170px] text-right ${isGold ? "text-[#FFFFFF]" : "text-[#002F1A]"}`}>
              {pass.holderName}
            </span>
          </div>

          {serialText && (
            <div
              className={`flex justify-between items-center pb-0.5 border-b ${
                isGold ? "border-[#C9A84C]/20" : "border-[#002F1A]/10"
              }`}
            >
              <span
                className={`text-[8.5px] uppercase font-bold tracking-wider ${
                  isGold ? "text-[#C9A84C]" : "text-[#002F1A]/70"
                }`}
              >
                Pass Serial
              </span>
              <span className={`font-mono font-bold ${isGold ? "text-[#E5C768]" : "text-[#002F1A]"}`}>
                {serialText}
              </span>
            </div>
          )}

          {(pass.sponsorName || (isSponsored && pass.hostName)) && (
            <div
              className={`flex justify-between items-center pb-0.5 border-b ${
                isGold ? "border-[#C9A84C]/20" : "border-[#002F1A]/10"
              }`}
            >
              <span
                className={`text-[8.5px] uppercase font-bold tracking-wider ${
                  isGold ? "text-[#C9A84C]" : "text-[#002F1A]/70"
                }`}
              >
                Sponsored By
              </span>
              <span className={`font-bold truncate max-w-[170px] text-right ${isGold ? "text-[#FFFFFF]" : "text-[#002F1A]"}`}>
                {pass.sponsorName || pass.hostName}
              </span>
            </div>
          )}

          <div
            className={`flex justify-between items-center pb-0.5 border-b ${
              isGold ? "border-[#C9A84C]/20" : "border-[#002F1A]/10"
            }`}
          >
            <span
              className={`text-[8.5px] uppercase font-bold tracking-wider ${
                isGold ? "text-[#C9A84C]" : "text-[#002F1A]/70"
              }`}
            >
              Days
            </span>
            <span className={`font-semibold flex items-center gap-1 ${isGold ? "text-[#E5C768]" : "text-[#002F1A]"}`}>
              <Calendar className="size-2.5 text-gold-deep" />
              {daysLabel}
            </span>
          </div>

          <div
            className={`flex justify-between items-center pb-0.5 border-b ${
              isGold ? "border-[#C9A84C]/20" : "border-[#002F1A]/10"
            }`}
          >
            <span
              className={`text-[8.5px] uppercase font-bold tracking-wider ${
                isGold ? "text-[#C9A84C]" : "text-[#002F1A]/70"
              }`}
            >
              Access
            </span>
            <span className={`font-bold truncate max-w-[170px] text-right ${isGold ? "text-[#E5C768]" : "text-[#002F1A]"}`}>
              {isGold ? "Royal Pavilion & Grandstand" : "Festival Grounds & Grandstand"}
            </span>
          </div>

          <div className="flex justify-between items-center pt-0.5">
            <span
              className={`text-[8.5px] uppercase font-bold tracking-wider ${
                isGold ? "text-[#C9A84C]" : "text-[#002F1A]/70"
              }`}
            >
              Venue
            </span>
            <span className={`font-medium flex items-center gap-1 text-[10px] ${isGold ? "text-[#E8DFD0]" : "text-[#1B1C1C]"}`}>
              <MapPin className="size-2.5 text-gold-deep" /> Abeokuta Polo Club Grounds
            </span>
          </div>

          {/* Security Foil Strip */}
          <div
            className={`mt-1 rounded-md px-2 py-0.5 text-[8px] flex items-center justify-between border ${
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

        {/* Card Footer & Security Footnote */}
        <div
          className={`px-2.5 py-1 text-center text-[8px] leading-tight border-t ${
            isGold
              ? "bg-[#0E0A02] border-[#3D2E08] text-[#C9A84C]"
              : "bg-[#002F1A]/5 border-[#002F1A]/15 text-[#002F1A] font-medium"
          }`}
        >
          {isGold ? (
            <span>Turnstile accreditation required. Royal Gate Marshals on duty.</span>
          ) : (
            <span>Turnstile accreditation required. Complimentary Heritage Entry.</span>
          )}
        </div>
      </div>

      {/* Card Action Buttons & 1-Click Guest Forwarding */}
      {showActions && (
        <div className="mt-3 space-y-1.5 w-full max-w-[290px] sm:max-w-[305px] min-w-0">
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

          {/* Anti-Leakage Guard: Recipient View is STRICTLY Locked and Cannot Forward */}
          {isSponsored && !isBuyer ? (
            <div className="rounded-xl border border-amber-600/40 bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-amber-500/10 p-2.5 text-center text-xs text-amber-950 space-y-1 shadow-xs">
              <div className="flex items-center justify-center gap-1.5 font-bold text-amber-900 text-[10px] sm:text-[11px]">
                <ShieldCheck className="size-3.5 text-amber-700 shrink-0" />
                <span>Gifted / Sponsored Ticket — Locked to this device · Non-transferable</span>
              </div>
              <p className="text-[9px] text-amber-800 leading-tight">
                This pass is bound to this device for turnstile gate admission. To avoid fund leakage and unauthorized transfer, forwarding controls are disabled.
              </p>
            </div>
          ) : isSponsored && isBuyer ? (
            /* Primary Buyer Guest Forwarding: Can only forward up to the purchased quantity */
            <>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <Button
                  size="sm"
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] h-7 px-2 shadow-xs cursor-pointer"
                >
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-1 size-3" />
                    WhatsApp to Guest
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
                      <span>Copy Guest Link</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-center text-amber-900/80 font-medium pt-0.5">
                👑 Forward this unused guest ticket ({serialText || "Guest Ticket"}). Once opened by your guest, it binds to their phone.
              </p>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

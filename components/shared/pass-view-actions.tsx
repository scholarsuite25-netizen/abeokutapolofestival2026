"use client";

import { useEffect, useState } from "react";
import { Download, Printer, Share2, Check, FileDown, Calendar, MessageCircle, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  forceDownloadOfflinePassCard,
  persistRegisteredPass,
  type StoredPass,
} from "@/lib/storage/pass-storage";
import { downloadProgrammePDF } from "@/lib/pdf/programme-pdf";
import { siteUrl } from "@/lib/site";
import { downloadFestivalCalendar } from "@/lib/calendar/event-ics";

interface PassViewActionsProps {
  passData: StoredPass;
}

export function PassViewActions({ passData }: PassViewActionsProps) {
  const [downloaded, setDownloaded] = useState(false);
  const [shared, setShared] = useState(false);

  const isGiftTicket = Boolean(
    passData.isLockedToDevice ||
    passData.isSponsored ||
    (passData.ticketIndex && passData.ticketIndex > 1) ||
    passData.holderName?.toLowerCase().startsWith("sponsored invitation") ||
    passData.affiliationType === "guest_of"
  );

  // Automatically save this pass to device storage (localStorage/sessionStorage/cookie) when viewed
  useEffect(() => {
    if (passData && passData.passCode) {
      persistRegisteredPass(passData);
    }
  }, [passData]);

  const handleDownload = () => {
    forceDownloadOfflinePassCard(passData);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `🏇 I have registered for the Abeokuta Polo Festival 2026 — The Blueprint! (18–20 Dec 2026 at Abeokuta Polo Club & Country Resort). Day 1 is 100% Free Public Admission! Claim your complimentary pass and view the 3-day schedule here: ${siteUrl(`/register?ref=${passData.passCode}`)}`
  )}`;

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Abeokuta Polo Festival 2026 Pass - ${passData.passCode}`,
          text: `Gate Pass for ${passData.holderName} (${passData.passCode}) - Abeokuta Polo Festival 2026. Day 1 Free, Day 2 & 3 Through Ticket.`,
          url: window.location.href,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // Dismissed by user
      }
    } else {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    }
  };

  return (
    <div className="space-y-2.5 print:hidden w-full max-w-[290px] sm:max-w-[305px] mx-auto min-w-0">
      {/* Anti-Leakage Recipient Device Lock Callout */}
      {isGiftTicket && (
        <div className="rounded-xl border border-amber-600/40 bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 p-2.5 text-center text-xs text-amber-950 shadow-xs space-y-0.5">
          <div className="flex items-center justify-center gap-1.5 font-bold text-amber-900 text-[10px] sm:text-[11px]">
            <ShieldCheck className="size-3.5 text-amber-700 shrink-0" />
            <span>Gifted / Sponsored Ticket — Locked to this device · Non-transferable</span>
          </div>
          <p className="text-[9px] text-amber-800 leading-tight">
            Bound to this device for turnstile gate admission. Pass forwarding and link sharing are disabled.
          </p>
        </div>
      )}

      {/* Primary Pass Actions */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <Button
          onClick={handleDownload}
          size="sm"
          className="bg-gold text-forest font-bold hover:bg-gold/90 shadow-xs cursor-pointer text-xs h-8 px-3 flex-1"
        >
          {downloaded ? (
            <>
              <Check className="mr-1.5 size-3.5" /> Saved to Phone
            </>
          ) : (
            <>
              <Download className="mr-1.5 size-3.5" /> Save Offline Card
            </>
          )}
        </Button>

        {/* Anti-Leakage Guard: Only render WhatsApp Invite if NOT a gifted/sponsored ticket */}
        {!isGiftTicket && (
          <Button
            asChild
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-ivory font-bold shadow-xs cursor-pointer text-xs h-8 px-3"
          >
            <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-1.5 size-3.5" />
              Invite Friends
            </a>
          </Button>
        )}
      </div>

      {/* Global Standard Feature: Apple & Google Wallet Digital Passes */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="border-black/30 bg-black text-white hover:bg-neutral-800 text-[10px] h-7 px-2 font-medium flex-1 truncate shadow-xs"
          title="Add to Apple Wallet"
        >
          <Smartphone className="mr-1 size-3 text-white" />
          Apple Wallet
        </Button>
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="border-line bg-card text-forest hover:bg-sage/40 text-[10px] h-7 px-2 font-medium flex-1 truncate shadow-xs"
          title="Save to Google Wallet"
        >
          <Smartphone className="mr-1 size-3 text-gold-deep" />
          Google Wallet
        </Button>
      </div>

      {/* Secondary Utilities */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <Button
          onClick={() => downloadProgrammePDF()}
          variant="outline"
          size="sm"
          className="border-gold/60 text-forest hover:bg-gold/15 cursor-pointer text-[11px] h-7 px-2 font-medium flex-1 truncate"
        >
          <FileDown className="mr-1 size-3 text-gold-deep" />
          Schedule PDF
        </Button>

        <Button
          onClick={() => downloadFestivalCalendar()}
          variant="outline"
          size="sm"
          className="border-forest/20 text-forest hover:bg-sage/40 cursor-pointer text-[11px] h-7 px-2 font-medium flex-1 truncate"
        >
          <Calendar className="mr-1 size-3 text-gold-deep" />
          Add Calendar
        </Button>

        <Button
          onClick={() => window.print()}
          variant="outline"
          size="sm"
          className="border-forest/20 text-forest hover:bg-forest/10 cursor-pointer text-[11px] h-7 px-2"
          title="Print ID Card"
        >
          <Printer className="size-3" />
        </Button>

        {/* Anti-Leakage Guard: Share pass button is disabled/hidden for gifted tickets */}
        {!isGiftTicket && (
          <Button
            onClick={handleShare}
            variant="ghost"
            size="sm"
            className="text-forest hover:bg-sage/40 cursor-pointer text-[11px] h-7 px-2"
            title="Share Pass"
          >
            <Share2 className="size-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

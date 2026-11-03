"use client";

import { useEffect, useState } from "react";
import { Download, Printer, Share2, Check, FileDown, Calendar, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  forceDownloadOfflinePassCard,
  persistRegisteredPass,
  type StoredPass,
} from "@/lib/storage/pass-storage";
import { downloadProgrammePDF } from "@/lib/pdf/programme-pdf";
import { downloadFestivalCalendar } from "@/lib/calendar/event-ics";

interface PassViewActionsProps {
  passData: StoredPass;
}

export function PassViewActions({ passData }: PassViewActionsProps) {
  const [downloaded, setDownloaded] = useState(false);
  const [shared, setShared] = useState(false);

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
    `🏇 I have registered for the Abeokuta Polo Festival 2026 — The Blueprint! (18–20 Dec 2026 at Abeokuta Polo Club & Country Resort). Day 1 is 100% Free Public Admission! Claim your complimentary pass and view the 3-day schedule here: https://abeokuta-polo-festival-2026.vercel.app/register?ref=${passData.passCode}`
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
    <div className="space-y-3 print:hidden">
      {/* Primary Pass Actions */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <Button
          onClick={handleDownload}
          className="bg-gold text-forest font-bold hover:bg-gold/90 shadow cursor-pointer text-xs py-2 px-3.5"
        >
          {downloaded ? (
            <>
              <Check className="mr-1.5 size-3.5" /> Saved to Phone
            </>
          ) : (
            <>
              <Download className="mr-1.5 size-3.5" /> Save Offline Pass Card
            </>
          )}
        </Button>

        <Button
          onClick={() => downloadProgrammePDF()}
          variant="outline"
          className="border-gold/60 text-forest hover:bg-gold/15 cursor-pointer text-xs py-2 px-3.5 font-semibold"
        >
          <FileDown className="mr-1.5 size-3.5 text-gold-deep" />
          Download 3-Day Schedule (PDF)
        </Button>

        <Button
          onClick={() => downloadFestivalCalendar()}
          variant="outline"
          className="border-forest/20 text-forest hover:bg-sage/40 cursor-pointer text-xs py-2 px-3.5 font-semibold"
        >
          <Calendar className="mr-1.5 size-3.5 text-gold-deep" />
          Add to Phone Calendar
        </Button>

        <Button
          asChild
          className="bg-emerald-600 hover:bg-emerald-500 text-ivory font-bold shadow-sm cursor-pointer text-xs py-2 px-3.5"
        >
          <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-1.5 size-3.5" />
            Invite on WhatsApp
          </a>
        </Button>

        <Button
          onClick={() => window.print()}
          variant="outline"
          className="border-forest/30 text-forest hover:bg-forest/10 cursor-pointer text-xs py-2 px-3.5"
        >
          <Printer className="mr-1.5 size-3.5" /> Print / PDF
        </Button>

        <Button
          onClick={handleShare}
          variant="ghost"
          className="text-forest hover:bg-sage/40 cursor-pointer text-xs py-2 px-3.5"
        >
          <Share2 className="mr-1.5 size-3.5" />
          {shared ? "Link Copied!" : "Share"}
        </Button>
      </div>
    </div>
  );
}

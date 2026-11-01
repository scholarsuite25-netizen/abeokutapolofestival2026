"use client";

import { useEffect, useState } from "react";
import { Download, Printer, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  forceDownloadOfflinePassCard,
  persistRegisteredPass,
  type StoredPass,
} from "@/lib/storage/pass-storage";

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
      // Fallback: copy link
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 print:hidden">
      <Button
        onClick={handleDownload}
        className="w-full sm:w-auto bg-gold text-forest font-bold hover:bg-gold/90 shadow cursor-pointer"
      >
        {downloaded ? (
          <>
            <Check className="mr-2 size-4" /> Downloaded to Phone
          </>
        ) : (
          <>
            <Download className="mr-2 size-4" /> Save / Download Offline Pass
          </>
        )}
      </Button>

      <Button
        onClick={() => window.print()}
        variant="outline"
        className="w-full sm:w-auto border-forest/30 text-forest hover:bg-forest/10 cursor-pointer"
      >
        <Printer className="mr-2 size-4" /> Print / Save PDF
      </Button>

      <Button
        onClick={handleShare}
        variant="ghost"
        className="w-full sm:w-auto text-forest hover:bg-sage/40 cursor-pointer"
      >
        <Share2 className="mr-2 size-4" />
        {shared ? "Link Copied!" : "Share Pass"}
      </Button>
    </div>
  );
}


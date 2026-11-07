"use client";

import { useState } from "react";
import { Users, Share2, Calendar, FileDown, Check, Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadProgrammePDF } from "@/lib/pdf/programme-pdf";
import { downloadFestivalCalendar } from "@/lib/calendar/event-ics";

export function AttendanceMilestoneWidget({
  passCode,
  holderName,
  currentCount = 1840,
  targetCount = 2500,
  variant = "default",
  className = "",
}: {
  passCode?: string;
  holderName?: string;
  currentCount?: number;
  targetCount?: number;
  variant?: "default" | "compact";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const percentage = Math.min(100, Math.round((currentCount / targetCount) * 100));

  const shareText = `🏇 ${
    holderName ? `${holderName} invites you` : "You're invited"
  } to Abeokuta Polo Festival 2026 — The Blueprint! 18–20 Dec 2026 at Abeokuta Polo Club & Country Resort. Day 1 is 100% Free Public Admission! Claim your official gate access pass here: https://abeokuta-polo-festival-2026.vercel.app/register${
    passCode ? `?ref=${encodeURIComponent(passCode)}` : ""
  }`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(
        `https://abeokuta-polo-festival-2026.vercel.app/register${
          passCode ? `?ref=${encodeURIComponent(passCode)}` : ""
        }`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className={`rounded-3xl border-2 border-gold/40 bg-forest p-4 sm:p-8 text-ivory shadow-2xl relative overflow-hidden min-w-0 max-w-full ${className}`}>
      {/* Ambient background container securely clipped to prevent scrollWidth blowout */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -bottom-20 size-72 rounded-full bg-gold/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ivory/15 pb-5">
        <div>
          <Badge className="bg-gold text-forest font-bold text-[10px] mb-2">
            <Sparkles className="mr-1 size-3" /> OFFICIAL 2,500 ATTENDANCE CAMPAIGN
          </Badge>
          <h3 className="font-display text-2xl font-semibold text-ivory">
            Help Us Welcome 2,500 Attendees to Abeokuta
          </h3>
          <p className="text-xs text-ivory/70 mt-1 max-w-xl">
            Promoting West Africa&apos;s premier equestrian gathering. Invite colleagues, club members, and friends to claim their complimentary gate pass.
          </p>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <span className="font-mono text-3xl sm:text-4xl font-extrabold text-gold tracking-tight">
            {currentCount.toLocaleString()}
          </span>
          <span className="text-xs text-ivory/60 block">/ {targetCount.toLocaleString()} Target Passes</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 pt-5 space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-ivory/80 flex items-center gap-1.5">
            <Users className="size-4 text-gold" />
            Accreditation Capacity Progress
          </span>
          <span className="text-gold font-mono">{percentage}% Achieved</span>
        </div>
        <div className="h-3 w-full rounded-full bg-forest-deep border border-gold/30 p-0.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold/80 via-gold to-emerald-400 transition-all duration-1000 shadow-[0_0_12px_rgba(223,190,117,0.5)]"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Multi-Channel Attendance Acceleration Buttons: Responsive to variant */}
      <div
        className={`relative z-10 mt-6 pt-5 border-t border-ivory/15 grid gap-3 ${
          variant === "compact"
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {/* 1. WhatsApp 1-Click Viral Invite */}
        <Button
          asChild
          className="w-full min-w-0 bg-emerald-600 hover:bg-emerald-500 text-ivory font-bold shadow-md cursor-pointer text-xs h-auto py-3 px-3 text-center"
        >
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 truncate">
            <MessageCircle className="size-4 shrink-0" />
            <span className="truncate">Share on WhatsApp</span>
          </a>
        </Button>

        {/* 2. Download Official PDF Schedule */}
        <Button
          onClick={() => downloadProgrammePDF()}
          variant="outline"
          className="w-full min-w-0 border-gold text-gold hover:bg-gold/15 cursor-pointer text-xs h-auto py-3 px-3 font-semibold text-center"
        >
          <div className="flex items-center justify-center gap-1.5 truncate">
            <FileDown className="size-4 shrink-0" />
            <span className="truncate">Download Schedule PDF</span>
          </div>
        </Button>

        {/* 3. Add to Phone Calendar (.ics with alarms) */}
        <Button
          onClick={() => downloadFestivalCalendar()}
          variant="outline"
          className="w-full min-w-0 border-ivory/30 bg-white/10 text-ivory hover:bg-white/20 cursor-pointer text-xs h-auto py-3 px-3 font-semibold text-center"
        >
          <div className="flex items-center justify-center gap-1.5 truncate">
            <Calendar className="size-4 text-gold shrink-0" />
            <span className="truncate">Add to Phone Calendar</span>
          </div>
        </Button>

        {/* 4. Copy Invite Link */}
        <Button
          onClick={handleCopy}
          variant="ghost"
          className="w-full min-w-0 border border-ivory/20 text-ivory hover:bg-white/10 cursor-pointer text-xs h-auto py-3 px-3 text-center"
        >
          <div className="flex items-center justify-center gap-1.5 truncate">
            {copied ? (
              <>
                <Check className="size-4 text-emerald-400 shrink-0" />
                <span className="truncate">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="size-4 shrink-0" />
                <span className="truncate">Copy Referral Link</span>
              </>
            )}
          </div>
        </Button>
      </div>

      <div className="relative z-10 mt-4 text-[11px] text-ivory/60 text-center">
        Every registered guest can invite family, colleagues, or delegation members. Day 1 is 100% Free Public Admission!
      </div>
    </div>
  );
}


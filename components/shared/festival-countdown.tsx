"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Clock, Calendar } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLive: boolean;
}

// Target Festival Opening: Day 1 — Friday, 18th December 2026 at 10:00 AM WAT (UTC+1)
const FESTIVAL_START_TIME = new Date("2026-12-18T10:00:00+01:00").getTime();

const emptySubscribe = () => () => {};

function getFestivalTimeLeft(): TimeLeft {
  const difference = FESTIVAL_START_TIME - Date.now();
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true };
  }
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / (1000 * 60)) % 60);
  const seconds = Math.floor((difference / 1000) % 60);
  return { days, hours, minutes, seconds, isLive: false };
}

const INITIAL_TIME: TimeLeft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  isLive: false,
};

export function FestivalCountdown({
  variant = "full",
  className = "",
}: {
  variant?: "full" | "compact" | "banner";
  className?: string;
}) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(INITIAL_TIME);

  useEffect(() => {
    const update = () => setTimeLeft(getFestivalTimeLeft());
    const anim = requestAnimationFrame(update);
    const timer = setInterval(update, 1000);

    return () => {
      cancelAnimationFrame(anim);
      clearInterval(timer);
    };
  }, []);

  if (!mounted) {
    // Initial SSR placeholder
    return (
      <div className={`flex items-center gap-2 text-gold animate-pulse ${className}`}>
        <Clock className="size-4" />
        <span className="text-xs uppercase font-mono tracking-widest">
          Calculating Countdown to 18 Dec 2026...
        </span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 font-mono text-xs text-gold ${className}`}>
        <Clock className="size-3.5 text-gold animate-pulse" />
        <span className="font-semibold text-ivory">
          {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </span>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-3 text-xs ${className}`}>
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-gold">
          <Clock className="size-3.5" /> Countdown to Opening Day:
        </span>
        <div className="flex items-center gap-1.5 font-mono font-bold text-ivory">
          <span className="rounded bg-gold/20 px-2 py-0.5 text-gold border border-gold/40">
            {timeLeft.days} <span className="text-[9px] font-sans text-ivory/70">DAYS</span>
          </span>
          <span>:</span>
          <span className="rounded bg-gold/20 px-2 py-0.5 text-gold border border-gold/40">
            {String(timeLeft.hours).padStart(2, "0")}{" "}
            <span className="text-[9px] font-sans text-ivory/70">HRS</span>
          </span>
          <span>:</span>
          <span className="rounded bg-gold/20 px-2 py-0.5 text-gold border border-gold/40">
            {String(timeLeft.minutes).padStart(2, "0")}{" "}
            <span className="text-[9px] font-sans text-ivory/70">MIN</span>
          </span>
          <span>:</span>
          <span className="rounded bg-gold/20 px-2 py-0.5 text-gold border border-gold/40">
            {String(timeLeft.seconds).padStart(2, "0")}{" "}
            <span className="text-[9px] font-sans text-ivory/70">SEC</span>
          </span>
        </div>
      </div>
    );
  }

  // Full luxury cards variant
  return (
    <div className={`w-full max-w-full min-w-0 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-1 mb-3 text-xs">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-gold text-[11px] sm:text-xs">
          <Clock className="size-3.5 sm:size-4 text-gold animate-pulse shrink-0" />
          Official Festival Countdown
        </span>
        <span className="text-ivory/70 flex items-center gap-1 text-[10px] sm:text-[11px]">
          <Calendar className="size-3 text-gold shrink-0" />
          Opens Fri 18 Dec 2026 · 10:00 AM
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-3 text-center">
        {/* Days */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gold/40 bg-forest-deep/90 px-1.5 py-2.5 sm:p-4 shadow-xl backdrop-blur-md min-w-0">
          <span className="font-mono text-xl sm:text-4xl lg:text-5xl font-extrabold text-gold tracking-tight truncate">
            {timeLeft.days}
          </span>
          <span className="mt-0.5 sm:mt-1 text-[9px] sm:text-xs font-semibold uppercase tracking-wider sm:tracking-widest text-ivory/70 truncate">
            Days
          </span>
        </div>

        {/* Hours */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gold/40 bg-forest-deep/90 px-1.5 py-2.5 sm:p-4 shadow-xl backdrop-blur-md min-w-0">
          <span className="font-mono text-xl sm:text-4xl lg:text-5xl font-extrabold text-gold tracking-tight truncate">
            {String(timeLeft.hours).padStart(2, "0")}
          </span>
          <span className="mt-0.5 sm:mt-1 text-[9px] sm:text-xs font-semibold uppercase tracking-wider sm:tracking-widest text-ivory/70 truncate">
            Hours
          </span>
        </div>

        {/* Minutes */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gold/40 bg-forest-deep/90 px-1.5 py-2.5 sm:p-4 shadow-xl backdrop-blur-md min-w-0">
          <span className="font-mono text-xl sm:text-4xl lg:text-5xl font-extrabold text-gold tracking-tight truncate">
            {String(timeLeft.minutes).padStart(2, "0")}
          </span>
          <span className="mt-0.5 sm:mt-1 text-[9px] sm:text-xs font-semibold uppercase tracking-wider sm:tracking-widest text-ivory/70 truncate">
            Minutes
          </span>
        </div>

        {/* Seconds */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gold/40 bg-forest-deep/90 px-1.5 py-2.5 sm:p-4 shadow-xl backdrop-blur-md min-w-0">
          <span className="font-mono text-xl sm:text-4xl lg:text-5xl font-extrabold text-gold tracking-tight truncate">
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
          <span className="mt-0.5 sm:mt-1 text-[9px] sm:text-xs font-semibold uppercase tracking-wider sm:tracking-widest text-ivory/70 truncate">
            Seconds
          </span>
        </div>
      </div>
    </div>
  );
}


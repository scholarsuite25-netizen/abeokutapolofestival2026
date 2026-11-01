"use client";

import { useState } from "react";
import Link from "next/link";
import { Ticket, ExternalLink, X, ShieldCheck } from "lucide-react";
import { useStoredPass } from "@/lib/storage/pass-storage";

export function PersistentPassBanner() {
  const pass = useStoredPass();
  const [dismissed, setDismissed] = useState(false);

  if (!pass || dismissed) return null;

  return (
    <aside
      aria-label="Active Gate Pass Notification"
      className="bg-forest text-ivory border-b border-gold/40 text-xs px-4 py-2 transition-all relative z-50 shadow-md"
    >
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold border border-gold/40">
            <Ticket className="size-3.5" />
          </span>
          <p className="truncate text-ivory/90 text-[11px] sm:text-xs">
            <span className="font-semibold text-gold">Active Pass on Device:</span> Welcome back,{" "}
            <strong className="text-ivory font-bold">{pass.holderName}</strong> ·{" "}
            <span className="font-mono font-bold tracking-wider text-gold">{pass.passCode}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <Link
            href={`/pass/${pass.passCode}`}
            className="inline-flex items-center gap-1 rounded bg-gold px-2.5 py-1 text-[11px] font-bold text-forest hover:bg-gold/90 transition-colors shadow-sm"
          >
            <ShieldCheck className="size-3" />
            Open Access Pass
            <ExternalLink className="size-3 ml-0.5" />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss active pass notification"
            className="rounded p-1 text-ivory/60 hover:text-ivory transition-colors cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

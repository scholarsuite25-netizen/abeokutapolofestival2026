"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Ticket,
  ExternalLink,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Search,
} from "lucide-react";
import { useStoredPass, forceDownloadOfflinePassCard } from "@/lib/storage/pass-storage";

// External store for dock minimized state
const DOCK_MINIMIZED_KEY = "abk_pass_dock_minimized";
const dockListeners = new Set<() => void>();

function subscribeDock(callback: () => void) {
  dockListeners.add(callback);
  return () => {
    dockListeners.delete(callback);
  };
}

function getDockSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DOCK_MINIMIZED_KEY) === "true";
  } catch {
    return false;
  }
}

function getDockServerSnapshot(): boolean {
  return false;
}

function setDockMinimized(val: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DOCK_MINIMIZED_KEY, String(val));
    for (const listener of dockListeners) {
      listener();
    }
  } catch {
    // Non-blocking
  }
}

export function PermanentPassDock() {
  const pass = useStoredPass();
  const minimized = useSyncExternalStore(subscribeDock, getDockSnapshot, getDockServerSnapshot);
  const [copied, setCopied] = useState(false);

  const toggleMinimized = () => {
    setDockMinimized(!minimized);
  };

  const copyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pass) return;
    try {
      await navigator.clipboard.writeText(pass.passCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const downloadCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pass) return;
    forceDownloadOfflinePassCard(pass);
  };

  // If user has a registered pass on this device:
  if (pass) {
    if (minimized) {
      return (
        <aside
          aria-label="Permanent Access Pass Token"
          className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <button
            onClick={toggleMinimized}
            className="group flex items-center gap-2.5 rounded-full border border-gold/60 bg-forest-deep/95 px-4 py-2.5 text-xs text-ivory shadow-2xl backdrop-blur-md transition-all hover:border-gold hover:bg-forest hover:scale-105 cursor-pointer ring-2 ring-gold/20"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-gold text-forest font-bold">
              <Ticket className="size-3" />
            </span>
            <span className="font-mono font-bold tracking-wider text-gold">
              {pass.passCode}
            </span>
            <span className="hidden sm:inline text-ivory/80 text-[11px]">
              · My Digital Pass
            </span>
            <ChevronUp className="size-3.5 text-gold/70 group-hover:text-gold" />
          </button>
        </aside>
      );
    }

    return (
      <aside
        aria-label="Permanent Access Pass Cockpit"
        className="fixed bottom-4 right-4 z-50 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] rounded-2xl border-2 border-gold/70 bg-forest-deep/95 p-4 text-ivory shadow-2xl backdrop-blur-lg animate-in fade-in slide-in-from-bottom-4 duration-300 ring-4 ring-gold/15"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-gold/20 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-gold text-forest shadow">
              <Ticket className="size-3.5" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gold">
                Registered Pass On Device
              </p>
              <p className="text-xs font-bold text-ivory truncate max-w-[180px] sm:max-w-[220px]">
                {pass.holderName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMinimized}
              aria-label="Minimize pass dock"
              className="rounded p-1 text-ivory/60 hover:text-ivory hover:bg-white/10 transition-colors cursor-pointer"
              title="Minimize to floating badge"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>
        </div>

        {/* Pass Code Highlight & 1-Click Copy */}
        <div className="flex items-center justify-between rounded-xl bg-forest/80 border border-gold/30 px-3.5 py-2 mb-3">
          <div>
            <span className="block text-[9px] uppercase tracking-wider text-ivory/60">
              Access Pass Code
            </span>
            <span className="font-mono text-base font-extrabold tracking-widest text-gold">
              {pass.passCode}
            </span>
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-1 rounded bg-gold/15 hover:bg-gold/25 border border-gold/40 px-2 py-1 text-[11px] font-medium text-gold transition-colors cursor-pointer"
            title="Copy Pass Code"
          >
            {copied ? (
              <>
                <Check className="size-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* 1-Click Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/pass/${pass.passCode}`}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-xs font-bold text-forest hover:bg-gold/90 transition-all shadow-md active:scale-95"
          >
            <ShieldCheck className="size-3.5" />
            <span>Open Pass</span>
            <ExternalLink className="size-3 ml-0.5 opacity-70" />
          </Link>

          <button
            onClick={downloadCard}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-gold/40 bg-white/5 px-3 py-2 text-xs font-medium text-ivory hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
            title="Download offline card for no-internet access"
          >
            <Download className="size-3.5 text-gold" />
            <span>Offline Card</span>
          </button>
        </div>
      </aside>
    );
  }

  // If user is not yet registered on this device, show a small discreet retrieval badge:
  return (
    <aside
      aria-label="Retrieve Pass"
      className="fixed bottom-4 right-4 z-40 hidden sm:block animate-in fade-in duration-500"
    >
      <Link
        href="/pass/lookup"
        className="group flex items-center gap-2 rounded-full border border-forest/30 bg-card/90 px-3.5 py-2 text-xs text-forest shadow-lg backdrop-blur hover:border-gold hover:bg-ivory hover:shadow-xl transition-all"
      >
        <Search className="size-3.5 text-gold group-hover:scale-110 transition-transform" />
        <span className="font-medium text-xs">Retrieve My Pass</span>
      </Link>
    </aside>
  );
}

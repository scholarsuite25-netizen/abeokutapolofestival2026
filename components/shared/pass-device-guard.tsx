"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ShieldAlert, ShieldCheck, Lock, ArrowLeft, MessageSquare, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyPassDeviceBinding } from "@/lib/security/device-binding";

interface PassDeviceGuardProps {
  passCode: string;
  holderName: string;
  isTableGuest: boolean;
  children: ReactNode;
}

export function PassDeviceGuard({
  passCode,
  holderName,
  isTableGuest,
  children,
}: PassDeviceGuardProps) {
  const [authStatus, setAuthStatus] = useState<"checking" | "authorized" | "blocked">(
    isTableGuest ? "checking" : "authorized"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!isTableGuest) {
      setAuthStatus("authorized");
      return;
    }

    // Get or create unique client device identifier
    let deviceId = "";
    if (typeof window !== "undefined") {
      deviceId = localStorage.getItem("abk_device_id") || "";
      if (!deviceId) {
        deviceId = `DEV-${crypto.randomUUID()}`;
        localStorage.setItem("abk_device_id", deviceId);
      }
    }

    verifyPassDeviceBinding(passCode, deviceId, holderName)
      .then((res) => {
        if (res.isAuthorized) {
          setAuthStatus("authorized");
        } else {
          setAuthStatus("blocked");
          setErrorMessage(
            res.message ||
              "This Day 3 Table pass has already been claimed and bound to another mobile device. Forwarding to third parties is strictly prohibited."
          );
        }
      })
      .catch(() => {
        // Fallback gracefully to authorized on network error so genuine attendees aren't stranded
        setAuthStatus("authorized");
      });
  }, [passCode, holderName, isTableGuest]);

  if (authStatus === "checking") {
    return (
      <div className="flex min-h-[50vh] w-full flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-3 rounded-2xl border border-gold/30 bg-[#120E03] p-6 text-ivory shadow-xl">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold animate-pulse">
            <Lock className="size-6" />
          </div>
          <h2 className="font-display text-lg font-bold text-gold">Verifying Device Security</h2>
          <p className="text-xs text-ivory/80 leading-relaxed">
            Authenticating anti-forwarding device lock token for VIP Table Pass <strong className="font-mono text-gold">{passCode}</strong>...
          </p>
          <div className="flex items-center justify-center gap-2 text-[11px] text-ivory/60 pt-2">
            <RefreshCw className="size-3 animate-spin text-gold" />
            <span>Turnstile Device Handshake</span>
          </div>
        </div>
      </div>
    );
  }

  if (authStatus === "blocked") {
    const maskedCode = passCode.length > 8 ? `${passCode.slice(0, 14)}••••` : passCode;
    return (
      <div className="flex min-h-[65vh] w-full flex-col items-center justify-center p-4 sm:p-6 text-center bg-ivory">
        <div className="max-w-md w-full space-y-4 rounded-3xl border-2 border-red-500/50 bg-[#140505] p-6 sm:p-8 text-ivory shadow-2xl">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-950/80 border-2 border-red-500 text-red-400">
            <ShieldAlert className="size-9" />
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest bg-red-500 text-black">
              Anti-Forwarding Protocol Active
            </span>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-red-200">
              Pass Forwarding Blocked
            </h1>
            <p className="text-xs font-mono text-gold">{maskedCode}</p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3.5 text-xs text-red-100 text-left space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <p className="text-[11px] text-ivory/70 leading-relaxed border-t border-red-900/50 pt-2">
              Under Abeokuta Polo Festival rules, table guest tickets bind exclusively to the recipient device upon initial receipt. They cannot be re-forwarded, scalped, or shared with third parties.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              asChild
              variant="outline"
              className="border-ivory/20 bg-ivory/5 text-ivory hover:bg-ivory/10 text-xs flex-1"
            >
              <Link href="/">
                <ArrowLeft className="mr-1.5 size-3.5" /> Return Home
              </Link>
            </Button>
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex-1"
            >
              <a
                href="https://wa.me/2348181888884?text=Hello%20Secretariat%2C%20I%20need%20assistance%20with%20my%20table%20pass%20device%20binding."
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquare className="mr-1.5 size-3.5" /> Secretariat Help
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {isTableGuest && (
        <div className="mx-auto w-full max-w-[290px] sm:max-w-[305px] mb-2 rounded-xl border border-gold/40 bg-gradient-to-r from-[#1B1608] via-[#2A2007] to-[#1B1608] p-2.5 text-center text-ivory shadow-xs">
          <div className="flex items-center justify-center gap-1.5 font-bold text-gold text-[10px] sm:text-[11px]">
            <ShieldCheck className="size-3.5 text-gold shrink-0" />
            <span>Device-Locked Guest Invitation</span>
          </div>
          <p className="text-[9px] text-ivory/80 leading-tight mt-0.5">
            Bound to this device for Grand Finale turnstiles. Link forwarding & sharing are locked.
          </p>
        </div>
      )}
      {children}
    </>
  );
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import QRCodeLib from "qrcode";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  QrCode,
  Smartphone,
  Mail,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { verifyPassDeviceBinding, sendPassMobileBindingEmail } from "@/lib/security/device-binding";
import { formatWhatsAppUrl } from "@/lib/utils/phone";

/**
 * Mobile user agent detection oracle.
 */
export function isMobileUserAgent(userAgent?: string): boolean {
  if (!userAgent) return false;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Silk/i;
  return mobileRegex.test(userAgent);
}

/**
 * Client-side runtime check to determine if the current session is on a mobile smartphone/tablet.
 */
export function isMobileBrowser(): boolean {
  if (typeof window === "undefined") return false;

  const navAny = navigator as unknown as { userAgentData?: { mobile?: boolean } };
  if (navAny.userAgentData && typeof navAny.userAgentData.mobile === "boolean") {
    if (navAny.userAgentData.mobile) return true;
  }

  const ua = navigator.userAgent || "";
  if (isMobileUserAgent(ua)) return true;

  if (typeof window.matchMedia === "function") {
    const hasTouch = navigator.maxTouchPoints > 0;
    const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
    if (hasTouch && isSmallScreen) return true;
  }

  return false;
}

/**
 * Client-side runtime check to determine if the current session is on a desktop or laptop.
 */
export function isDesktopBrowser(): boolean {
  return !isMobileBrowser();
}

/**
 * Generates an authoritative mobile device identifier: MOBILE-${UUID}.
 */
export function generateMobileDeviceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `MOBILE-${crypto.randomUUID()}`;
  }
  return `MOBILE-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

/**
 * Retrieves the persisted mobile device ID from localStorage,
 * or generates and persists a new authoritative MOBILE-${UUID} identifier.
 */
export function getOrCreateMobileDeviceId(): string {
  if (typeof window === "undefined") return generateMobileDeviceId();

  try {
    const existing = localStorage.getItem("abk_device_id");
    if (existing && existing.startsWith("MOBILE-")) {
      return existing;
    }
    const newId = generateMobileDeviceId();
    localStorage.setItem("abk_device_id", newId);
    return newId;
  } catch {
    return generateMobileDeviceId();
  }
}

export interface MobileBindingStationProps {
  passCode: string;
  holderName?: string;
  phone?: string;
  email?: string;
  category?: string;
  className?: string;
}

/**
 * High-visibility Desktop Mobile Binding Station:
 * Displays a scannable "📱 Scan to bind to your mobile phone" QR code,
 * one-click WhatsApp share link (wa.me), and email dispatch trigger.
 */
export function MobileBindingStation({
  passCode,
  holderName,
  phone = "+234 818 188 8884",
  email = "",
  category = "Festival Access Pass",
  className = "",
}: MobileBindingStationProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [targetEmail, setTargetEmail] = useState<string>(email);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [copied, setCopied] = useState<boolean>(false);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://abeokutapolofestival2026.org.ng";

  const mobileBindingUrl = `${origin}/pass/${encodeURIComponent(passCode)}?bind=mobile`;

  // WhatsApp pre-filled claim message
  const whatsappMessage = `Abeokuta Polo Festival 2026: Claim Pass ${passCode} at ${mobileBindingUrl}`;
  const whatsappUrl = formatWhatsAppUrl(phone, whatsappMessage);

  useEffect(() => {
    let active = true;
    QRCodeLib.toDataURL(mobileBindingUrl, {
      margin: 1,
      width: 256,
      color: {
        dark: "#064e3b",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [mobileBindingUrl]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail || !targetEmail.includes("@")) return;

    setEmailStatus("sending");
    try {
      const res = await sendPassMobileBindingEmail({
        email: targetEmail,
        passCode,
        holderName,
        passUrl: mobileBindingUrl,
      });

      if (res.success) {
        setEmailStatus("sent");
      } else {
        setEmailStatus("error");
      }
    } catch {
      setEmailStatus("error");
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(mobileBindingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className={`rounded-3xl border-2 border-emerald-600/40 bg-gradient-to-b from-[#06241b] via-[#051c15] to-[#03130e] p-6 sm:p-8 text-ivory shadow-2xl max-w-2xl mx-auto ${className}`}
    >
      {/* Station Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <Smartphone className="size-3.5 text-emerald-400" />
          <span>Desktop Mobile Binding Station</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gold">
          📱 Scan to bind to your mobile phone
        </h2>
        <p className="text-xs sm:text-sm text-ivory/80 max-w-lg mx-auto leading-relaxed">
          Kobape Grounds turnstiles require mobile smartphone presentation for contactless gate entry.
          Scan this QR code with your phone camera to bind Pass{" "}
          <strong className="font-mono text-gold">{passCode}</strong> directly to your mobile device.
        </p>
      </div>

      {/* Center QR Code */}
      <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10 mb-6">
        <div className="p-3 bg-white rounded-2xl shadow-lg border-2 border-gold/40">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`Mobile binding QR code for pass ${passCode}`}
              className="size-48 sm:size-52 rounded-lg"
            />
          ) : (
            <div className="size-48 sm:size-52 flex items-center justify-center bg-gray-100 rounded-lg">
              <QrCode className="size-10 text-forest/40 animate-pulse" />
            </div>
          )}
        </div>
        <p className="mt-3 text-[11px] font-mono text-emerald-300 text-center break-all max-w-sm">
          {mobileBindingUrl}
        </p>
      </div>

      {/* Dispatch Actions: WhatsApp + Email + Copy */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* WhatsApp Direct Dispatch */}
          <Button
            asChild
            className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs py-5 shadow-md cursor-pointer"
          >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Share2 className="mr-2 size-4" />
              Open in WhatsApp (wa.me)
            </a>
          </Button>

          {/* Copy Link Button */}
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="w-full border-ivory/20 bg-ivory/10 hover:bg-ivory/20 text-ivory text-xs font-semibold py-5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="mr-2 size-4 text-emerald-400" />
                Copied Binding Link!
              </>
            ) : (
              <>
                <Copy className="mr-2 size-4" />
                Copy Mobile Binding Link
              </>
            )}
          </Button>
        </div>

        {/* Email Dispatch Trigger */}
        <form onSubmit={handleSendEmail} className="pt-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder="Enter your email to receive binding link"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-ivory/40 text-xs flex-1"
            />
            <Button
              type="submit"
              disabled={emailStatus === "sending"}
              className="bg-gold hover:bg-gold-deep text-forest font-bold text-xs shrink-0 px-4 cursor-pointer"
            >
              <Mail className="mr-1.5 size-3.5 text-forest" />
              {emailStatus === "sending"
                ? "Sending..."
                : emailStatus === "sent"
                ? "Sent ✓"
                : "Email Pass Link"}
            </Button>
          </div>
          {emailStatus === "sent" && (
            <p className="mt-1.5 text-[11px] text-emerald-400 font-semibold">
              ✓ Mobile binding link dispatched to {targetEmail}! Open on your smartphone.
            </p>
          )}
          {emailStatus === "error" && (
            <p className="mt-1.5 text-[11px] text-amber-400">
              Note: Email gateway simulated or pending. You can use WhatsApp or scan the QR code above.
            </p>
          )}
        </form>

        {/* Security Anti-Scalping Callout */}
        <div className="rounded-xl border border-gold/30 bg-gold/10 p-3 text-[11px] text-ivory/90 flex items-start gap-2.5">
          <ShieldCheck className="size-4 text-gold shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Anti-Forwarding Protection:</strong> Opening the link on your smartphone
            permanently binds this pass to your phone. Recipient forwarding is disabled so tickets
            cannot be scalped or shared with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}

interface PassDeviceGuardProps {
  passCode: string;
  holderName: string;
  isTableGuest?: boolean;
  userEmail?: string;
  userPhone?: string;
  children: ReactNode;
}

export function PassDeviceGuard({
  passCode,
  holderName,
  isTableGuest = false,
  userEmail = "",
  userPhone = "+234 818 188 8884",
  children,
}: PassDeviceGuardProps) {
  const [authStatus, setAuthStatus] = useState<
    "checking" | "authorized" | "blocked" | "desktop_unbound" | "desktop_locked"
  >("checking");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showDesktopPreview, setShowDesktopPreview] = useState<boolean>(false);
  const [isNewlyBound, setIsNewlyBound] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function evaluateDeviceSecurity() {
      const isMobile = isMobileBrowser();
      const isHost = passCode.toUpperCase().includes("-S01-");

      // Table Host ticket (-S01-) is unrestricted master pass
      if (isHost) {
        if (isMounted) setAuthStatus("authorized");
        return;
      }

      // ── DESKTOP SESSION ──
      if (!isMobile) {
        try {
          // Check if pass is already bound to a mobile device
          const binding = await verifyPassDeviceBinding(passCode, "");
          if (!isMounted) return;

          if (binding.status === "forwarding_blocked") {
            // Mobile-bound pass accessed on desktop -> Reject with access lock screen
            setAuthStatus("desktop_locked");
            setErrorMessage(
              binding.message ||
                "Pass is non-transferable and locked to another device. Under Abeokuta Polo Festival anti-scalping security protocol, this pass is bound exclusively to the attendee's mobile phone."
            );
            return;
          }

          // Unbound pass viewed on desktop -> Display Mobile Binding Station
          setAuthStatus("desktop_unbound");
        } catch {
          if (isMounted) setAuthStatus("desktop_unbound");
        }
        return;
      }

      // ── MOBILE SESSION ──
      const mobileId = getOrCreateMobileDeviceId();

      try {
        const res = await verifyPassDeviceBinding(passCode, mobileId, holderName);
        if (!isMounted) return;

        if (res.isAuthorized) {
          setAuthStatus("authorized");
          setIsNewlyBound(res.status === "newly_bound");
        } else {
          setAuthStatus("blocked");
          setErrorMessage(
            res.message ||
              "Pass is non-transferable and locked to another device. Under Abeokuta Polo Festival anti-scalping security protocol, VIP passes cannot be forwarded or shared."
          );
        }
      } catch {
        // Fallback gracefully on network error so genuine patrons aren't stranded
        if (isMounted) setAuthStatus("authorized");
      }
    }

    evaluateDeviceSecurity();

    return () => {
      isMounted = false;
    };
  }, [passCode, holderName]);

  // 1. Loading / Verification Handshake
  if (authStatus === "checking") {
    return (
      <div className="flex min-h-[50vh] w-full flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-3 rounded-2xl border border-gold/30 bg-[#120E03] p-6 text-ivory shadow-xl">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold animate-pulse">
            <Lock className="size-6" />
          </div>
          <h2 className="font-display text-lg font-bold text-gold">Verifying Device Security</h2>
          <p className="text-xs text-ivory/80 leading-relaxed">
            Authenticating anti-forwarding device lock token for Pass{" "}
            <strong className="font-mono text-gold">{passCode}</strong>...
          </p>
          <div className="flex items-center justify-center gap-2 text-[11px] text-ivory/60 pt-2">
            <RefreshCw className="size-3 animate-spin text-gold" />
            <span>Turnstile Device Handshake</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Desktop Viewing Unbound Pass: Show Mobile Binding Station
  if (authStatus === "desktop_unbound") {
    return (
      <div className="w-full max-w-4xl mx-auto py-6 px-4 space-y-6">
        <MobileBindingStation
          passCode={passCode}
          holderName={holderName}
          phone={userPhone}
          email={userEmail}
        />

        {/* Toggle to preview gate card on desktop */}
        <div className="text-center pt-2">
          <Button
            onClick={() => setShowDesktopPreview((prev) => !prev)}
            variant="ghost"
            size="sm"
            className="text-xs text-muted-brand hover:text-forest underline"
          >
            <Laptop className="mr-1.5 size-3.5" />
            {showDesktopPreview ? "Hide Desktop Pass Preview" : "Preview Gate Pass ID Card on Desktop →"}
          </Button>
        </div>

        {showDesktopPreview && (
          <div className="pt-4 border-t border-line space-y-3">
            <div className="mx-auto max-w-md rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-center text-xs text-amber-900">
              <strong>⚠️ Desktop Preview Only:</strong> Turnstile barcode admission requires scanning the QR code above with your mobile phone to activate live contactless gate entry.
            </div>
            {children}
          </div>
        )}
      </div>
    );
  }

  // 3. Desktop Viewing Mobile-Bound Pass: Access Locked Screen
  if (authStatus === "desktop_locked") {
    const maskedCode = passCode.length > 8 ? `${passCode.slice(0, 14)}••••` : passCode;
    return (
      <div className="flex min-h-[65vh] w-full flex-col items-center justify-center p-4 sm:p-6 text-center bg-ivory">
        <div className="max-w-md w-full space-y-4 rounded-3xl border-2 border-amber-500/50 bg-[#161005] p-6 sm:p-8 text-ivory shadow-2xl">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-950/80 border-2 border-amber-500 text-amber-400">
            <Smartphone className="size-9" />
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest bg-amber-500 text-black">
              Anti-Scalping Protocol Active
            </span>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-amber-200">
              Pass Bound to Mobile Device
            </h1>
            <p className="text-xs font-semibold text-amber-300">
              Pass is non-transferable and locked to another device
            </p>
            <p className="text-xs font-mono text-gold">{maskedCode}</p>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3.5 text-xs text-amber-100 text-left space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                This gate pass is locked exclusively to the attendee&apos;s mobile phone for contactless turnstile admission. Access from desktop browsers is restricted under anti-scalping protocol.
              </p>
            </div>
            <p className="text-[11px] text-ivory/70 leading-relaxed border-t border-amber-900/50 pt-2">
              Under Abeokuta Polo Festival rules, each pass is bound to the original recipient&apos;s smartphone to prevent unauthorized sharing, printing, or duplicate admission.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              asChild
              variant="outline"
              className="border-ivory/20 bg-ivory/5 text-ivory hover:bg-ivory/10 text-xs flex-1 cursor-pointer"
            >
              <Link href="/">
                <ArrowLeft className="mr-1.5 size-3.5" /> Return Home
              </Link>
            </Button>
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex-1 cursor-pointer"
            >
              <a
                href="https://wa.me/2348181888884?text=Hello%20Secretariat%2C%20I%20need%20assistance%20accessing%20my%20mobile-bound%20pass."
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

  // 4. Mobile Forwarding Blocked Screen
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
            <p className="text-xs font-semibold text-red-300">
              Pass is non-transferable and locked to another device
            </p>
            <p className="text-xs font-mono text-gold">{maskedCode}</p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3.5 text-xs text-red-100 text-left space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {errorMessage ||
                  "Pass is non-transferable and locked to another device. Under Abeokuta Polo Festival anti-scalping security protocol, passes cannot be forwarded or shared."}
              </p>
            </div>
            <p className="text-[11px] text-ivory/70 leading-relaxed border-t border-red-900/50 pt-2">
              Under Abeokuta Polo Festival rules, tickets bind exclusively to the recipient device upon initial claim. They cannot be re-forwarded, scalped, or shared with third parties.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              asChild
              variant="outline"
              className="border-ivory/20 bg-ivory/5 text-ivory hover:bg-ivory/10 text-xs flex-1 cursor-pointer"
            >
              <Link href="/">
                <ArrowLeft className="mr-1.5 size-3.5" /> Return Home
              </Link>
            </Button>
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex-1 cursor-pointer"
            >
              <a
                href="https://wa.me/2348181888884?text=Hello%20Secretariat%2C%20I%20need%20assistance%20with%20my%20pass%20device%20binding."
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

  // 5. Authorized (Mobile Bound or Table Host)
  return (
    <>
      {isNewlyBound && (
        <div className="mx-auto w-full max-w-[290px] sm:max-w-[305px] mb-2 rounded-xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 p-2.5 text-center text-ivory shadow-xs">
          <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-300 text-[10px] sm:text-[11px]">
            <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
            <span>Pass Successfully Bound to This Phone</span>
          </div>
          <p className="text-[9px] text-emerald-200/90 leading-tight mt-0.5">
            Turnstile contactless access activated. Device-locked under anti-scalping protocol.
          </p>
        </div>
      )}

      {isTableGuest && !isNewlyBound && (
        <div className="mx-auto w-full max-w-[290px] sm:max-w-[305px] mb-2 rounded-xl border border-gold/40 bg-gradient-to-r from-[#1B1608] via-[#2A2007] to-[#1B1608] p-2.5 text-center text-ivory shadow-xs">
          <div className="flex items-center justify-center gap-1.5 font-bold text-gold text-[10px] sm:text-[11px]">
            <ShieldCheck className="size-3.5 text-gold shrink-0" />
            <span>Device-Locked Guest Invitation</span>
          </div>
          <p className="text-[9px] text-ivory/80 leading-tight mt-0.5">
            Bound to this device for Grand Finale turnstiles. Link forwarding &amp; sharing are locked.
          </p>
        </div>
      )}

      {children}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCodeLib from "qrcode";
import {
  ShieldCheck,
  Lock,
  Printer,
  ExternalLink,
  Crown,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import type { ComplimentaryInvitation } from "@/lib/invitations/types";

export interface PortraitInvitationCardProps {
  invitation: ComplimentaryInvitation;
  className?: string;
  showActions?: boolean;
}

/**
 * Large Portrait Invitation Card Component.
 * - Strict portrait orientation (480 × 720 px on screen; A5 / 5×7" Portrait when printed).
 * - Strictly non-transferable: no standalone downloadable image or static HTML
 *   files are generated, so the card cannot be copied from a desktop to a
 *   mobile phone or from one mobile phone to another phone.
 * - Printing runs directly from the single bound device via `window.print()`.
 */
export function PortraitInvitationCard({
  invitation,
  className = "",
  showActions = true,
}: PortraitInvitationCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  const hasProvidedNames = Boolean(
    invitation.firstName?.trim() || invitation.surname?.trim()
  );
  const guestFullName = [invitation.firstName, invitation.surname]
    .filter(Boolean)
    .join(" ")
    .trim();

  // Scannable verification payload (embeds "Aare Elesin" seal and unique ID)
  const qrTargetPayload =
    invitation.qrPayload ||
    invitation.qrToken ||
    `/invitation/verify?id=${invitation.invitationCode}&seal=Aare+Elesin`;

  // Verification URL for manual navigation (also guarded by device lock)
  const verificationHref = `/invitation/verify?id=${invitation.invitationCode}&seal=Aare+Elesin${
    invitation.qrToken ? `&sig=${encodeURIComponent(invitation.qrToken)}` : ""
  }`;

  useEffect(() => {
    QRCodeLib.toDataURL(qrTargetPayload, {
      margin: 1,
      width: 480,
      errorCorrectionLevel: "H",
      color: {
        dark: "#0A0A0A",
        light: "#FFFFFF",
      },
    })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error("Failed to render QR Code for portrait invitation:", err);
      });
  }, [qrTargetPayload]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleCopyLink = async () => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/invitation/${invitation.invitationCode}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } catch {
        // Fallback
      }
    }
  };

  return (
    <div className={`flex flex-col items-center w-full max-w-full ${className}`}>
      {/* ── PORTRAIT INVITATION CARD (STRICT PORTRAIT: max-w-[440px] sm:max-w-[480px], min-h-[700px]) ── */}
      <div
        id="portrait-invitation-container"
        className="relative w-full max-w-[440px] sm:max-w-[480px] rounded-3xl p-2.5 sm:p-3 border-2 border-[#C9A84C]/80 bg-gradient-to-b from-[#141008] via-[#0A0A0A] to-[#040404] shadow-[0_0_50px_rgba(201,168,76,0.22)] print:shadow-none print:max-w-[480px] [-webkit-print-color-adjust:exact] [print-color-adjust:exact] transition-all duration-300"
      >
        {/* Inner Hairline Filigree Frame */}
        <div className="relative rounded-2xl border border-[#C9A84C]/40 p-6 sm:p-8 flex flex-col items-center justify-between min-h-[680px] sm:min-h-[720px] text-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1C1608]/40 via-transparent to-transparent">
          {/* Subtle Corner Gold Ornaments */}
          <div className="absolute top-2 left-2 size-2 border-t border-l border-[#C9A84C]" />
          <div className="absolute top-2 right-2 size-2 border-t border-r border-[#C9A84C]" />
          <div className="absolute bottom-2 left-2 size-2 border-b border-l border-[#C9A84C]" />
          <div className="absolute bottom-2 right-2 size-2 border-b border-r border-[#C9A84C]" />

          {/* 1. Header Section: Crest & Royal Inscriptions */}
          <div className="flex flex-col items-center space-y-2 pt-1">
            <div className="relative size-16 sm:size-18 flex items-center justify-center">
              <Image
                src="/icons/icon.svg"
                alt="Abeokuta Polo Club Royal Crest"
                width={72}
                height={72}
                className="drop-shadow-[0_0_12px_rgba(201,168,76,0.35)] object-contain"
                priority
              />
            </div>

            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-sans uppercase font-bold tracking-[0.25em] text-[#C9A84C]">
                <Crown className="size-3 text-[#E5C768]" />
                Royal Access &amp; Dignitary Pass
              </span>
              <h1 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-[0.2em] text-[#FDFCF8] leading-tight drop-shadow-sm">
                Abeokuta Polo Festival
              </h1>
              <p className="text-[10px] sm:text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-[#C9A84C]/80">
                December 18–20, 2026 · Egba Heritage
              </p>
            </div>
          </div>

          {/* 2. Guest Information & Access Category Section */}
          <div className="w-full my-4 space-y-2 py-3 border-y border-[#C9A84C]/25 bg-[#0F0C05]/60 rounded-xl px-4">
            <div className="text-[9.5px] sm:text-[10.5px] uppercase font-bold tracking-[0.25em] text-[#C9A84C]/90">
              {hasProvidedNames ? "Formal Invitation Presented To" : "Distinguished Dignitary Invitation"}
            </div>

            {hasProvidedNames ? (
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-wide leading-tight drop-shadow-md">
                {guestFullName}
              </h2>
            ) : (
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#FCF9F8] tracking-wide leading-tight drop-shadow-md">
                Honoured Patron of the Festival
              </h2>
            )}

            <p className="font-sans text-sm sm:text-base font-semibold text-[#E5C768] tracking-wide">
              {invitation.designation}
            </p>

            <div className="pt-1.5 flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-1.5 rounded-full border-2 border-[#C9A84C] bg-[#1E180A] text-[#F3E5AB] text-xs sm:text-sm font-extrabold uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(201,168,76,0.3)]">
                <Sparkles className="size-3.5 text-[#E5C768]" />
                <span>{invitation.category}</span>
              </span>
            </div>
          </div>

          {/* 3. High-Contrast QR Code Verification Core */}
          <div className="flex flex-col items-center my-3 w-full">
            <div className="relative rounded-2xl p-2.5 sm:p-3 bg-white border-2 border-[#C9A84C] shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`Aare Elesin QR Verification for ${invitation.invitationCode}`}
                  className="size-36 sm:size-40 object-contain block rounded-lg"
                />
              ) : (
                <div className="size-36 sm:size-40 flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">
                  <span className="text-[11px] font-mono text-gray-500">Generating QR...</span>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-col items-center space-y-1">
              <div className="font-mono text-base sm:text-lg font-extrabold tracking-[0.22em] text-[#C9A84C]">
                {invitation.invitationCode}
              </div>

              <div className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wider text-[#E5C768]">
                <ShieldCheck className="size-3.5 text-[#C9A84C]" />
                <span>Aare Elesin · Royal Security Sealed</span>
              </div>
            </div>
          </div>

          {/* 4. Non-Transferable Device Binding Footer */}
          <div className="w-full pt-3 mt-1">
            <div className="rounded-xl border border-amber-600/35 bg-gradient-to-r from-[#1C1405] via-[#241A06] to-[#1C1405] p-2.5 sm:p-3 text-center space-y-1 shadow-sm">
              <div className="flex items-center justify-center gap-1.5 font-bold text-[#E5C768] text-[10px] sm:text-[11px] uppercase tracking-wider">
                <Lock className="size-3 text-[#C9A84C] shrink-0" />
                <span>Strictly Non-Transferable · Device Bound</span>
              </div>
              <p className="text-[9px] sm:text-[9.5px] text-[#FCF9F8]/75 leading-tight">
                This complimentary royal invitation is locked to this device for turnstile admission at Gate 1 (VVIP Enclosure) &amp; Gate 2 across Days 1, 2 &amp; 3.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── DIGNITARY UTILITY ACTIONS (No transferable file downloads) ── */}
      {showActions && (
        <div className="w-full max-w-[440px] sm:max-w-[480px] mt-4 print:hidden space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Print Royal Invitation directly from this bound device */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#C9A84C]/50 bg-[#161208] hover:bg-[#201A0B] text-[#F3E5AB] text-xs font-semibold shadow-sm transition active:scale-[0.98] cursor-pointer"
            >
              <Printer className="size-3.5 text-[#C9A84C]" />
              <span>Print Royal Card</span>
            </button>

            {/* Open Dedicated QR Verification Page (device-locked) */}
            <Link
              href={verificationHref}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#C9A84C]/60 bg-[#1E1708] hover:bg-[#2A200B] text-[#FFF2CE] text-xs font-bold shadow-sm transition active:scale-[0.98]"
            >
              <ShieldCheck className="size-3.5 text-[#E5C768]" />
              <span>Verify &quot;Aare Elesin&quot;</span>
              <ExternalLink className="size-3 text-[#C9A84C]/70" />
            </Link>

            {/* Copy Non-Transferable Guest Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#C9A84C]/30 bg-[#0E0C06] hover:bg-[#181409] text-[#E5C768] text-xs font-semibold shadow-sm transition active:scale-[0.98] cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Link Copied!</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5 text-[#C9A84C]" />
                  <span>Copy Pass Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Client Device Guard Wrapper for Complimentary Portrait Invitations.
 * Enforces strict non-transferability on every device (desktop or mobile)
 * with no query-parameter bypasses:
 * 1. Automatically binds invitation to the first device that opens it (`abk_device_id`).
 * 2. Any other desktop or mobile phone is strictly blocked.
 */
export function PortraitInvitationDeviceGuard({
  invitation,
  onBindDevice,
  children,
}: {
  invitation: ComplimentaryInvitation;
  onBindDevice: (deviceId: string) => Promise<{ authorized: boolean; status: string; message?: string }>;
  children?: React.ReactNode;
}) {
  const [authStatus, setAuthStatus] = useState<"checking" | "authorized" | "blocked">("checking");
  const [blockMessage, setBlockMessage] = useState<string>("");

  useEffect(() => {
    let deviceId = "";
    if (typeof window !== "undefined") {
      deviceId = localStorage.getItem("abk_device_id") || "";
      if (!deviceId) {
        deviceId = `DEV-${crypto.randomUUID()}`;
        localStorage.setItem("abk_device_id", deviceId);
      }
    }

    onBindDevice(deviceId)
      .then((res) => {
        if (res.authorized) {
          setAuthStatus("authorized");
        } else {
          setAuthStatus("blocked");
          setBlockMessage(
            res.message ||
              "This complimentary royal invitation is non-transferable and has already been bound to another device."
          );
        }
      })
      .catch(() => {
        setAuthStatus("blocked");
        setBlockMessage(
          "Unable to verify device binding for this invitation. Please check your connection and try again."
        );
      });
  }, [invitation.invitationCode, onBindDevice]);

  if (authStatus === "checking") {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full space-y-3 rounded-2xl border border-[#C9A84C]/40 bg-[#0E0C06] p-6 text-[#FCF9F8] shadow-2xl">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#C9A84C]/15 text-[#E5C768] animate-pulse">
            <Lock className="size-6" />
          </div>
          <h2 className="font-display text-lg font-bold text-[#E5C768]">
            Verifying Device Security
          </h2>
          <p className="text-xs text-[#FCF9F8]/80 leading-relaxed font-sans">
            Authenticating non-transferable device binding for invitation{" "}
            <strong className="font-mono text-[#C9A84C]">{invitation.invitationCode}</strong>...
          </p>
          <div className="flex items-center justify-center gap-2 text-[11px] text-[#C9A84C]/80 pt-2 font-mono">
            <span>🛡️ Aare Elesin Protocol Handshake</span>
          </div>
        </div>
      </div>
    );
  }

  if (authStatus === "blocked") {
    return (
      <div className="flex min-h-[65vh] w-full flex-col items-center justify-center p-4 sm:p-6 text-center">
        <div className="max-w-md w-full space-y-5 rounded-3xl border-2 border-red-500/60 bg-[#120505] p-6 sm:p-8 text-[#FCF9F8] shadow-2xl">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-950/80 border-2 border-red-500 text-red-400">
            <Lock className="size-8" />
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest bg-red-500 text-black">
              Anti-Transfer Protocol Active
            </span>
            <h1 className="font-display text-2xl font-bold text-red-200">
              Invitation Transfer Blocked
            </h1>
            <p className="text-xs font-mono text-[#C9A84C]">{invitation.invitationCode}</p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3.5 text-xs text-red-100 text-left space-y-2">
            <p className="font-semibold text-red-200 flex items-center gap-1.5">
              <span>⚠️ Non-Transferable Compliment Pass</span>
            </p>
            <p className="text-[11.5px] text-red-100/85 leading-relaxed">
              {blockMessage}
            </p>
          </div>

          <p className="text-[11px] text-[#FCF9F8]/60 leading-relaxed">
            If you recently switched your device or require secretariat re-assignment, please contact the Secretariat Accounts desk.
          </p>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl border border-[#C9A84C]/40 bg-[#1A1408] text-[#E5C768] text-xs font-bold hover:bg-[#251D0B] transition"
            >
              Return to Official Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children ?? <PortraitInvitationCard invitation={invitation} />}</>;
}

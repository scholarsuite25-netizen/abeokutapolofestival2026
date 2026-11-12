"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCodeLib from "qrcode";
import {
  ShieldCheck,
  Lock,
  Printer,
  Download,
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
 * Renders a print-shop-ready 300-DPI Portrait Invitation Card (1440 × 2160 px,
 * exact 2:3 ratio — 5" × 7" / A5 Portrait) onto an HTML5 canvas and downloads
 * it immediately as a crisp PNG file for physical printing.
 */
export async function downloadPrintableInvitationPng(
  invitation: ComplimentaryInvitation
): Promise<void> {
  const qrTargetPayload =
    invitation.qrPayload ||
    invitation.qrToken ||
    `/invitation/verify?id=${invitation.invitationCode}&seal=Aare+Elesin`;

  const qrDataUrl = await QRCodeLib.toDataURL(qrTargetPayload, {
    margin: 1,
    width: 600,
    errorCorrectionLevel: "H",
    color: { dark: "#0A0A0A", light: "#FFFFFF" },
  });

  const loadImage = (src: string): Promise<HTMLImageElement | null> =>
    new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  const [crestImg, qrImg] = await Promise.all([
    loadImage("/icons/icon.svg"),
    loadImage(qrDataUrl),
  ]);

  const W = 1440;
  const H = 2160;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // 1. Deep obsidian background + top royal gold radial glow
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#141008");
  bgGrad.addColorStop(0.5, "#0A0A0A");
  bgGrad.addColorStop(1, "#040404");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 260, 20, W / 2, 260, 680);
  glow.addColorStop(0, "rgba(201, 168, 76, 0.22)");
  glow.addColorStop(1, "rgba(201, 168, 76, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // 2. Outer Gold Border & Inner Filigree Frame
  roundRect(36, 36, W - 72, H - 72, 64);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(201, 168, 76, 0.88)";
  ctx.stroke();

  roundRect(72, 72, W - 144, H - 144, 44);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(201, 168, 76, 0.45)";
  ctx.stroke();

  // Corner Gold Ornaments
  const corners = [
    [96, 96, 1, 1],
    [W - 96, 96, -1, 1],
    [96, H - 96, 1, -1],
    [W - 96, H - 96, -1, -1],
  ];
  ctx.strokeStyle = "#C9A84C";
  ctx.lineWidth = 4;
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * 28);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * 28, cy);
    ctx.stroke();
  }

  // 3. Crest & Header Inscriptions
  if (crestImg) {
    ctx.drawImage(crestImg, W / 2 - 90, 125, 180, 180);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#C9A84C";
  ctx.font = "700 28px 'Manrope', 'Segoe UI', Arial, sans-serif";
  ctx.fillText("👑  ROYAL ACCESS & DIGNITARY PASS", W / 2, 355);

  ctx.fillStyle = "#FDFCF8";
  ctx.font = "700 64px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText("ABEOKUTA POLO FESTIVAL", W / 2, 430);

  ctx.fillStyle = "rgba(201, 168, 76, 0.88)";
  ctx.font = "600 28px 'Manrope', 'Segoe UI', Arial, sans-serif";
  ctx.fillText("DECEMBER 18–20, 2026  ·  EGBA HERITAGE", W / 2, 480);

  // 4. Dignitary Panel
  const panelY = 535;
  const panelH = 470;
  roundRect(120, panelY, W - 240, panelH, 32);
  ctx.fillStyle = "rgba(15, 12, 5, 0.78)";
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "rgba(201, 168, 76, 0.32)";
  ctx.stroke();

  const hasNames = Boolean(invitation.firstName?.trim() || invitation.surname?.trim());
  const fullName =
    [invitation.firstName, invitation.surname].filter(Boolean).join(" ").trim() ||
    "Honoured Patron of the Festival";

  ctx.fillStyle = "rgba(201, 168, 76, 0.92)";
  ctx.font = "700 26px 'Manrope', 'Segoe UI', Arial, sans-serif";
  ctx.fillText(
    hasNames ? "FORMAL INVITATION PRESENTED TO" : "DISTINGUISHED DIGNITARY INVITATION",
    W / 2,
    panelY + 68
  );

  // Guest Name (auto-fit font size if name is long)
  let nameFontSize = 72;
  ctx.font = `700 ${nameFontSize}px 'Cormorant Garamond', Georgia, serif`;
  while (ctx.measureText(fullName).width > W - 320 && nameFontSize > 42) {
    nameFontSize -= 4;
    ctx.font = `700 ${nameFontSize}px 'Cormorant Garamond', Georgia, serif`;
  }
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(fullName, W / 2, panelY + 170);

  // Designation
  ctx.fillStyle = "#E5C768";
  ctx.font = "600 40px 'Manrope', 'Segoe UI', Arial, sans-serif";
  ctx.fillText(invitation.designation || "Special Guest", W / 2, panelY + 245);

  // Category Pill
  const catText = `✦  ${(invitation.category || "VVIP").toUpperCase()}  ✦`;
  ctx.font = "800 34px 'Manrope', 'Segoe UI', Arial, sans-serif";
  const pillW = Math.max(380, ctx.measureText(catText).width + 110);
  const pillH = 82;
  const pillX = (W - pillW) / 2;
  const pillY = panelY + 310;
  roundRect(pillX, pillY, pillW, pillH, 41);
  ctx.fillStyle = "#1E180A";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#C9A84C";
  ctx.stroke();

  ctx.fillStyle = "#F3E5AB";
  ctx.fillText(catText, W / 2, pillY + 53);

  // 5. High-Contrast QR Code Verification Core
  const qrBoxSize = 560;
  const qrBoxX = (W - qrBoxSize) / 2;
  const qrBoxY = 1065;
  roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 42);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#C9A84C";
  ctx.stroke();

  if (qrImg) {
    ctx.drawImage(qrImg, qrBoxX + 32, qrBoxY + 32, qrBoxSize - 64, qrBoxSize - 64);
  }

  // Unique Invitation Code & Royal Seal
  ctx.fillStyle = "#C9A84C";
  ctx.font = "800 46px 'JetBrains Mono', Consolas, monospace";
  ctx.fillText(invitation.invitationCode, W / 2, 1705);

  ctx.fillStyle = "#E5C768";
  ctx.font = "700 28px 'Manrope', 'Segoe UI', Arial, sans-serif";
  ctx.fillText("🛡️  AARE ELESIN · ROYAL SECURITY SEALED", W / 2, 1760);

  // 6. Non-Transferable Footer Box
  const footY = 1815;
  const footH = 195;
  roundRect(120, footY, W - 240, footH, 28);
  ctx.fillStyle = "#1C1405";
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "rgba(217, 119, 6, 0.45)";
  ctx.stroke();

  ctx.fillStyle = "#E5C768";
  ctx.font = "700 27px 'Manrope', 'Segoe UI', Arial, sans-serif";
  ctx.fillText("🔒  STRICTLY NON-TRANSFERABLE · OFFICIAL ACCESS CREDENTIAL", W / 2, footY + 58);

  ctx.fillStyle = "rgba(252, 249, 248, 0.82)";
  ctx.font = "500 23px 'Manrope', 'Segoe UI', Arial, sans-serif";
  ctx.fillText(
    "Admitted at Gate 1 (Royal Box & VVIP Enclosure) & Gate 2 across Days 1, 2 & 3.",
    W / 2,
    footY + 112
  );
  ctx.fillStyle = "rgba(201, 168, 76, 0.72)";
  ctx.font = "600 20px 'JetBrains Mono', Consolas, monospace";
  ctx.fillText(
    "PRINT SPEC: A5 / 5×7 IN PORTRAIT (480×720 PT · 1440×2160 PX @ 300 DPI)",
    W / 2,
    footY + 158
  );

  // Trigger PNG download
  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `Abeokuta-Polo-2026-Invitation-${invitation.invitationCode}-Print.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Generates a self-contained offline HTML invitation file for dignitary offline access.
 */
function downloadOfflineInvitationHtml(
  invitation: ComplimentaryInvitation,
  qrDataUrl: string
): void {
  const dignitaryName =
    [invitation.firstName, invitation.surname].filter(Boolean).join(" ") ||
    invitation.designation ||
    "Distinguished Guest";

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abeokuta Polo Festival 2026 — Royal Invitation (${invitation.invitationCode})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Manrope:wght@400;600;800&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #030303;
      color: #FCF9F8;
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }
    .portrait-card {
      width: 100%;
      max-width: 480px;
      min-height: 720px;
      background: radial-gradient(circle at 50% 12%, rgba(201, 168, 76, 0.15) 0%, rgba(10, 10, 10, 0.98) 75%), #0A0A0A;
      border: 2px solid rgba(201, 168, 76, 0.8);
      border-radius: 28px;
      padding: 12px;
      box-shadow: 0 0 50px rgba(201, 168, 76, 0.22);
      position: relative;
    }
    .inner-frame {
      border: 1px solid rgba(201, 168, 76, 0.4);
      border-radius: 20px;
      padding: 32px 24px;
      min-height: 696px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
    }
    .crest-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 12px;
    }
    .crown-gold { color: #C9A84C; font-size: 28px; margin-bottom: 6px; }
    .festival-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 20px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #E5C768;
      font-weight: 700;
    }
    .festival-sub {
      font-size: 10px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(252, 249, 248, 0.7);
      margin-top: 2px;
    }
    .guest-section {
      margin: 16px 0;
    }
    .salutation {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #C9A84C;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .guest-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 30px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: 0.04em;
      line-height: 1.15;
    }
    .guest-designation {
      font-size: 15px;
      color: #E5C768;
      font-weight: 600;
      margin-top: 6px;
    }
    .category-pill {
      display: inline-block;
      margin-top: 14px;
      padding: 6px 20px;
      border-radius: 9999px;
      border: 2px solid #C9A84C;
      background: #1A1405;
      color: #F3E5AB;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      box-shadow: 0 0 15px rgba(201, 168, 76, 0.25);
    }
    .qr-container {
      margin: 18px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .qr-tile {
      background: #FFFFFF;
      padding: 12px;
      border-radius: 16px;
      border: 2px solid #C9A84C;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }
    .qr-tile img {
      width: 150px;
      height: 150px;
      display: block;
    }
    .invitation-id {
      font-family: 'JetBrains Mono', monospace;
      font-size: 15px;
      font-weight: 700;
      color: #C9A84C;
      letter-spacing: 0.2em;
      margin-top: 10px;
    }
    .seal-endorsement {
      font-size: 11px;
      color: #DFC06A;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .security-notice {
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 12px;
      background: rgba(201, 168, 76, 0.08);
      border: 1px solid rgba(201, 168, 76, 0.25);
      font-size: 10.5px;
      color: rgba(252, 249, 248, 0.85);
      line-height: 1.4;
    }
    .security-notice strong {
      color: #C9A84C;
    }
    @page {
      size: A5 portrait;
      margin: 0;
    }
    @media print {
      body { background: #030303; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .portrait-card { box-shadow: none; max-width: 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="portrait-card">
    <div class="inner-frame">
      <div class="crest-container">
        <div class="crown-gold">👑</div>
        <div class="festival-title">Abeokuta Polo Festival</div>
        <div class="festival-sub">December 18–20, 2026 · Established 1928</div>
      </div>

      <div class="guest-section">
        <div class="salutation">Royal Complimentary Access</div>
        <div class="guest-name">${dignitaryName}</div>
        <div class="guest-designation">${invitation.designation}</div>
        <div class="category-pill">${invitation.category}</div>
      </div>

      <div class="qr-container">
        <div class="qr-tile">
          <img src="${qrDataUrl}" alt="Aare Elesin QR Verification" />
        </div>
        <div class="invitation-id">${invitation.invitationCode}</div>
        <div class="seal-endorsement">🛡️ Aare Elesin · Security Seal Verified</div>
      </div>

      <div class="security-notice">
        <strong>🔒 Strictly Non-Transferable · Offline Access Credential</strong><br />
        Admitted at Gate 1 (Royal Box & VVIP Enclosure) & Gate 2 (General Turnstiles) across all three tournament days.
      </div>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Abeokuta-Polo-2026-Invitation-${invitation.invitationCode}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Large Portrait Invitation Card Component.
 * - Strict portrait orientation.
 * - Sizing: w-full max-w-[440px] sm:max-w-[480px], min-height 680–740px (>2x surface area of 305px gate pass).
 * - Deep obsidian black (#0A0A0A / #080808) with double gold border (#C9A84C).
 * - Cormorant Garamond luxury serif typography, pure white guest name, champagne gold designation.
 * - Scannable QR code on high-contrast white tile with gold border, embedding "Aare Elesin" seal.
 * - Non-transferable device notice.
 */
export function PortraitInvitationCard({
  invitation,
  className = "",
  showActions = true,
}: PortraitInvitationCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Determine displayed guest name or gracefully collapse if omitted
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

  // Verification URL for manual navigation
  const verificationHref = `/invitation/verify?id=${invitation.invitationCode}&seal=Aare+Elesin${
    invitation.qrToken ? `&sig=${encodeURIComponent(invitation.qrToken)}` : ""
  }`;

  useEffect(() => {
    // Generate high-resolution scannable QR code
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

  const handleDownloadOfflineHtml = () => {
    if (qrDataUrl) {
      downloadOfflineInvitationHtml(invitation, qrDataUrl);
    }
  };

  const handleDownloadPrintPng = () => {
    void downloadPrintableInvitationPng(invitation);
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
                Royal Access & Dignitary Pass
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

            {/* Guest Name: Pure White Cormorant Garamond */}
            {hasProvidedNames ? (
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-wide leading-tight drop-shadow-md">
                {guestFullName}
              </h2>
            ) : (
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#FCF9F8] tracking-wide leading-tight drop-shadow-md">
                Honoured Patron of the Festival
              </h2>
            )}

            {/* Designation: Champagne Gold */}
            <p className="font-sans text-sm sm:text-base font-semibold text-[#E5C768] tracking-wide">
              {invitation.designation}
            </p>

            {/* Category Badge Pill with Gold Foil Border */}
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

            {/* Unique Invitation Code in Monospace Gold */}
            <div className="mt-3 flex flex-col items-center space-y-1">
              <div className="font-mono text-base sm:text-lg font-extrabold tracking-[0.22em] text-[#C9A84C]">
                {invitation.invitationCode}
              </div>

              {/* Security Seal Endorsement Notice */}
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
                This complimentary royal invitation is locked to this mobile device for turnstile admission at Gate 1 (VVIP Enclosure) & Gate 2 across Days 1, 2 & 3.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── DIGNITARY UTILITY ACTIONS ── */}
      {showActions && (
        <div className="w-full max-w-[440px] sm:max-w-[480px] mt-4 print:hidden space-y-2">
          {/* Primary Print-Ready Download Button */}
          <button
            type="button"
            onClick={handleDownloadPrintPng}
            disabled={!qrDataUrl}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-[#C9A84C] bg-[#C9A84C] hover:bg-[#DFBE68] text-[#0A0803] text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-lg transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <Download className="size-4 text-[#0A0803]" />
            <span>Download Printable Card (300 DPI PNG · A5 / 5×7&quot;)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {/* Download Offline HTML */}
            <button
              type="button"
              onClick={handleDownloadOfflineHtml}
              disabled={!qrDataUrl}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#C9A84C]/50 bg-[#161208] hover:bg-[#201A0B] text-[#F3E5AB] text-xs font-semibold shadow-sm transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <Download className="size-3.5 text-[#C9A84C]" />
              <span>Offline Card (.html)</span>
            </button>

            {/* Print Royal Invitation / Save as PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#C9A84C]/50 bg-[#161208] hover:bg-[#201A0B] text-[#F3E5AB] text-xs font-semibold shadow-sm transition active:scale-[0.98] cursor-pointer"
            >
              <Printer className="size-3.5 text-[#C9A84C]" />
              <span>Print / Save as PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Open Dedicated QR Verification Page */}
            <Link
              href={verificationHref}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#C9A84C]/60 bg-[#1E1708] hover:bg-[#2A200B] text-[#FFF2CE] text-xs font-bold shadow-sm transition active:scale-[0.98]"
            >
              <ShieldCheck className="size-3.5 text-[#E5C768]" />
              <span>Verify &quot;Aare Elesin&quot;</span>
              <ExternalLink className="size-3 text-[#C9A84C]/70" />
            </Link>

            {/* Copy Guest Link */}
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
 * Enforces non-transferability:
 * 1. Automatically binds invitation to client device on first open (localStorage `abk_device_id`).
 * 2. If opened on an unauthorized device, presents a secure barrier preventing pass forwarding.
 */
export function PortraitInvitationDeviceGuard({
  invitation,
  onBindDevice,
}: {
  invitation: ComplimentaryInvitation;
  onBindDevice: (deviceId: string) => Promise<{ authorized: boolean; status: string; message?: string }>;
}) {
  const [authStatus, setAuthStatus] = useState<"checking" | "authorized" | "blocked">("checking");
  const [blockMessage, setBlockMessage] = useState<string>("");

  useEffect(() => {
    let deviceId = "";
    let isAdminPreview = false;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      isAdminPreview = params.get("preview") === "admin";
      deviceId = localStorage.getItem("abk_device_id") || "";
      if (!deviceId) {
        deviceId = `DEV-${crypto.randomUUID()}`;
        localStorage.setItem("abk_device_id", deviceId);
      }
    }

    if (isAdminPreview) {
      setAuthStatus("authorized");
      return;
    }

    onBindDevice(deviceId)
      .then((res) => {
        if (res.authorized) {
          setAuthStatus("authorized");
        } else {
          setAuthStatus("blocked");
          setBlockMessage(
            res.message ||
              "This complimentary royal invitation is non-transferable and has already been bound to another mobile device."
          );
        }
      })
      .catch(() => {
        // Fallback gracefully so genuine patrons aren't stranded by temporary network drop
        setAuthStatus("authorized");
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
            If you recently switched your mobile device or require secretariat re-assignment, please contact the Secretariat Accounts desk.
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

  return <PortraitInvitationCard invitation={invitation} />;
}

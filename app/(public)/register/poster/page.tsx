"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import QRCodeLib from "qrcode";
import {
  Crown,
  Printer,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Camera,
  Sparkles,
  Ticket,
  Calendar,
  MapPin,
  Phone,
  ArrowRight,
  SunMedium,
  Moon,
  Info,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSiteOrigin, siteHostname } from "@/lib/site";

const TARGET_URL = `${getSiteOrigin()}/register?ref=venue_poster`;
const DISPLAY_URL = `${siteHostname()}/register?ref=venue_poster`;

export default function VenueRegistrationPosterPage() {
  const [svgQr, setSvgQr] = useState<string>("");
  const [dataUrlQr, setDataUrlQr] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [savingImage, setSavingImage] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<"royal" | "eco">("royal");
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate crisp vector SVG for direct DOM rendering & vector printing
    void QRCodeLib.toString(TARGET_URL, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "H",
      color: {
        dark: "#002F1A",
        light: "#FFFFFF",
      },
    }).then((svg) => {
      setSvgQr(svg);
    });

    // Generate high-resolution 1200px PNG Data URL for image export
    void QRCodeLib.toDataURL(TARGET_URL, {
      margin: 1,
      width: 1200,
      errorCorrectionLevel: "H",
      color: {
        dark: "#002F1A",
        light: "#FFFFFF",
      },
    }).then((url) => {
      setDataUrlQr(url);
    });
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(TARGET_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadStandaloneQR = () => {
    if (!dataUrlQr) return;
    const a = document.createElement("a");
    a.href = dataUrlQr;
    a.download = "abeokuta-polo-festival-2026-venue-qr-code.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSavePosterImage = async () => {
    if (!dataUrlQr) return;
    setSavingImage(true);

    try {
      // High-res canvas: 1654 x 2339 (approx A4 @ 200 DPI)
      const width = 1654;
      const height = 2339;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      const isEco = themeMode === "eco";
      const bgFill = isEco ? "#FCF9F8" : "#002F1A";
      const primaryText = isEco ? "#002F1A" : "#FFFFFF";
      const goldColor = "#C9A84C";
      const cardBg = isEco ? "#FFFFFF" : "#002414";

      // 1. Background
      ctx.fillStyle = bgFill;
      ctx.fillRect(0, 0, width, height);

      // 2. Dual Gold Outer Borders
      ctx.strokeStyle = goldColor;
      ctx.lineWidth = 12;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      ctx.strokeStyle = goldColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(60, 60, width - 120, height - 120);

      // 3. Header Section
      ctx.textAlign = "center";
      ctx.fillStyle = goldColor;
      ctx.font = "bold 32px serif";
      ctx.fillText("ABEOKUTA POLO CLUB · FOUNDED 2025", width / 2, 140);

      ctx.fillStyle = primaryText;
      ctx.font = "bold 64px serif";
      ctx.fillText("2026 ABEOKUTA POLO FESTIVAL", width / 2, 220);

      ctx.fillStyle = goldColor;
      ctx.font = "bold 34px sans-serif";
      ctx.fillText("THE BLUEPRINT · KOBAPE GROUNDS, OGUN STATE", width / 2, 280);

      ctx.fillStyle = isEco ? "#2C3E30" : "#C4D6C8";
      ctx.font = "600 30px sans-serif";
      ctx.fillText("DECEMBER 18 – 20, 2026 · ADMISSION GATE SIGNAGE", width / 2, 330);

      // 4. Headline Banner
      ctx.fillStyle = goldColor;
      ctx.fillRect(100, 370, width - 200, 110);

      ctx.fillStyle = "#002F1A";
      ctx.font = "900 48px sans-serif";
      ctx.fillText("INSTANT VENUE REGISTRATION & GATE PASS", width / 2, 440);

      // 5. Instruction Strapline
      ctx.fillStyle = primaryText;
      ctx.font = "bold 34px sans-serif";
      ctx.fillText("Point your phone camera at this QR code to obtain your official gate pass immediately", width / 2, 540);

      // 6. QR Code Image Rendering (Square 660x660 in center)
      const qrSize = 660;
      const qrX = (width - qrSize) / 2;
      const qrY = 580;

      // Draw QR White backing & Gold frame
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(qrX - 25, qrY - 25, qrSize + 50, qrSize + 50);

      ctx.strokeStyle = goldColor;
      ctx.lineWidth = 10;
      ctx.strokeRect(qrX - 25, qrY - 25, qrSize + 50, qrSize + 50);

      const qrImg = new Image();
      qrImg.src = dataUrlQr;
      await new Promise<void>((resolve) => {
        qrImg.onload = () => resolve();
      });
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // 7. QR Sub-Caption & Direct Link
      ctx.fillStyle = goldColor;
      ctx.font = "bold 26px monospace";
      ctx.fillText(DISPLAY_URL, width / 2, qrY + qrSize + 70);

      // 8. 3-Step Guidance Box
      const stepsY = qrY + qrSize + 110;
      ctx.fillStyle = cardBg;
      ctx.strokeStyle = goldColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(100, stepsY, width - 200, 170, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = primaryText;
      ctx.font = "bold 28px sans-serif";
      ctx.fillText("HOW TO GET YOUR GATE PASS IN 3 SIMPLE STEPS:", width / 2, stepsY + 50);

      ctx.font = "24px sans-serif";
      ctx.fillText("1. Scan QR with Camera   ➜   2. Enter Name & Select Days   ➜   3. Pass Saves to Phone Immediately", width / 2, stepsY + 110);

      // 9. Gate Protocol Dual Panels (Days 1 & 2 vs Day 3)
      const protoY = stepsY + 210;
      const panelWidth = 690;
      const panelHeight = 320;
      const gap = 74;
      const leftX = 100;
      const rightX = leftX + panelWidth + gap;

      // Panel 1: Days 1 & 2 (Left)
      ctx.fillStyle = isEco ? "#F0FDF4" : "#023A20";
      ctx.strokeStyle = "#16A34A";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(leftX, protoY, panelWidth, panelHeight, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#16A34A";
      ctx.fillRect(leftX + 30, protoY + 30, panelWidth - 60, 50);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("🟢 DAYS 1 & 2 (FRI 18 & SAT 19 DEC)", leftX + panelWidth / 2, protoY + 65);

      ctx.fillStyle = primaryText;
      ctx.font = "bold 32px sans-serif";
      ctx.fillText("100% FREE PUBLIC ADMISSION", leftX + panelWidth / 2, protoY + 130);

      ctx.font = "22px sans-serif";
      ctx.fillStyle = isEco ? "#1B1C1C" : "#E2E8F0";
      ctx.fillText("• Complimentary access to matches & festival village.", leftX + panelWidth / 2, protoY + 180);
      ctx.fillText("• Pre-registration required for turnstile security.", leftX + panelWidth / 2, protoY + 220);
      ctx.fillText("• 1-Click instant pass issued directly to your phone.", leftX + panelWidth / 2, protoY + 260);

      // Panel 2: Day 3 (Right)
      ctx.fillStyle = isEco ? "#FFFBEB" : "#2E1C03";
      ctx.strokeStyle = goldColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(rightX, protoY, panelWidth, panelHeight, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = goldColor;
      ctx.fillRect(rightX + 30, protoY + 30, panelWidth - 60, 50);
      ctx.fillStyle = "#002F1A";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("👑 DAY 3 (SUN 20 DEC) — ROYAL FINALE", rightX + panelWidth / 2, protoY + 65);

      ctx.fillStyle = primaryText;
      ctx.font = "bold 32px sans-serif";
      ctx.fillText("₦50,000 VVIP TICKET REQUIRED", rightX + panelWidth / 2, protoY + 130);

      ctx.font = "22px sans-serif";
      ctx.fillStyle = isEco ? "#1B1C1C" : "#E2E8F0";
      ctx.fillText("• The Royal Cup & 100 Kings Grand Durbar.", rightX + panelWidth / 2, protoY + 180);
      ctx.fillText("• Requires ₦50,000 VVIP Pass or Verified Invite Code.", rightX + panelWidth / 2, protoY + 220);
      ctx.fillText("• Instant online payment or VIP code verification upon scan.", rightX + panelWidth / 2, protoY + 260);

      // 10. Turnstile Gate & Security Footer
      const footerY = protoY + panelHeight + 40;
      ctx.fillStyle = goldColor;
      ctx.font = "bold 22px sans-serif";
      ctx.fillText("OFFICIAL TURNSTILE GATES 1, 2 & 3 · KOBAPE POLO GROUNDS", width / 2, footerY + 30);

      ctx.fillStyle = isEco ? "#4A5568" : "#94A3B8";
      ctx.font = "20px sans-serif";
      ctx.fillText("Present your issued digital pass or printed QR at the gate reader. Validated cryptographically at Kobape Checkpoint.", width / 2, footerY + 70);

      ctx.fillStyle = goldColor;
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("Festival Secretariat & Emergency Assistance: +234 818 188 8884 · 0803 681 8916 · abeokutapolo@gmail.com", width / 2, footerY + 110);

      // Trigger download
      const imageUri = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = imageUri;
      a.download = "abeokuta-polo-festival-2026-venue-standee-poster.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("Failed to render poster image:", e);
    } finally {
      setSavingImage(false);
    }
  };

  const isEco = themeMode === "eco";

  return (
    <div className="min-h-screen bg-[#081710] py-6 sm:py-10 print:py-0 print:bg-white text-ink">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP PRODUCTION CONTROL BAR (Screen Only, Hidden on Print)        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-3 sm:px-6 mb-6 print:hidden">
        <div className="rounded-2xl border border-gold/40 bg-[#002F1A] p-4 sm:p-5 text-ivory shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-gold text-forest shrink-0 shadow-md">
              <Printer className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gold/20 text-gold border-gold/40 text-[10px] uppercase font-bold tracking-wider">
                  Venue Print Signage
                </Badge>
                <span className="text-xs text-ivory/60 hidden sm:inline">A4 Standee &amp; Gate Poster</span>
              </div>
              <h1 className="font-serif text-lg sm:text-xl font-bold text-ivory">
                Official Venue Registration Poster &amp; Standee
              </h1>
              <p className="text-xs text-ivory/80">
                Place at Kobape turnstiles, VIP parking, hotel receptions, and festival entrance gates.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
            {/* Theme Toggle: Royal Dark vs Eco-Print Light */}
            <div className="flex items-center rounded-lg border border-gold/30 bg-black/30 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setThemeMode("royal")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 font-semibold transition-all ${
                  !isEco ? "bg-gold text-forest shadow-xs" : "text-ivory/70 hover:text-ivory"
                }`}
                title="Regal full-color deep forest green and gold palette"
              >
                <Moon className="size-3.5" /> Royal Dark
              </button>
              <button
                type="button"
                onClick={() => setThemeMode("eco")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 font-semibold transition-all ${
                  isEco ? "bg-gold text-forest shadow-xs" : "text-ivory/70 hover:text-ivory"
                }`}
                title="Clean white background to save ink on paper printing"
              >
                <SunMedium className="size-3.5" /> Eco Print (Light)
              </button>
            </div>

            {/* Primary Action: Print A4 Poster */}
            <Button
              onClick={handlePrint}
              className="bg-gold text-forest font-bold hover:bg-gold/90 text-xs shadow-md cursor-pointer h-9 px-4"
            >
              <Printer className="mr-1.5 size-4" /> Print A4 Poster
            </Button>

            {/* Save High-Res Poster Image */}
            <Button
              onClick={handleSavePosterImage}
              disabled={savingImage || !dataUrlQr}
              variant="outline"
              className="border-gold/50 bg-white/10 text-ivory hover:bg-white/20 text-xs font-semibold h-9 px-3.5 cursor-pointer"
            >
              <Download className="mr-1.5 size-4 text-gold" />
              {savingImage ? "Generating Image..." : "Save Poster Image"}
            </Button>

            {/* Download Standalone QR */}
            <Button
              onClick={handleDownloadStandaloneQR}
              disabled={!dataUrlQr}
              variant="outline"
              className="border-ivory/30 bg-white/5 text-ivory/90 hover:bg-white/15 text-xs h-9 px-3 cursor-pointer"
              title="Download high-res standalone QR PNG for graphic designers & roll-up banners"
            >
              <QrCode className="mr-1.5 size-4 text-gold" /> Standalone QR
            </Button>

            {/* Copy Registration Link */}
            <Button
              onClick={handleCopy}
              variant="ghost"
              className="text-ivory/80 hover:text-ivory text-xs h-9 px-3 cursor-pointer"
              title="Copy registration URL with venue poster reference"
            >
              {copied ? (
                <>
                  <Check className="mr-1.5 size-4 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 size-4" /> Copy Link
                </>
              )}
            </Button>

            {/* Test Registration */}
            <Button
              asChild
              variant="ghost"
              className="text-ivory/70 hover:text-gold text-xs h-9 px-2.5"
            >
              <Link href="/register?ref=venue_poster" target="_blank">
                <ExternalLink className="size-3.5 mr-1" /> Test Link
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. THE STANDEE POSTER CANVAS (A4 Edge-to-Edge Portrait)             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[800px] px-2 sm:px-4 print:p-0 print:max-w-none print:w-full">
        <div
          ref={posterRef}
          className={`poster-page relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 print:shadow-none print:rounded-none print:m-0 print:w-full print:border-4 print:border-[#C9A84C] ${
            isEco
              ? "bg-[#FCF9F8] text-[#002F1A] border-4 border-[#C9A84C]"
              : "bg-[#002F1A] text-ivory border-4 border-[#C9A84C]"
          }`}
          style={{
            minHeight: "1050px",
          }}
        >
          {/* Ornate Inner Double Border */}
          <div className="absolute inset-2 sm:inset-3 rounded-xl border border-[#C9A84C]/50 pointer-events-none print:inset-2" />

          {/* Corner Flourishes */}
          <div className="absolute top-4 left-4 size-6 border-t-2 border-l-2 border-[#C9A84C] pointer-events-none" />
          <div className="absolute top-4 right-4 size-6 border-t-2 border-r-2 border-[#C9A84C] pointer-events-none" />
          <div className="absolute bottom-4 left-4 size-6 border-b-2 border-l-2 border-[#C9A84C] pointer-events-none" />
          <div className="absolute bottom-4 right-4 size-6 border-b-2 border-r-2 border-[#C9A84C] pointer-events-none" />

          <div className="relative p-5 sm:p-10 flex flex-col items-center text-center justify-between min-h-[1050px]">
            {/* Header: Royal Club Identity */}
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="h-px w-10 sm:w-16 bg-[#C9A84C]" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#C9A84C]">
                  Abeokuta Polo Club · Founded 2025
                </span>
                <div className="h-px w-10 sm:w-16 bg-[#C9A84C]" />
              </div>

              <div className="flex justify-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-[#C9A84C]/20 border-2 border-[#C9A84C] text-[#C9A84C]">
                  <Crown className="size-8" />
                </div>
              </div>

              <h2
                className={`font-serif text-2xl sm:text-4xl font-extrabold tracking-tight ${
                  isEco ? "text-[#002F1A]" : "text-white"
                }`}
              >
                2026 ABEOKUTA POLO FESTIVAL
              </h2>

              <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-[#C9A84C]">
                The Blueprint · Kobape Polo Grounds, Ogun State · Dec 18–20, 2026
              </p>

              {/* Bold Golden Header Banner */}
              <div className="mt-3 py-2 px-4 rounded-lg bg-[#C9A84C] text-[#002F1A] font-extrabold text-sm sm:text-lg uppercase tracking-wider shadow-sm">
                OFFICIAL FESTIVAL REGISTRATION &amp; INSTANT GATE PASS
              </div>

              <p
                className={`text-xs sm:text-sm max-w-lg mx-auto font-medium ${
                  isEco ? "text-[#1B1C1C]" : "text-ivory/90"
                }`}
              >
                Scan with your smartphone camera to receive your cryptographically verified gate pass immediately.
              </p>
            </div>

            {/* Central Focal Point: High-Resolution QR Presentation */}
            <div className="my-5 flex flex-col items-center">
              <div
                className={`relative rounded-2xl p-4 sm:p-5 bg-white border-4 border-[#C9A84C] shadow-2xl ${
                  !isEco ? "shadow-[0_0_35px_rgba(201,168,76,0.3)]" : ""
                }`}
              >
                {/* Visual Camera Scan Guide Overlay on corners */}
                <div className="absolute top-2 left-2 size-5 border-t-2 border-l-2 border-[#002F1A]" />
                <div className="absolute top-2 right-2 size-5 border-t-2 border-r-2 border-[#002F1A]" />
                <div className="absolute bottom-2 left-2 size-5 border-b-2 border-l-2 border-[#002F1A]" />
                <div className="absolute bottom-2 right-2 size-5 border-b-2 border-r-2 border-[#002F1A]" />

                {/* Real Vector SVG QR Code */}
                {svgQr ? (
                  <div
                    className="w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: svgQr }}
                  />
                ) : (
                  <div className="w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] flex items-center justify-center bg-gray-100 rounded-lg">
                    <QrCode className="size-20 text-[#002F1A] animate-pulse" />
                  </div>
                )}
              </div>

              {/* URL Caption */}
              <div className="mt-3 flex items-center gap-1.5 text-[11px] sm:text-xs font-mono font-bold tracking-wider text-[#C9A84C]">
                <span>{DISPLAY_URL}</span>
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 flex items-center gap-1 ${
                  isEco ? "text-forest/70" : "text-ivory/70"
                }`}
              >
                <Camera className="size-3 text-[#C9A84C]" /> Open iPhone / Android Camera &amp; Point Here · No App Required
              </span>
            </div>

            {/* 3 Simple Attendee Steps */}
            <div
              className={`w-full rounded-xl p-3 sm:p-4 border ${
                isEco
                  ? "bg-white border-[#C9A84C]/40 shadow-xs"
                  : "bg-[#002414] border-[#C9A84C]/40 shadow-inner"
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#C9A84C] block mb-2">
                3-Step Instant Check-In Protocol
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-left">
                <div className="flex items-start gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#C9A84C] text-[11px] font-black text-[#002F1A]">
                    1
                  </span>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">Point Camera</h4>
                    <p className={`text-[11px] leading-snug mt-0.5 ${isEco ? "text-[#4A5568]" : "text-ivory/70"}`}>
                      Aim phone camera at QR code &amp; tap banner.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#C9A84C] text-[11px] font-black text-[#002F1A]">
                    2
                  </span>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">Select Days</h4>
                    <p className={`text-[11px] leading-snug mt-0.5 ${isEco ? "text-[#4A5568]" : "text-ivory/70"}`}>
                      Enter your name and pick your attendance days.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#C9A84C] text-[11px] font-black text-[#002F1A]">
                    3
                  </span>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">Instant Pass</h4>
                    <p className={`text-[11px] leading-snug mt-0.5 ${isEco ? "text-[#4A5568]" : "text-ivory/70"}`}>
                      Pass is generated &amp; saved on device immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Crucial Gate Admission Protocols: Days 1 & 2 vs Day 3 */}
            <div className="my-4 w-full grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-left">
              {/* Day 1 & Day 2 Card */}
              <div
                className={`rounded-xl border-2 p-3 sm:p-4 relative flex flex-col justify-between ${
                  isEco
                    ? "bg-[#F0FDF4] border-emerald-600 text-emerald-950"
                    : "bg-[#023A20] border-emerald-500 text-ivory"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      <Check className="size-3 stroke-[3]" /> Days 1 &amp; 2 · Dec 18 &amp; 19
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">
                      Complimentary
                    </span>
                  </div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-white">
                    100% FREE Public Admission
                  </h3>
                  <p
                    className={`mt-1 text-xs leading-relaxed ${
                      isEco ? "text-emerald-900" : "text-emerald-100/90"
                    }`}
                  >
                    Scan and complete 1-click registration to get your official gate pass immediately. Full complimentary access to tournament chukkers, grandstands, and cultural village.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-500/30 flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-emerald-300">Turnstiles: Free Instant Entry</span>
                  <span className="text-emerald-400 uppercase text-[10px] font-bold">Zero Fee · 1-Click</span>
                </div>
              </div>

              {/* Day 3 VVIP Card */}
              <div
                className={`rounded-xl border-2 p-3 sm:p-4 relative flex flex-col justify-between ${
                  isEco
                    ? "bg-[#FFFBEB] border-[#C9A84C] text-[#2E1C03]"
                    : "bg-[#201503] border-[#C9A84C] text-ivory"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C9A84C] text-[#002F1A] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      <Crown className="size-3 fill-current" /> Day 3 · Sun 20 Dec
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#C9A84C]">
                      Grand Finale
                    </span>
                  </div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#E5C768]">
                    Royal Cup Finale · ₦50,000 VVIP Pass
                  </h3>
                  <p
                    className={`mt-1 text-xs leading-relaxed ${
                      isEco ? "text-amber-950" : "text-amber-100/90"
                    }`}
                  >
                    Access to Royal Cup Final &amp; 100 Kings Durbar requires a <strong>₦50,000 VVIP Ticket</strong> (or verified Special Invitation code). Scan QR to pay securely online or verify your code.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#C9A84C]/30 flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-[#C9A84C]">VVIP Access &amp; Hospitality</span>
                  <span className="text-[#E5C768] uppercase text-[10px] font-bold">₦50,000 / Royal Code</span>
                </div>
              </div>
            </div>

            {/* Footer Signage Information */}
            <div className="w-full pt-3 border-t border-[#C9A84C]/40 space-y-1 text-center">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-bold text-[#C9A84C] uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3.5" /> Kobape Turnstiles 1, 2 &amp; 3
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="size-3.5" /> Cryptographic Gate Validation
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5" /> Secretariat: 0803 681 8916 · +234 818 188 8884
                </span>
              </div>
              <p
                className={`text-[10px] leading-tight ${
                  isEco ? "text-[#4A5568]" : "text-ivory/60"
                }`}
              >
                Physical badge issuance available at the Secretariat for dignitaries and delegates requiring hard copy credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

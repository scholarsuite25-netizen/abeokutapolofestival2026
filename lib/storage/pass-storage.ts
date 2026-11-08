"use client";

import { useSyncExternalStore } from "react";

export interface StoredPass {
  passCode: string;
  holderName: string;
  category: string;
  affiliationType: "individual" | "guest_of" | "corporate";
  hostName?: string | null;
  organization?: string | null;
  email?: string;
  phone?: string;
  qrToken?: string;
  registeredAt: string;
  daysCovered?: number[];
  passTier?: "free_day1" | "free_day2" | "free_day1_2" | "vvip_day3" | string;
  isVvip?: boolean;
  designTheme?: "standard" | "gold";
  paymentRef?: string | null;
  bankTransferRef?: string | null;
  status?: "active" | "pending_verification" | "pending_bank_verification" | "pending_approval" | "revoked" | string;
  invitationCode?: string | null;
  day1Status?: "free_admitted" | "registered" | "not_selected";
  day2Status?: "free_admitted" | "registered" | "not_selected" | "ticket_required" | "ticket_verified";
  day3Status?: "vvip_admitted" | "payment_verified" | "ticket_required" | "ticket_verified" | "not_selected" | "pending_verification" | "pending_bank_verification";
  ticketRefDay2?: string | null;
  ticketRefDay3?: string | null;
  securityHash?: string;
  ticketIndex?: number;
  totalTickets?: number;
  serialLabel?: string;
  isSponsored?: boolean;
  sponsorName?: string | null;
  isBuyer?: boolean;
  isLockedToDevice?: boolean;
  claimedByRecipient?: boolean;
  claimedRecipientName?: string | null;
}

const PASS_STORAGE_KEY = "abk_polo_registered_pass";
const PASSES_STORAGE_KEY = "abk_polo_registered_passes_list";
const PASS_COOKIE_NAME = "abk_pass_code";

let cachedRaw: string | null = null;
let cachedPasses: StoredPass[] = [];
let cachedPrimary: StoredPass | null = null;
const EMPTY_PASSES: StoredPass[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToPassStore(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = () => {
    cachedRaw = null;
    callback();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
    window.addEventListener("abk_pass_saved", onStorage);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("abk_pass_saved", onStorage);
    }
  };
}

function loadFromStorage(): StoredPass[] {
  if (typeof window === "undefined") return [];
  try {
    const rawList = localStorage.getItem(PASSES_STORAGE_KEY) || sessionStorage.getItem(PASSES_STORAGE_KEY);
    if (rawList) {
      const parsed = JSON.parse(rawList);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as StoredPass[];
      }
    }

    // Fallback to legacy single key
    const rawSingle = localStorage.getItem(PASS_STORAGE_KEY) || sessionStorage.getItem(PASS_STORAGE_KEY);
    if (rawSingle) {
      const single = JSON.parse(rawSingle) as StoredPass;
      return [single];
    }
    return [];
  } catch {
    return [];
  }
}

export function getPassesSnapshot(): StoredPass[] {
  if (typeof window === "undefined") return EMPTY_PASSES;
  try {
    const raw = localStorage.getItem(PASSES_STORAGE_KEY) || localStorage.getItem(PASS_STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedPasses;
    }
    cachedRaw = raw;
    if (!raw) {
      cachedPasses = EMPTY_PASSES;
      cachedPrimary = null;
      return EMPTY_PASSES;
    }
    cachedPasses = loadFromStorage();
    cachedPrimary = cachedPasses[0] || null;
    return cachedPasses;
  } catch {
    return EMPTY_PASSES;
  }
}

export function getPassSnapshot(): StoredPass | null {
  getPassesSnapshot();
  return cachedPrimary;
}

export function getPassServerSnapshot(): StoredPass | null {
  return null;
}

export function getPassesServerSnapshot(): StoredPass[] {
  return EMPTY_PASSES;
}

/**
 * React 19 safe Hook: Returns all active passes saved on this device (e.g. Free Pass + Day 3 VVIP Pass).
 */
export function useStoredPasses(): StoredPass[] {
  return useSyncExternalStore(subscribeToPassStore, getPassesSnapshot, getPassesServerSnapshot);
}

/**
 * React 19 safe Hook: Returns the primary pass saved on this device.
 */
export function useStoredPass(): StoredPass | null {
  return useSyncExternalStore(subscribeToPassStore, getPassSnapshot, getPassServerSnapshot);
}

/**
 * Persists registered pass(es) to localStorage, sessionStorage, and cookie.
 */
export function persistRegisteredPass(input: StoredPass | StoredPass[]): void {
  if (typeof window === "undefined") return;

  try {
    const newPasses = Array.isArray(input) ? input : [input];
    if (newPasses.length === 0) return;

    // Merge with any existing passes that don't share the same pass code
    const existing = loadFromStorage();
    const map = new Map<string, StoredPass>();
    for (const p of existing) {
      map.set(p.passCode, p);
    }
    for (const p of newPasses) {
      map.set(p.passCode, p);
    }

    const merged = Array.from(map.values());
    const serializedList = JSON.stringify(merged);
    const primary = merged[0];
    const serializedPrimary = JSON.stringify(primary);

    localStorage.setItem(PASSES_STORAGE_KEY, serializedList);
    sessionStorage.setItem(PASSES_STORAGE_KEY, serializedList);
    localStorage.setItem(PASS_STORAGE_KEY, serializedPrimary);
    sessionStorage.setItem(PASS_STORAGE_KEY, serializedPrimary);

    // 365-day cookie for cross-session/SSR detection
    const codes = merged.map((p) => p.passCode).join(",");
    document.cookie = `${PASS_COOKIE_NAME}=${encodeURIComponent(codes)}; max-age=31536000; path=/; SameSite=Lax`;

    cachedRaw = serializedList;
    cachedPasses = merged;
    cachedPrimary = primary;

    notify();
    window.dispatchEvent(new CustomEvent("abk_pass_saved", { detail: merged }));
  } catch {
    // Non-blocking
  }
}

/**
 * Retrieves the currently saved passes from device storage.
 */
export function getStoredPasses(): StoredPass[] {
  return getPassesSnapshot();
}

/**
 * Retrieves the single primary saved pass.
 */
export function getStoredPass(): StoredPass | null {
  return getPassSnapshot();
}

/**
 * Clears stored pass credentials from device.
 */
export function clearStoredPass(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PASSES_STORAGE_KEY);
    localStorage.removeItem(PASS_STORAGE_KEY);
    sessionStorage.removeItem(PASSES_STORAGE_KEY);
    sessionStorage.removeItem(PASS_STORAGE_KEY);
    document.cookie = `${PASS_COOKIE_NAME}=; max-age=0; path=/`;
    cachedRaw = null;
    cachedPasses = [];
    cachedPrimary = null;
    notify();
    window.dispatchEvent(new CustomEvent("abk_pass_saved", { detail: null }));
  } catch {
    // Non-blocking
  }
}

/**
 * Claims and personalizes a gifted pass on this recipient's device.
 * Binds the pass to the recipient's phone and marks it permanently non-transferable.
 */
export function claimGiftedPassOnDevice(passCode: string, recipientName: string): StoredPass | null {
  if (typeof window === "undefined") return null;
  try {
    const passes = loadFromStorage();
    let updated: StoredPass | null = null;
    const modified = passes.map((p) => {
      if (p.passCode.toUpperCase() === passCode.toUpperCase()) {
        updated = {
          ...p,
          holderName: recipientName.trim() || p.holderName,
          claimedByRecipient: true,
          claimedRecipientName: recipientName.trim(),
          isLockedToDevice: true,
          isSponsored: true,
          isBuyer: false,
        };
        return updated;
      }
      return p;
    });

    if (updated) {
      persistRegisteredPass(modified);
      return updated;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generates and triggers an automatic download of a self-contained offline Digital Access ID Card.
 * Day 3 VVIP passes render a distinct, classic deep gold design.
 * Days 1 & 2 passes render the classic Forest Green & Warm Ivory royal design.
 */
export function forceDownloadOfflinePassCard(pass: StoredPass): void {
  if (typeof window === "undefined") return;

  const isGold = pass.isVvip || pass.designTheme === "gold" || pass.passTier === "vvip_day3";
  const isSponsored = Boolean(pass.isSponsored || pass.holderName.toLowerCase().startsWith("sponsored invitation"));
  const serialLabel = pass.serialLabel || (pass.totalTickets && pass.totalTickets > 1 && pass.ticketIndex ? `Ticket ${pass.ticketIndex} of ${pass.totalTickets}` : "");

  // Days display label
  const daysLabel = pass.daysCovered && pass.daysCovered.length === 2
    ? "Day 1 & Day 2 (18 & 19 Dec 2026)"
    : pass.daysCovered?.includes(3)
    ? "Day 3: Sunday 20 Dec 2026"
    : pass.daysCovered?.includes(2)
    ? "Day 2: Saturday 19 Dec 2026"
    : "Day 1: Friday 18 Dec 2026";

  const cardTitle = isGold
    ? isSponsored
      ? "DAY 3 VVIP GUEST INVITATION"
      : "DAY 3 VVIP GRAND FINALE PASS"
    : pass.daysCovered && pass.daysCovered.length === 2
    ? "DAY 1 & DAY 2 DUAL ACCESS PASS"
    : pass.daysCovered?.includes(2)
    ? "DAY 2 ACCESS PASS"
    : "DAY 1 ACCESS PASS";

  const badgeTheme = isGold
    ? isSponsored
      ? `👑 VVIP GUEST INVITATION${serialLabel ? ` · ${serialLabel.toUpperCase()}` : ""}`
      : `👑 VVIP ROYAL ADMISSION${serialLabel ? ` · ${serialLabel.toUpperCase()}` : ""}`
    : `🛡️ CLASSIC HERITAGE BADGE${serialLabel ? ` · ${serialLabel.toUpperCase()}` : ""}`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Abeokuta Polo Festival 2026 ID Pass - ${pass.passCode}</title>
  <style>
    :root {
      --forest: #002F1A;
      --forest-deep: #00210E;
      --gold: #C9A84C;
      --gold-deep: #B38F34;
      --gold-bright: #E5C768;
      --ivory: #FCF9F8;
      --obsidian: #1C1605;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 'Manrope', sans-serif;
      background: ${isGold ? "#0A0702" : "#00210E"};
      color: #1B1C1C;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
    }

    /* ID-CARD DIMENSIONS & PROPORTIONS (CR80 Standard Physical ID-Badge Ratio: max-w-[305px]) */
    .id-card {
      width: 100%;
      max-width: 305px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: ${isGold ? "0 10px 30px rgba(201,168,76,0.3)" : "0 10px 25px rgba(0,0,0,0.4)"};
      background: ${isGold ? "linear-gradient(180deg, #1C1605 0%, #2A2007 50%, #120E03 100%)" : "#FCF9F8"};
      border: 2px solid ${isGold ? "#C9A84C" : "#002F1A"};
      position: relative;
    }

    /* Lanyard punch hole aesthetic */
    .lanyard-slot {
      width: 36px;
      height: 5px;
      background: ${isGold ? "#0B0902" : "#E5DFD5"};
      border-radius: 9999px;
      margin: 6px auto 3px auto;
      border: 1px solid ${isGold ? "#5E4711" : "rgba(0,47,26,0.2)"};
    }

    /* Top Card Header */
    .card-header {
      padding: 6px 10px;
      text-align: center;
      background: ${isGold ? "linear-gradient(90deg, #241A04, #3B2B08, #241A04)" : "#002F1A"};
      color: ${isGold ? "#E5C768" : "#FCF9F8"};
      border-bottom: 2px solid ${isGold ? "#C9A84C" : "rgba(201,168,76,0.5)"};
    }
    .badge-pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: ${isGold ? "linear-gradient(90deg, #B38F34, #F5D77F, #C9A84C)" : "#FCF9F8"};
      color: ${isGold ? "#000000" : "#002F1A"};
      border: 1px solid ${isGold ? "#C9A84C" : "#002F1A"};
    }
    .card-title {
      font-family: Georgia, serif;
      font-size: 13px;
      font-weight: 700;
      margin-top: 3px;
      color: ${isGold ? "#FDF6D8" : "#FCF9F8"};
      letter-spacing: 0.02em;
      line-height: 1.2;
    }
    .festival-sub {
      font-size: 8px;
      color: ${isGold ? "#C9A84C" : "#E5C768"};
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-top: 2px;
      font-weight: 600;
    }

    /* QR Code & Security Core */
    .qr-core {
      padding: 8px;
      text-align: center;
      background: ${isGold ? "#140F04" : "#FAF7F2"};
      border-bottom: 1px solid ${isGold ? "#3D2E08" : "rgba(0,47,26,0.15)"};
    }
    .qr-frame {
      display: inline-block;
      padding: 5px;
      background: #FFFFFF;
      border-radius: 8px;
      border: 2px solid ${isGold ? "#C9A84C" : "#002F1A"};
      box-shadow: ${isGold ? "0 0 12px rgba(201,168,76,0.35)" : "0 2px 6px rgba(0,0,0,0.1)"};
    }
    .pass-code {
      font-family: monospace;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.12em;
      margin-top: 4px;
      color: ${isGold ? "#E5C768" : "#002F1A"};
    }
    .security-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 3px;
      letter-spacing: 0.06em;
      background: ${isGold ? "#2C2106" : "#ECFDF5"};
      border: 1px solid ${isGold ? "rgba(201,168,76,0.5)" : "#A7F3D0"};
      color: ${isGold ? "#F3E5AB" : "#065F46"};
    }

    /* ID Card Body Info */
    .card-body {
      padding: 8px 12px;
      font-size: 10.5px;
      color: ${isGold ? "#E8DFD0" : "#1B1C1C"};
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 2.5px 0;
      border-bottom: 1px solid ${isGold ? "rgba(201,168,76,0.2)" : "rgba(0,47,26,0.1)"};
    }
    .info-label {
      font-size: 8.5px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${isGold ? "#C9A84C" : "rgba(0,47,26,0.7)"};
      font-weight: 700;
    }
    .info-val {
      font-weight: 700;
      text-align: right;
      color: ${isGold ? "#FFFFFF" : "#002F1A"};
      max-width: 170px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Security Foil Watermark */
    .security-foil {
      margin: 6px 0 2px 0;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 7.5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: ${isGold ? "linear-gradient(90deg, #2C2106, #4A3910, #1A1404)" : "#EFECE6"};
      border: 1px solid ${isGold ? "#C9A84C" : "rgba(0,47,26,0.2)"};
      color: ${isGold ? "#F3E5AB" : "#002F1A"};
      font-weight: 600;
    }

    /* Footer */
    .card-footer {
      padding: 5px 8px;
      text-align: center;
      font-size: 7.5px;
      background: ${isGold ? "#0E0A02" : "rgba(0,47,26,0.05)"};
      color: ${isGold ? "#C9A84C" : "#002F1A"};
      border-top: 1px solid ${isGold ? "#3D2E08" : "rgba(0,47,26,0.15)"};
    }
  </style>
</head>
<body>
  <div class="id-card">
    <div class="lanyard-slot"></div>
    <div class="card-header">
      <div class="badge-pill">${badgeTheme}</div>
      <div class="card-title">${cardTitle}</div>
      <div class="festival-sub">Abeokuta Polo Festival 2026</div>
    </div>

    <div class="qr-core">
      <div class="qr-frame">
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(pass.passCode)}"
          alt="ID Pass QR Code"
          width="100"
          height="100"
          style="display: block; border-radius: 4px;"
        />
      </div>
      <div class="pass-code">${pass.passCode}</div>
      <div class="security-status">${isGold ? "👑 VVIP ACTIVE STATUS · ROYAL ADMISSION" : "✓ EMERALD ACTIVE STATUS · HERITAGE ADMISSION"}</div>
    </div>

    <div class="card-body">
      <div class="info-row">
        <span class="info-label">Pass Holder</span>
        <span class="info-val">${pass.holderName}</span>
      </div>
      ${serialLabel ? `
      <div class="info-row">
        <span class="info-label">Ticket Serial</span>
        <span class="info-val" style="color: ${isGold ? "#E5C768" : "#002F1A"}; font-family: monospace;">${serialLabel}</span>
      </div>` : ""}
      ${pass.sponsorName || pass.hostName ? `
      <div class="info-row">
        <span class="info-label">Sponsored By</span>
        <span class="info-val">${pass.sponsorName || pass.hostName}</span>
      </div>` : ""}
      <div class="info-row">
        <span class="info-label">Admission Days</span>
        <span class="info-val" style="color: ${isGold ? "#E5C768" : "#002F1A"};">${daysLabel}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Tier / Access</span>
        <span class="info-val" style="color: ${isGold ? "#E5C768" : "#002F1A"};">${isGold ? "Royal Pavilion & Grandstand" : "Festival Grounds & Grandstand"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Venue</span>
        <span class="info-val">Abeokuta Polo Club Grounds</span>
      </div>

      <div class="security-foil">
        <span>🛡️ <strong>HMAC-256:</strong> SEALED</span>
        <span>${isGold ? "GOLD FOIL SECURITY HOLOGRAM" : "CLASSIC HERITAGE BADGE"}</span>
      </div>
    </div>

    <div class="card-footer">
      ${isGold ? "Turnstile accreditation required. Royal Gate Marshals on duty." : "Turnstile accreditation required. Complimentary Heritage Entry."}
    </div>
  </div>
</body>
</html>`;

  try {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const prefix = isGold ? "Abeokuta_Polo_VVIP_Day3" : "Abeokuta_Polo_Pass";
    link.download = `${prefix}_${pass.passCode}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch {
    // Non-blocking
  }
}

/**
 * Downloads all passes in the list with a slight stagger to ensure all files drop to storage.
 */
export function forceDownloadAllPasses(passes: StoredPass[]): void {
  passes.forEach((p, index) => {
    setTimeout(() => {
      forceDownloadOfflinePassCard(p);
    }, index * 300);
  });
}

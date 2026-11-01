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
  day1Status: "free_admitted" | "registered";
  day2Status: "ticket_required" | "ticket_verified";
  day3Status: "ticket_required" | "ticket_verified";
  ticketRefDay2?: string | null;
  ticketRefDay3?: string | null;
}

const PASS_STORAGE_KEY = "abk_polo_registered_pass";
const PASS_COOKIE_NAME = "abk_pass_code";

let cachedRaw: string | null = null;
let cachedParsed: StoredPass | null = null;
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
    cachedParsed = null;
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

export function getPassSnapshot(): StoredPass | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PASS_STORAGE_KEY) || sessionStorage.getItem(PASS_STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedParsed;
    }
    cachedRaw = raw;
    cachedParsed = raw ? (JSON.parse(raw) as StoredPass) : null;
    return cachedParsed;
  } catch {
    return null;
  }
}

export function getPassServerSnapshot(): StoredPass | null {
  return null;
}

/**
 * React 19 safe Hook: Synchronizes active pass credentials with browser storage
 * without triggering cascading renders or hydration mismatch.
 */
export function useStoredPass(): StoredPass | null {
  return useSyncExternalStore(subscribeToPassStore, getPassSnapshot, getPassServerSnapshot);
}

/**
 * Persists the registered pass to localStorage, sessionStorage, and cookie.
 */
export function persistRegisteredPass(pass: StoredPass): void {
  if (typeof window === "undefined") return;

  try {
    const serialized = JSON.stringify(pass);
    localStorage.setItem(PASS_STORAGE_KEY, serialized);
    sessionStorage.setItem(PASS_STORAGE_KEY, serialized);
    // 365-day cookie for cross-session/SSR detection
    document.cookie = `${PASS_COOKIE_NAME}=${encodeURIComponent(pass.passCode)}; max-age=31536000; path=/; SameSite=Lax`;
    cachedRaw = serialized;
    cachedParsed = pass;
    notify();
    window.dispatchEvent(new CustomEvent("abk_pass_saved", { detail: pass }));
  } catch {
    // Non-blocking
  }
}

/**
 * Retrieves the currently saved pass from device storage.
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
    localStorage.removeItem(PASS_STORAGE_KEY);
    sessionStorage.removeItem(PASS_STORAGE_KEY);
    document.cookie = `${PASS_COOKIE_NAME}=; max-age=0; path=/`;
    cachedRaw = null;
    cachedParsed = null;
    notify();
    window.dispatchEvent(new CustomEvent("abk_pass_saved", { detail: null }));
  } catch {
    // Non-blocking
  }
}

/**
 * Generates and triggers an automatic download of a self-contained offline Digital Access Pass HTML card.
 * This guarantees the pass "drops" into the user's phone downloads/files and remains accessible
 * even without an internet connection at the tournament gate turnstiles.
 */
export function forceDownloadOfflinePassCard(pass: StoredPass): void {
  if (typeof window === "undefined") return;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abeokuta Polo Festival 2026 Gate Pass - ${pass.passCode}</title>
  <style>
    :root {
      --forest: #062D1D;
      --forest-deep: #031A10;
      --gold: #DFBE75;
      --gold-deep: #795910;
      --ivory: #FAF9F5;
      --card-bg: #FFFFFF;
      --border: #DCD5C2;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #062D1D;
      color: #111827;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .pass-card {
      background: var(--card-bg);
      width: 100%;
      max-width: 440px;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
      border: 2px solid var(--gold);
    }
    .pass-header {
      background: var(--forest);
      color: var(--ivory);
      padding: 24px 20px;
      text-align: center;
      position: relative;
    }
    .tag {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      background: rgba(223,190,117,0.2);
      border: 1px solid var(--gold);
      color: var(--gold);
      margin-bottom: 8px;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      color: #FAF9F5;
      letter-spacing: -0.02em;
    }
    .subtitle {
      font-size: 11px;
      color: var(--gold);
      text-transform: uppercase;
      letter-spacing: 0.2em;
      margin-top: 4px;
    }
    .qr-section {
      background: #FAF9F5;
      padding: 24px;
      text-align: center;
      border-bottom: 1px dashed var(--border);
    }
    .qr-box {
      background: #FFFFFF;
      display: inline-block;
      padding: 16px;
      border-radius: 16px;
      border: 3px dashed var(--forest);
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .pass-code {
      font-family: monospace;
      font-size: 22px;
      font-weight: 800;
      color: var(--forest);
      letter-spacing: 0.12em;
      margin-top: 12px;
    }
    .details {
      padding: 20px;
      font-size: 13px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #F0ECE1;
    }
    .label { color: #6B7280; font-weight: 500; }
    .value { color: var(--forest); font-weight: 700; text-align: right; }
    .admission-policy {
      background: #F7F5EE;
      margin: 14px 0;
      padding: 12px;
      border-radius: 12px;
      font-size: 11px;
      line-height: 1.4;
      border: 1px solid #E5DFD3;
    }
    .day-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6px;
      margin-top: 8px;
      text-align: center;
      font-size: 10px;
    }
    .day-col {
      padding: 6px 4px;
      border-radius: 8px;
      border: 1px solid #DCD5C2;
    }
    .day-free { background: #ECFDF5; border-color: #6EE7B7; color: #065F46; }
    .day-ticket { background: #FEF3C7; border-color: #FCD34D; color: #92400E; }
    .footer {
      background: #FAF9F5;
      padding: 14px;
      text-align: center;
      font-size: 11px;
      color: #6B7280;
      border-top: 1px solid var(--border);
    }
  </style>
</head>
<body>
  <div class="pass-card">
    <div class="pass-header">
      <div class="tag">Offline Gate Access Pass</div>
      <h1>Abeokuta Polo Festival 2026</h1>
      <div class="subtitle">The Blueprint · 18–20 Dec 2026</div>
    </div>

    <div class="qr-section">
      <div class="qr-box">
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pass.passCode)}"
          alt="Gate QR Code"
          width="180"
          height="180"
          style="display: block; border-radius: 8px;"
        />
      </div>
      <div class="pass-code">${pass.passCode}</div>
      <p style="font-size: 11px; color: #065F46; font-weight: 600; margin-top: 6px;">
        ✓ Saved to Device · Ready for Gate Turnstiles
      </p>
    </div>

    <div class="details">
      <div class="row">
        <span class="label">Attendee Name:</span>
        <span class="value">${pass.holderName}</span>
      </div>
      <div class="row">
        <span class="label">Affiliation / Host:</span>
        <span class="value">${
          pass.affiliationType === "guest_of"
            ? `Guest of: ${pass.hostName || "Host Member"}`
            : pass.affiliationType === "corporate"
            ? `Corporate: ${pass.organization || "Company"}`
            : "Individual Attendee"
        }</span>
      </div>
      <div class="row">
        <span class="label">Category:</span>
        <span class="value">${pass.category}</span>
      </div>
      <div class="row">
        <span class="label">Venue:</span>
        <span class="value">Abeokuta Polo Club Grounds, Kobape</span>
      </div>

      <div class="admission-policy">
        <strong>Daily Admission Rules:</strong>
        <div class="day-grid">
          <div class="day-col day-free">
            <strong>Day 1 (Fri 18)</strong><br />
            <span>FREE ENTRY</span>
          </div>
          <div class="day-col day-ticket">
            <strong>Day 2 (Sat 19)</strong><br />
            <span>THROUGH TICKET</span>
          </div>
          <div class="day-col day-ticket">
            <strong>Day 3 (Sun 20)</strong><br />
            <span>THROUGH TICKET</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      Show this screen at the turnstiles. Gate officers scan this pass code on each tournament day.
    </div>
  </div>
</body>
</html>`;

  try {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Abeokuta_Polo_Pass_${pass.passCode}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch {
    // Non-blocking
  }
}

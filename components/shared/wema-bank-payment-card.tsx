"use client";

import { useState } from "react";
import {
  Landmark,
  Copy,
  Check,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { CLUB_BANK_DETAILS, formatNaira } from "@/lib/config/checkout-config";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { formatWhatsAppUrl } from "@/lib/utils/phone";
import { Button } from "@/components/ui/button";

export interface WemaBankPaymentCardProps {
  flow: "vvip" | "sponsorship" | "hospitality";
  referenceCode: string;
  amountNgn?: number;
  itemName?: string;
  buyerName?: string;
  phone?: string;
  email?: string;
  className?: string;
  compact?: boolean;
}

export function WemaBankPaymentCard({
  flow,
  referenceCode,
  amountNgn,
  itemName = flow === "vvip"
    ? "Day 3 VVIP Grand Finale Pass"
    : flow === "sponsorship"
    ? "Corporate Sponsorship Allocation"
    : "VIP Hospitality Enclosure",
  buyerName = "Valued Patron",
  phone = "",
  email = "",
  className = "",
  compact = false,
}: WemaBankPaymentCardProps) {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(CLUB_BANK_DETAILS.accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyRef = async () => {
    try {
      await navigator.clipboard.writeText(referenceCode);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Automated WhatsApp reconciliation link payload to Secretariat Desk
  const waReconciliationText =
    `🏇 *ABEOKUTA POLO FESTIVAL 2026 — BANK WIRE RECONCILIATION*\n\n` +
    `Hello Secretariat Desk, I have initiated a direct bank transfer to the official club account:\n\n` +
    `• *Category / Item:* ${itemName}\n` +
    (amountNgn ? `• *Amount Transferred:* ₦${amountNgn.toLocaleString()}\n` : "") +
    `• *Bank Transferred To:* ${CLUB_BANK_DETAILS.bankName} / ${CLUB_BANK_DETAILS.accountNumber} / ${CLUB_BANK_DETAILS.accountName}\n` +
    `• *Narration / Unique Reference:* ${referenceCode}\n` +
    `• *Payer / Organization:* ${buyerName}\n` +
    (phone ? `• *Phone:* ${phone}\n` : "") +
    (email ? `• *Email:* ${email}\n` : "") +
    `\n📎 *Attached:* My bank debit payment slip / transaction advice.\n\n` +
    `Please reconcile with Accounts ledger and confirm activation.\n\n` +
    `_Abeokuta Polo Club Secretariat_`;

  const waUrl = formatWhatsAppUrl(CLUB_BANK_DETAILS.secretariatWhatsApp, waReconciliationText);

  return (
    <div
      className={`rounded-2xl border-2 border-amber-500/60 bg-gradient-to-br from-amber-50/90 via-white to-amber-100/40 p-5 sm:p-6 text-ink shadow-md ${className}`}
    >
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-forest text-gold shadow-xs">
            <Landmark className="size-6 text-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base sm:text-lg font-bold text-forest">
                Official Club Bank Wire Details
              </h3>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-900 border border-amber-400">
                Direct Wire
              </span>
            </div>
            <p className="text-xs text-muted-brand">
              Direct transfer to Abeokuta Polo Club Wema Bank Account
            </p>
          </div>
        </div>

        {amountNgn ? (
          <div className="text-left sm:text-right">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-muted-brand">
              Amount Due
            </span>
            <span className="font-mono text-xl font-extrabold text-forest">
              {formatNaira(amountNgn)}
            </span>
          </div>
        ) : null}
      </div>

      {/* Account Details Matrix */}
      <div className="my-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Bank Name */}
        <div className="rounded-xl border border-line bg-card p-3 shadow-xs">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-brand">
            Bank Name
          </span>
          <p className="mt-1 font-mono text-sm sm:text-base font-bold text-forest">
            {CLUB_BANK_DETAILS.bankName}
          </p>
        </div>

        {/* Account Name */}
        <div className="rounded-xl border border-line bg-card p-3 shadow-xs">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-brand">
            Beneficiary Account Name
          </span>
          <p className="mt-1 font-mono text-xs sm:text-sm font-bold text-forest truncate" title={CLUB_BANK_DETAILS.accountName}>
            {CLUB_BANK_DETAILS.accountName}
          </p>
        </div>

        {/* Account Number with 1-Click Copy */}
        <div className="rounded-xl border-2 border-emerald-600/40 bg-emerald-50/60 p-3 shadow-xs flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-900">
              Account Number
            </span>
            <p className="mt-0.5 font-mono text-lg font-black tracking-widest text-emerald-950">
              {CLUB_BANK_DETAILS.accountNumber}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCopyAccount}
            className="border-emerald-600/30 bg-white hover:bg-emerald-100 text-emerald-900 size-8 p-0 shrink-0"
            title="Copy Account Number"
          >
            {copiedAccount ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Unique Reference Code Box */}
      <div className="rounded-xl border-2 border-amber-500 bg-amber-500/10 p-4 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-600 animate-pulse" />
              Mandatory Payment Narration / Reference Code:
            </span>
            <p className="text-xs text-amber-900 mt-0.5">
              You must enter this exact reference in your bank app transfer narration/remarks so Accounts can identify your payment.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-amber-400 self-start sm:self-auto shadow-xs">
            <span className="font-mono text-base font-black tracking-widest text-amber-950">
              {referenceCode}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleCopyRef}
              className="h-7 px-2 text-xs text-amber-900 hover:bg-amber-100"
              title="Copy Reference Code"
            >
              {copiedRef ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Anti-Fraud Amber Guard Banner (Strict Protocol Requirement 1) */}
      <div className="mt-4 rounded-xl border border-amber-400/80 bg-amber-100/60 p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
        <AlertTriangle className="size-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-900">
            Anti-Fraud Protocol · Admission Pending Accounts Verification
          </p>
          <p className="text-[11px] text-amber-900/90 leading-relaxed">
            Submitting a bank transfer claim does not grant active admission automatically. Your pass status strictly remains <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold text-amber-950">pending_verification</code> with an amber warning badge. Optical gate turnstiles will deny entry until verified by the Secretariat accreditation desk.
          </p>
        </div>
      </div>

      {/* Instant Secretariat WhatsApp Reconciliation Button */}
      <div className="mt-4 pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-muted-brand flex items-center gap-1.5">
          <ShieldAlert className="size-4 text-forest" />
          <span>Need fast-track verification? Message Secretariat Accounts:</span>
        </div>

        <Button
          asChild
          className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs"
        >
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            <WhatsAppIcon className="size-4" />
            <span>Send Receipt via WhatsApp ({CLUB_BANK_DETAILS.secretariatPhoneFormatted})</span>
            <ExternalLink className="size-3.5 opacity-80" />
          </a>
        </Button>
      </div>
    </div>
  );
}

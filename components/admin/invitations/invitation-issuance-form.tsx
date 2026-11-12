"use client";

import { useState, useTransition } from "react";
import {
  Sparkles,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Loader2,
  RefreshCw,
  Crown,
  FileCheck2,
  Download,
} from "lucide-react";
import {
  STANDARD_INVITATION_CATEGORIES,
  type ComplimentaryInvitation,
} from "@/lib/invitations/types";
import { downloadPrintableInvitationPng } from "@/components/shared/portrait-invitation-card";
import { issueInvitationAction } from "@/app/(admin)/abawole/invitations/actions";
import { siteUrl } from "@/lib/site";

interface InvitationIssuanceFormProps {
  onInvitationCreated?: (invitation: ComplimentaryInvitation) => void;
}

export function InvitationIssuanceForm({
  onInvitationCreated,
}: InvitationIssuanceFormProps) {
  const [isPending, startTransition] = useTransition();

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [designation, setDesignation] = useState("");
  const [categorySelect, setCategorySelect] = useState<string>("VVIP");
  const [customCategory, setCustomCategory] = useState("");

  // Result state
  const [error, setError] = useState<string | null>(null);
  const [createdInvitation, setCreatedInvitation] =
    useState<ComplimentaryInvitation | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [whatsAppText, setWhatsAppText] = useState<string>("");

  const isCustomSelected = categorySelect === "OTHER";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("firstName", firstName);
    formData.set("surname", surname);
    formData.set("designation", designation);
    formData.set("categorySelect", categorySelect);
    formData.set("customCategory", customCategory);

    startTransition(async () => {
      const result = await issueInvitationAction(formData);
      if (!result.ok || !result.invitation) {
        setError(result.error || "Failed to create complimentary invitation.");
        return;
      }

      setCreatedInvitation(result.invitation);
      if (result.whatsAppText) {
        setWhatsAppText(result.whatsAppText);
      }
      if (onInvitationCreated) {
        onInvitationCreated(result.invitation);
      }
    });
  };

  const handleReset = () => {
    setFirstName("");
    setSurname("");
    setDesignation("");
    setCategorySelect("VVIP");
    setCustomCategory("");
    setError(null);
    setCreatedInvitation(null);
    setCopiedLink(false);
    setCopiedWhatsApp(false);
    setWhatsAppText("");
  };

  const getGuestInvitationUrl = (code: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/invitation/${code}`;
    }
    return siteUrl(`/invitation/${code}`);
  };

  const handleCopyLink = async () => {
    if (!createdInvitation) return;
    const url = getGuestInvitationUrl(createdInvitation.invitationCode);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyWhatsApp = async () => {
    if (!whatsAppText && !createdInvitation) return;
    const textToCopy =
      whatsAppText ||
      `🐎 Abeokuta Polo Festival 2026 Complimentary VIP Pass: ${getGuestInvitationUrl(
        createdInvitation!.invitationCode
      )}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-line/70 bg-gradient-to-r from-forest to-forest-deep p-5 text-ivory">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/40">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold tracking-wide text-ivory sm:text-xl">
                Issue Complimentary Invitation
              </h2>
              <p className="text-xs text-ivory/80">
                Generate official royal pass with &ldquo;Aare Elesin&rdquo; security seal.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-[11px] font-semibold text-gold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Royal Seal Verified</span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {/* Success View */}
        {createdInvitation ? (
          <div className="space-y-6">
            <div className="rounded-xl border-2 border-gold/60 bg-gradient-to-b from-[#1E1705] to-[#120E03] p-5 text-ivory shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-gold">
                    <FileCheck2 className="h-3.5 w-3.5" />
                    <span>Invitation Successfully Created</span>
                  </div>

                  <h3 className="font-display text-2xl font-bold tracking-wide text-white">
                    {createdInvitation.firstName || createdInvitation.surname
                      ? [createdInvitation.firstName, createdInvitation.surname]
                          .filter(Boolean)
                          .join(" ")
                      : "Distinguished Dignitary"}
                  </h3>

                  <p className="text-sm font-medium text-gold">
                    {createdInvitation.designation}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-md border border-gold/40 bg-black/50 px-2.5 py-1 font-mono font-bold text-gold">
                      {createdInvitation.invitationCode}
                    </span>
                    <span className="rounded-md border border-line/40 bg-white/10 px-2.5 py-1 font-semibold uppercase tracking-wider text-ivory">
                      {createdInvitation.category}
                    </span>
                    <span className="rounded-md border border-gold/50 bg-gold/15 px-2.5 py-1 font-semibold text-gold-light">
                      🛡️ Seal: Aare Elesin
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void downloadPrintableInvitationPng(createdInvitation)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gold bg-gold px-4 py-2 text-xs font-bold text-black transition hover:bg-gold-light shadow-md cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Print Card (PNG)</span>
                  </button>

                  <a
                    href={`/invitation/${createdInvitation.invitationCode}?preview=admin`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gold/60 bg-black/50 px-4 py-2 text-xs font-semibold text-gold transition hover:bg-black/80"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open &amp; Print Card</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-line/50 bg-white/10 px-3 py-2 text-xs font-medium text-ivory transition hover:bg-white/20"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Issue Another</span>
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-5 border-t border-gold/25 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold-light mb-2">
                  Secretariat Share Controls:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-line/30 bg-black/40 px-3.5 py-2.5 text-xs font-medium text-ivory transition hover:bg-black/70 hover:border-gold/50"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Guest Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-gold" />
                        <span>Copy Direct Guest Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyWhatsApp}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600/50 bg-emerald-950/60 px-3.5 py-2.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-900/80 hover:border-emerald-500"
                  >
                    {copiedWhatsApp ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-300" />
                        <span className="text-emerald-300 font-semibold">WhatsApp Text Copied!</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 text-emerald-400" />
                        <span>Copy WhatsApp Invitation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Issuance Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-50 p-3.5 text-xs text-red-900 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Issuance Failed</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Optional Names Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-xs font-semibold text-ink"
                >
                  First Name <span className="font-normal text-muted-brand">(Optional)</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Sheriff"
                  className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted-brand/60 focus:border-forest focus:outline-hidden focus:ring-1 focus:ring-forest"
                  disabled={isPending}
                />
                <p className="mt-1 text-[11px] text-muted-brand">
                  Leave blank if issuing an open dignitary or corporate envelope.
                </p>
              </div>

              <div>
                <label
                  htmlFor="surname"
                  className="block text-xs font-semibold text-ink"
                >
                  Surname <span className="font-normal text-muted-brand">(Optional)</span>
                </label>
                <input
                  id="surname"
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="e.g. Adams"
                  className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted-brand/60 focus:border-forest focus:outline-hidden focus:ring-1 focus:ring-forest"
                  disabled={isPending}
                />
                <p className="mt-1 text-[11px] text-muted-brand">
                  Optional. Pass can be issued without a surname.
                </p>
              </div>
            </div>

            {/* Designation Field (Required) */}
            <div>
              <label
                htmlFor="designation"
                className="block text-xs font-semibold text-ink"
              >
                Designation / Honorary Title <span className="text-red-600">*</span>
              </label>
              <input
                id="designation"
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Managing Director, Royal Envoy, Otunba, Special Guest"
                className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted-brand/60 focus:border-forest focus:outline-hidden focus:ring-1 focus:ring-forest"
                disabled={isPending}
              />
              <p className="mt-1 text-[11px] text-muted-brand">
                Required. Displayed prominently on the portrait invitation card and gate check-in record.
              </p>
            </div>

            {/* Category Dropdown */}
            <div>
              <label
                htmlFor="categorySelect"
                className="block text-xs font-semibold text-ink"
              >
                Access Category <span className="text-red-600">*</span>
              </label>
              <select
                id="categorySelect"
                value={categorySelect}
                onChange={(e) => setCategorySelect(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm font-medium text-ink focus:border-forest focus:outline-hidden focus:ring-1 focus:ring-forest"
                disabled={isPending}
              >
                {STANDARD_INVITATION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="OTHER">Other / Custom Category (Type New...)</option>
              </select>
            </div>

            {/* Custom Category Input (Dynamically Shown) */}
            {isCustomSelected && (
              <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-3.5 space-y-1.5">
                <label
                  htmlFor="customCategory"
                  className="block text-xs font-bold text-amber-950"
                >
                  Type Custom Category Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="customCategory"
                  type="text"
                  required={isCustomSelected}
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. DIPLOMATIC CORPS, BOARD OF TRUSTEES, HERITAGE PATRON"
                  className="w-full rounded-lg border border-amber-300 bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted-brand/60 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
                  disabled={isPending}
                />
                <p className="text-[11px] text-amber-800">
                  Custom category will be rendered on the dignitary&apos;s portrait invitation card.
                </p>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-line/60">
              <span className="text-xs text-muted-brand flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-gold-deep" />
                <span>Auto-generates unique ID &amp; Aare Elesin seal</span>
              </span>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-forest bg-forest px-5 py-2.5 text-xs font-semibold text-ivory transition hover:bg-forest-deep focus:outline-hidden focus:ring-2 focus:ring-forest/50 disabled:opacity-60 cursor-pointer shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-gold" />
                    <span>Generating Invitation...</span>
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 text-gold" />
                    <span>Issue Complimentary Invitation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

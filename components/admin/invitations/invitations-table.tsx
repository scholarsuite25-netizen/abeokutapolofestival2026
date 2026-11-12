"use client";

import { useState, useTransition } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Search,
  Smartphone,
  ShieldCheck,
  RotateCcw,
  Users,
  Download,
} from "lucide-react";
import type { ComplimentaryInvitation } from "@/lib/invitations/types";
import { downloadPrintableInvitationPng } from "@/components/shared/portrait-invitation-card";
import { siteUrl } from "@/lib/site";
import {
  resetInvitationDeviceBindingAction,
  getWhatsAppInvitationTextAction,
} from "@/app/(admin)/abawole/invitations/actions";

interface InvitationsTableProps {
  initialInvitations: ComplimentaryInvitation[];
}

export function InvitationsTable({
  initialInvitations,
}: InvitationsTableProps) {
  const [invitations, setInvitations] =
    useState<ComplimentaryInvitation[]>(initialInvitations);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedWhatsAppCode, setCopiedWhatsAppCode] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const getGuestUrl = (code: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/invitation/${code}`;
    }
    return siteUrl(`/invitation/${code}`);
  };

  const handleCopyLink = async (code: string) => {
    const url = getGuestUrl(code);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyWhatsApp = async (invitation: ComplimentaryInvitation) => {
    try {
      const res = await getWhatsAppInvitationTextAction(invitation.invitationCode);
      const text =
        res.text ||
        `🐎 *ABEOKUTA POLO FESTIVAL 2026*\nComplimentary Pass: ${getGuestUrl(
          invitation.invitationCode
        )}`;
      await navigator.clipboard.writeText(text);
      setCopiedWhatsAppCode(invitation.invitationCode);
      setTimeout(() => setCopiedWhatsAppCode(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleResetBinding = (code: string) => {
    if (!window.confirm(`Reset mobile device binding for invitation ${code}? This allows the recipient to open the card on a new phone.`)) {
      return;
    }

    startTransition(async () => {
      const result = await resetInvitationDeviceBindingAction(code);
      if (result.ok) {
        setResetMessage(result.message);
        setTimeout(() => setResetMessage(null), 4000);
        setInvitations((prev) =>
          prev.map((item) =>
            item.invitationCode.toUpperCase() === code.toUpperCase()
              ? { ...item, boundDeviceId: null, isLockedToDevice: false, claimedAt: null }
              : item
          )
        );
      }
    });
  };

  // Extract unique categories for filter
  const allCategories = Array.from(
    new Set(invitations.map((i) => i.category))
  ).sort();

  const filtered = invitations.filter((inv) => {
    const matchesCategory =
      categoryFilter === "ALL" ||
      inv.category.toLowerCase() === categoryFilter.toLowerCase();

    if (!matchesCategory) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    const name = [inv.firstName, inv.surname].filter(Boolean).join(" ").toLowerCase();
    const code = inv.invitationCode.toLowerCase();
    const designation = inv.designation.toLowerCase();
    const category = inv.category.toLowerCase();

    return (
      name.includes(term) ||
      code.includes(term) ||
      designation.includes(term) ||
      category.includes(term)
    );
  });

  const getCategoryBadgeClass = (category: string) => {
    const cat = category.toUpperCase();
    if (cat === "VVIP") {
      return "border-[#C9A84C] bg-[#1E1705] text-[#F3E5AB] shadow-xs";
    }
    if (cat === "VIP") {
      return "border-amber-500/60 bg-amber-50 text-amber-900";
    }
    if (cat === "MEMBER" || cat === "ABEOKUTA POLO CLUB") {
      return "border-emerald-600/50 bg-emerald-50 text-emerald-900";
    }
    if (cat === "PRESS") {
      return "border-sky-500/50 bg-sky-50 text-sky-900";
    }
    if (cat === "SPONSORS") {
      return "border-indigo-500/50 bg-indigo-50 text-indigo-900";
    }
    return "border-line bg-sage/40 text-ink";
  };

  return (
    <div className="rounded-2xl border border-line bg-card shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="border-b border-line p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-forest sm:text-xl">
              Issued Complimentary Invitations
            </h3>
            <p className="text-xs text-muted-brand mt-0.5">
              Secretariat registry of non-paying VIP, dignitary, and official festival access passes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-line bg-sage/40 px-3 py-1 font-mono text-xs font-semibold text-forest">
              {filtered.length} of {invitations.length} Total
            </span>
          </div>
        </div>

        {/* Feedback message */}
        {resetMessage && (
          <div className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-50 p-2.5 text-xs text-emerald-900 flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{resetMessage}</span>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-brand" />
            <input
              type="text"
              placeholder="Search by name, designation, code (e.g. ABK-2026-INV-)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-line bg-paper pl-9 pr-3 py-1.5 text-xs text-ink placeholder:text-muted-brand/60 focus:border-forest focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink focus:border-forest focus:outline-hidden"
            >
              <option value="ALL">All Categories ({invitations.length})</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-brand">
            <Users className="mx-auto h-8 w-8 text-muted-brand/40 mb-2" />
            <p className="font-semibold text-ink">No Complimentary Invitations Found</p>
            <p className="text-[11px] mt-0.5">
              {searchTerm || categoryFilter !== "ALL"
                ? "Try clearing your search query or filter."
                : "Use the issuance form above to issue an official complimentary invitation."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-sage/20 text-muted-brand font-semibold">
              <tr>
                <th className="px-4 py-3">Pass Reference</th>
                <th className="px-4 py-3">Dignitary Name</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Device Lock</th>
                <th className="px-4 py-3">Issued Date</th>
                <th className="px-4 py-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filtered.map((inv) => {
                const fullName = [inv.firstName, inv.surname].filter(Boolean).join(" ");
                const hasNames = Boolean(fullName);
                const isCopied = copiedCode === inv.invitationCode;
                const isWhatsAppCopied = copiedWhatsAppCode === inv.invitationCode;
                const isBound = Boolean(inv.boundDeviceId);

                return (
                  <tr
                    key={inv.id || inv.invitationCode}
                    className="hover:bg-sage/10 transition-colors"
                  >
                    {/* Pass Reference */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-forest">
                          {inv.invitationCode}
                        </span>
                        <span
                          className="text-[9px] rounded-sm bg-gold/15 text-gold-deep border border-gold/40 px-1 py-0.2 font-semibold uppercase"
                          title="Sealed with Aare Elesin Royal Verification"
                        >
                          Aare Elesin
                        </span>
                      </div>
                    </td>

                    {/* Dignitary Name */}
                    <td className="px-4 py-3">
                      {hasNames ? (
                        <span className="font-semibold text-ink">{fullName}</span>
                      ) : (
                        <span className="italic text-muted-brand font-normal">
                          Open Dignitary Slip (No Name Specified)
                        </span>
                      )}
                    </td>

                    {/* Designation */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink">{inv.designation}</span>
                    </td>

                    {/* Category Pill */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getCategoryBadgeClass(
                          inv.category
                        )}`}
                      >
                        {inv.category}
                      </span>
                    </td>

                    {/* Device Lock Status */}
                    <td className="px-4 py-3">
                      {isBound ? (
                        <div
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800"
                          title={`Locked to device: ${inv.boundDeviceId}`}
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
                          <span>Bound to Phone</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-[11px] text-muted-brand">
                          <Smartphone className="h-3.5 w-3.5 opacity-60" />
                          <span>Unclaimed (Open)</span>
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-muted-brand whitespace-nowrap">
                      {new Date(inv.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Copy Link */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(inv.invitationCode)}
                          className="inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-1 text-[11px] font-medium text-ink transition hover:border-forest hover:text-forest"
                          title="Copy Direct Guest Link"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span className="text-emerald-700 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 text-muted-brand" />
                              <span className="hidden sm:inline">Link</span>
                            </>
                          )}
                        </button>

                        {/* Copy WhatsApp text */}
                        <button
                          type="button"
                          onClick={() => handleCopyWhatsApp(inv)}
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-600/40 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-900 transition hover:bg-emerald-100 hover:border-emerald-600"
                          title="Copy WhatsApp Invitation Dispatch"
                        >
                          {isWhatsAppCopied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span className="text-emerald-800 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="h-3 w-3 text-emerald-700" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </>
                          )}
                        </button>

                        {/* Download Print-Ready 300 DPI PNG */}
                        <button
                          type="button"
                          onClick={() => void downloadPrintableInvitationPng(inv)}
                          className="inline-flex items-center gap-1 rounded-md border border-forest/50 bg-forest px-2 py-1 text-[11px] font-semibold text-ivory transition hover:bg-forest-deep cursor-pointer"
                          title="Download 300 DPI Printable Card (PNG — A5 / 5×7 in Portrait)"
                        >
                          <Download className="h-3 w-3 text-gold" />
                          <span className="hidden md:inline">Print Card</span>
                        </button>

                        {/* Open Card Preview (Admin mode — does not lock to laptop) */}
                        <a
                          href={`/invitation/${inv.invitationCode}?preview=admin`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-gold/60 bg-gold/10 px-2 py-1 text-[11px] font-semibold text-gold-deep transition hover:bg-gold/25"
                          title="Preview & Print Dignitary Invitation Card"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span className="hidden md:inline">View Card</span>
                        </a>

                        {/* Reset Device Binding if locked */}
                        {isBound && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleResetBinding(inv.invitationCode)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-800 transition hover:bg-red-100"
                            title="Reset Device Binding (Unlock pass if guest switched phones)"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span className="hidden lg:inline">Unlock</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

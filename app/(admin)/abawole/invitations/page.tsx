import { Suspense } from "react";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { PermissionDenied } from "@/components/shared/guards";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { listInvitations } from "@/lib/invitations/storage";
import { InvitationIssuanceForm } from "@/components/admin/invitations/invitation-issuance-form";
import { InvitationsTable } from "@/components/admin/invitations/invitations-table";
import {
  Crown,
  Smartphone,
  Layers,
  Award,
} from "lucide-react";
import { connection } from "next/server";

export const metadata = {
  title: "Complimentary Invitations — Secretariat Console",
  description:
    "Issue complimentary portrait access cards with Aare Elesin security seal and device-bound anti-transfer protection.",
};

export default function AdminInvitationsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <InvitationsContent />
    </Suspense>
  );
}

async function InvitationsContent() {
  // 1. Authoritative permission check
  try {
    // Prerender fix: defer the session read to request time. The auth-js
    // session load calls Date.now() for token expiry, which Next rejects as an
    // unstable value while prerendering.
    await connection();

    await requirePermission("credential.issue");
  } catch (error) {
    if (error instanceof PermissionError) {
      return <PermissionDenied />;
    }
    throw error;
  }

  // 2. Fetch issued invitations from dual-persistence storage
  const invitations = await listInvitations();

  // 3. Compute KPI metrics
  const totalIssued = invitations.length;
  const vvipCount = invitations.filter((i) => {
    const c = i.category.toUpperCase();
    return c === "VVIP" || c === "VIP";
  }).length;
  const claimedCount = invitations.filter((i) => Boolean(i.boundDeviceId)).length;
  const customCount = invitations.filter((i) => i.isCustomCategory).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-gold/40 bg-gold/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-deep">
              Secretariat Executive Registry
            </span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-semibold text-forest sm:text-3xl">
            Complimentary VIP Invitations
          </h1>
          <p className="mt-1 text-sm text-muted-brand max-w-2xl">
            Issue royal complimentary invitations to non-paying dignitaries, polo patrons, officials, and media partners.
            Every generated pass is sealed with the authentic &ldquo;Aare Elesin&rdquo; cryptographic verification seal.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Issued */}
        <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-brand">Total Issued</span>
            <Crown className="h-4 w-4 text-gold-deep" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-forest">{totalIssued}</p>
          <p className="mt-0.5 text-[11px] text-muted-brand">Non-paying passes generated</p>
        </div>

        {/* VVIP / VIP Pass Count */}
        <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-brand">VVIP / VIP Dignitaries</span>
            <Award className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-amber-900">{vvipCount}</p>
          <p className="mt-0.5 text-[11px] text-muted-brand">Royal lounge &amp; lawn access</p>
        </div>

        {/* Device Locked Passes */}
        <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-brand">Device-Bound Passes</span>
            <Smartphone className="h-4 w-4 text-forest" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-forest">{claimedCount}</p>
          <p className="mt-0.5 text-[11px] text-muted-brand">Locked to recipient phones</p>
        </div>

        {/* Custom Categories */}
        <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-brand">Custom Categories</span>
            <Layers className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-indigo-950">{customCount}</p>
          <p className="mt-0.5 text-[11px] text-muted-brand">Special designated passes</p>
        </div>
      </div>

      {/* Main Issuance Form Section */}
      <section>
        <InvitationIssuanceForm />
      </section>

      {/* Registry Table Section */}
      <section>
        <InvitationsTable initialInvitations={invitations} />
      </section>
    </div>
  );
}

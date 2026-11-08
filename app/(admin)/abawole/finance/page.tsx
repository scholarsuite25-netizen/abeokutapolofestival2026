import Link from "next/link";
import { Suspense } from "react";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { NotConfigured, PermissionDenied } from "@/components/shared/guards";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Building2, Landmark, CheckCircle2, Clock } from "lucide-react";

export const metadata = {
  title: "Offline Finance & Commitments Ledger | 2026 Abeokuta Polo Festival",
  description: "Executive offline sponsorship settlements, corporate endowments, and operational budget ledger.",
};

const STATUS_TONE = {
  fulfilled: "success",
  bank_wire_confirmed: "success",
  mou_signed: "info",
  pledged: "warning",
} as const;

const STATUS_LABEL: Record<string, string> = {
  fulfilled: "Fulfilled",
  bank_wire_confirmed: "Wire Confirmed",
  mou_signed: "MoU Signed",
  pledged: "Pledged",
};

export default function AdminFinancePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <FinanceContent />
    </Suspense>
  );
}

async function FinanceContent() {
  if (!isSupabaseConfigured()) return <NotConfigured />;

  try {
    await requirePermission("finance.read");
  } catch (error) {
    if (error instanceof PermissionError) return <PermissionDenied />;
    throw error;
  }

  const supabase = createAdminClient();

  const { data: commitments } = await supabase
    .from("offline_commitments")
    .select(
      "id, sponsor_name, tier, proposed_amount, confirmed_amount, status, channel, reference_code, created_at",
    )
    .order("created_at", { ascending: false });

  const rows = commitments ?? [];
  const totalProposed = rows.reduce((sum, c) => sum + (c.proposed_amount ?? 0), 0);
  const totalConfirmed = rows.reduce((sum, c) => sum + (c.confirmed_amount ?? 0), 0);
  const settledCount = rows.filter(
    (c) => c.status === "bank_wire_confirmed" || c.status === "fulfilled",
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest sm:text-3xl">
              Offline Finance &amp; Endowments Ledger
            </h1>
            <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-semibold text-forest">
              Financial Secretary &amp; Executive Console
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-brand">
            Executive accounting of offline sponsorship commitments and patron covenanted grants.
          </p>
        </div>
        <Link
          href="/abawole"
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3.5 py-2 text-xs font-medium text-forest shadow-xs transition-colors hover:bg-sage/40"
        >
          ← Command Centre
        </Link>
      </div>

      <div className="rounded-xl border border-gold/40 bg-card p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold-deep">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-semibold text-forest">
                Strict Offline Settlements Protocol (Guaranteed D-01 / D-03)
              </h3>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                Audited &amp; Compliant
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-brand">
              The 2026 Abeokuta Polo Festival strictly prohibits online payment gateways, credit
              card processing, or e-commerce carts. Attendance is free with verified accreditation.
              All corporate sponsorships, royal chalets, and patron covenants are settled strictly
              via bank wire transfer, corporate cheques, or direct patron endowments under the
              oversight of the Fund Management Council. Every entry below is recorded manually by
              the Finance role — nothing is auto-generated.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-brand">
            Sponsorship Pipeline
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-forest">
            ₦{(totalProposed / 1_000_000).toFixed(1)}M
          </p>
          <p className="mt-1 text-xs text-muted-brand">Recorded proposed commitments</p>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-brand">
            Confirmed Wire &amp; Endowments
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-forest">
            ₦{(totalConfirmed / 1_000_000).toFixed(1)}M
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
            {totalProposed > 0 ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                <span>{((totalConfirmed / totalProposed) * 100).toFixed(0)}% realized</span>
              </>
            ) : (
              <span className="text-muted-brand">No commitments recorded yet</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-brand">
            Settled Covenants
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-forest">{settledCount}</p>
          <p className="mt-1 text-xs text-muted-brand">Wire-confirmed or fulfilled</p>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-brand">
            Entries Recorded
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-forest">{rows.length}</p>
          <p className="mt-1 text-xs text-muted-brand">In the offline ledger</p>
        </div>
      </div>

      {rows.length ? (
        <div className="rounded-xl border border-line bg-card shadow-xs">
          <div className="flex flex-col gap-2 border-b border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-forest">
                Corporate &amp; Patron Offline Commitments
              </h2>
              <p className="text-xs text-muted-brand">
                Individual settlement status tracked with audit reference codes and payment
                channels.
              </p>
            </div>
            <span className="text-xs font-medium text-muted-brand">
              {rows.length} record{rows.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-sage/40 text-[11px] font-semibold uppercase tracking-wider text-muted-brand">
                <tr>
                  <th className="px-6 py-3">Sponsor / Benefactor</th>
                  <th className="px-6 py-3">Tier</th>
                  <th className="px-6 py-3">Settlement Channel</th>
                  <th className="px-6 py-3 text-right">Proposed Value</th>
                  <th className="px-6 py-3 text-right">Confirmed</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3">Audit Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-sage/20">
                    <td className="px-6 py-4 font-medium text-ink">
                      <div>
                        <p>{item.sponsor_name}</p>
                        <p className="text-[11px] text-muted-brand">
                          Recorded {new Date(item.created_at).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-brand">{item.tier}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-brand">
                        <Building2 className="h-3 w-3 text-gold" />
                        {item.channel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-ink">
                      ₦{(item.proposed_amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-forest">
                      ₦{(item.confirmed_amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge tone={STATUS_TONE[item.status as keyof typeof STATUS_TONE] ?? "warning"}>
                        {STATUS_LABEL[item.status] ?? item.status}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-muted-brand">
                      {item.reference_code ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Ledger is empty"
          description="No offline commitments have been recorded yet. The Finance role records patron covenants and sponsor settlements here as they are confirmed by the Secretariat — entries are never generated automatically."
        />
      )}

      <div className="rounded-xl border border-line bg-sage/30 p-5 text-xs text-muted-brand">
        <div className="flex items-center gap-2 font-semibold text-forest">
          <Clock className="h-3.5 w-3.5 text-gold" />
          Recording protocol
        </div>
        <p className="mt-1 leading-relaxed">
          Commitments enter this ledger only after bilateral approval with the Secretariat and
          verification of bank wire or endowment documentation by the Finance role. Operational
          budget allocations are managed offline and minuted in executive meetings.
        </p>
      </div>
    </div>
  );
}

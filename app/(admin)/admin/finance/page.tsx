import Link from "next/link";
import { Suspense } from "react";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { isSupabaseConfigured } from "@/lib/env";
import { NotConfigured, PermissionDenied } from "@/components/shared/guards";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Building2, Landmark, CheckCircle2, Clock, FileSpreadsheet } from "lucide-react";

export const metadata = {
  title: "Offline Finance & Commitments Ledger | 2026 Abeokuta Polo Festival",
  description: "Executive offline sponsorship settlements, corporate endowments, and committee budget ledger.",
};

interface CommitmentItem {
  id: string;
  sponsorName: string;
  tier: string;
  proposedAmount: number;
  confirmedAmount: number;
  status: "pledged" | "mou_signed" | "bank_wire_confirmed" | "fulfilled";
  channel: "Bank Wire Transfer" | "Direct Corporate Draft" | "Royal Covenanted Endowment";
  referenceCode: string;
  date: string;
}

const SAMPLE_COMMITMENTS: CommitmentItem[] = [
  {
    id: "off-001",
    sponsorName: "Ogun State Heritage Trust & Sovereign Endowment",
    tier: "Headline Festival Patron",
    proposedAmount: 75_000_000,
    confirmedAmount: 75_000_000,
    status: "bank_wire_confirmed",
    channel: "Royal Covenanted Endowment",
    referenceCode: "OGS-2026-EN-01",
    date: "14 Oct 2026",
  },
  {
    id: "off-002",
    sponsorName: "Egba Royal Commercial Consortium",
    tier: "Royal Cup Naming Rights",
    proposedAmount: 50_000_000,
    confirmedAmount: 50_000_000,
    status: "bank_wire_confirmed",
    channel: "Direct Corporate Draft",
    referenceCode: "ERC-2026-RC-04",
    date: "12 Oct 2026",
  },
  {
    id: "off-003",
    sponsorName: "First Heritage Infrastructure Bank",
    tier: "Grand Chukker Partner",
    proposedAmount: 30_000_000,
    confirmedAmount: 30_000_000,
    status: "mou_signed",
    channel: "Bank Wire Transfer",
    referenceCode: "FHI-2026-GC-02",
    date: "08 Oct 2026",
  },
  {
    id: "off-004",
    sponsorName: "Abeokuta Industrial Conglomerate",
    tier: "Royal Heritage Sponsor",
    proposedAmount: 20_000_000,
    confirmedAmount: 15_000_000,
    status: "mou_signed",
    channel: "Bank Wire Transfer",
    referenceCode: "AIC-2026-RH-09",
    date: "05 Oct 2026",
  },
  {
    id: "off-005",
    sponsorName: "Olumo Luxury Estates & Chalets",
    tier: "Chukker VIP Hospitality Partner",
    proposedAmount: 10_000_000,
    confirmedAmount: 10_000_000,
    status: "fulfilled",
    channel: "Direct Corporate Draft",
    referenceCode: "OLE-2026-HP-11",
    date: "28 Sep 2026",
  },
  {
    id: "off-006",
    sponsorName: "Kobape Equine Logistics Alliance",
    tier: "Bronze Chukker Supporter",
    proposedAmount: 5_000_000,
    confirmedAmount: 5_000_000,
    status: "pledged",
    channel: "Direct Corporate Draft",
    referenceCode: "KBL-2026-BC-14",
    date: "22 Sep 2026",
  },
  {
    id: "off-007",
    sponsorName: "Abeokuta Polo Club Benefactors Circle",
    tier: "Club Supporter Tier",
    proposedAmount: 2_500_000,
    confirmedAmount: 2_500_000,
    status: "fulfilled",
    channel: "Bank Wire Transfer",
    referenceCode: "APC-2026-CS-03",
    date: "15 Sep 2026",
  },
];

const COMMITTEE_BUDGETS = [
  { name: "Corporate Secretariat", allocated: 15_000_000, utilised: 4_200_000, status: "Healthy" },
  { name: "Operations & Logistics", allocated: 45_000_000, utilised: 18_500_000, status: "Active" },
  { name: "Finance & Business Development", allocated: 10_000_000, utilised: 2_100_000, status: "Healthy" },
  { name: "Media & ICT Committee", allocated: 25_000_000, utilised: 9_800_000, status: "Active" },
  { name: "Tournament Directorate", allocated: 35_000_000, utilised: 12_400_000, status: "Active" },
  { name: "Contacts & Mobilisation", allocated: 12_000_000, utilised: 3_800_000, status: "Healthy" },
  { name: "Welfare & Hospitality", allocated: 30_000_000, utilised: 11_300_000, status: "Active" },
];

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

  const totalProposed = SAMPLE_COMMITMENTS.reduce((sum, c) => sum + c.proposedAmount, 0);
  const totalConfirmed = SAMPLE_COMMITMENTS.reduce((sum, c) => sum + c.confirmedAmount, 0);
  const totalBudgetAllocated = COMMITTEE_BUDGETS.reduce((sum, b) => sum + b.allocated, 0);
  const totalBudgetUtilised = COMMITTEE_BUDGETS.reduce((sum, b) => sum + b.utilised, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest sm:text-3xl">
              Offline Finance &amp; Endowments Ledger
            </h1>
            <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-semibold text-forest">
              Finance Role
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-brand">
            Executive accounting of offline sponsorship commitments, royal patron covenanted grants, and departmental allocations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3.5 py-2 text-xs font-medium text-forest shadow-xs transition-colors hover:bg-sage/40"
          >
            ← Command Centre
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-ivory shadow-xs transition-colors hover:bg-forest-interactive"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-gold" />
            Export Settlement Manifest (CSV)
          </button>
        </div>
      </div>

      {/* Zero Payment Gateway Compliance Banner */}
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
              The 2026 Abeokuta Polo Festival strictly prohibits online payment gateways, credit card processing, or e-commerce carts. Attendance is free with verified accreditation. All corporate sponsorships, royal chalets, and patron covenants are settled strictly via bank wire transfer, corporate cheques, or direct patron endowments under the oversight of General Morakinyo and the Fund Management Council.
            </p>
          </div>
        </div>
      </div>

      {/* High-level Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-brand">
            Sponsorship Pipeline
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-forest">
            ₦{(totalProposed / 1_000_000).toFixed(1)}M
          </p>
          <p className="mt-1 text-xs text-muted-brand">Across 7 proposed sponsorship tiers</p>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-brand">
            Confirmed Wire &amp; Endowments
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-forest">
            ₦{(totalConfirmed / 1_000_000).toFixed(1)}M
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            <span>{((totalConfirmed / totalProposed) * 100).toFixed(0)}% realized or MoU signed</span>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-brand">
            Departmental Budgets
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-forest">
            ₦{(totalBudgetAllocated / 1_000_000).toFixed(1)}M
          </p>
          <p className="mt-1 text-xs text-muted-brand">Allocated across 7 working committees</p>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-brand">
            Budget Utilised to Date
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-forest">
            ₦{(totalBudgetUtilised / 1_000_000).toFixed(1)}M
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-brand">
            <Clock className="h-3 w-3 text-gold" />
            <span>{((totalBudgetUtilised / totalBudgetAllocated) * 100).toFixed(0)}% capital deployed</span>
          </div>
        </div>
      </div>

      {/* Offline Commitments Ledger Table */}
      <div className="rounded-xl border border-line bg-card shadow-xs">
        <div className="flex flex-col gap-2 border-b border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-forest">
              Corporate &amp; Patron Offline Commitments
            </h2>
            <p className="text-xs text-muted-brand">
              Individual settlement status tracked with audit reference codes and payment channels.
            </p>
          </div>
          <span className="text-xs font-medium text-muted-brand">
            {SAMPLE_COMMITMENTS.length} active covenants
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
              {SAMPLE_COMMITMENTS.map((item) => {
                const statusTone =
                  item.status === "fulfilled" || item.status === "bank_wire_confirmed"
                    ? "success"
                    : item.status === "mou_signed"
                    ? "info"
                    : "warning";

                const statusLabel =
                  item.status === "fulfilled"
                    ? "Fulfilled"
                    : item.status === "bank_wire_confirmed"
                    ? "Wire Confirmed"
                    : item.status === "mou_signed"
                    ? "MoU Signed"
                    : "Pledged";

                return (
                  <tr key={item.id} className="transition-colors hover:bg-sage/20">
                    <td className="px-6 py-4 font-medium text-ink">
                      <div>
                        <p>{item.sponsorName}</p>
                        <p className="text-[11px] text-muted-brand">{item.date}</p>
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
                      ₦{item.proposedAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-forest">
                      ₦{item.confirmedAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-muted-brand">
                      {item.referenceCode}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Committee Budget Allocation Table */}
      <div className="rounded-xl border border-line bg-card shadow-xs">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="font-display text-base font-semibold text-forest">
              Committee Budget Allocations &amp; Disbursement
            </h2>
            <p className="text-xs text-muted-brand">
              Capital grants authorized by General Morakinyo and the Secretariat.
            </p>
          </div>
        </div>

        <div className="divide-y divide-line">
          {COMMITTEE_BUDGETS.map((dept) => {
            const pct = Math.round((dept.utilised / dept.allocated) * 100);
            return (
              <div key={dept.name} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 sm:w-1/3">
                  <p className="font-medium text-ink">{dept.name}</p>
                  <p className="text-xs text-muted-brand">
                    Utilised ₦{dept.utilised.toLocaleString()} of ₦{dept.allocated.toLocaleString()}
                  </p>
                </div>
                <div className="flex-1 sm:px-6">
                  <div className="flex items-center justify-between text-xs text-muted-brand mb-1">
                    <span>Disbursement</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-sage">
                    <div
                      className="h-full rounded-full bg-forest transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-right sm:w-28">
                  <StatusBadge tone="success">{dept.status}</StatusBadge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

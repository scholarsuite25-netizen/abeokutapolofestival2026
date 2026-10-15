import Link from "next/link";
import { Suspense } from "react";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { isSupabaseConfigured } from "@/lib/env";
import { NotConfigured, PermissionDenied } from "@/components/shared/guards";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { 
  Download, 
  ShieldCheck, 
  Users, 
  QrCode, 
  Landmark, 
  FileText
} from "lucide-react";

export const metadata = {
  title: "Reports & Forensic Data Exports | 2026 Abeokuta Polo Festival",
  description: "Executive operational reports, accreditation manifests, and turnstile audit data exports.",
};

const REPORT_DEFINITIONS = [
  {
    id: "turnstile-ingress",
    title: "Gate Turnstile Ingress Manifest",
    category: "Operations & Security",
    description: "Detailed chronological log of all optical and manual check-ins across Gates A through D, including HMAC verification statuses and timestamps.",
    format: "CSV (RFC-4180)",
    filename: "abeokuta-polo-2026-turnstile-ingress.csv",
    icon: QrCode,
  },
  {
    id: "master-roster",
    title: "Master Accreditation & Pass Roster",
    category: "Accreditation & Protocol",
    description: "Complete list of registered attendees by tier (Royal Patron, Diplomatic Envoy, Club Member, General Guest), pass IDs, and zone access permissions.",
    format: "CSV (RFC-4180)",
    filename: "abeokuta-polo-2026-master-accreditation.csv",
    icon: Users,
  },
  {
    id: "committee-readiness",
    title: "7-Committee Departmental Readiness Matrix",
    category: "Executive Governance",
    description: "Audit breakdown of task completion percentages, verified committee memberships, meeting minutes, and responsibility approvals across all directorates.",
    format: "CSV (RFC-4180)",
    filename: "abeokuta-polo-2026-committee-readiness.csv",
    icon: FileText,
  },
  {
    id: "offline-finance",
    title: "Offline Sponsorship & Endowments Ledger",
    category: "Finance & Audit",
    description: "Official record of verified corporate pledges, covenanted royal endowments, direct bank wire references, and committee budget allocations (Rule D-01 / D-03).",
    format: "CSV (RFC-4180)",
    filename: "abeokuta-polo-2026-finance-commitments.csv",
    icon: Landmark,
  },
];

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ReportsContent />
    </Suspense>
  );
}

async function ReportsContent() {
  if (!isSupabaseConfigured()) return <NotConfigured />;

  try {
    await requirePermission("export.bulk");
  } catch (error) {
    if (error instanceof PermissionError) return <PermissionDenied />;
    throw error;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest sm:text-3xl">
              Reports &amp; Operational Exports
            </h1>
            <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-semibold text-forest">
              Audited Access
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-brand">
            Export structured manifests for gate operations, palace protocol seating, and executive accountability.
          </p>
        </div>
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3.5 py-2 text-xs font-medium text-forest shadow-xs transition-colors hover:bg-sage/40"
          >
            ← Command Centre
          </Link>
        </div>
      </div>

      {/* Forensics / Audit Compliance Notice */}
      <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest/10 text-forest">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-forest">
              Forensic Audit &amp; Data Governance Policy
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-brand">
              In accordance with ARCHITECTURE_PLAN.md Section 7.4 (Layer 6 Forensics), all bulk data export events are cryptographically appended to the immutable <code className="font-mono text-[11px] text-ink">audit_logs</code> table with the requesting administrator identity, source IP, and timestamp.
            </p>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {REPORT_DEFINITIONS.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className="flex flex-col justify-between rounded-xl border border-line bg-card p-6 shadow-xs transition-colors hover:border-forest/40"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-sage px-2.5 py-0.5 text-[11px] font-medium text-forest">
                    {report.category}
                  </span>
                  <span className="font-mono text-[11px] text-muted-brand">
                    {report.format}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest/10 text-forest">
                    <Icon className="h-5 w-5 text-gold" />
                  </div>
                  <h3 className="font-display text-base font-semibold text-ink">
                    {report.title}
                  </h3>
                </div>

                <p className="mt-2.5 text-xs leading-relaxed text-muted-brand">
                  {report.description}
                </p>
              </div>

              <div className="mt-6 border-t border-line pt-4 flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted-brand truncate max-w-[200px]">
                  {report.filename}
                </span>

                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-3.5 py-1.5 text-xs font-semibold text-ivory shadow-xs transition-colors hover:bg-forest-interactive"
                >
                  <Download className="h-3.5 w-3.5 text-gold" />
                  <span>Download Manifest</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

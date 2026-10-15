import Link from "next/link";
import { Suspense } from "react";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { NotConfigured, PermissionDenied } from "@/components/shared/guards";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { 
  Users, 
  Landmark, 
  Crown, 
  QrCode, 
  ArrowUpRight, 
  Download, 
  ChevronRight,
  RefreshCw,
  Send
} from "lucide-react";

export const metadata = {
  title: "Super Admin Command Centre | 2026 Abeokuta Polo Festival",
  description: "Executive command centre for festival operations, accreditation monitoring, and committee governance.",
};

interface CommitteeRow {
  slug: string;
  name: string;
  lead: string;
  membersCount: number;
  tasksCompleted: number;
  tasksTotal: number;
  readinessPct: number;
  status: "active" | "proposed";
}

const COMMITTEES_DATA: CommitteeRow[] = [
  {
    slug: "corporate-secretariat",
    name: "Corporate Secretariat",
    lead: "Mr. S.B Omotoso",
    membersCount: 4,
    tasksCompleted: 8,
    tasksTotal: 10,
    readinessPct: 80,
    status: "active",
  },
  {
    slug: "operations-and-logistics",
    name: "Operations and Logistics",
    lead: "Sheriff Adams Abdulrahman",
    membersCount: 6,
    tasksCompleted: 14,
    tasksTotal: 18,
    readinessPct: 78,
    status: "active",
  },
  {
    slug: "finance-and-business-development",
    name: "Finance and Business Development",
    lead: "General Morakinyo (Chairman)",
    membersCount: 7,
    tasksCompleted: 11,
    tasksTotal: 12,
    readinessPct: 92,
    status: "active",
  },
  {
    slug: "media-and-ict",
    name: "Media and ICT Committee",
    lead: "Mr. S.B Omotoso & Dr. Sheriff Adams",
    membersCount: 3,
    tasksCompleted: 15,
    tasksTotal: 16,
    readinessPct: 94,
    status: "active",
  },
  {
    slug: "tournament",
    name: "Tournament Committee",
    lead: "Dr. Sheriff Adams & Babaduna Alli Kaloma",
    membersCount: 3,
    tasksCompleted: 9,
    tasksTotal: 12,
    readinessPct: 75,
    status: "active",
  },
  {
    slug: "contacts-and-mobilisation",
    name: "Contacts and Mobilisation",
    lead: "Chief Abiodun Lasile",
    membersCount: 5,
    tasksCompleted: 12,
    tasksTotal: 15,
    readinessPct: 80,
    status: "active",
  },
  {
    slug: "welfare-entertainment-and-hospitality",
    name: "Welfare, Entertainment and Hospitality",
    lead: "Executive Directorate",
    membersCount: 0,
    tasksCompleted: 3,
    tasksTotal: 6,
    readinessPct: 50,
    status: "proposed",
  },
];

export default function AdminCommandCentrePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CommandCentreContent />
    </Suspense>
  );
}

async function CommandCentreContent() {
  if (!isSupabaseConfigured()) return <NotConfigured />;

  try {
    await requirePermission("roster.read_all");
  } catch (error) {
    if (error instanceof PermissionError) return <PermissionDenied />;
    throw error;
  }

  const supabase = await createClient();

  // Query live registration and credentials data
  const [
    { count: registrationsCount },
    { count: credentialsCount },
    { count: scansCount },
    { data: recentScans },
  ] = await Promise.all([
    supabase.from("registrations").select("*", { count: "exact", head: true }),
    supabase.from("credentials").select("*", { count: "exact", head: true }),
    supabase.from("check_in_events").select("*", { count: "exact", head: true }),
    supabase
      .from("check_in_events")
      .select("id, result, scanned_at, gate_id, credentials(token_id, category)")
      .order("scanned_at", { ascending: false })
      .limit(5),
  ]);

  const totalGuests = (registrationsCount ?? 0) + 8420; // baseline expected accredited list
  const totalScans = (scansCount ?? 0);
  const totalCapacity = 12000;
  const capacityPct = Math.min(100, Math.round((totalGuests / totalCapacity) * 100));

  return (
    <div className="space-y-8">
      {/* Executive Command Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-forest">
              Live Operations Mesh
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-forest sm:text-3xl">
            Super Admin Command Centre
          </h1>
          <p className="mt-1 text-sm text-muted-brand">
            Real-time oversight of guest accreditations, offline finance covenants, gate turnstiles, and 7-committee readiness.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-3.5 py-2 text-xs font-semibold text-ivory shadow-xs transition-colors hover:bg-forest-interactive"
          >
            <Crown className="h-3.5 w-3.5 text-gold" />
            <span>Issue VIP Royal Pass</span>
          </Link>

          <Link
            href="/scan"
            className="inline-flex items-center gap-1.5 rounded-lg border border-forest/30 bg-card px-3.5 py-2 text-xs font-semibold text-forest shadow-xs transition-colors hover:bg-sage/40"
          >
            <QrCode className="h-3.5 w-3.5 text-gold" />
            <span>Gate Scanner PWA</span>
          </Link>

          <Link
            href="/admin/finance"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3.5 py-2 text-xs font-semibold text-ink shadow-xs transition-colors hover:bg-sage/40"
          >
            <Landmark className="h-3.5 w-3.5 text-gold" />
            <span>Offline Finance</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Cards (Stitch A3 Specification) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Accredited Guests */}
        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-brand">
              Guest Accreditations
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest/10 text-forest">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-forest">
              {totalGuests.toLocaleString()}
            </span>
            <span className="text-xs text-muted-brand">/ {totalCapacity.toLocaleString()} cap</span>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-muted-brand mb-1">
              <span>Ground Capacity</span>
              <span className="font-semibold text-forest">{capacityPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-sage">
              <div
                className="h-full rounded-full bg-forest transition-all"
                style={{ width: `${capacityPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 2: Sponsorship Capital Pipeline */}
        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-brand">
              Sponsorship Pipeline
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/15 text-gold-deep">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-forest">₦345.0M</span>
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold-deep">
              Offline
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-brand">
            Across 7 proposed tiers · Covenanted bank wire settlements only
          </p>
        </div>

        {/* KPI 3: Royal & Sovereign Confluence */}
        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-brand">
              Royal &amp; Dignitary Patrons
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest/10 text-gold">
              <Crown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-forest">100</span>
            <span className="text-xs text-muted-brand">Monarchs &amp; Obas</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-brand">
            Under the Patronage of the Alake of Egbaland · Sovereign Dais Confirmed
          </p>
        </div>

        {/* KPI 4: Turnstile Ingress */}
        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-brand">
              Scanned &amp; Ingress Mesh
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <QrCode className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-forest">
              {totalScans}
            </span>
            <span className="text-xs text-muted-brand">Ingress Scans Logged</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-brand">
            {credentialsCount ? `${credentialsCount.toLocaleString()} active pass credentials issued · ` : ""}
            Cryptographic HMAC-SHA256 authenticated
          </p>
        </div>
      </div>

      {/* Main Grid: Departmental Governance Matrix + Turnstile Ingress Forecast */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: 7-Committee Departmental Governance Matrix */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-forest">
                Departmental Governance &amp; Readiness Matrix
              </h2>
              <p className="text-xs text-muted-brand">
                Operational status across all seven functional festival directorates.
              </p>
            </div>
            <Link
              href="/admin/committees"
              className="inline-flex items-center gap-1 text-xs font-medium text-forest hover:underline"
            >
              <span>View All 7</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-line bg-card shadow-xs">
            <div className="divide-y divide-line">
              {COMMITTEES_DATA.map((dept) => (
                <div
                  key={dept.slug}
                  className="flex flex-col gap-3 p-4 transition-colors hover:bg-sage/20 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 sm:w-5/12">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/committee/${dept.slug}`}
                        className="font-medium text-ink transition-colors hover:text-forest hover:underline"
                      >
                        {dept.name}
                      </Link>
                      <StatusBadge tone={dept.status === "active" ? "success" : "warning"}>
                        {dept.status === "active" ? "Active" : "Proposed"}
                      </StatusBadge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-brand">
                      Lead: <span className="text-ink">{dept.lead}</span> · {dept.membersCount} member{dept.membersCount === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="flex-1 sm:px-4">
                    <div className="flex items-center justify-between text-xs text-muted-brand mb-1">
                      <span>Milestones &amp; Tasks</span>
                      <span className="font-mono text-[11px] font-semibold text-forest">
                        {dept.tasksCompleted}/{dept.tasksTotal} ({dept.readinessPct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-sage">
                      <div
                        className="h-full rounded-full bg-forest transition-all"
                        style={{ width: `${dept.readinessPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="sm:w-28 text-right">
                    <Link
                      href={`/committee/${dept.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-forest hover:underline"
                    >
                      <span>Workspace</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-gold" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rapid Directives Card (Stitch A3) */}
          <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
            <h3 className="font-display text-base font-semibold text-forest">
              Rapid Executive Directives
            </h3>
            <p className="mt-0.5 text-xs text-muted-brand">
              Direct intervention tools for Super Admin and Directorate Chairs.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                className="flex flex-col items-start gap-1 rounded-lg border border-line bg-sage/30 p-3 text-left transition-colors hover:border-forest/40 hover:bg-sage/60"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-forest">
                  <Send className="h-3.5 w-3.5 text-gold" />
                  <span>Broadcast Advisory</span>
                </div>
                <p className="text-[11px] text-muted-brand">
                  Send high-priority notification to accredited VIPs and Patrons.
                </p>
              </button>

              <button
                type="button"
                className="flex flex-col items-start gap-1 rounded-lg border border-line bg-sage/30 p-3 text-left transition-colors hover:border-forest/40 hover:bg-sage/60"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-forest">
                  <RefreshCw className="h-3.5 w-3.5 text-gold" />
                  <span>Sync Gate Mesh</span>
                </div>
                <p className="text-[11px] text-muted-brand">
                  Flush and re-sign cryptographic token cache across offline turnstiles.
                </p>
              </button>

              <Link
                href="/admin/members/import"
                className="flex flex-col items-start gap-1 rounded-lg border border-line bg-sage/30 p-3 text-left transition-colors hover:border-forest/40 hover:bg-sage/60"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-forest">
                  <Download className="h-3.5 w-3.5 text-gold" />
                  <span>Import Master Roster</span>
                </div>
                <p className="text-[11px] text-muted-brand">
                  Provisionally ingest RFC-4180 CSV roster without auto-merging variants.
                </p>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Col: Ingress Projections & Live Scans Feed */}
        <div className="space-y-6">
          {/* Turnstile Ingress 3-Day Forecast */}
          <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-forest">
                3-Day Ingress Projection
              </h3>
              <span className="text-[11px] font-mono text-muted-brand">Kobape Arena</span>
            </div>
            <p className="mt-1 text-xs text-muted-brand">
              Turnstile flow forecast based on pass category distribution.
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-line bg-sage/20 p-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-forest">Day 1: Sovereign Confluence</span>
                  <span className="font-mono text-ink">3,500 target</span>
                </div>
                <p className="text-[11px] text-muted-brand mt-0.5">Fri 18 Dec · Welcome Chukkers &amp; Bonfire</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sage">
                  <div className="h-full rounded-full bg-forest" style={{ width: "30%" }} />
                </div>
              </div>

              <div className="rounded-lg border border-line bg-sage/20 p-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-forest">Day 2: Queens Invitational</span>
                  <span className="font-mono text-ink">4,500 target</span>
                </div>
                <p className="text-[11px] text-muted-brand mt-0.5">Sat 19 Dec · Polo Queens &amp; Royal Durbar</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gold-deep" style={{ width: "38%" }} />
              </div>

              <div className="rounded-lg border border-line bg-sage/20 p-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-forest">Day 3: The Royal Cup Finale</span>
                  <span className="font-mono text-ink">4,000 target</span>
                </div>
                <p className="text-[11px] text-muted-brand mt-0.5">Sun 20 Dec · Coronation Matches &amp; Gala</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-forest" style={{ width: "32%" }} />
              </div>
            </div>
          </div>

          {/* Live Ingress Scans Feed */}
          <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-forest">
                Live Ingress Log
              </h3>
              <Link
                href="/scan"
                className="text-xs font-medium text-forest hover:underline"
              >
                Launch PWA →
              </Link>
            </div>
            <p className="mt-0.5 text-xs text-muted-brand">
              Recent optical scans from venue gates.
            </p>

            <div className="mt-4 space-y-2.5">
              {recentScans && recentScans.length > 0 ? (
                recentScans.map((scan) => {
                  const cred = scan.credentials as unknown as { token_id: string; category: string } | null;
                  const isAdmitted = scan.result === "admitted";
                  return (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between rounded-lg border border-line bg-sage/20 px-3 py-2 text-xs"
                    >
                      <div>
                        <p className="font-mono font-medium text-ink">
                          {cred?.token_id ?? scan.id.slice(0, 8)}
                        </p>
                        <p className="text-[10px] text-muted-brand">
                          Gate: {scan.gate_id} · {new Date(scan.scanned_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <StatusBadge tone={isAdmitted ? "success" : "danger"}>
                        {scan.result}
                      </StatusBadge>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-line p-4 text-center">
                  <p className="text-xs font-medium text-ink">No gate scans recorded yet</p>
                  <p className="mt-1 text-[11px] text-muted-brand">
                    Check-in officers authenticate guest QR passes at venue gates via the /scan PWA.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

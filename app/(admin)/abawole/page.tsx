import Link from "next/link";
import { Suspense } from "react";
import ModelSelector from "@/components/shared/model-selector";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { NotConfigured, PermissionDenied } from "@/components/shared/guards";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import {
  Users,
  Landmark,
  Crown,
  QrCode,
  ChevronRight,
  UserCheck,
  Building,
  CalendarCheck,
  Printer,
  KeyRound,
} from "lucide-react";
import { connection } from "next/server";

export const metadata = {
  title: "Executive Command Centre (/abawole) | 2026 Abeokuta Polo Festival",
  description: "Executive command centre for festival operations, registrations, and gate accreditation.",
};

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
    // Prerender fix: defer the session read to request time. The auth-js
    // session load calls Date.now() for token expiry, which Next rejects as an
    // unstable value while prerendering.
    await connection();

    await requirePermission("roster.read_all");
  } catch (error) {
    if (error instanceof PermissionError) return <PermissionDenied />;
    throw error;
  }

  const supabase = createAdminClient();

  const [
    { count: registrationsCount },
    { count: credentialsCount },
    { count: scansCount },
    { count: pendingApprovals },
    { count: pendingBankVerificationsCount },
    { data: recentScans },
    { data: commitments },
    { data: recentRegistrationsRaw },
  ] = await Promise.all([
    supabase.from("registrations").select("*", { count: "exact", head: true }),
    supabase
      .from("credentials")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("check_in_events").select("*", { count: "exact", head: true }),
    supabase
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_approval"),
    supabase
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending_verification", "pending_bank_verification", "pending_approval"]),
    supabase
      .from("check_in_events")
      .select("id, result, scanned_at, gate, credentials(pass_code, pass_type)")
      .order("scanned_at", { ascending: false })
      .limit(5),
    supabase
      .from("offline_commitments")
      .select("proposed_amount, confirmed_amount, status"),
    supabase
      .from("registrations")
      .select("id, first_name, last_name, category, status, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const recentRegistrations = (recentRegistrationsRaw || []).map((r: any) => {
    const cat = r.category || "";
    const isGuestOf = cat.toLowerCase().includes("guest of");
    const isCorporate = cat.toLowerCase().includes("corporate") || cat.toLowerCase().includes("sponsor");
    let host_name: string | null = null;
    let organization: string | null = null;
    if (isGuestOf) {
      const match = cat.match(/Guest of (.*)/i);
      host_name = match ? match[1] : null;
    }
    if (isCorporate) {
      const match = cat.match(/Corporate.*?\(?(.*?)\)?$/i);
      organization = match ? match[1] : null;
    }
    return {
      ...r,
      affiliation_type: isGuestOf ? "guest_of" : isCorporate ? "corporate" : "individual",
      host_name,
      organization,
    };
  });

  const totalGuests = registrationsCount ?? 0;
  const totalCapacity = 12000;
  const capacityPct = Math.min(100, Math.round((totalGuests / totalCapacity) * 100));
  const proposedTotal = (commitments ?? []).reduce(
    (sum, c) => sum + (c.proposed_amount ?? 0),
    0,
  );
  const confirmedTotal = (commitments ?? []).reduce(
    (sum, c) => sum + (c.confirmed_amount ?? 0),
    0,
  );
  const patronPasses =
    (commitments ?? []).filter((c) => c.status === "bank_wire_confirmed").length ?? 0;
  const pendingBankCount = pendingBankVerificationsCount ?? 0;

  return (
    <div className="space-y-8">
      {/* AI Model Selector — allows admin to switch to zero-cost local model */}
      <div className="flex justify-end">
        <div className="w-72">
          <ModelSelector />
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-forest">
              Live Operations Mesh
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-forest sm:text-3xl">
            Executive Command Centre (/abawole)
          </h1>
          <p className="mt-1 text-sm text-muted-brand">
            Real-time oversight of attendee registrations, guest affiliations, 3-day gate turnstiles, and offline finance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/abawole/registrations"
            className="inline-flex items-center gap-1.5 rounded-lg border border-forest/30 bg-card px-3.5 py-2 text-xs font-semibold text-forest shadow-xs transition-colors hover:bg-sage/40"
          >
            <Users className="h-3.5 w-3.5 text-gold-deep" />
            <span>Manage Participants</span>
          </Link>

          <Link
            href="/scan"
            className="inline-flex items-center gap-1.5 rounded-lg border border-forest/30 bg-card px-3.5 py-2 text-xs font-semibold text-forest shadow-xs transition-colors hover:bg-sage/40"
          >
            <QrCode className="h-3.5 w-3.5 text-gold-deep" />
            <span>Gate Scanner PWA</span>
          </Link>

          <Link
            href="/register/poster"
            className="inline-flex items-center gap-1.5 rounded-lg border border-forest/30 bg-card px-3.5 py-2 text-xs font-semibold text-forest shadow-xs transition-colors hover:bg-sage/40"
          >
            <Printer className="h-3.5 w-3.5 text-gold-deep" />
            <span>Venue QR Poster</span>
          </Link>

          <Link
            href="/abawole/finance"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3.5 py-2 text-xs font-semibold text-ink shadow-xs transition-colors hover:bg-sage/40"
          >
            <Landmark className="h-3.5 w-3.5 text-gold-deep" />
            <span>Offline Finance</span>
          </Link>
        </div>
      </div>

      {/* Prominent Pulsing Alert Banner for Pending Bank Transfer Verifications (Requirement 2) */}
      {pendingBankCount > 0 && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/90 bg-gradient-to-r from-red-950 via-rose-950 to-red-900 p-5 text-white shadow-xl animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="relative flex h-4 w-4 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
              </span>
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-white tracking-wide">
                  🔴 Action Required: {pendingBankCount} Bank Transfer Verification{pendingBankCount > 1 ? "s" : ""} Awaiting Financial Secretary / Secretariat Confirmation
                </h3>
                <p className="text-xs sm:text-sm text-red-200 mt-0.5 leading-relaxed">
                  Attendees have submitted direct Wema Bank wire payments. Turnstile gates will deny admission until an administrator inspects and verifies bank credit.
                </p>
              </div>
            </div>

            <Link
              href="/abawole/registrations?filter=bank_transfers"
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-extrabold text-red-900 shadow-md transition-all hover:bg-red-50 shrink-0"
            >
              Inspect &amp; Approve in 1 Click →
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-brand">
              Guest Registrations
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

        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-brand">
              Sponsorship Pipeline (Offline)
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/15 text-gold-deep">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-forest">
              ₦{(proposedTotal / 1_000_000).toFixed(1)}M
            </span>
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold-deep">
              Offline
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-brand">
            ₦{(confirmedTotal / 1_000_000).toFixed(1)}M confirmed via bank wire or endowment
          </p>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-brand">
              Patrons &amp; Chalets
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest/10 text-gold">
              <Crown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-forest">{patronPasses}</span>
            <span className="text-xs text-muted-brand">wire-confirmed</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-brand">
            Recorded in the offline ledger by the Finance role
          </p>
        </div>

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
              {scansCount ?? 0}
            </span>
            <span className="text-xs text-muted-brand">Ingress Scans Logged</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-brand">
            {(credentialsCount ?? 0) > 0
              ? `${(credentialsCount ?? 0).toLocaleString()} active pass credentials issued · `
              : ""}
            Cryptographic HMAC-SHA256 authenticated
          </p>
        </div>
      </div>

      {(pendingApprovals ?? 0) > 0 ? (
        <Link
          href="/abawole/registrations"
          className="flex items-center justify-between rounded-xl border border-gold/50 bg-gold/10 p-4 transition-colors hover:bg-gold/15"
        >
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-gold-deep" />
            <div>
              <p className="text-sm font-semibold text-forest">
                {(pendingApprovals ?? 0)} VIP / dignitary registration{pendingApprovals === 1 ? "" : "s"} awaiting approval
              </p>
              <p className="text-xs text-muted-brand">
                Review and issue accredited gate access cards from the Participant Management Console.
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-forest" />
        </Link>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Column: Recent Registrations & Affiliations */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-forest">
                Recent Attendee Registrations &amp; Affiliations
              </h2>
              <p className="text-xs text-muted-brand">
                Latest attendees, stated inviting hosts, and corporate delegations.
              </p>
            </div>
            <Link
              href="/abawole/registrations"
              className="inline-flex items-center gap-1 text-xs font-medium text-forest hover:underline"
            >
              <span>View All Participants</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-line bg-card shadow-xs overflow-hidden">
            <div className="divide-y divide-line">
              {recentRegistrations && recentRegistrations.length > 0 ? (
                recentRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="flex flex-col gap-2 p-4 transition-colors hover:bg-sage/20 sm:flex-row sm:items-center sm:justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-forest text-sm block">
                        {reg.first_name} {reg.last_name}
                      </span>
                      <span className="text-[11px] text-muted-brand">
                        Category: <strong>{reg.category}</strong>
                      </span>
                    </div>

                    <div className="sm:text-right">
                      <div className="font-medium text-gold-deep flex items-center gap-1 sm:justify-end">
                        {reg.affiliation_type === "guest_of" ? (
                          <>
                            <UserCheck className="size-3 text-gold-deep" />
                            <span>Guest of: {reg.host_name || "Host Member"}</span>
                          </>
                        ) : reg.affiliation_type === "corporate" ? (
                          <>
                            <Building className="size-3 text-gold-deep" />
                            <span>Corporate: {reg.organization || "Company"}</span>
                          </>
                        ) : (
                          <span className="text-muted-brand">Individual Attendee</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-brand block mt-0.5">
                        {new Date(reg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-muted-brand">
                  No registrations recorded yet. Attendees register at{" "}
                  <Link href="/register" className="font-semibold text-forest underline">
                    /register
                  </Link>.
                </div>
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
            <h3 className="font-display text-base font-semibold text-forest">
              Operations Shortcuts
            </h3>
            <p className="mt-0.5 text-xs text-muted-brand">
              Quick links for Accreditation and Gate Control.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                href="/abawole/registrations"
                className="flex flex-col items-start gap-1 rounded-lg border border-line bg-sage/30 p-3 text-left transition-colors hover:border-forest/40 hover:bg-sage/60"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-forest">
                  <Users className="h-3.5 w-3.5 text-gold-deep" />
                  <span>Participant Management &amp; CSV Download</span>
                </div>
                <p className="text-[11px] text-muted-brand">
                  Search, edit, add, or download registered attendees by category.
                </p>
              </Link>

              <Link
                href="/scan"
                className="flex flex-col items-start gap-1 rounded-lg border border-line bg-sage/30 p-3 text-left transition-colors hover:border-forest/40 hover:bg-sage/60"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-forest">
                  <CalendarCheck className="h-3.5 w-3.5 text-gold-deep" />
                  <span>3-Day Turnstile Gate Scanner</span>
                </div>
                <p className="text-[11px] text-muted-brand">
                  Launch the camera QR scanner to record attendance for Days 1, 2, or 3.
                </p>
              </Link>

              <Link
                href="/register/poster"
                className="flex flex-col items-start gap-1 rounded-lg border border-line bg-sage/30 p-3 text-left transition-colors hover:border-forest/40 hover:bg-sage/60"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-forest">
                  <Printer className="h-3.5 w-3.5 text-gold-deep" />
                  <span>Print Venue Registration QR Poster &amp; Standee</span>
                </div>
                <p className="text-[11px] text-muted-brand">
                  High-res scannable signage for Kobape turnstiles, car parks, and reception stands.
                </p>
              </Link>

              <Link
                href="/abawole/change-password"
                className="flex flex-col items-start gap-1 rounded-lg border border-line bg-sage/30 p-3 text-left transition-colors hover:border-forest/40 hover:bg-sage/60"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-forest">
                  <KeyRound className="h-3.5 w-3.5 text-gold-deep" />
                  <span>Security &amp; Password Rotation</span>
                </div>
                <p className="text-[11px] text-muted-brand">
                  Self-service credential updates for Super Admin, President, Secretary, and Marshals.
                </p>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Live Turnstile Ingress Log */}
        <div className="space-y-6">
          <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-forest">
                Live Gate Ingress Log
              </h3>
              <Link
                href="/scan"
                className="text-xs font-medium text-forest hover:underline"
              >
                Launch PWA →
              </Link>
            </div>
            <p className="mt-0.5 text-xs text-muted-brand">
              Recent optical scans from venue gates across Days 1–3.
            </p>

            <div className="mt-4 space-y-2.5">
              {recentScans && recentScans.length > 0 ? (
                recentScans.map((scan) => {
                  const cred = scan.credentials as unknown as {
                    pass_code?: string;
                    pass_type?: string;
                  } | null;
                  const isAdmitted = scan.result === "admitted";
                  return (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between rounded-lg border border-line bg-sage/20 px-3 py-2 text-xs"
                    >
                      <div>
                        <p className="font-mono font-medium text-ink">
                          {cred?.pass_code ?? `event-${scan.id}`}
                        </p>
                        <p className="text-[10px] text-muted-brand">
                          Gate: {scan.gate} ·{" "}
                          {new Date(scan.scanned_at).toLocaleTimeString()}
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

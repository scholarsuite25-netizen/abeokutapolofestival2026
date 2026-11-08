import Link from "next/link";
import { Suspense } from "react";
import { QrCode, ShieldCheck, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/require";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { NotConfigured } from "@/components/shared/guards";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/shared/page-skeleton";

export const metadata = {
  title: "Guest Pass Dashboard — 2026 Abeokuta Polo Festival",
  description:
    "Personalized attendee dashboard, digital QR credentials, and festival itinerary.",
};

export default function GuestDashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  // requireUser redirects signed-out visitors to /sign-in (page-level guard).
  const session = await requireUser();

  if (!isSupabaseConfigured()) return <NotConfigured />;

  const supabase = await createClient();

  const [{ data: registration }, { data: credentials }] = await Promise.all([
    supabase
      .from("registrations")
      .select("id, status, category, group_size, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("credentials")
      .select(
        "id, pass_code, pass_type, zone_access, status, holder_name, first_checked_in_at, registrations(status)",
      )
      .eq("registrations.user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const reg = registration as
    | { id: string; status: string; category: string; group_size: number; created_at: string }
    | null;
  const cred = credentials as
    | {
        id: string;
        pass_code: string;
        pass_type: string;
        zone_access: string[];
        status: string;
        holder_name: string;
        first_checked_in_at: string | null;
        registrations: { status: string } | null;
      }
    | null;

  const hasActivePass = cred?.status === "active";
  const pending = reg?.status === "pending_approval";
  const declined = reg?.status === "declined";

  const isExecutive = session.actor.roles.some((r) =>
    ["super_admin", "president", "general_secretary", "finance_officer", "accreditation_officer"].includes(r)
  );
  const isGateMarshal = session.actor.roles.includes("security_checkin_officer");

  return (
    <div className="flex w-full flex-col bg-ivory text-ink py-10 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
        {isExecutive ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border-2 border-gold/40 bg-forest p-4 text-ivory shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-gold border border-gold/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-ivory">Executive Officer Clearance Active</h2>
                <p className="text-xs text-ivory/80">
                  You are signed in as <span className="font-semibold text-gold">{session.actor.roles.join(", ")}</span>. You have privileged access to the Festival Command Centre.
                </p>
              </div>
            </div>
            <Button asChild className="bg-gold font-bold text-forest-deep hover:bg-gold/90 shrink-0">
              <Link href="/abawole">
                Command Centre (/abawole) &rarr;
              </Link>
            </Button>
          </div>
        ) : isGateMarshal ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-forest/30 bg-forest p-4 text-ivory shadow-md">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              <div>
                <h2 className="font-display font-semibold text-ivory">Security & Gate Marshal Clearance Active</h2>
                <p className="text-xs text-ivory/80">Launch the Turnstile Scanner PWA for gate pass validation.</p>
              </div>
            </div>
            <Button asChild className="bg-emerald-500 font-bold text-white hover:bg-emerald-600 shrink-0">
              <Link href="/scan">
                Open Scanner (/scan) &rarr;
              </Link>
            </Button>
          </div>
        ) : null}

        <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge tone={hasActivePass ? "success" : pending ? "warning" : "neutral"}>
                {hasActivePass
                  ? "Pass Active"
                  : pending
                    ? "Under Review"
                    : declined
                      ? "Declined"
                      : "No Registration"}
              </StatusBadge>
            </div>
            <h1 className="mt-2 font-display text-3xl font-semibold text-forest sm:text-4xl">
              Guest Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-brand">
              {session.user.email ?? "Signed-in guest"} · Abeokuta Polo Club Grounds · 18–20
              December 2026
            </p>
          </div>

          {hasActivePass ? (
            <Button asChild className="bg-gold font-semibold text-forest-deep hover:bg-gold/90">
              <Link href="/dashboard/pass">
                <QrCode className="mr-2 size-4" /> View Digital Pass
              </Link>
            </Button>
          ) : (
            <Button asChild className="bg-gold font-semibold text-forest-deep hover:bg-gold/90">
              <Link href="/register">
                <ArrowRight className="mr-2 size-4" /> Register for Free Pass
              </Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">
              Accreditation
            </span>
            <h2 className="mt-2 font-display text-xl font-semibold text-forest">
              {hasActivePass
                ? "Digital Pass Active"
                : pending
                  ? "Under Secretariat Review"
                  : declined
                    ? "Registration Declined"
                    : "Not Yet Registered"}
            </h2>
            <p className="mt-2 text-xs text-muted-brand leading-relaxed">
              {hasActivePass
                ? `Your ${cred?.pass_type ?? "guest"} pass is valid for all three tournament days.`
                : pending
                  ? "The accreditation secretariat is reviewing your registration. Your pass will be issued by email once approved."
                  : declined
                    ? "Your registration was not approved. Contact the Secretariat via the official channels for assistance."
                    : "Register for your free digital QR pass — required for gate entry."}
            </p>
            {hasActivePass ? (
              <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Ready for Gate Scanning
                </span>
                <Link href="/dashboard/pass" className="font-semibold text-forest hover:text-gold">
                  Open Pass →
                </Link>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">
              Tournament Countdown
            </span>
            <h2 className="mt-2 font-display text-xl font-semibold text-forest">
              18–20 December 2026
            </h2>
            <p className="mt-2 text-xs text-muted-brand leading-relaxed">
              Gates open daily at 10:00 AM on the Kobape grounds along the Abeokuta-Sagamu
              Expressway.
            </p>
            {reg?.category ? (
              <div className="mt-6 pt-4 border-t text-xs">
                <p className="text-muted-brand">
                  Category: <span className="font-medium text-ink">{reg.category}</span>
                  {reg.group_size > 1 ? ` · ${reg.group_size} guests` : ""}
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">
              Policy Notice
            </span>
            <h2 className="mt-2 font-display text-xl font-semibold text-forest">
              Free Public Entry
            </h2>
            <p className="mt-2 text-xs text-muted-brand leading-relaxed">
              No tickets or payments are required or accepted. Show your QR badge at Gate 2 or
              Gate 3 with valid photo identification.
            </p>
            <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs">
              <span className="text-forest font-semibold">Free Credential</span>
              <Link href="/faq" className="font-semibold text-forest hover:text-gold">
                Entry Rules →
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gold/40 bg-forest p-8 text-ivory shadow-xl sm:p-10">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-4">
              <Badge
                variant="outline"
                className="border-gold bg-gold/15 text-gold text-xs uppercase tracking-widest"
              >
                Official Credential Wallet
              </Badge>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                {hasActivePass ? "Your Pass Is Ready" : "Get Your Free Tournament Pass"}
              </h2>
              <p className="text-sm text-ivory/80 leading-relaxed max-w-xl">
                {hasActivePass
                  ? "Present your digital pass on your mobile device upon arrival at the security turnstiles. A print copy saved to your device works too."
                  : "Register once and your accredited digital QR pass is issued to your email after Secretariat approval. Bring valid photo ID to the gate."}
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                {hasActivePass ? (
                  <Button asChild className="bg-gold font-semibold text-forest-deep hover:bg-gold/90">
                    <Link href="/dashboard/pass">Open Full Screen Pass</Link>
                  </Button>
                ) : (
                  <Button asChild className="bg-gold font-semibold text-forest-deep hover:bg-gold/90">
                    <Link href="/register">Register Free</Link>
                  </Button>
                )}
                <Button asChild variant="outline" className="border-ivory/30 text-ivory hover:bg-ivory/10">
                  <Link href="/programme">View 3-Day Programme</Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-ivory p-6 text-forest shadow-md w-full max-w-xs">
                <QrCode className="size-32 text-forest" />
                <p className="mt-3 font-mono text-xs font-bold uppercase tracking-widest text-forest">
                  {hasActivePass ? cred?.pass_code : "ABK-2026-PASS"}
                </p>
                <span className="mt-1 text-[11px] text-muted-brand">
                  {hasActivePass ? "Scan at Gate 1, 2 or 3" : "Issued after approval"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

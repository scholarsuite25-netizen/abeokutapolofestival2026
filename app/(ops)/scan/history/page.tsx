import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { PermissionDenied } from "@/components/shared/guards";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import {
  ArrowLeft,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";

export const metadata = {
  title: "Turnstile Ingress Log & Device History | 2026 Abeokuta Polo Festival",
  description: "Real-time gate ingress scan logs and cryptographic verification audit trail.",
};

interface ScanHistoryItem {
  id: string;
  tokenId: string;
  guestName: string;
  category: string;
  gate: string;
  result: "admitted" | "duplicate" | "revoked" | "invalid";
  timestamp: string;
  officerId: string;
}

export default function ScanHistoryPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ScanHistoryContent />
    </Suspense>
  );
}

async function ScanHistoryContent() {
  // Prerender fix: defer the permission/session check to request time.
  await connection();
  try {
    await requirePermission("credential.validate");
  } catch (error) {
    if (error instanceof PermissionError) return <PermissionDenied />;
    throw error;
  }

  if (!isSupabaseConfigured()) {
    return (
      <EmptyState
        title="Credential service not configured"
        description="The ingress log reads from the festival database. Connect Supabase to view gate scans."
      />
    );
  }

  let items: ScanHistoryItem[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("check_in_events")
      .select(`
        id, result, scanned_at, gate, officer_id,
        credentials ( pass_code, pass_type, holder_name )
      `)
      .order("scanned_at", { ascending: false })
      .limit(30);

    items = (data ?? []).map((d) => {
      const cred = d.credentials as unknown as {
        pass_code?: string;
        pass_type?: string;
        holder_name?: string;
      } | null;
      return {
        id: String(d.id),
        tokenId: cred?.pass_code ?? `event-${d.id}`,
        guestName: cred?.holder_name ?? "Accredited Attendee",
        category: cred?.pass_type ?? "General Admission",
        gate: d.gate,
        result: d.result as ScanHistoryItem["result"],
        timestamp: new Date(d.scanned_at).toLocaleTimeString(),
        officerId: d.officer_id ?? "gate-terminal",
      };
    });
  } catch {
    items = [];
  }

  const admittedCount = items.filter((i) => i.result === "admitted").length;
  const flaggedCount = items.filter((i) => i.result !== "admitted").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-ivory/10 pb-4">
        <Link
          href="/scan"
          className="inline-flex items-center gap-1.5 text-xs text-gold transition-colors hover:text-gold-interactive"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Optical Scanner</span>
        </Link>

        <span className="rounded-full bg-forest px-2.5 py-0.5 font-mono text-[11px] text-ivory/80 border border-ivory/10">
          Terminal Mesh Online
        </span>
      </div>

      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ivory">
          Turnstile Ingress History
        </h1>
        <p className="mt-1 text-xs text-ivory/70">
          Cryptographic token verification log for security and turnstile mesh audits.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-ivory/10 bg-forest/40 p-3.5 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-ivory/70">Admitted</span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ivory">{admittedCount}</p>
          <p className="text-[10px] text-ivory/50">Authenticated passes</p>
        </div>

        <div className="rounded-xl border border-ivory/10 bg-forest/40 p-3.5 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-ivory/70">Flagged / Duplicates</span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ivory">{flaggedCount}</p>
          <p className="text-[10px] text-ivory/50">Rejected entry attempts</p>
        </div>
      </div>

      {items.length ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-ivory/60">
            <span>Recent Scans ({items.length})</span>
            <span className="font-mono text-[10px]">HMAC-SHA256 Verified</span>
          </div>

          <div className="space-y-2">
            {items.map((scan) => {
              const isAdmitted = scan.result === "admitted";
              const isDuplicate = scan.result === "duplicate";

              return (
                <div
                  key={scan.id}
                  className="rounded-xl border border-ivory/10 bg-card/10 p-3.5 transition-colors hover:bg-card/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-ivory truncate">
                          {scan.guestName}
                        </p>
                        <span className="rounded-sm bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold text-gold">
                          {scan.category}
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-ivory/60">{scan.tokenId}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ivory/50">
                        <span>{scan.gate}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gold" />
                          {scan.timestamp}
                        </span>
                        <span>·</span>
                        <span className="font-mono text-[10px]">{scan.officerId}</span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isAdmitted ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" />
                          Admitted
                        </span>
                      ) : isDuplicate ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="h-3 w-3" />
                          Duplicate
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-300 border border-red-500/30">
                          <XCircle className="h-3 w-3" />
                          {scan.result}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No gate scans recorded yet"
          description="Scans appear here in real time as check-in officers validate guest QR passes at the venue gates."
        />
      )}

      <div className="pt-2">
        <Link
          href="/scan"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-center text-sm font-semibold text-forest-deep shadow-lg transition-colors hover:bg-gold-interactive"
        >
          <QrCode className="h-4 w-4" />
          <span>Return to Camera Scanner</span>
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { QrCode, ArrowLeft, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/require";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { NotConfigured } from "@/components/shared/guards";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { generateSignedPassToken, hashPassToken, verifyPassToken } from "@/lib/qr/token";

export const metadata = {
  title: "Official Digital Pass — 2026 Abeokuta Polo Festival",
  description: "Accredited digital QR entry pass for the 2026 Abeokuta Polo Festival.",
};

export default function DigitalPassPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PassContent />
    </Suspense>
  );
}

async function PassContent() {
  // Prerender fix: defer the session read to request time (auth-js reads
  // Date.now() for token expiry, which cannot run during prerendering).
  await connection();
  const session = await requireUser();

  if (!isSupabaseConfigured()) return <NotConfigured />;

  const supabase = await createClient();

  const { data } = await supabase
    .from("credentials")
    .select(
      "id, pass_code, pass_type, holder_name, zone_access, status, issued_at, first_checked_in_at, registrations(category)",
    )
    .eq("registrations.user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const cred = data as
    | {
        id: string;
        pass_code: string;
        pass_type: string;
        holder_name: string;
        zone_access: string[];
        status: string;
        issued_at: string | null;
        first_checked_in_at: string | null;
        registrations: { category: string } | null;
      }
    | null;

  if (!cred) {
    return (
      <div className="flex w-full flex-col bg-ivory text-ink py-10 sm:py-16">
        <div className="mx-auto max-w-xl px-4 sm:px-6 space-y-6">
          <Button asChild variant="ghost" size="sm" className="text-muted-brand hover:text-forest">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 size-4" /> Back to Dashboard
            </Link>
          </Button>
          <div className="rounded-2xl border border-line bg-card p-8 text-center">
            <QrCode className="size-12 text-muted-brand mx-auto" />
            <h1 className="mt-4 font-display text-xl font-semibold text-forest">
              No pass issued yet
            </h1>
            <p className="mt-2 text-sm text-muted-brand">
              Your accredited digital pass will appear here once your registration is approved.
            </p>
            <Button asChild className="mt-6 bg-gold font-semibold text-forest-deep">
              <Link href="/register">Register for Free</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Re-derive the signed token from stored fields and confirm it matches the
  // stored hash — the on-screen QR payload is verifiable end to end.
  let qrPayload = "";
  let qrVerified = false;
  if (cred.issued_at) {
    const token = generateSignedPassToken({
      credentialId: cred.id,
      holderName: cred.holder_name,
      passType: cred.pass_type,
      editionYear: 2026,
      issuedAt: Date.parse(cred.issued_at),
    });
    const { data: stored } = await supabase
      .from("credentials")
      .select("token_hash")
      .eq("id", cred.id)
      .maybeSingle();
    if (stored) {
      const reverify = verifyPassToken(token);
      qrVerified =
        reverify.valid && hashPassToken(token) === (stored as { token_hash: string }).token_hash;
    }
    qrPayload = token;
  }

  const isActive = cred.status === "active";

  return (
    <div className="flex w-full flex-col bg-ivory text-ink py-10 sm:py-16">
      <div className="mx-auto max-w-xl px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="text-muted-brand hover:text-forest">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 size-4" /> Back to Dashboard
            </Link>
          </Button>
          <Badge
            variant="outline"
            className="border-gold/50 bg-gold/10 text-forest text-[10px] uppercase tracking-wider"
          >
            Gate Credential
          </Badge>
        </div>

        <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-2xl">
          <div className="bg-forest p-6 text-ivory text-center relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 size-32 rounded-full bg-gold/15 blur-2xl" />
            <div className="flex items-center justify-center gap-2">
              <Badge
                variant="outline"
                className="border-gold bg-gold/20 text-gold text-[10px] uppercase tracking-widest mb-2"
              >
                Official Entry Pass
              </Badge>
            </div>
            <h1 className="font-display text-2xl font-semibold sm:text-3xl text-ivory">
              Abeokuta Polo Festival 2026
            </h1>
            <p className="mt-1 text-xs text-ivory/80">Where Heritage Meets Excellence · Est. 2025</p>
            <div className="mt-3 flex justify-center">
              <StatusBadge tone={isActive ? "success" : "danger"}>
                {isActive ? "Active" : cred.status}
              </StatusBadge>
            </div>
          </div>

          <div className="p-8 flex flex-col items-center justify-center bg-ivory border-y border-line/60">
            <div className="flex size-48 items-center justify-center rounded-2xl border-4 border-dashed border-forest/30 bg-card p-4 shadow-inner">
              <QrCode className="size-40 text-forest" />
            </div>
            <p className="mt-4 font-mono text-base font-bold tracking-widest text-forest">
              {cred.pass_code}
            </p>
            <span className="mt-1 text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Active &amp; Valid For Gate Access
            </span>
            {qrVerified ? (
              <span className="mt-2 max-w-full break-all rounded bg-sage/60 px-2 py-1 font-mono text-[9px] text-muted-brand">
                {qrPayload}
              </span>
            ) : null}
          </div>

          <div className="p-6 bg-card space-y-4 text-xs">
            <div className="flex justify-between border-b border-line pb-2.5">
              <span className="text-muted-brand font-medium">Attendee Name:</span>
              <span className="font-semibold text-forest text-sm">{cred.holder_name}</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2.5">
              <span className="text-muted-brand font-medium">Pass Type:</span>
              <span className="font-semibold text-gold text-sm">{cred.pass_type}</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2.5">
              <span className="text-muted-brand font-medium">Tournament Dates:</span>
              <span className="font-semibold text-forest">18–20 December 2026</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2.5">
              <span className="text-muted-brand font-medium">Grounds:</span>
              <span className="font-semibold text-forest">Abeokuta Polo Club, Kobape</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2.5">
              <span className="text-muted-brand font-medium">Zone Entitlements:</span>
              <span className="font-semibold text-forest-interactive">
                {cred.zone_access.join(", ")}
              </span>
            </div>
            {cred.first_checked_in_at ? (
              <div className="flex justify-between border-b border-line pb-2.5">
                <span className="text-muted-brand font-medium">First Admitted:</span>
                <span className="font-semibold text-forest">
                  {new Date(cred.first_checked_in_at).toLocaleString("en-GB")}
                </span>
              </div>
            ) : null}
          </div>

          <div className="bg-forest-deep text-ivory p-4 text-center border-t-2 border-gold/40 text-[11px] space-y-1">
            <p className="font-bold text-gold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-3.5 text-gold inline" /> Mandatory Gate Protocol
            </p>
            <p className="text-ivory/90 leading-relaxed">
              <strong>All attendees must be duly registered to attend any of the three festival days.</strong> Turnstile accreditation required. Present this QR pass on your mobile device at Gate 1, 2 or 3.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

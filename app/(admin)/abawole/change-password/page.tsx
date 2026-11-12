import { Suspense } from "react";
import Link from "next/link";
import { KeyRound, ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { requireUser } from "@/lib/auth/require";
import { isSupabaseConfigured } from "@/lib/env";
import { NotConfigured } from "@/components/shared/guards";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { connection } from "next/server";

export const metadata = {
  title: "Change Account Password | 2026 Abeokuta Polo Festival",
  description: "Securely update your executive or staff account password.",
};

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ChangePasswordContent />
    </Suspense>
  );
}

async function ChangePasswordContent() {
  if (!isSupabaseConfigured()) return <NotConfigured />;

  // Requires valid authenticated session (Super Admin, President, General Secretary, Gate Marshal, etc.)
  // Prerender fix: defer the session read to request time. The auth-js
  // session load calls Date.now() for token expiry, which Next rejects as an
  // unstable value while prerendering.
  await connection();

  const session = await requireUser("/abawole/change-password");

  const primaryRole = session.actor.roles[0] ?? "staff";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/abawole"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-brand hover:text-forest transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Operations Console</span>
        </Link>
        <span className="text-[11px] font-mono text-muted-brand">
          Console Security v2026
        </span>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest/10 text-forest">
            <KeyRound className="h-6 w-6 text-gold-deep" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-forest sm:text-2xl">
              Change Password
            </h1>
            <p className="mt-1 text-xs text-muted-brand leading-relaxed">
              Update your security credentials. Your new password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.
            </p>
          </div>
        </div>

        <ChangePasswordForm
          userEmail={session.user.email ?? ""}
          userRole={primaryRole}
        />
      </div>

      {/* Security Best Practices Card */}
      <div className="rounded-xl border border-line bg-sage/30 p-4 text-xs text-muted-brand space-y-2">
        <div className="flex items-center gap-2 font-semibold text-forest">
          <Lock className="h-3.5 w-3.5 text-gold-deep" />
          <span>Security Recommendations</span>
        </div>
        <p className="leading-relaxed">
          Never share administrative or gate check-in passphrases over unencrypted messaging. Each committee member and gate marshal should maintain a unique passphrase.
        </p>
      </div>
    </div>
  );
}

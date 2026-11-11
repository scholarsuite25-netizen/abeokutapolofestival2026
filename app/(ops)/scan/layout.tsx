import { Suspense } from "react";
import { connection } from "next/server";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { PermissionDenied } from "@/components/shared/guards";

async function GateGuard({ children }: { children: React.ReactNode }) {
  // Prerender fix: defer the session/permission check to request time so the
  // auth-js session load never runs during static prerendering (it reads
  // Date.now() for token expiry, which Next blocks with an unstable-value
  // error and a multi-minute streamed shell).
  await connection();
  try {
    await requirePermission("credential.validate");
  } catch (error) {
    if (error instanceof PermissionError) return <PermissionDenied />;
    throw error;
  }
  return <>{children}</>;
}

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-forest-deep">
      <Suspense
        fallback={
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="h-64 animate-pulse rounded-xl bg-ivory/10" />
          </div>
        }
      >
        <GateGuard>
          <div className="mx-auto max-w-4xl px-4 py-8 text-ivory">{children}</div>
        </GateGuard>
      </Suspense>
    </div>
  );
}

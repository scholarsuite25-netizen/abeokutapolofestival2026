import Link from "next/link";
import {
  ShieldCheck,
  LayoutDashboard,
  Users2,
  Landmark,
  QrCode,
  FileSpreadsheet,
  ExternalLink,
  Printer,
  UserCog,
  BadgeCheck,
  KeyRound,
  ArrowLeft,
  Ticket
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminTopBadge } from "@/components/admin/admin-top-badge";
import { requireUser } from "@/lib/auth/require";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isFeatureEnabled } from "@/lib/config/feature-flags";

/**
 * Review finding M4: the console shell now enforces its own guard instead of
 * relying solely on per-page `requirePermission` calls. Signed-out visitors
 * are sent to sign-in; authenticated non-console roles (public/guest) are sent
 * to their own dashboard. Fine-grained permissions remain enforced per page.
 *
 * Rendering note (Next 16 Cache Components): `requireUser` reads cookies via
 * the session, and a session read outside `<Suspense>` is a BUILD ERROR — a
 * layout cannot wrap itself in a boundary. Per the docs' `[block]` fix
 * (`authentication-with-cache-components.md` / `blocking-prerender-dynamic`),
 * `instant = false` lets this segment keep blocking on the server: every
 * /abawole/* route renders at request time instead of being prerendered with
 * an unstable session value. The admin console has no meaningful static shell
 * (it is fully authenticated), so nothing is lost.
 */
export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Prerender fix: stop prerendering before the session is read. The auth-js
  // session load calls `Date.now()` for token expiry, which Next rejects as an
  // unstable value during (on-demand) prerendering. `connection()` defers the
  // whole /abawole/* subtree to request time, so the session is only ever read
  // while serving a real request.
  await connection();

  const session = await requireUser("/abawole");

  // Optional two-factor gate for the console. It is OFF by default so no one
  // is locked out before enrolling; switch on the administrator-controlled
  // "mfa_required_for_console" flag once every staff member has enrolled a
  // second factor.
  if (await isFeatureEnabled("mfa_required_for_console", false)) {
    const assurance = (session.user as { aal?: string }).aal;
    if (assurance !== "aal2") {
      redirect("/mfa-setup");
    }
  }
  const isConsoleRole = session.actor.roles.some(
    (role) => role !== "public" && role !== "guest",
  );
  if (!isConsoleRole) {
    redirect("/dashboard");
  }

  const navItems = [
    { label: "Command Centre", href: "/abawole", icon: LayoutDashboard },
    { label: "Participants", href: "/abawole/registrations", icon: Users2 },
    { label: "Offline Finance", href: "/abawole/finance", icon: Landmark },
    { label: "Verification Queue", href: "/abawole/members", icon: BadgeCheck },
    { label: "VIP Invitations", href: "/abawole/invitations", icon: Ticket },
    { label: "Reports & Export", href: "/abawole/reports", icon: FileSpreadsheet },
    { label: "Admin Hierarchy", href: "/abawole/admins", icon: UserCog },
    { label: "Change Password", href: "/abawole/change-password", icon: KeyRound },
    { label: "Turnstile Scanner", href: "/scan", icon: QrCode },
    { label: "Venue QR Poster", href: "/register/poster", icon: Printer },
  ];

  return (
    <div className="min-h-screen bg-sage/30 text-ink flex flex-col">
      {/* Top Banner: Clearance & Security */}
      <div className="border-b border-forest/30 bg-forest text-ivory shadow-sm">
        <div className="mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 sm:px-6 max-w-7xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/40 shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <AdminTopBadge />
          </div>

          {/* Action Controls: Back to Site, Change Password, and Log Out */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto pt-1 md:pt-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ivory/20 bg-ivory/10 px-3 py-1.5 text-xs font-semibold text-ivory transition-colors hover:bg-gold hover:text-black shadow-xs"
              title="Return to the public festival website"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Site</span>
            </Link>

            <Link
              href="/abawole/change-password"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ivory/20 bg-ivory/10 px-3 py-1.5 text-xs font-semibold text-ivory transition-colors hover:bg-gold hover:text-black shadow-xs"
              title="Change Account Password"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Password</span>
            </Link>

            <SignOutButton
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-600/90 hover:bg-red-600 text-white px-3 py-1.5 text-xs font-semibold shadow-xs cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Primary Sub-navigation Bar */}
      <div className="border-b border-line bg-card shadow-xs sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6">
          <nav className="flex items-center gap-1.5 text-xs overflow-x-auto py-1 w-full sm:w-auto scrollbar-thin">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-muted-brand transition-colors hover:bg-sage/50 hover:text-forest shrink-0 whitespace-nowrap border border-transparent hover:border-line/60"
                >
                  <Icon className="h-3.5 w-3.5 text-gold-deep" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 text-xs lg:flex shrink-0 ml-4">
            <span className="rounded-md border border-line bg-sage/40 px-2.5 py-1 font-mono text-[11px] text-muted-brand whitespace-nowrap">
              Edition: 2026-ABK-01
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-line bg-card py-6 text-xs text-muted-brand">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <p>© 2026 Abeokuta Polo Club. Authorized Executive Personnel Only.</p>
          <div className="flex items-center gap-4">
            <Link href="/abawole/registrations" className="transition-colors hover:text-forest">
              Participant Registry
            </Link>
            <span>·</span>
            <Link href="/abawole/admins" className="transition-colors hover:text-forest">
              Admin Console
            </Link>
            <span>·</span>
            <Link href="/abawole/change-password" className="transition-colors hover:text-forest">
              Change Password
            </Link>
            <span>·</span>
            <Link href="/scan" className="transition-colors hover:text-forest">
              Gate Ingress PWA
            </Link>
            <span>·</span>
            <Link href="/" className="transition-colors hover:text-forest">
              Public Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

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
  ArrowLeft
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminTopBadge } from "@/components/admin/admin-top-badge";

export default function AdminLayout({ children }: { children: React.ReactNode }) {

  const navItems = [
    { label: "Command Centre", href: "/abawole", icon: LayoutDashboard },
    { label: "Participants", href: "/abawole/registrations", icon: Users2 },
    { label: "Offline Finance", href: "/abawole/finance", icon: Landmark },
    { label: "Verification Queue", href: "/abawole/members", icon: BadgeCheck },
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

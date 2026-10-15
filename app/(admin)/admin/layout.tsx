import Link from "next/link";
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Users2, 
  FolderKanban, 
  Landmark, 
  QrCode, 
  FileSpreadsheet,
  ExternalLink
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { label: "Command Centre", href: "/admin", icon: LayoutDashboard },
    { label: "Committees (7)", href: "/admin/committees", icon: FolderKanban },
    { label: "Member Roster", href: "/admin/members", icon: Users2 },
    { label: "Offline Finance", href: "/admin/finance", icon: Landmark },
    { label: "Reports & Export", href: "/admin/reports", icon: FileSpreadsheet },
    { label: "Turnstile Scanner", href: "/scan", icon: QrCode },
  ];

  return (
    <div className="min-h-screen bg-sage/30 text-ink">
      {/* Top Banner: Clearance & Security */}
      <div className="border-b border-forest/20 bg-forest text-ivory">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/20 text-gold border border-gold/30">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold tracking-wide text-ivory">
                Abeokuta Polo Festival 1928 · Operations Console
              </p>
              <div className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] tracking-wider uppercase text-ivory/70">
                  Level 4 Royal Clearance · Live Security Mesh
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-ivory/80 transition-colors hover:text-gold"
            >
              <span>Public Showcase</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Sub-navigation Bar */}
      <div className="border-b border-line bg-card shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between overflow-x-auto px-4 py-2 sm:px-6">
          <nav className="flex items-center gap-1 text-xs sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-muted-brand transition-colors hover:bg-sage/50 hover:text-forest"
                >
                  <Icon className="h-3.5 w-3.5 text-gold" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 text-xs sm:flex">
            <span className="rounded-md border border-line bg-sage/40 px-2.5 py-1 font-mono text-[11px] text-muted-brand">
              Festival Edition: 2026-ABK-01
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
            <Link href="/committee" className="transition-colors hover:text-forest">
              Committee Workspaces
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

import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sage/50">
      <header className="border-b border-line bg-forest text-ivory">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <p className="font-display text-base font-semibold">
            Festival Operations Console
          </p>
          <p className="text-xs text-ivory/60">
            Restricted — Super Admin &amp; granted roles only
          </p>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-10">{children}</div>
      <footer className="mx-auto max-w-7xl px-4 pb-10 text-xs text-muted-brand">
        <Link href="/" className="underline-offset-4 hover:text-forest hover:underline">
          ← Back to the public site
        </Link>
      </footer>
    </div>
  );
}

import Link from "next/link";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-line bg-ivory">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <p className="font-display text-base font-semibold text-forest">
            Guest dashboard
          </p>
          <Link
            href="/"
            className="text-sm font-medium text-muted-brand underline-offset-4 hover:text-forest hover:underline"
          >
            Festival site
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-10">{children}</div>
    </div>
  );
}

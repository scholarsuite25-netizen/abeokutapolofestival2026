export default function CommitteeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-line bg-ivory">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <p className="font-display text-base font-semibold text-forest">
            Committee workspace
          </p>
          <span className="rounded border border-warning/40 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
            Responsibilities proposed — pending approval
          </span>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-10">{children}</div>
    </div>
  );
}

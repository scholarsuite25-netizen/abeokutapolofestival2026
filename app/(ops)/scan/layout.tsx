export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-forest-deep">
      <div className="mx-auto max-w-4xl px-4 py-8 text-ivory">{children}</div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sage px-4 py-16">
      <div className="w-full max-w-md">
        <p className="mb-8 text-center font-display text-2xl font-semibold text-forest">
          2026 Abeokuta Polo Festival
        </p>
        {children}
      </div>
    </div>
  );
}

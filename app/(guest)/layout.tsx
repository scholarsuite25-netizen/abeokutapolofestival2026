import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-line bg-ivory shadow-xs">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-brand hover:text-forest transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Festival Site</span>
            </Link>
            <span className="text-line">|</span>
            <p className="font-display text-base font-semibold text-forest">
              Guest Dashboard
            </p>
          </div>

          <div className="flex items-center gap-2">
            <SignOutButton
              className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-700 px-2.5 py-1 text-xs font-semibold"
            />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-10">{children}</div>
    </div>
  );
}

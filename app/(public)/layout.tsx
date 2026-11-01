import { PublicFooter } from "@/components/design/public/public-footer";
import { PublicHeader } from "@/components/design/public/public-header";
import { PersistentPassBanner } from "@/components/shared/persistent-pass-banner";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PersistentPassBanner />
      <PublicHeader />
      <div className="flex-1">{children}</div>
      <PublicFooter />
    </div>
  );
}

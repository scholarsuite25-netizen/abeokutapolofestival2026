import { PublicFooter } from "@/components/design/public/public-footer";
import { PublicHeader } from "@/components/design/public/public-header";
import { PersistentPassBanner } from "@/components/shared/persistent-pass-banner";
import { PermanentPassDock } from "@/components/shared/permanent-pass-dock";
import { PWAInstallPrompt } from "@/components/shared/pwa-install-prompt";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PersistentPassBanner />
      <PublicHeader />
      <div className="flex-1">{children}</div>
      <PublicFooter />
      <PermanentPassDock />
      <PWAInstallPrompt />
    </div>
  );
}

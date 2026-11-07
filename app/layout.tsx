import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const viewport = {
  themeColor: "#002F1A",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "2026 Abeokuta Polo Festival — The Blueprint",
    template: "%s · 2026 Abeokuta Polo Festival",
  },
  description:
    "Official information and management platform for the 2026 Abeokuta Polo Festival. Attendance is free; entry requires prior registration and an accredited credential.",
  applicationName: "Abeokuta Polo Festival 2026",
  keywords: ["Abeokuta", "Polo", "Festival", "2026", "Royal Cup", "Abeokuta Polo Club"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${manrope.variable} h-full antialiased overflow-x-clip`}
    >
      <body className="min-h-full flex flex-col font-sans font-semibold overflow-x-clip w-full max-w-full">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <TooltipProvider delayDuration={200}>
          <main id="main" className="flex flex-1 flex-col overflow-x-clip w-full max-w-full min-w-0">
            {children}
          </main>
        </TooltipProvider>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}

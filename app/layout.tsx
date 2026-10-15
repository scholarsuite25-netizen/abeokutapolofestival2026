import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <TooltipProvider delayDuration={200}>
          <main id="main" className="flex flex-1 flex-col">
            {children}
          </main>
        </TooltipProvider>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}

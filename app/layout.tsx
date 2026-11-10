import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StructuredData } from "@/components/shared/structured-data";
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

const defaultOrigin =
  process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "https://www.abeokutapolofestival2026.org.ng";

export const metadata: Metadata = {
  metadataBase: new URL(defaultOrigin),
  title: {
    default: "2026 Abeokuta Polo Festival — The Blueprint | 18–20 Dec 2026",
    template: "%s · 2026 Abeokuta Polo Festival",
  },
  description:
    "Official management and accreditation platform for the 2026 Abeokuta Polo Festival (18–20 Dec 2026). Royal Cup championship, VIP hospitality chalets, 100% free Day 1 entry pass.",
  applicationName: "Abeokuta Polo Festival 2026",
  keywords: [
    "Abeokuta Polo Festival 2026",
    "The Blueprint",
    "Abeokuta Polo Club",
    "Royal Cup Polo Tournament",
    "African Polo Championships",
    "Ogun State Polo",
    "Equestrian Festival Nigeria",
    "VIP Polo Hospitality",
    "Kobape Polo Grounds",
    "Free Day 1 Polo Pass",
    "Global Polo Calendar 2026",
  ],
  authors: [{ name: "Abeokuta Polo Club", url: "https://abeokutapoloclub.org.ng" }],
  creator: "Abeokuta Polo Club Secretariat",
  publisher: "Abeokuta Polo Club",
  category: "Sports",
  classification: "International Equestrian Sports Festival & Tournament",
  alternates: {
    canonical: "https://www.abeokutapolofestival2026.org.ng",
    languages: {
      "en-US": "https://www.abeokutapolofestival2026.org.ng",
      "en-GB": "https://www.abeokutapolofestival2026.org.ng",
      "en-NG": "https://www.abeokutapolofestival2026.org.ng",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://www.abeokutapolofestival2026.org.ng",
    siteName: "2026 Abeokuta Polo Festival — The Blueprint",
    title: "2026 Abeokuta Polo Festival — The Blueprint | 18–20 Dec 2026",
    description:
      "Official management platform for the 2026 Abeokuta Polo Festival (18–20 Dec 2026). 3-day equestrian spectacle, Royal Cup, VIP chalets & free Day 1 pass.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "2026 Abeokuta Polo Festival — The Blueprint | 18–20 December 2026",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "2026 Abeokuta Polo Festival — The Blueprint",
    description:
      "Official management platform for the 2026 Abeokuta Polo Festival (18–20 Dec 2026). Royal Cup championship, VIP hospitality chalets & free Day 1 pass.",
    images: ["/og-image.png"],
    creator: "@AbeokutaPolo",
    site: "@AbeokutaPolo",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
      <head>
        <StructuredData />
      </head>
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

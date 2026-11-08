import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const CONTACT = {
  phone1: "+234 818 188 8884",
  phone1Href: "tel:+2348181888884",
  phone2: "0803 681 8916",
  phone2Href: "tel:08036818916",
  email: "abeokutapolo@gmail.com",
  emailHref: "mailto:abeokutapolo@gmail.com",
  whatsapp: "https://wa.me/2348181888884",
};

const COLUMNS = [
  {
    title: "Tournament",
    links: [
      { href: "/programme", label: "Match Programme" },
      { href: "/royal-cup", label: "The Royal Cup" },
      { href: "/experiences", label: "Experiences & Gala" },
    ],
  },
  {
    title: "Access",
    links: [
      { href: "/register", label: "Register for Pass (Free)" },
      { href: "/register/poster", label: "Venue QR Standee / Poster" },
      { href: "/pass/lookup", label: "Find My Access Card" },
      { href: "/scan", label: "Gate Scanner PWA" },
      { href: "/dashboard/pass", label: "Digital Member Pass" },
    ],
  },
  {
    title: "Hospitality",
    links: [
      { href: "/hospitality", label: "Suites & Enclosures" },
      { href: "/sponsorship", label: "Corporate Partnerships" },
      { href: "/press", label: "Media & Press Access" },
    ],
  },
  {
    title: "Guide",
    links: [
      { href: "/visit", label: "Plan Your Visit" },
      { href: "/faq", label: "Visitor Protocols & FAQs" },
      { href: "/publications", label: "Tournament Gazette" },
      { href: "/gallery", label: "Archival Imagery" },
      { href: "/news", label: "Festival News" },
    ],
  },
] as const;

const LEGAL = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms of Entry" },
  { href: "/accessibility", label: "Accessibility Statement" },
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-forest text-ivory overflow-x-clip w-full max-w-full min-w-0 print:hidden">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-10 sm:py-14 min-w-0">
        {/* Pre-Footer Gate Protocol Notice */}
        <div className="mb-12 rounded-2xl border-2 border-gold/60 bg-forest-deep p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gold text-forest shrink-0 shadow-sm mt-0.5 sm:mt-0">
                <ShieldCheck className="size-5.5 text-forest" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gold">
                    Mandatory Gate Protocol
                  </span>
                  <span className="text-[10px] text-ivory/60 hidden sm:inline">· 18–20 Dec 2026</span>
                </div>
                <p className="text-xs sm:text-sm text-ivory/95 font-medium leading-relaxed">
                  <strong>All attendees must be duly registered to attend any of the three festival days.</strong> No turnstile admission is permitted without an official digital access card.
                </p>
              </div>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-xs font-bold text-forest hover:bg-gold/90 transition-colors shrink-0 shadow-sm w-full sm:w-auto text-center"
            >
              Register for Pass →
            </Link>
          </div>
        </div>

        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="font-display text-xl font-bold tracking-tight text-ivory">
              Abeokuta Polo Festival 2026
            </p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-gold">
              The Blueprint · 18–20 Dec 2026
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ivory/80">
              All attendees must be duly registered to attend any of the three festival days.
              Entry requires an official digital access card for contactless turnstile admission.
            </p>
            <div className="mt-5 space-y-1.5 text-sm text-ivory/80">
              <div className="rounded-lg border border-gold/30 bg-forest-deep/60 p-3 text-xs leading-relaxed text-ivory/85 space-y-1">
                <p className="font-semibold text-gold">Physical Secretariat (General Enquiries):</p>
                <p>Abeokuta Polo Club Secretariat, 4th Floor, Conference Hotel, Presidential Boulevard, Oke-Mosan, Abeokuta, Ogun State.</p>
              </div>
              <p className="flex flex-wrap items-center gap-1">
                <a className="underline-offset-4 hover:underline" href={CONTACT.phone1Href}>
                  {CONTACT.phone1}
                </a>
                <span aria-hidden className="px-1 text-ivory/40">·</span>
                <a className="underline-offset-4 hover:underline" href={CONTACT.phone2Href}>
                  {CONTACT.phone2}
                </a>
              </p>
              <p>
                <a className="underline-offset-4 hover:underline" href={CONTACT.emailHref}>
                  {CONTACT.email}
                </a>
              </p>
              <p>
                <a
                  className="underline underline-offset-4 hover:text-gold"
                  href={CONTACT.whatsapp}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Enquire on WhatsApp
                </a>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-8 sm:grid-cols-4 min-w-0">
            {COLUMNS.map((column) => (
              <div key={column.title} className="min-w-0">
                <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gold truncate">
                  {column.title}
                </h2>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href} className="min-w-0">
                      <Link
                        href={link.href}
                        className="text-xs sm:text-sm text-ivory/80 underline-offset-4 hover:text-ivory hover:underline block truncate"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ivory/15 pt-6 text-xs text-ivory/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Abeokuta Polo Club. All rights reserved.</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1">
            {LEGAL.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-ivory">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

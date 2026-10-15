import Link from "next/link";

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
      { href: "/programme", label: "Programme" },
      { href: "/royal-cup", label: "Royal Cup" },
      { href: "/experiences", label: "Experiences" },
    ],
  },
  {
    title: "Attend",
    links: [
      { href: "/register", label: "Register (free)" },
      { href: "/dashboard/pass", label: "Digital Member Pass" },
      { href: "/hospitality", label: "VIP Hospitality & Cabanas" },
      { href: "/visit", label: "Visitor Protocol" },
    ],
  },
  {
    title: "Partners",
    links: [
      { href: "/sponsorship", label: "Patrons & Royal Sponsors" },
      { href: "/partners", label: "Official Partners" },
      { href: "/press", label: "Media & Press Access" },
    ],
  },
  {
    title: "Information",
    links: [
      { href: "/publications", label: "Tournament Gazette" },
      { href: "/gallery", label: "Archival Imagery" },
      { href: "/news", label: "News" },
      { href: "/faq", label: "FAQs" },
      { href: "/contact", label: "Contact" },
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
    <footer className="border-t border-line bg-forest text-ivory">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="font-display text-xl font-semibold">2026 Abeokuta Polo Festival</p>
            <p className="mt-1 text-sm italic text-ivory/70">The Blueprint</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ivory/80">
              Attendance is free; entry requires prior registration and an accredited
              credential. This website does not take payments.
            </p>
            <div className="mt-5 space-y-1.5 text-sm text-ivory/80">
              <p>
                <a className="underline-offset-4 hover:underline" href={CONTACT.phone1Href}>
                  {CONTACT.phone1}
                </a>
                <span aria-hidden className="px-2 text-ivory/40">·</span>
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

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">
                  {column.title}
                </h2>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-ivory/80 underline-offset-4 hover:text-ivory hover:underline"
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

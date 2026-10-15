import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "News & Bulletins — 2026 Abeokuta Polo Festival",
  description:
    "Official press statements, announcements, and tournament notices from the Secretariat.",
};

const NEWS_ITEMS = [
  {
    id: "1",
    date: "14 October 2026",
    title: "Abeokuta Polo Club Confirms 2026 Festival Theme: The Blueprint",
    category: "Official Announcement",
    excerpt:
      "The tournament management committee has announced 'The Blueprint — Where Heritage Meets Excellence' as the official theme for the 2026 edition scheduled for 18–20 December at the Kobape grounds.",
  },
  {
    id: "2",
    date: "12 October 2026",
    title: "100 Crowned Monarchs Invited for The Royal Cup Pinnacle Match",
    category: "Royal Protocol",
    excerpt:
      "Under the royal auspices of HRM The Alake of Egbaland, invitations have been dispatched to traditional rulers across the Southwest for the signature sovereign championship.",
  },
  {
    id: "3",
    date: "10 October 2026",
    title: "Free Digital Accreditation Pass System Launched for 2026 Edition",
    category: "Accreditation",
    excerpt:
      "In a decisive move to expand community participation, general public attendance is confirmed free of charge, supported by an advanced digital QR entry pass system.",
  },
];

export default function NewsPage() {
  return (
    <div className="flex w-full flex-col bg-ivory text-ink">
      <section className="relative overflow-hidden bg-forest text-ivory py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold uppercase tracking-widest text-[11px]">
            Secretariat Press & Bulletins
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl">
            News & Announcements
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ivory/80 sm:text-lg">
            Stay informed with official notices, tournament schedules, and press briefings.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {NEWS_ITEMS.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8 transition hover:shadow-md"
              >
                <div className="flex items-center gap-3 text-xs">
                  <Badge variant="outline" className="border-gold/50 bg-gold/10 text-forest text-[10px]">
                    {item.category}
                  </Badge>
                  <span className="text-muted-brand">{item.date}</span>
                </div>
                <h2 className="mt-3 font-display text-2xl font-semibold text-forest">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm text-muted-brand leading-relaxed">
                  {item.excerpt}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

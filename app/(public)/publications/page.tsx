import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Publications & Gazette — 2026 Abeokuta Polo Festival",
  description:
    "Official tournament gazette, spectator guide, festival rules of entry, and commemorative publications.",
};

const PUBLICATIONS = [
  {
    id: "gazette",
    title: "Official 2026 Tournament Gazette",
    type: "Commemorative Issue",
    format: "Print & Digital PDF",
    description:
      "The definitive tournament journal containing the Sovereign address by HRM The Alake of Egbaland, club history since 1928, and official player rosters.",
  },
  {
    id: "spectator-guide",
    title: "Visitor Protocol & Spectator Handbook",
    type: "Spectator Guide",
    format: "Digital PDF",
    description:
      "Rules of polo, chukka scoring guidelines, pavilion seating layouts, dress codes, and equestrian safety instructions.",
  },
  {
    id: "commercial-blueprint",
    title: "The Festival Blueprint & Partnership Prospectus",
    type: "Sponsor Deck",
    format: "Executive Summary",
    description:
      "Commercial rights, audience demographic analyses, and activation specifications for corporate partners and government agencies.",
  },
];

export default function PublicationsPage() {
  return (
    <div className="flex w-full flex-col bg-ivory text-ink">
      <section className="relative overflow-hidden bg-forest text-ivory py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold uppercase tracking-widest text-[11px]">
            Official Documentation & Literature
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl">
            Tournament Gazette & Publications
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ivory/80 sm:text-lg">
            Archival literature, festival programmes, and commemorative editions published under the authority of the Corporate Secretariat.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {PUBLICATIONS.map((pub) => (
              <div
                key={pub.id}
                className="flex flex-col justify-between rounded-2xl border border-line bg-card p-8 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-gold/50 bg-gold/10 text-forest font-semibold text-[11px]">
                      {pub.type}
                    </Badge>
                    <span className="text-xs text-muted-brand">{pub.format}</span>
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-semibold text-forest">
                    {pub.title}
                  </h3>
                  <p className="mt-3 text-sm text-muted-brand leading-relaxed">
                    {pub.description}
                  </p>
                </div>
                <div className="mt-8 border-t border-line/60 pt-4">
                  <span className="text-xs font-semibold text-forest-interactive">
                    ● Published prior to tournament kickoff
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-xl border border-line bg-sage/30 p-8 text-center">
            <h3 className="font-display text-xl font-semibold text-forest">Looking for Sponsorship Information?</h3>
            <p className="mt-2 text-xs text-muted-brand max-w-md mx-auto">
              Corporate partnership prospectuses can be reviewed directly on our dedicated sponsorship portal.
            </p>
            <div className="mt-4">
              <Button asChild variant="outline" className="border-line text-forest">
                <Link href="/sponsorship">Review Sponsorship Packages →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

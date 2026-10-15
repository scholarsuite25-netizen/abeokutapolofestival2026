import Link from "next/link";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Media Gallery & Archives — 2026 Abeokuta Polo Festival",
  description:
    "Official photographic coverage and archival imagery from the Abeokuta Polo Club and festival chukkas.",
};

const ALBUMS = [
  {
    title: "Championship Chukkas",
    category: "High-Goal Action",
    date: "1928 – 2026",
    description: "High-speed thoroughbred sprints, fierce mallet hooks, and field-side celebrations.",
  },
  {
    title: "Royal Pageantry & Durbar",
    category: "Sovereign Heritage",
    date: "Annual Tradition",
    description: "Crowned Yoruba monarchs, ceremonial drumming, and royal equestrian processions.",
  },
  {
    title: "Chukka Terrace & Society",
    category: "Lifestyle & Society",
    date: "Festival Highlights",
    description: "Guests in high-fashion garden attire, clubhouse gatherings, and evening galas.",
  },
  {
    title: "Grounds & Club Heritage",
    category: "Club Archives",
    date: "Est. 1928",
    description: "Historical photography celebrating nearly a century of polo excellence in Kobape, Ogun State.",
  },
];

export default function GalleryPage() {
  return (
    <div className="flex w-full flex-col bg-ivory text-ink">
      <section className="relative overflow-hidden bg-forest text-ivory py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold uppercase tracking-widest text-[11px]">
            Visual Archives & Media Hub
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl">
            Tournament Photography & Heritage Archives
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ivory/80 sm:text-lg">
            Capturing the speed, majesty, and sovereign tradition of the Abeokuta Polo Club.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ALBUMS.map((album, idx) => (
              <div
                key={idx}
                className="group flex flex-col justify-between rounded-2xl border border-line bg-card overflow-hidden shadow-sm transition hover:shadow-md"
              >
                <div className="h-48 bg-forest-deep/90 flex flex-col items-center justify-center text-ivory p-6 text-center">
                  <div className="flex size-14 items-center justify-center rounded-xl bg-gold/15 text-gold mb-3">
                    <Camera className="size-7" />
                  </div>
                  <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold text-[10px]">
                    {album.category}
                  </Badge>
                </div>
                <div className="p-6">
                  <span className="text-xs text-muted-brand">{album.date}</span>
                  <h3 className="mt-1 font-display text-xl font-semibold text-forest">
                    {album.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-brand">
                    {album.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border border-line bg-sage/30 p-8 text-center sm:p-12">
            <h3 className="font-display text-2xl font-semibold text-forest">Media & Press Accreditation</h3>
            <p className="mt-2 text-sm text-muted-brand max-w-lg mx-auto">
              Accredited photojournalists, television broadcast crews, and digital creators may request media pit credentials for the 2026 tournament.
            </p>
            <div className="mt-6 flex justify-center">
              <Button asChild className="bg-forest text-ivory hover:bg-forest-interactive">
                <Link href="/register">Apply for Media Pass →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

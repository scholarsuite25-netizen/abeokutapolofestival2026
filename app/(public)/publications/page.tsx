import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicationsHub } from "@/components/design/public/publications-hub";
import { FESTIVAL_METADATA } from "@/lib/data/programme";

export const metadata = {
  title: "Tournament Gazette & Official Publications — 2026 Abeokuta Polo Festival",
  description:
    "Official tournament gazettes, spectator guide, festival rules of entry, equine pedigree logs, and commemorative publications from the Abeokuta Polo Club.",
};

export default function PublicationsPage() {
  return (
    <div className="flex w-full flex-col bg-ivory text-ink">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION                                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-forest py-16 text-ivory sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-gold/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-gold/40 bg-gold/10 text-[11px] tracking-widest text-gold uppercase"
            >
              Official Repository
            </Badge>
            <Badge className="bg-gold text-forest font-bold text-[10px]">
              ESTABLISHED 2025
            </Badge>
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight font-semibold text-balance text-ivory sm:text-6xl">
            Tournament Gazette &amp;{" "}
            <span className="font-normal text-gold italic">Official Publications</span>
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ivory/80 sm:text-lg">
            Curated festival literature, official tournament programmes, Kobape ground maps, equine
            pedigree rosters, and historical retrospectives preserved by the Curatorial Secretariat.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              className="h-11 bg-gold px-4 font-semibold text-forest-deep hover:bg-gold/90"
            >
              <Link href="/register">
                Register for a pass
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 border-gold/40 bg-white/10 px-4 text-ivory hover:bg-white/20 hover:text-ivory"
            >
              <a href="#repository">
                <BookOpen className="mr-2 size-4 text-gold" />
                Browse archives
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. PUBLICATIONS REPOSITORY & INTERACTIVE HUB                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="repository" className="py-16 sm:py-20 scroll-mt-20" aria-label="Official Publications">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PublicationsHub />
        </div>
      </section>
    </div>
  );
}

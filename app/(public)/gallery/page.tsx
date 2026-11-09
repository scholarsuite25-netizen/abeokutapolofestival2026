import Link from "next/link";
import { Camera, Calendar, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Media Gallery & Photographic Archives — 2026 Abeokuta Polo Festival",
  description:
    "Official photographic coverage and archival imagery from the Abeokuta Polo Club, celebrating royal fathers, leadership, government participation, and high-goal chukkas.",
};

export default function GalleryPage() {
  return (
    <div className="flex w-full max-w-full flex-col bg-ivory text-ink overflow-x-clip min-w-0">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION                                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-forest text-ivory py-16 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-gold/10 blur-3xl"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-gold/40 bg-gold/10 text-gold uppercase tracking-widest text-[11px]"
            >
              Visual Archives &amp; Media Desk
            </Badge>
            <Badge className="bg-gold text-forest font-bold text-[10px]">
              ESTABLISHED 2025
            </Badge>
          </div>

          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl text-ivory">
            Visual Heritage &amp; <br />
            <span className="font-normal italic text-gold">Championship Archives</span>
          </h1>

          <p className="mt-4 max-w-2xl text-base text-ivory/80 sm:text-lg">
            Documenting the historic journey of the Abeokuta Polo Club from its foundation at Kobape to the landmark 2026 Blueprint Festival (18–20 December 2026).
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. SECRETARIAT CURATION HOLDING NOTICE                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-2xl border border-line bg-card p-8 sm:p-12 shadow-sm">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gold/15 text-gold-dim">
              <Camera className="size-7" />
            </div>

            <Badge variant="outline" className="mt-6 border-gold/40 bg-gold/10 text-forest text-xs font-semibold">
              Curatorial Notice
            </Badge>

            <h2 className="mt-4 font-display text-2xl sm:text-3xl font-semibold text-forest">
              Official Photographic Archives in Curation
            </h2>

            <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-brand">
              The official photographic records of the Abeokuta Polo Club &amp; Country Resort are currently being
              curated by the Media &amp; Publicity Committee ahead of the 2026 Festival.
            </p>

            <p className="mt-3 text-xs sm:text-sm text-muted-brand leading-relaxed">
              Verified high-resolution tournament photography, royal procession ceremonies, and match-action dispatches
              will be released here directly from the field during the festival (<strong>18–20 December 2026</strong>).
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="bg-gold text-forest-deep font-semibold hover:bg-gold/90 shadow text-xs sm:text-sm">
                <Link href="/register">
                  Register for Festival Passes <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-line bg-card text-forest hover:bg-sage text-xs sm:text-sm">
                <Link href="/press">
                  Media &amp; Press Desk
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-line bg-card text-forest hover:bg-sage text-xs sm:text-sm">
                <Link href="/programme">
                  <Calendar className="mr-1.5 size-4 text-gold" /> Tournament Itinerary
                </Link>
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-line text-xs text-muted-brand text-center">
              <p>For photographic curation inquiries or press media access:</p>
              <a href="mailto:abeokutapolo@gmail.com" className="font-mono text-gold-dim hover:underline font-semibold">
                abeokutapolo@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

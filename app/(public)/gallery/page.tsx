import Link from "next/link";
import { Camera, Film, Download, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FestivalVideoPlayer } from "@/components/shared/festival-video-player";
import { GalleryShowcase } from "@/components/design/public/gallery-showcase";

export const metadata = {
  title: "Media Gallery & Photographic Archives — 2026 Abeokuta Polo Festival",
  description:
    "Official photographic coverage and archival imagery from the Abeokuta Polo Club (Established 2025), celebrating royal fathers, leadership, government participation, and high-goal chukkas.",
};

export default function GalleryPage() {
  return (
    <div className="flex w-full flex-col bg-ivory text-ink">
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
              Visual Archives &amp; Media Hub
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
            Documenting the historic journey of the Abeokuta Polo Club from its groundbreaking on May 17, 2025, to the maiden festival on December 21, 2025, and onwards to the landmark 2026 Blueprint Festival.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild className="bg-gold text-forest font-bold hover:bg-gold/90 text-xs sm:text-sm">
              <Link href="/register">
                Register for 2026 Access Pass <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-gold/40 bg-white/10 text-ivory hover:bg-white/20 text-xs sm:text-sm">
              <a href="#archives">
                <Camera className="mr-1.5 size-4 text-gold" /> Explore Photo Archives
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. OFFICIAL VIDEO TEASER SECTION                                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-forest-deep py-12 border-b border-gold/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <Badge className="bg-gold text-forest font-bold text-[10px] mb-2">
                <Film className="mr-1 size-3" /> OFFICIAL 2026 TRAILER
              </Badge>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ivory">
                The Blueprint — Official Teaser
              </h2>
            </div>
            <p className="text-xs text-ivory/70 max-w-md">
              A cinematic preview of the championship chukkas, Kobape heritage grounds, and royal pageantry scheduled for 18–20 December 2026.
            </p>
          </div>

          <FestivalVideoPlayer
            src="/videos/abeokuta-polo-trailer.mp4"
            autoPlay={false}
            muted={false}
            className="w-full shadow-2xl"
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. VERIFIED PHOTOGRAPHIC ARCHIVES                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="archives" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Inception To Date · 2025 – 2026
            </span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-forest sm:text-4xl">
              Photographic Timeline &amp; Sovereign Highlights
            </h2>
            <p className="mt-2 text-sm text-muted-brand sm:text-base">
              Featuring published coverage of Club President Dr. Chief Sheriff Adams Abdulrahman, Royal Monarchs chaired by HRM The Alake of Egbaland, Ogun State Government leadership, and high-goal equestrian action.
            </p>
          </div>

          {/* Interactive Gallery Showcase */}
          <GalleryShowcase />

          {/* Press & Media Accreditation Card */}
          <div className="mt-20 rounded-3xl border border-line bg-sage/30 p-8 sm:p-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8 space-y-2">
                <Badge variant="outline" className="border-gold/60 text-gold uppercase text-[10px]">
                  Editorial &amp; Broadcast Rights
                </Badge>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold text-forest">
                  Official Media Accreditation &amp; Press Assets
                </h3>
                <p className="text-sm text-muted-brand leading-relaxed">
                  Journalists, broadcast crews, and digital creators may request high-resolution assets, sideline pit access, and interview credentials for the 2026 Abeokuta Polo Festival.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                <Button asChild className="bg-forest text-ivory hover:bg-forest-interactive">
                  <Link href="/press">
                    <ShieldCheck className="mr-2 size-4 text-gold" />
                    Apply for Media Pass →
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-forest/30 bg-card text-forest hover:bg-ivory">
                  <Link href="/api/programme/pdf" target="_blank">
                    <Download className="mr-2 size-4 text-gold" />
                    Download Official Schedule (PDF)
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

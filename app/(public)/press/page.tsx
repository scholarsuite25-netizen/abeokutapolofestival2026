import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PressHub } from "@/components/design/public/press-hub";
import { FESTIVAL_METADATA } from "@/lib/data/programme";

export const metadata = {
  title: "Press & Media Accreditation — 2026 Abeokuta Polo Festival",
  description:
    "Official press guidelines, broadcast syndicate technical specs, photo-pit safety protocols, and credential accreditation for media covering the 2026 Abeokuta Polo Festival.",
};

export default function PressPage() {
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
              Media Operations &amp; Broadcast Desk
            </Badge>
            <Badge className="bg-gold text-forest font-bold text-[10px]">
              ESTABLISHED 2025
            </Badge>
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight font-semibold text-balance text-ivory sm:text-6xl">
            Press &amp; Media <span className="font-normal text-gold italic">Operations Centre</span>
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ivory/80 sm:text-lg">
            Credential accreditation, broadcast transmission feeds, pitch-side photo pits, and
            official media guidelines for national and international journalists covering the 2026 festival.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              className="h-11 bg-gold px-4 font-semibold text-forest-deep hover:bg-gold/90"
            >
              <Link href="/register">
                Apply for Media Pass
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 border-gold/40 bg-white/10 px-4 text-ivory hover:bg-white/20 hover:text-ivory"
            >
              <a href="#credentials">
                <BadgeCheck className="mr-2 size-4 text-gold" />
                Review Guidelines
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. PRESS OPERATIONS & ACCREDITATION HUB                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="credentials" className="py-16 sm:py-20 scroll-mt-20" aria-label="Media Guidelines">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PressHub />
        </div>
      </section>
    </div>
  );
}

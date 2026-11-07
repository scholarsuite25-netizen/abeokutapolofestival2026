import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewsDesk } from "@/components/design/public/news-desk";
import { FESTIVAL_METADATA } from "@/lib/data/programme";

export const metadata = {
  title: "News & Bulletins — 2026 Abeokuta Polo Festival",
  description:
    "Standing Secretariat notices for accreditation, the published programme, Kobape grounds, and media day at the 2026 Abeokuta Polo Festival.",
};

export default function NewsPage() {
  return (
    <div className="flex w-full flex-col bg-ivory text-ink">
      <section className="relative overflow-hidden bg-forest py-16 text-ivory sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-gold/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge
            variant="outline"
            className="border-gold/40 bg-gold/10 text-[11px] tracking-widest text-gold uppercase"
          >
            Secretariat notices
          </Badge>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight font-semibold text-balance text-ivory sm:text-6xl">
            News &amp; <span className="font-normal text-gold italic">announcements</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ivory/80 sm:text-lg">
            Official guidance for {FESTIVAL_METADATA.dates}. Standing notices cover who may enter,
            what the three days hold, and how the grounds and media desk work.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="h-11 bg-gold px-4 font-semibold text-forest-deep hover:bg-gold/90">
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
              <a href="#desk">Read standing notices</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20" aria-label="Festival notices">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <NewsDesk />
        </div>
      </section>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = {
  title: "News & Bulletins — 2026 Abeokuta Polo Festival",
  description:
    "Official press statements, announcements, and tournament notices from the Secretariat.",
};

export default function NewsPage() {
  return (
    <div className="flex w-full flex-col bg-ivory text-ink">
      <section className="relative overflow-hidden bg-forest text-ivory py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge
            variant="outline"
            className="border-gold/40 bg-gold/10 text-gold uppercase tracking-widest text-[11px]"
          >
            Secretariat Press &amp; Bulletins
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl">
            News &amp; Announcements
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ivory/80 sm:text-lg">
            Stay informed with official notices, tournament schedules, and press briefings.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <EmptyState
            title="No bulletins published yet"
            description="Official announcements from the Secretariat will appear here once published. Festival updates are also shared through accredited guest channels and the official festival contacts."
          />
        </div>
      </section>
    </div>
  );
}

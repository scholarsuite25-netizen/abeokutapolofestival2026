import {
  Wine,
  Theater,
  Flame,
  Crown,
  Sparkles,
  Music,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnquiryDialog } from "@/components/design/public/enquiry-dialog";

export const metadata = {
  title: "Experiences — 2026 Abeokuta Polo Festival",
  description:
    "Curated cultural, culinary, equestrian, and evening experiences at the 2026 Abeokuta Polo Festival.",
};

export default function ExperiencesPage() {
  return (
    <div className="flex w-full flex-col bg-ivory text-ink">
      <section className="relative overflow-hidden bg-forest text-ivory py-16 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-gold/10 blur-3xl"
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold uppercase tracking-widest text-[11px]">
            Culture · Lifestyle · Celebration
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl">
            Curated Festival Experiences
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ivory/80 sm:text-lg">
            Beyond the high-intensity chukkas on the field, the 2026 Abeokuta Polo Festival offers a vibrant tapestry of Yoruba sovereign culture, luxury hospitality, and night celebrations.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-8 shadow-sm">
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  <Theater className="size-6" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-semibold text-forest">
                  The Kings Procession & Durbar
                </h2>
                <p className="mt-3 text-sm text-muted-brand leading-relaxed">
                  A ceremonial spectacle uniting crowned monarchs, traditional royal horsemen, and cultural dancers in majestic Yoruba regalia opening the tournament.
                </p>
              </div>
              <div className="mt-6 border-t border-line/60 pt-4">
                <span className="text-xs font-semibold uppercase text-gold">Sunday Feature · 20 Dec</span>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-8 shadow-sm">
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-forest/15 text-forest">
                  <Wine className="size-6" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-semibold text-forest">
                  Equestrian Style Lounge
                </h2>
                <p className="mt-3 text-sm text-muted-brand leading-relaxed">
                  A high-fashion garden showcase curated for equestrian lifestyle enthusiasts, featuring Nigerian couture designers, artisanal leather craft, and luxury millinery.
                </p>
              </div>
              <div className="mt-6 border-t border-line/60 pt-4">
                <span className="text-xs font-semibold uppercase text-gold">Saturday & Sunday</span>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-8 shadow-sm">
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  <Flame className="size-6" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-semibold text-forest">
                  Bonfire Night & Fireworks
                </h2>
                <p className="mt-3 text-sm text-muted-brand leading-relaxed">
                  The ceremonial bonfire lighting and stadium fireworks display ushering in the December festivities under the stars on the polo grounds.
                </p>
              </div>
              <div className="mt-6 border-t border-line/60 pt-4">
                <span className="text-xs font-semibold uppercase text-gold">Friday Night · 18 Dec</span>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-8 shadow-sm">
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-forest/15 text-forest">
                  <Music className="size-6" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-semibold text-forest">
                  Aristos Band Gala
                </h2>
                <p className="mt-3 text-sm text-muted-brand leading-relaxed">
                  The grand musical finale featuring live classic highlife and contemporary pan-African sounds to conclude the tournament championship.
                </p>
              </div>
              <div className="mt-6 border-t border-line/60 pt-4">
                <span className="text-xs font-semibold uppercase text-gold">Sunday Evening · 20 Dec</span>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-8 shadow-sm">
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  <Crown className="size-6" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-semibold text-forest">
                  Corporate Hospitality Chalets
                </h2>
                <p className="mt-3 text-sm text-muted-brand leading-relaxed">
                  Bespoke field-side entertaining pavilions for corporate executive entertaining and diplomatic hosting with dedicated catering.
                </p>
              </div>
              <div className="mt-6 border-t border-line/60 pt-4">
                <EnquiryDialog
                  category="hospitality"
                  tierName="Private Chalet"
                  triggerText="Inquire on Chalets"
                  className="w-full bg-forest text-xs font-semibold text-ivory hover:bg-forest-interactive"
                />
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-8 shadow-sm">
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-sage text-forest">
                  <Sparkles className="size-6" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-semibold text-forest">
                  Cultural Pavilion
                </h2>
                <p className="mt-3 text-sm text-muted-brand leading-relaxed">
                  Showcase of Abeokuta heritage, Adire textile exhibitions, local crafts, and culinary delicacies from the Gateway State.
                </p>
              </div>
              <div className="mt-6 border-t border-line/60 pt-4">
                <span className="text-xs font-semibold uppercase text-gold">All 3 Days · Free Entry</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

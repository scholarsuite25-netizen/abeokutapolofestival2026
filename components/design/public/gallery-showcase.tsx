"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Users,
  ZoomIn,
  Share2,
  X,
  Check,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface GalleryItem {
  id: string;
  title: string;
  category:
    | "Royal Fathers"
    | "President & Leadership"
    | "Government Participation"
    | "Official Opening & Chukkas"
    | "Culture & Entertainment";
  date: string;
  year: "2025" | "2026";
  location: string;
  dignitaries: string;
  description: string;
  imageUrl: string;
  fallbackColor: string;
}

export const GALLERY_DATA: GalleryItem[] = [
  {
    id: "royal-groundbreaking-2025",
    title: "HRM The Alake of Egbaland Chairs Landmark Groundbreaking",
    category: "Royal Fathers",
    date: "May 17, 2025",
    year: "2025",
    location: "Kobape Polo Grounds, Abeokuta-Sagamu Expressway",
    dignitaries: "HRM Oba Dr. Adedotun Aremu Gbadebo CFR, Alake & Paramount Ruler of Egbaland",
    description:
      "His Royal Majesty presiding over the sovereign sod-turning ceremony for the 100+ acre Abeokuta Polo Club & Country Resort, inaugurating the permanent home of equestrian excellence in Ogun State.",
    imageUrl: "/images/gallery/alake-groundbreaking.jpg",
    fallbackColor: "from-amber-900 to-forest-deep",
  },
  {
    id: "president-aare-eleshin-conferment",
    title: "Conferment of Aare Eleshin Chieftaincy on Club President",
    category: "President & Leadership",
    date: "July 2026",
    year: "2026",
    location: "Oke-Ona Egba Sovereign Palace, Abeokuta",
    dignitaries: "Dr. Chief Sheriff Abdulrahman Adams (PhD) & HRM Oba Dr. Adedapo Tejuoso",
    description:
      "The Osile of Oke-Ona Egba formally conferring the traditional equestrian title of Aare Eleshin of Oke-Ona Egba upon Club President Dr. Sheriff Adams during his 37th coronation anniversary celebrations.",
    imageUrl: "/images/gallery/chieftaincy-conferment.jpg",
    fallbackColor: "from-emerald-950 to-forest",
  },
  {
    id: "gov-deputy-salako-groundbreaking",
    title: "Ogun State Executive Endorsement at Kobape Grounds",
    category: "Government Participation",
    date: "May 17, 2025",
    year: "2025",
    location: "Kobape Interchange Expressway, Ogun State",
    dignitaries: "Deputy Governor Engr. Noimot Salako-Oyedele (Rep. Gov. Prince Dapo Abiodun CON)",
    description:
      "The Deputy Governor of Ogun State delivering the official executive address endorsing the Abeokuta Polo & Country Resort as a transformative sports-tourism catalyst for Ogun State.",
    imageUrl: "/images/gallery/ogun-executive-endorsement.jpg",
    fallbackColor: "from-slate-900 to-forest-deep",
  },
  {
    id: "maiden-festival-chukka-2025",
    title: "Maiden Abeokuta Polo Festival: Inaugural Chukka on Kobape Turf",
    category: "Official Opening & Chukkas",
    date: "December 21, 2025",
    year: "2025",
    location: "Kobape Polo Arena, Abeokuta",
    dignitaries: "Abeokuta Polo Club Patron Squad vs Invited High-Goal Delegations",
    description:
      "The thunder of thoroughbred hooves during the historic inaugural chukka of the maiden Abeokuta Polo Festival on December 21, 2025, celebrating the competitive club debut on Kobape turf.",
    imageUrl: "/images/gallery/kobape-inaugural-chukka.jpg",
    fallbackColor: "from-forest to-emerald-900",
  },
  {
    id: "president-inspections-kobape",
    title: "President Dr. Sheriff Adams Inspects Turf & Infrastructure",
    category: "President & Leadership",
    date: "October 2025",
    year: "2025",
    location: "Kobape Country Resort Development Site",
    dignitaries: "Dr. Chief Sheriff Abdulrahman Adams with Project Engineers & Surveyors",
    description:
      "Club President Dr. Sheriff Adams leading technical site walkthroughs of the regulation Tifway 419 Bermuda grass turf, drainage systems, and spectator pavilion foundations.",
    imageUrl: "/images/gallery/kobape-turf-inspection.jpg",
    fallbackColor: "from-amber-950 to-stone-900",
  },
  {
    id: "alake-pioneer-inductions",
    title: "HRM The Alake Inducts Pioneer Club Members",
    category: "Royal Fathers",
    date: "July 2026",
    year: "2026",
    location: "Abeokuta Secretariat / Palace Chamber",
    dignitaries: "HRM Oba Dr. Adedotun Aremu Gbadebo CFR & Prince Ma'ruf Adesegun Ajibola SAN",
    description:
      "The Paramount Ruler of Egbaland presenting official membership insignia and club blazers to pioneer inductees, including Crescent University proprietor Prince Maruf Adesegun Ajibola (SAN).",
    imageUrl: "/images/gallery/alake-pioneer-inductions.jpg",
    fallbackColor: "from-forest-deep to-amber-950",
  },
  {
    id: "queens-polo-invitational",
    title: "The Queens Polo Invitational: Elegance & High-Goal Mastery",
    category: "Official Opening & Chukkas",
    date: "Festival Showcase",
    year: "2026",
    location: "Kobape Main Arena",
    dignitaries: "National Female Polo Riders & Royal Chaperones",
    description:
      "Celebrating women in equestrian sport with exhilarating tactical play, precision mallet work, and sporting grace during the signature Queens Cup exhibition.",
    imageUrl: "/images/gallery/queens-polo-invitational.jpg",
    fallbackColor: "from-pink-950 to-forest-deep",
  },
  {
    id: "state-tourism-roundtable",
    title: "Ogun State Tourism & Cultural Heritage Alliance",
    category: "Government Participation",
    date: "September 2025",
    year: "2025",
    location: "Conference Hotel, Oke Mosan, Abeokuta",
    dignitaries: "Chief Dr. Abiodun Lasile (Orunto of Owu) & Ogun State Tourism Leadership",
    description:
      "Strategic consultative briefing outlining the 2026 Festival Blueprint as the cornerstone of Ogun State socio-economic and cultural tourism calendar.",
    imageUrl: "/images/gallery/ogun-tourism-alliance.jpg",
    fallbackColor: "from-blue-950 to-slate-900",
  },
  {
    id: "wole-soyinka-amphitheater-unveiling",
    title: "Prof. Wole Soyinka Arts & Culture Amphitheater Blueprint",
    category: "Culture & Entertainment",
    date: "May 17, 2025",
    year: "2025",
    location: "Kobape Resort Cultural Precinct",
    dignitaries: "Egba Cultural Council, Club Trustees & Architectural Team",
    description:
      "Unveiling the architectural blueprint of the dedicated arts and performance amphitheater honoring Nobel Laureate Prof. Wole Soyinka within the Kobape Country Resort.",
    imageUrl: "/images/gallery/wole-soyinka-amphitheater.jpg",
    fallbackColor: "from-stone-900 to-amber-950",
  },
  {
    id: "chukka-terrace-vip-society",
    title: "Chukka Terrace VIP Society & High-Fashion Attire",
    category: "Culture & Entertainment",
    date: "Annual Festival Tradition",
    year: "2025",
    location: "VIP Chukka Pavilion, Kobape",
    dignitaries: "Captains of Industry, Diplomatic Envoys & Society Patrons",
    description:
      "Distinguished guests in bespoke Nigerian adire-infused couture and luxury garden attire enjoying hospitality service alongside the championship pitch.",
    imageUrl: "/images/gallery/vip-chukka-terrace-fashion.jpg",
    fallbackColor: "from-rose-950 to-amber-900",
  },
  {
    id: "royal-procession-100-kings",
    title: "The Sovereign 100 Kings Celebration: One Field, One Legacy",
    category: "Royal Fathers",
    date: "December 20, 2026 Preview",
    year: "2026",
    location: "Grand Pavilion, Abeokuta",
    dignitaries: "Over 100 Yoruba Monarchs, Royal Highnesses & Egba Council of Obas",
    description:
      "The signature royal assembly uniting sovereign crowned rulers from across Yorubaland in celebration of cultural continuity, peace, and equestrian heritage.",
    imageUrl: "/images/gallery/royal-procession-100-kings.jpg",
    fallbackColor: "from-amber-950 to-forest",
  },
  {
    id: "aristos-berryola-musical-gala",
    title: "Patrons Gala & Twilight Celebration: Aristos Band Live",
    category: "Culture & Entertainment",
    date: "Festival Grand Finale",
    year: "2026",
    location: "Resort Marquee Grounds",
    dignitaries: "Aristos Band, Berryola, and Festival Patrons",
    description:
      "Electrifying live musical entertainment, highlife melodies, and celebration dinner concluding the 3-day tournament festivities on Sunday, 20 December 2026.",
    imageUrl: "/images/gallery/patrons-gala-twilight.jpg",
    fallbackColor: "from-indigo-950 to-purple-950",
  },
];

const CATEGORIES = [
  "All",
  "Royal Fathers",
  "President & Leadership",
  "Government Participation",
  "Official Opening & Chukkas",
  "Culture & Entertainment",
] as const;

export function GalleryShowcase() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<"All" | "2025" | "2026">("All");
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = GALLERY_DATA.filter((item) => {
    const matchCat = selectedCategory === "All" || item.category === selectedCategory;
    const matchYear = selectedYear === "All" || item.year === selectedYear;
    return matchCat && matchYear;
  });

  const handleShare = async (item: GalleryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/gallery#${item.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `${item.title} — ${item.dignitaries} (${item.date})`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full space-y-10">
      {/* Category & Year Filter Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-6">
        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-forest text-gold shadow-md ring-2 ring-gold/40"
                  : "bg-card border border-line text-muted-brand hover:border-gold hover:text-forest"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Inception Year Filter */}
        <div className="flex items-center gap-1.5 bg-card border border-line rounded-xl p-1 self-start sm:self-auto text-xs">
          <span className="text-[11px] font-semibold text-muted-brand px-2 uppercase tracking-wider">
            Era:
          </span>
          {(["All", "2025", "2026"] as const).map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer ${
                selectedYear === yr
                  ? "bg-gold text-forest shadow-sm"
                  : "text-muted-brand hover:text-forest"
              }`}
            >
              {yr === "All" ? "All Inception" : yr}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <article
            key={item.id}
            id={item.id}
            onClick={() => setActiveItem(item)}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition hover:shadow-xl hover:border-gold/50 cursor-pointer"
          >
            {/* Image Container with Fallback Overlay */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-forest-deep">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/40 via-transparent to-transparent pointer-events-none" />

              {/* Badges Overlay */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <Badge className="bg-forest-deep/90 border border-gold/40 text-gold text-[10px] font-bold backdrop-blur">
                  {item.category}
                </Badge>
                <Badge variant="outline" className="bg-black/60 text-ivory text-[10px] border-white/20">
                  {item.year}
                </Badge>
              </div>

              {/* Hover Quick Action */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-forest/40 backdrop-blur-[2px]">
                <span className="flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-bold text-forest shadow-lg">
                  <ZoomIn className="size-3.5" /> View Photo Details
                </span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-5 flex flex-col flex-1 justify-between space-y-3">
              <div>
                <div className="flex items-center gap-3 text-[11px] text-muted-brand mb-1.5 min-w-0">
                  <span className="inline-flex items-center gap-1 shrink-0">
                    <Calendar className="size-3 text-gold" />
                    {item.date}
                  </span>
                  <span className="inline-flex items-center gap-1 truncate max-w-[160px] min-w-0">
                    <MapPin className="size-3 text-gold shrink-0" />
                    <span className="truncate min-w-0">{item.location.split(",")[0]}</span>
                  </span>
                </div>

                <h3 className="font-display text-lg font-bold text-forest leading-snug group-hover:text-forest-interactive transition-colors">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs text-muted-brand line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Key Figures & Footer Bar */}
              <div className="border-t border-line/60 pt-3">
                <div className="flex items-center gap-1.5 text-[11px] text-forest-interactive font-medium mb-3 min-w-0">
                  <Users className="size-3 text-gold shrink-0" />
                  <span className="truncate min-w-0">{item.dignitaries}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gold inline-flex items-center gap-1 group-hover:underline">
                    Inspect Archives <ChevronRight className="size-3" />
                  </span>

                  <button
                    onClick={(e) => handleShare(item, e)}
                    className="p-1.5 rounded-lg border border-line bg-card hover:border-gold hover:text-gold transition-colors text-muted-brand"
                    title="Share Photograph Link"
                  >
                    {copiedId === item.id ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Share2 className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-gold/40 bg-forest-deep text-ivory shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveItem(null)}
              className="absolute top-4 right-4 z-20 flex size-9 items-center justify-center rounded-full bg-black/60 text-ivory/80 hover:text-ivory hover:bg-black/90 transition-colors"
              aria-label="Close photo preview"
            >
              <X className="size-5" />
            </button>

            {/* Modal Image */}
            <div className="relative aspect-[16/9] w-full bg-black">
              <Image
                src={activeItem.imageUrl}
                alt={activeItem.title}
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Modal Metadata */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-gold text-forest font-bold text-xs">
                    {activeItem.category}
                  </Badge>
                  <span className="text-xs text-gold/80 font-semibold">
                    Inception Era {activeItem.year}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleShare(activeItem, e)}
                    className="border-gold/40 bg-forest text-ivory hover:bg-forest-interactive text-xs"
                  >
                    <Share2 className="mr-1.5 size-3.5" />
                    {copiedId === activeItem.id ? "Link Copied!" : "Share Link"}
                  </Button>
                </div>
              </div>

              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-ivory">
                  {activeItem.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ivory/70">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-gold" />
                    {activeItem.date}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-gold" />
                    {activeItem.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-gold font-medium">
                    <Users className="size-3.5" />
                    {activeItem.dignitaries}
                  </span>
                </div>
              </div>

              <p className="text-sm text-ivory/90 leading-relaxed pt-2 border-t border-gold/20">
                {activeItem.description}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs text-ivory/60 border-t border-gold/10">
                <span>Abeokuta Polo Club Photographic Archives · Established 2025</span>
                <span className="text-gold">Official Media Hub</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  ZoomIn,
  Share2,
  X,
  Check,
  Camera,
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

export const GALLERY_DATA: GalleryItem[] = [];

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
          title: `${item.title} — Abeokuta Polo Festival`,
          text: item.description,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Category & Year Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-6">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedCategory === cat
                  ? "bg-forest text-ivory shadow-sm"
                  : "bg-card border border-line text-muted-brand hover:border-gold/50 hover:text-forest"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-line bg-card p-1">
          {(["All", "2025", "2026"] as const).map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => setSelectedYear(yr)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                selectedYear === yr
                  ? "bg-gold text-forest shadow-xs"
                  : "text-muted-brand hover:text-forest"
              }`}
            >
              {yr === "All" ? "All Inception" : yr}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Cards Grid or Empty Curatorial State */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card p-12 text-center max-w-2xl mx-auto shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-gold/15 text-gold-dim">
            <Camera className="size-6" />
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-gold-dim">
            Archive In Curation
          </p>
          <h3 className="mt-2 font-display text-xl font-semibold text-forest">
            Official Photographic Archives in Curation
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-muted-brand leading-relaxed">
            Unverified placeholder imagery has been completely removed. Genuine photographic dispatches and tournament archives from the Abeokuta Polo Club &amp; Country Resort will be published here upon release by the Secretariat.
          </p>
          <div className="mt-6 pt-6 border-t border-line text-xs text-muted-brand">
            <p className="font-semibold text-forest">Curatorial Inquiries & Photo Submissions</p>
            <p className="mt-1">
              Secretariat Media & Photography Desk:{" "}
              <a href="mailto:abeokutapolo@gmail.com" className="text-gold-dim hover:underline font-mono">
                abeokutapolo@gmail.com
              </a>
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              id={item.id}
              onClick={() => setActiveItem(item)}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition hover:shadow-xl hover:border-gold/50 cursor-pointer"
            >
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
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <Badge className="bg-forest-deep/90 border border-gold/40 text-gold text-[10px] font-bold backdrop-blur">
                    {item.category}
                  </Badge>
                  <Badge variant="outline" className="bg-black/60 text-ivory text-[10px] border-white/20">
                    {item.year}
                  </Badge>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1 justify-between space-y-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-forest leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-muted-brand line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-gold/40 bg-card shadow-2xl text-ink"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              className="absolute top-4 right-4 z-20 flex size-9 items-center justify-center rounded-full bg-black/70 text-ivory hover:bg-black transition"
              aria-label="Close modal"
            >
              <X className="size-5" />
            </button>
            <div className="p-6">
              <h3 className="font-display text-2xl font-bold text-forest">{activeItem.title}</h3>
              <p className="mt-2 text-xs text-muted-brand">{activeItem.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

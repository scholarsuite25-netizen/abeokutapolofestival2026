"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Download,
  FileText,
  Search,
  X,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
  Shield,
  Send,
  Mail,
  Phone,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  PUBLICATIONS_DATA,
  type PublicationCategory,
  type PublicationItem,
} from "@/lib/data/publications";
import { cn } from "@/lib/utils";

interface FilterOption {
  id: PublicationCategory;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: "all", label: "All Publications" },
  { id: "gazette", label: "Tournament Gazettes" },
  { id: "guides", label: "Spectator Guides & Maps" },
  { id: "programmes", label: "Sovereign Match Programmes" },
  { id: "equine", label: "Equine Care & Rosters" },
];

export function PublicationsHub() {
  const searchId = useId();
  const [filter, setFilter] = useState<PublicationCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeItem, setActiveItem] = useState<PublicationItem | null>(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Form state
  const [institution, setInstitution] = useState("");
  const [email, setEmail] = useState("");
  const [scope, setScope] = useState("Foundation & Maiden 2025 Retrospective");
  const [notes, setNotes] = useState("");

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PUBLICATIONS_DATA.filter((pub) => {
      if (filter !== "all" && pub.category !== filter) return false;
      if (!q) return true;
      const haystack = [
        pub.title,
        pub.subtitle,
        pub.summary,
        pub.badge,
        pub.categoryLabel,
        ...pub.chapters,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [filter, searchQuery]);

  const featuredPublication = PUBLICATIONS_DATA.find((p) => p.isFeatured) ?? PUBLICATIONS_DATA[0];

  function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRequestSubmitted(true);
  }

  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. SEARCH & CATEGORY FILTER BAR                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-line bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search input */}
          <div className="relative flex-1">
            <label htmlFor={searchId} className="sr-only">
              Search archival literature and gazettes
            </label>
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-brand"
            />
            <input
              id={searchId}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, chukker roster, sovereign protocol, or equine topic..."
              className="h-11 w-full rounded-lg border border-line bg-ivory pr-10 pl-10 text-sm text-ink outline-none placeholder:text-muted-brand/80 focus-visible:border-forest focus-visible:ring-2 focus-visible:ring-forest/20"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-2.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded text-forest hover:bg-sage focus-visible:outline-none"
              >
                <X className="size-4" />
                <span className="sr-only">Clear search</span>
              </button>
            ) : null}
          </div>

          {/* Result counter indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-brand">
            <span>
              Showing <strong className="text-forest">{filteredItems.length}</strong> of{" "}
              {PUBLICATIONS_DATA.length} archives
            </span>
            <span className="size-1 rounded-full bg-gold" />
            <span className="text-[11px] font-medium text-forest-interactive">
              Official Secretariat Repository
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div
          role="group"
          aria-label="Filter publications"
          className="mt-4 flex gap-2 overflow-x-auto pb-1"
        >
          {FILTER_OPTIONS.map((opt) => {
            const isSelected = filter === opt.id;
            const count =
              opt.id === "all"
                ? PUBLICATIONS_DATA.length
                : PUBLICATIONS_DATA.filter((p) => p.category === opt.id).length;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setFilter(opt.id)}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30",
                  isSelected
                    ? "border-forest bg-forest text-ivory shadow-sm"
                    : "border-line bg-ivory text-forest hover:bg-sage",
                )}
              >
                <span>{opt.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px]",
                    isSelected ? "bg-white/20 text-ivory" : "bg-black/5 text-muted-brand",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. FEATURED PUBLICATION SPOTLIGHT                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {(!searchQuery && (filter === "all" || filter === "gazette")) && (
        <section
          aria-labelledby="featured-publication-title"
          className="relative overflow-hidden rounded-2xl border border-gold/30 bg-forest text-ivory shadow-xl"
        >
          {/* Subtle gold glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-gold/15 blur-3xl"
          />

          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded bg-gold/20 px-2.5 py-1 font-semibold tracking-wider text-gold uppercase text-[10px]">
                Featured Release
              </span>
              <span className="text-gold/50">·</span>
              <span className="text-ivory/80">{featuredPublication.date}</span>
              <span className="text-gold/50">·</span>
              <span className="font-semibold text-gold">{featuredPublication.pages} Archival Pages</span>
              <span className="text-gold/50">·</span>
              <span className="text-ivory/70">{featuredPublication.fileSize}</span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8 space-y-4">
                <h2
                  id="featured-publication-title"
                  className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl"
                >
                  {featuredPublication.title}
                </h2>
                <p className="max-w-2xl text-sm leading-relaxed text-ivory/85 sm:text-base">
                  {featuredPublication.summary}
                </p>

                {/* Chapter chips */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 pt-2">
                  <div className="rounded-lg bg-white/5 p-3 backdrop-blur-sm border border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold block">
                      Imperial Foreword
                    </span>
                    <span className="mt-1 text-xs text-ivory/90 font-medium block">
                      HRM The Alake of Egbaland
                    </span>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3 backdrop-blur-sm border border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold block">
                      3-Day Match Rosters
                    </span>
                    <span className="mt-1 text-xs text-ivory/90 font-medium block">
                      Royal Cup &amp; Queens Cup
                    </span>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3 backdrop-blur-sm border border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold block">
                      Pageantry Protocols
                    </span>
                    <span className="mt-1 text-xs text-ivory/90 font-medium block">
                      Egba Royal Durbar Timings
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveItem(featuredPublication)}
                    className="h-11 bg-gold font-semibold text-forest-deep shadow hover:bg-gold/90"
                  >
                    <BookOpen className="mr-2 size-4" />
                    Read Folio Online
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 border-gold/40 bg-white/10 text-ivory hover:bg-white/20"
                  >
                    <Link href="/api/programme/pdf" target="_blank">
                      <Download className="mr-2 size-4 text-gold" />
                      Download Gazette (PDF)
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Cover Mockup Card */}
              <div className="hidden lg:col-span-4 lg:flex justify-center">
                <div className="w-56 rounded-xl border border-gold/40 bg-forest-deep p-4 shadow-2xl text-center transform -rotate-1 hover:rotate-0 transition-transform">
                  <div className="aspect-[3/4] rounded-lg border border-gold/30 bg-gradient-to-b from-forest-deep to-forest p-4 flex flex-col justify-between items-center text-ivory">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[9px] uppercase tracking-widest text-gold font-bold">
                        Abeokuta Polo Club
                      </span>
                      <div className="size-8 rounded-full bg-gold/20 flex items-center justify-center border border-gold/40 text-gold">
                        <Shield className="size-4" />
                      </div>
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold text-ivory leading-snug">
                        2026 FESTIVAL GAZETTE
                      </p>
                      <p className="mt-1 text-[9px] text-gold/80 italic">
                        The Blueprint Edition
                      </p>
                    </div>
                    <div className="w-full border-t border-gold/20 pt-2 flex items-center justify-between text-[8px] text-ivory/60">
                      <span>Vol. 1 · 2026</span>
                      <span>Kobape Turf</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. PUBLICATIONS REPOSITORY GRID                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section aria-labelledby="curated-library-heading" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-line pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-gold-dim">
              Archival Compendium
            </span>
            <h2
              id="curated-library-heading"
              className="font-display text-2xl font-semibold text-forest sm:text-3xl"
            >
              Curated Festival Documents
            </h2>
          </div>
          <p className="text-xs text-muted-brand">
            Showing <strong className="text-forest">{filteredItems.length}</strong> official publications
          </p>
        </div>

        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-card p-12 text-center">
            <FileText className="mx-auto size-8 text-muted-brand" />
            <h3 className="mt-3 font-display text-lg font-semibold text-forest">
              No matching publications found
            </h3>
            <p className="mt-1 text-xs text-muted-brand max-w-sm mx-auto">
              We couldn't find any documents matching &ldquo;{searchQuery}&rdquo;. Try clearing your query
              or resetting category filters.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setFilter("all");
              }}
              className="mt-4 border-line text-forest"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="group flex flex-col justify-between rounded-2xl border border-line bg-card p-6 shadow-sm transition hover:border-gold/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="border-gold/40 bg-gold/10 text-forest text-[10px] font-semibold tracking-wide"
                    >
                      {item.badge}
                    </Badge>
                    <span className="text-[11px] font-mono text-muted-brand">{item.fileSize}</span>
                  </div>

                  <h3 className="mt-3.5 font-display text-xl font-semibold text-forest group-hover:text-forest-interactive transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-gold-dim">{item.subtitle}</p>

                  <p className="mt-2.5 text-xs text-muted-brand leading-relaxed line-clamp-3">
                    {item.summary}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-brand">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3 text-gold" /> {item.date}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Layers className="size-3 text-forest" /> {item.pages} pages
                    </span>
                    <span>·</span>
                    <span className="rounded bg-sage/60 px-1.5 py-0.5 text-[10px] font-medium text-forest">
                      {item.format}
                    </span>
                  </div>
                </div>

                <div className="mt-6 border-t border-line/60 pt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveItem(item)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:text-forest-interactive underline-offset-4 hover:underline"
                  >
                    <Eye className="size-3.5" />
                    Read Folio
                  </button>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 border-line bg-ivory text-xs font-semibold text-forest hover:bg-sage"
                  >
                    <Link
                      href={item.downloadUrl && item.downloadUrl !== "#" ? item.downloadUrl : "#"}
                      onClick={(e) => {
                        if (!item.downloadUrl || item.downloadUrl === "#") {
                          e.preventDefault();
                          setActiveItem(item);
                        }
                      }}
                    >
                      <Download className="mr-1.5 size-3 text-gold" />
                      PDF
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. INSTITUTIONAL ARCHIVE REQUEST DESK                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="archival-request-heading"
        className="rounded-2xl border border-line bg-sage/30 p-6 sm:p-10"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <div className="space-y-4 lg:col-span-7">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-gold">
              <Shield className="size-4" /> Curatorial &amp; Historic Secretariat
            </span>
            <h2
              id="archival-request-heading"
              className="font-display text-2xl font-semibold text-forest sm:text-3xl"
            >
              Institutional Archival Access &amp; Historical Research
            </h2>
            <p className="text-sm leading-relaxed text-muted-brand">
              Are you an academic scholar, sports historian, documentary broadcaster, or member of the
              accredited equestrian press? The Abeokuta Polo Club preserves high-resolution photographic
              negatives, official match scores, and commemorative sovereign albums.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 text-xs">
              <a
                href="mailto:archives.abeokutapolo@gmail.com"
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-3.5 py-2 font-medium text-forest hover:border-gold"
              >
                <Mail className="size-4 text-gold" />
                archives.abeokutapolo@gmail.com
              </a>
              <a
                href="tel:+2348181888884"
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-3.5 py-2 font-medium text-forest hover:border-gold"
              >
                <Phone className="size-4 text-gold" />
                +234 818 188 8884
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-card p-6 shadow-sm lg:col-span-5">
            <h3 className="font-display text-lg font-semibold text-forest">
              Submit an Archival Request
            </h3>
            <p className="mt-1 text-xs text-muted-brand">
              Requests are processed within 48 business hours by our head archivist at the Kobape Secretariat.
            </p>

            {requestSubmitted ? (
              <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
                <CheckCircle2 className="mx-auto size-6 text-emerald-600" />
                <p className="mt-2 text-xs font-semibold text-emerald-900">
                  Request Transmitted to Archivist
                </p>
                <p className="mt-1 text-[11px] text-emerald-700">
                  A verification receipt has been dispatched. Our team will review your credentials and release
                  the requested archival folios.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRequestSubmitted(false)}
                  className="mt-3 text-xs border-emerald-300 text-emerald-800"
                >
                  Send another request
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-brand mb-1">
                    Affiliation / Institution *
                  </label>
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. University / Media Syndicate / Federation"
                    className="h-9 w-full rounded-md border border-line bg-ivory px-3 text-xs text-ink outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-brand mb-1">
                    Institutional Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="scholar@institution.org"
                    className="h-9 w-full rounded-md border border-line bg-ivory px-3 text-xs text-ink outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-brand mb-1">
                    Archival Scope
                  </label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    className="h-9 w-full rounded-md border border-line bg-ivory px-3 text-xs text-ink outline-none focus:border-forest"
                  >
                    <option>Foundation &amp; Maiden 2025 Retrospective</option>
                    <option>High-Resolution Royal Photography Pack</option>
                    <option>Equine Pedigree &amp; Thoroughbred Lineage Logs</option>
                    <option>Commercial Sponsorship Blueprint (High-Res)</option>
                    <option>Tournament Rules &amp; Umpire Technical Folios</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  className="mt-2 w-full bg-forest text-ivory text-xs font-semibold hover:bg-forest-interactive"
                >
                  <Send className="mr-1.5 size-3 text-gold" />
                  Transmit Request to Archivist
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. INTERACTIVE DOCUMENT READER / FOLIO DIALOG                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Dialog open={!!activeItem} onOpenChange={(open) => !open && setActiveItem(null)}>
        {activeItem && (
          <DialogContent className="max-w-3xl overflow-hidden rounded-2xl border-line bg-card p-0 sm:max-w-4xl">
            {/* Modal Header */}
            <div className="border-b border-line bg-forest px-6 py-5 text-ivory">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-gold/20 px-2 py-0.5 font-semibold text-gold uppercase text-[10px]">
                  {activeItem.badge}
                </span>
                <span>·</span>
                <span className="text-ivory/70">{activeItem.categoryLabel}</span>
                <span>·</span>
                <span className="text-gold font-semibold">{activeItem.securityClearance}</span>
              </div>
              <DialogTitle className="mt-2 font-display text-xl font-bold sm:text-2xl text-ivory">
                {activeItem.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs text-ivory/80">
                {activeItem.subtitle} · Published {activeItem.date} · {activeItem.pages} Pages ({activeItem.fileSize})
              </DialogDescription>
            </div>

            {/* Modal Body */}
            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
              {/* Executive Summary */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-forest">
                  Executive Abstract &amp; Archival Overview
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-brand">
                  {activeItem.summary}
                </p>
              </div>

              {/* Table of Contents / Chapters */}
              <div className="rounded-xl border border-line bg-sage/20 p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-forest">
                  Document Index &amp; Table of Contents ({activeItem.chapters.length} Sections)
                </h4>
                <ul className="mt-3 space-y-2">
                  {activeItem.chapters.map((ch, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-ink">
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-forest text-[9px] font-bold text-ivory">
                        {idx + 1}
                      </span>
                      <span>{ch}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Document Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
                <div className="rounded-lg border border-line bg-ivory p-3">
                  <span className="text-[10px] text-muted-brand uppercase block">Total Volume</span>
                  <span className="font-semibold text-forest mt-0.5 block">{activeItem.pages} Pages</span>
                </div>
                <div className="rounded-lg border border-line bg-ivory p-3">
                  <span className="text-[10px] text-muted-brand uppercase block">File Format</span>
                  <span className="font-semibold text-forest mt-0.5 block">{activeItem.format}</span>
                </div>
                <div className="rounded-lg border border-line bg-ivory p-3">
                  <span className="text-[10px] text-muted-brand uppercase block">Asset Size</span>
                  <span className="font-semibold text-forest mt-0.5 block">{activeItem.fileSize}</span>
                </div>
                <div className="rounded-lg border border-line bg-ivory p-3">
                  <span className="text-[10px] text-muted-brand uppercase block">Issuing Authority</span>
                  <span className="font-semibold text-forest mt-0.5 block">Kobape Secretariat</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-line bg-ivory px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-xs text-muted-brand">
                For printed commemorative copies, visit the tournament secretariat pavilion.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveItem(null)}
                  className="text-xs"
                >
                  Close Folio
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-forest text-ivory text-xs font-semibold hover:bg-forest-interactive"
                >
                  <Link
                    href={activeItem.downloadUrl && activeItem.downloadUrl !== "#" ? activeItem.downloadUrl : "#"}
                    target={activeItem.downloadUrl && activeItem.downloadUrl.startsWith("http") ? "_blank" : undefined}
                  >
                    <Download className="mr-1.5 size-3.5 text-gold" />
                    Download File
                  </Link>
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

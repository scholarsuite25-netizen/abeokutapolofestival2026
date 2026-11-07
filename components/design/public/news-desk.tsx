"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Newspaper,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import {
  NEWS_CATEGORIES,
  STANDING_NOTICES,
  type NewsCategory,
} from "@/lib/data/news";
import { cn } from "@/lib/utils";

type Filter = "All" | "Dispatches" | NewsCategory;

const FILTERS: Filter[] = ["All", ...NEWS_CATEGORIES, "Dispatches"];

export function NewsDesk() {
  const searchId = useId();
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(STANDING_NOTICES[0]?.id ?? null);

  const notices = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return STANDING_NOTICES.filter((notice) => {
      if (filter === "Dispatches") return false;
      if (filter !== "All" && notice.category !== filter) return false;
      if (!needle) return true;
      const haystack = [notice.title, notice.summary, notice.category, ...notice.points]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [filter, query]);

  const status =
    filter === "Dispatches"
      ? "No dated press dispatches have been published."
      : notices.length === 0
        ? "No standing notices match this search."
        : `Showing ${notices.length} standing ${notices.length === 1 ? "notice" : "notices"}.`;

  function clearSearch() {
    setQuery("");
  }

  return (
    <div id="desk" className="scroll-mt-24">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-dim">
            Secretariat desk
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-forest">
            Standing notices
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-brand">
            These notices restate the published programme, visit guide, and accreditation rules.
            Dated press dispatches appear here only after the Secretariat issues them.
          </p>
        </div>
        <p className="text-sm text-muted-brand">
          <span className="font-semibold text-forest">{STANDING_NOTICES.length}</span> standing
          <span aria-hidden> · </span>
          <span className="font-semibold text-forest">0</span> dispatches
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor={searchId} className="sr-only">
            Search standing notices
          </label>
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-brand"
            />
            <input
              id={searchId}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notices"
              className="h-11 w-full rounded-lg border border-line bg-ivory pr-10 pl-10 text-sm text-ink outline-none placeholder:text-muted-brand focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {query ? (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-forest hover:bg-sage focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <X className="size-4" />
                <span className="sr-only">Clear search</span>
              </button>
            ) : null}
          </div>
        </div>

        <div
          role="group"
          aria-label="Filter notices"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {FILTERS.map((item) => {
            const selected = filter === item;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(item)}
                className={cn(
                  "h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  selected
                    ? "border-forest bg-forest text-ivory"
                    : "border-line bg-ivory text-forest hover:bg-sage",
                )}
              >
                {item}
              </button>
            );
          })}
        </div>

        <p aria-live="polite" className="text-sm text-muted-brand">
          {status}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          {filter === "Dispatches" ? (
            <EmptyState
              className="bg-card px-6 py-14"
              title="No press dispatches yet"
              description="The Secretariat has not published a dated statement. Standing notices remain available, and media crews can request accreditation now."
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    type="button"
                    className="h-11 bg-forest px-4 text-ivory hover:bg-forest-interactive"
                    onClick={() => setFilter("All")}
                  >
                    View standing notices
                  </Button>
                  <Button asChild variant="outline" className="h-11 border-line px-4 text-forest">
                    <Link href="/press">Media guidelines</Link>
                  </Button>
                </div>
              }
            />
          ) : notices.length === 0 ? (
            <EmptyState
              className="bg-card px-6 py-14"
              title="Nothing matches that search"
              description="Try a day, a gate, or a topic such as accreditation, programme, or media."
              action={
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-line px-4 text-forest"
                  onClick={() => {
                    setQuery("");
                    setFilter("All");
                  }}
                >
                  Reset filters
                </Button>
              }
            />
          ) : (
            <ul className="space-y-4">
              {notices.map((notice, index) => {
                const open = openId === notice.id;
                const panelId = `${notice.id}-panel`;
                const featured = filter === "All" && !query && index === 0;
                return (
                  <li key={notice.id}>
                    <article
                      className={cn(
                        "rounded-2xl border bg-card p-5 shadow-sm sm:p-6",
                        featured ? "border-gold/50" : "border-line",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-sage px-2.5 py-1 text-[11px] font-semibold tracking-wide text-forest uppercase">
                          {notice.category}
                        </span>
                        <span className="text-xs font-medium text-muted-brand">Standing notice</span>
                        {featured ? (
                          <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-semibold text-gold-dim">
                            Start here
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-3 font-display text-2xl font-semibold text-balance text-forest">
                        {notice.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-brand">{notice.summary}</p>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-controls={panelId}
                          onClick={() => setOpenId(open ? null : notice.id)}
                          className="inline-flex h-11 items-center rounded-lg border border-line bg-ivory px-3.5 text-sm font-semibold text-forest hover:bg-sage focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                          {open ? "Hide details" : "Read notice"}
                        </button>
                        <Link
                          href={notice.href}
                          className="inline-flex h-11 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-forest-interactive underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                          {notice.hrefLabel}
                          <ArrowRight aria-hidden className="size-4" />
                        </Link>
                      </div>

                      {open ? (
                        <div id={panelId} className="mt-4 border-t border-line pt-4">
                          <ul className="space-y-2.5">
                            {notice.points.map((point) => (
                              <li
                                key={point}
                                className="flex gap-3 text-sm leading-relaxed text-ink"
                              >
                                <span
                                  aria-hidden
                                  className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-dim"
                                />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-line bg-forest p-5 text-ivory">
            <Newspaper aria-hidden className="size-5 text-gold" />
            <h2 className="mt-3 font-display text-xl font-semibold">Need a gate pass?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ivory/80">
              Register before you travel. The access card is what the turnstile reads on all three days.
            </p>
            <Button asChild className="mt-4 h-11 w-full bg-gold font-semibold text-forest-deep hover:bg-gold/90">
              <Link href="/register">Register for a pass</Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5">
            <Camera aria-hidden className="size-5 text-forest" />
            <h2 className="mt-3 font-display text-lg font-semibold text-forest">For newsrooms</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-brand">
              Credential requests, photo pits, and broadcast coordination sit with the media desk.
            </p>
            <Link
              href="/press"
              className="mt-4 inline-flex h-11 items-center text-sm font-semibold text-forest-interactive underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Press & media centre
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

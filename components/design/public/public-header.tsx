"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Ticket,
  QrCode,
  Trophy,
  Calendar,
  Sparkles,
  Crown,
  Building2,
  Newspaper,
  BookOpen,
  Camera,
  MapPin,
  HelpCircle,
  Phone,
  MessageCircle,
  Menu,
  ChevronDown,
  ArrowRight,
  Sparkle,
  ShieldCheck,
  Printer,
  ExternalLink,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useStoredPass } from "@/lib/storage/pass-storage";

interface SubmenuItem {
  href: string;
  label: string;
  desc?: string;
  icon: React.ComponentType<{ className?: string }>;
  isPriority?: boolean;
  isExternal?: boolean;
}

interface NavCategory {
  title: string; // Strictly one word
  desc: string;
  items: SubmenuItem[];
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    title: "Tournament",
    desc: "Chukkas, fixtures & championship",
    items: [
      {
        href: "/programme",
        label: "Programme",
        desc: "3-day chukka schedules",
        icon: Calendar,
      },
      {
        href: "/royal-cup",
        label: "Royal Cup",
        desc: "Historic trophy & royal feature",
        icon: Trophy,
      },
      {
        href: "/experiences",
        label: "Experiences",
        desc: "Cultural celebrations & gala",
        icon: Sparkles,
      },
    ],
  },
  {
    title: "Hospitality",
    desc: "VIP suites, tables & enclosures",
    items: [
      {
        href: "/tables",
        label: "VIP Tables",
        desc: "Day 3 VVIP tables of 10 & ₦50k option",
        icon: Crown,
        isPriority: true,
      },
      {
        href: "/hospitality",
        label: "Enclosures",
        desc: "Royal Dais, chalets & suites",
        icon: Crown,
      },
      {
        href: "https://www.abeokutapoloclub.org.ng/register",
        label: "Club Membership",
        desc: "Official Abeokuta Polo Club membership enquiries",
        icon: Award,
        isExternal: true,
      },
    ],
  },
  {
    title: "Partnerships",
    desc: "Corporate sponsorship & 10% affiliate programme",
    items: [
      {
        href: "/sponsorship",
        label: "Corporate Sponsorship",
        desc: "Official brand sponsorship tiers & dossier",
        icon: Building2,
        isPriority: true,
      },
      {
        href: "/affiliates",
        label: "Affiliates (10% Comm.)",
        desc: "International affiliate referral programme",
        icon: Sparkles,
        isPriority: true,
      },
      {
        href: "/affiliates/dashboard",
        label: "Affiliate Dashboard",
        desc: "Track partner referrals & commission",
        icon: ShieldCheck,
      },
    ],
  },
  {
    title: "Guide",
    desc: "Dispatches, press, pass recovery & visitor guide",
    items: [
      {
        href: "/news",
        label: "News & Dispatches",
        desc: "Secretariat dispatches & notices",
        icon: Newspaper,
      },
      {
        href: "/publications",
        label: "Publications",
        desc: "Official schedule & festival publications",
        icon: BookOpen,
      },
      {
        href: "/press",
        label: "Press & Media",
        desc: "Media accreditation protocols & dossier",
        icon: Camera,
      },
      {
        href: "/pass/lookup",
        label: "Find My Access Card",
        desc: "Instant digital pass lookup & recovery",
        icon: ShieldCheck,
        isPriority: true,
      },
      {
        href: "/visit",
        label: "Plan Your Visit",
        desc: "Club location & travel routes",
        icon: MapPin,
      },
      {
        href: "/faq",
        label: "Visitor FAQs",
        desc: "Free entry, tickets & gate protocols",
        icon: HelpCircle,
      },
      {
        href: "/register/poster",
        label: "Venue QR Standee / Poster",
        desc: "Printable gate registration signage",
        icon: Printer,
      },
      {
        href: "/scan",
        label: "Gate Scanner PWA",
        desc: "Turnstile validation app",
        icon: QrCode,
      },
    ],
  },
];

export function PublicHeader() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const storedPass = useStoredPass();
  const navRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoveredCategoryRef = useRef<string | null>(null);

  // Safe hover handlers with 150ms debounce
  const handleMouseEnter = (title: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    hoveredCategoryRef.current = title;
    setActiveCategory(title);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
      hoveredCategoryRef.current = null;
    }, 150);
  };

  // Click handler that avoids snapping shut on first click after hover,
  // while allowing toggle closure on second click or on touch devices
  const handleCategoryClick = (title: string) => {
    if (hoveredCategoryRef.current === title && activeCategory === title) {
      // First click while hovering: retain open state
      hoveredCategoryRef.current = null;
      return;
    }
    // Toggle closure or switch category
    setActiveCategory((prev) => (prev === title ? null : title));
    hoveredCategoryRef.current = null;
  };

  // Close desktop dropdown on Escape key or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveCategory(null);
        hoveredCategoryRef.current = null;
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveCategory(null);
        hoveredCategoryRef.current = null;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full overflow-x-clip border-b border-gold/30 bg-forest-deep/95 backdrop-blur-xl supports-[backdrop-filter]:bg-forest-deep/90 text-ivory shadow-lg shadow-black/20 print:hidden transition-all duration-200">
      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between gap-1.5 sm:gap-4 px-2 sm:px-5 lg:px-6">
        {/* ── 1. Event Brand Name: Royal Heritage Crest & Typography (Cute, Sharp, Compact) ── */}
        <Link
          href="/"
          className="group flex items-center gap-1.5 sm:gap-2.5 transition-opacity hover:opacity-95 shrink-0"
          aria-label="Abeokuta Polo Festival 2026 - The Blueprint"
        >
          <div className="relative flex size-7.5 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-forest-interactive to-forest-deep text-gold border border-gold/60 shadow-md shadow-forest-deep/40 transition-transform group-hover:scale-105">
            <Shield className="size-3.5 sm:size-5 text-gold drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
            <div className="absolute inset-0 rounded-xl bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col justify-center whitespace-nowrap shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap whitespace-nowrap">
              <span className="font-display text-xs sm:text-sm lg:text-base font-bold tracking-tight text-ivory whitespace-nowrap leading-tight">
                Abeokuta Polo Festival
              </span>
              <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[8.5px] sm:text-[10px] font-extrabold text-gold border border-gold/40 leading-none">
                2026
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[10px] font-serif uppercase tracking-[0.15em] sm:tracking-[0.2em] text-gold-light leading-none whitespace-nowrap">
              <span>The Blueprint</span>
              <span className="inline-block size-1 rounded-full bg-gold/60" />
              <span className="font-sans tracking-normal font-normal text-ivory/70">
                18–20 Dec
              </span>
            </div>
          </div>
        </Link>

        {/* ── 2. Unified Premium Main Menu with Explicit Submenu Indicators ── */}
        <nav
          ref={navRef}
          aria-label="Main Navigation"
          className="hidden xl:flex items-center gap-0.5 xl:gap-1"
        >
          {NAV_CATEGORIES.map((category) => {
            const isOpen = activeCategory === category.title;
            return (
              <div
                key={category.title}
                onMouseEnter={() => handleMouseEnter(category.title)}
                onMouseLeave={handleMouseLeave}
                className="relative py-2"
              >
                <button
                  type="button"
                  onClick={() => handleCategoryClick(category.title)}
                  className={`flex items-center gap-1 rounded-lg px-1.5 xl:px-2 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all outline-none cursor-pointer text-ivory/85 hover:text-gold hover:bg-white/5 ${
                    isOpen ? "bg-white/10 text-gold" : ""
                  }`}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  title={`${category.title} menu (${category.items.length} submenus)`}
                >
                  <span>{category.title}</span>
                  <ChevronDown
                    className={`size-3 transition-transform duration-200 text-gold/80 ${
                      isOpen ? "rotate-180 text-gold" : ""
                    }`}
                  />
                  <span className="ml-0.5 rounded-full bg-gold/15 px-1 py-0.2 text-[8.5px] font-mono text-gold-light border border-gold/30">
                    {category.items.length}
                  </span>
                </button>

                {/* Inline non-portalled dropdown with invisible hover bridge (Zero Shake!) */}
                <div
                  className={`absolute ${
                    category.title === "Guide" ? "right-0" : "left-0"
                  } top-full pt-2 w-80 transition-all duration-150 origin-top z-50 ${
                    isOpen
                      ? "opacity-100 visible translate-y-0 pointer-events-auto"
                      : "opacity-0 invisible -translate-y-2 pointer-events-none"
                  }`}
                >
                  {/* Invisible Hitbox Bridge preventing mouseLeave gap */}
                  <div className="absolute -top-2 left-0 right-0 h-4 bg-transparent" />

                  <div className="rounded-2xl border border-gold/40 bg-forest-deep/98 p-3 shadow-2xl shadow-black/80 backdrop-blur-2xl text-ivory">
                    <div className="px-3 pt-2 pb-2.5 border-b border-gold/25">
                      <div className="flex items-center justify-between">
                        <p className="font-display text-[11px] font-bold uppercase tracking-widest text-gold flex items-center gap-1.5">
                          <Sparkles className="size-3 text-gold" />
                          <span>{category.title} Submenus</span>
                        </p>
                        <span className="rounded-full bg-gold/15 px-1.5 py-0.2 text-[9px] font-mono text-gold-light border border-gold/30">
                          {category.items.length} Options
                        </span>
                      </div>
                      <p className="text-[11px] text-ivory/70 mt-0.5">{category.desc}</p>
                    </div>

                    <div className="mt-2 space-y-1">
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        const isExt = Boolean(item.isExternal || item.href.startsWith("http"));
                        const content = (
                          <>
                            <div
                              className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border ${
                                item.isPriority
                                  ? "bg-gold/20 text-gold border-gold/60"
                                  : "bg-white/5 text-ivory/90 border-white/10"
                              }`}
                            >
                              <Icon className="size-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-ivory flex items-center gap-1 group-hover:text-gold transition-colors">
                                  {item.label}
                                  {isExt && <ExternalLink className="size-2.5 opacity-60 text-gold" />}
                                </span>
                                {item.isPriority && (
                                  <Badge className="bg-gold text-forest-deep text-[8px] px-1.5 py-0 font-extrabold uppercase tracking-widest border border-gold/60 shadow-xs">
                                    Priority
                                  </Badge>
                                )}
                              </div>
                              {item.desc && (
                                <p className="text-[10px] text-ivory/60 leading-tight mt-0.5 truncate">
                                  {item.desc}
                                </p>
                              )}
                            </div>
                          </>
                        );

                        const itemClasses = `group flex items-start gap-3 rounded-xl p-2.5 transition-all cursor-pointer ${
                          item.isPriority
                            ? "bg-gold/10 border border-gold/40 hover:bg-gold/20 hover:border-gold"
                            : "hover:bg-white/10 text-ivory"
                        }`;

                        return isExt ? (
                          <a
                            key={item.href}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              setActiveCategory(null);
                              hoveredCategoryRef.current = null;
                            }}
                            className={itemClasses}
                          >
                            {content}
                          </a>
                        ) : (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => {
                              setActiveCategory(null);
                              hoveredCategoryRef.current = null;
                            }}
                            className={itemClasses}
                          >
                            {content}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Membership Direct Club Portal Link */}
          <a
            href="https://www.abeokutapoloclub.org.ng/register"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg px-1.5 xl:px-2 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors outline-none cursor-pointer text-ivory/85 hover:text-gold hover:bg-white/5"
            aria-label="Membership Enquiries at Abeokuta Polo Club (Opens in new tab)"
          >
            <span>Membership</span>
            <ExternalLink className="size-3 opacity-60 text-gold" />
          </a>
        </nav>

        {/* ── 3. Actions & Navigation Controls (Non-Overflowing Across All Viewports) ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Stored Pass Quick Access (visible when a registered pass exists on device) */}
          {storedPass && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-gold/60 bg-gold/10 text-gold font-semibold text-xs hover:bg-gold/20 hover:text-gold-light h-8 sm:h-9 px-2 sm:px-2.5 transition-colors"
            >
              <Link href={`/pass/${storedPass.passCode}`} className="flex items-center gap-1 sm:gap-1.5">
                <ShieldCheck className="size-3.5 text-gold shrink-0" />
                <span className="hidden min-[350px]:inline sm:inline">My Pass</span>
              </Link>
            </Button>
          )}

          {/* VIP Tables Direct CTA: visible on ultra-wide desktop where space is ample */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-gold/50 bg-forest text-gold font-semibold text-xs hover:bg-gold hover:text-forest-deep h-8.5 sm:h-9 px-3 hidden 2xl:inline-flex transition-all shadow-sm"
          >
            <Link href="/tables" className="flex items-center gap-1.5">
              <Crown className="size-3.5" />
              <span>VIP Tables</span>
            </Link>
          </Button>

          {/* Primary Registration CTA */}
          <Button
            asChild
            className={`relative group overflow-hidden bg-gradient-to-r from-gold via-gold-light to-gold-deep text-forest-deep font-extrabold text-xs px-2 sm:px-3 py-1.5 sm:py-2 h-8 sm:h-9 shadow-md border border-gold-light/60 transition-all hover:scale-[1.02] cursor-pointer ${
              storedPass ? "hidden sm:inline-flex" : "inline-flex"
            }`}
          >
            <Link href="/register" className="flex items-center gap-1 sm:gap-1.5">
              <Ticket className="size-3.5 text-forest-deep shrink-0 transition-transform group-hover:rotate-12" />
              <span className="font-extrabold tracking-wide uppercase">
                <span className="hidden min-[350px]:inline sm:hidden">Register</span>
                <span className="hidden sm:inline">Register for Pass</span>
              </span>
              <span className="rounded bg-forest-deep text-gold px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider hidden sm:inline-block">
                Day 1 Free
              </span>
            </Link>
          </Button>

          {/* Mobile Drawer Trigger (Visible below xl breakpoint) */}
          <div className="xl:hidden shrink-0">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Open Navigation Menu"
                  className="size-8 sm:size-9 border-gold/40 bg-forest text-gold hover:bg-gold hover:text-forest-deep"
                >
                  <Menu className="size-4 sm:size-5" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-full sm:max-w-md max-w-[100vw] overflow-y-auto overflow-x-hidden bg-forest-deep p-4 sm:p-6 text-ivory border-l border-gold/30 min-w-0"
              >
                <div className="flex items-center gap-3 border-b border-gold/30 pb-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-forest text-gold border border-gold/50 shadow-md">
                    <Shield className="size-5.5 text-gold" />
                  </div>
                  <div>
                    <SheetTitle className="font-display text-base font-bold text-ivory leading-tight text-left">
                      Abeokuta Polo Festival 2026
                    </SheetTitle>
                    <p className="font-serif text-[11px] font-semibold uppercase tracking-widest text-gold-light text-left">
                      The Blueprint · 18–20 Dec 2026
                    </p>
                  </div>
                </div>

                {/* Mobile Persistent Pass or Registration Hero */}
                {storedPass ? (
                  <div className="mt-5 rounded-2xl border-2 border-emerald-600 bg-emerald-900/90 p-4 text-ivory shadow-lg">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-emerald-500 text-ivory text-[10px]">SAVED PASS ON DEVICE</Badge>
                      <span className="font-mono text-xs text-gold font-bold">{storedPass.passCode}</span>
                    </div>
                    <p className="font-bold text-sm text-ivory mt-2">{storedPass.holderName}</p>
                    <p className="text-xs text-emerald-100/80">
                      Day 1: Free Entry · Day 2 &amp; 3: Through Ticket
                    </p>
                    <div className="mt-3 space-y-2">
                      <SheetClose asChild>
                        <Button asChild className="w-full bg-gold font-bold text-forest-deep hover:bg-gold/90 text-xs">
                          <Link href={`/pass/${storedPass.passCode}`}>
                            <ShieldCheck className="mr-1.5 size-4" /> Open Access Card QR
                          </Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button asChild variant="outline" className="w-full border-emerald-400/40 bg-white/10 text-ivory hover:bg-white/20 text-xs font-semibold">
                          <Link href="/register" className="flex items-center justify-center gap-1.5">
                            <Ticket className="size-3.5 text-gold" />
                            <span>Register Another Person / New Pass</span>
                          </Link>
                        </Button>
                      </SheetClose>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border-2 border-gold/60 bg-forest p-4 text-ivory shadow-lg relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold border border-gold/30">
                        <Sparkle className="size-3" /> Priority Accreditation
                      </div>
                      <Badge variant="outline" className="border-gold text-gold text-[10px]">
                        DAY 1 FREE
                      </Badge>
                    </div>

                    <h3 className="mt-2 font-display text-lg font-bold text-ivory">
                      Official Gate Access Card
                    </h3>
                    <p className="mt-1 text-xs text-ivory/80 leading-relaxed">
                      Day 1 is 100% Free Entry. Day 2 &amp; Day 3 admission is through ticket. Register now for your digital access card.
                    </p>

                    <div className="mt-4 flex flex-col gap-2">
                      <SheetClose asChild>
                        <Button
                          asChild
                          className="w-full bg-gold font-bold text-forest-deep hover:bg-gold/90 shadow-md py-2.5 text-xs sm:text-sm"
                        >
                          <Link href="/register" className="flex items-center justify-center gap-2">
                            <Ticket className="size-4" /> Register &amp; Get Pass Now
                            <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/pass/lookup"
                          className="text-center text-[11px] font-semibold text-gold/90 hover:underline pt-1"
                        >
                          Already registered? Look up your Access Card →
                        </Link>
                      </SheetClose>
                    </div>
                  </div>
                )}

                {/* Mobile Quick Action Buttons: VIP Tables, Affiliates, Membership */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <SheetClose asChild>
                    <Link
                      href="/tables"
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gold/40 bg-white/5 p-3 text-center text-[11px] font-semibold text-ivory hover:bg-gold/15 hover:border-gold transition-colors"
                    >
                      <Crown className="size-4 text-gold" />
                      <span>VIP Tables</span>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/affiliates"
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gold/40 bg-white/5 p-3 text-center text-[11px] font-semibold text-ivory hover:bg-gold/15 hover:border-gold transition-colors"
                    >
                      <Sparkles className="size-4 text-gold" />
                      <span>Affiliates (10%)</span>
                    </Link>
                  </SheetClose>
                  <a
                    href="https://www.abeokutapoloclub.org.ng/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gold/60 bg-forest p-3 text-center text-[11px] font-semibold text-ivory hover:bg-forest-interactive shadow-sm"
                  >
                    <Award className="size-4 text-gold" />
                    <span className="text-gold">Membership</span>
                  </a>
                </div>

                {/* Grouped Submenus with Clear Submenu Hierarchy */}
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between px-1 text-[11px] font-bold uppercase tracking-wider text-gold-light border-b border-gold/20 pb-2">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="size-3.5 text-gold" />
                      <span>Menu Categories &amp; Submenus</span>
                    </span>
                    <span className="text-[10px] text-ivory/60 font-mono">
                      {NAV_CATEGORIES.length} Categories
                    </span>
                  </div>

                  {NAV_CATEGORIES.map((category) => (
                    <div key={category.title} className="rounded-2xl border border-gold/30 bg-white/5 p-3.5 shadow-md">
                      <div className="flex items-center justify-between border-b border-gold/20 pb-2 mb-2 px-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-xs font-bold uppercase tracking-wider text-gold">
                            {category.title}
                          </span>
                          <span className="rounded-full bg-gold/15 px-1.5 py-0.2 text-[9px] font-mono text-gold-light border border-gold/30">
                            {category.items.length} submenus
                          </span>
                        </div>
                        <span className="text-[10px] text-ivory/60">{category.desc}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-1">
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          const isExt = Boolean(item.isExternal || item.href.startsWith("http"));
                          const rowContent = (
                            <>
                              <span className="flex items-center gap-2.5">
                                <Icon className="size-3.5 text-gold" />
                                {item.label}
                                {isExt && <ExternalLink className="size-3 opacity-60 text-gold" />}
                              </span>
                              {item.isPriority ? (
                                <Badge className="bg-gold text-forest-deep text-[9px] px-1.5 py-0 font-extrabold uppercase tracking-wider border border-gold/60">
                                  {item.href === "/register" ? "Day 1 Free" : "Priority"}
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-ivory/60">{item.desc}</span>
                              )}
                            </>
                          );

                          const rowClasses = `flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                            item.isPriority
                              ? "bg-gold/15 text-gold font-semibold border border-gold/40"
                              : "text-ivory/85 hover:bg-white/10 hover:text-gold"
                          }`;

                          return isExt ? (
                            <a
                              key={item.href}
                              href={item.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={rowClasses}
                            >
                              {rowContent}
                            </a>
                          ) : (
                            <SheetClose asChild key={item.href}>
                              <Link href={item.href} className={rowClasses}>
                                {rowContent}
                              </Link>
                            </SheetClose>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Secretariat Support Contacts */}
                <div className="mt-6 border-t border-line pt-4 text-xs text-muted-brand space-y-2">
                  <p className="font-semibold text-forest flex items-center gap-1.5">
                    <Phone className="size-3.5 text-gold-deep" /> Festival Secretariat Hotline:
                  </p>
                  <div className="flex flex-col gap-1 pl-5 text-[11px]">
                    <a href="tel:+2348181888884" className="hover:text-forest font-semibold">
                      +234 818 188 8884 (Helpline 1)
                    </a>
                    <a href="tel:08036818916" className="hover:text-forest font-semibold">
                      0803 681 8916 (Helpline 2)
                    </a>
                    <a
                      href="https://wa.me/2348181888884?text=Hello%20Festival%20Secretariat%2C%20I%20have%20an%20inquiry%20regarding%20Abeokuta%20Polo%20Festival%202026"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-forest text-emerald-700 font-semibold flex items-center gap-1"
                    >
                      <MessageCircle className="size-3 text-emerald-600" />
                      WhatsApp Secretariat Direct
                    </a>
                    <a href="mailto:abeokutapolo@gmail.com" className="hover:text-forest">
                      abeokutapolo@gmail.com
                    </a>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

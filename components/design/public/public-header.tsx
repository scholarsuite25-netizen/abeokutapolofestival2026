"use client";

import { useRef, useState } from "react";
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
  Image as ImageIcon,
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
    desc: "VIP suites, tables & corporate partnerships",
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
        href: "/sponsorship",
        label: "Corporate Partnerships",
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
    title: "Media",
    desc: "Dispatches, schedule & press",
    items: [
      {
        href: "/news",
        label: "News",
        desc: "Secretariat dispatches & notices",
        icon: Newspaper,
      },
      {
        href: "/publications",
        label: "Publications",
        desc: "Official schedule & publications",
        icon: BookOpen,
      },
      {
        href: "/press",
        label: "Press & Media",
        desc: "Media accreditation protocols",
        icon: Camera,
      },
    ],
  },
  {
    title: "Guide",
    desc: "Directions, pass recovery & venue tools",
    items: [
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Safe hover handlers with 150ms debounce to eliminate all shaking
  const handleMouseEnter = (title: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveCategory(title);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 150);
  };

  return (
    <header className="sticky top-0 z-40 w-full overflow-x-clip border-b border-line/80 bg-ivory/95 backdrop-blur-md supports-[backdrop-filter]:bg-ivory/85 print:hidden">
      <div className="mx-auto flex h-16 sm:h-18 lg:h-20 max-w-7xl items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6 lg:px-8">
        {/* ── 1. Event Brand Name: Clear & Visible ── */}
        <Link
          href="/"
          className="group flex items-center gap-2 sm:gap-3 transition-opacity hover:opacity-90 shrink min-w-0"
          aria-label="Abeokuta Polo Festival 2026 - The Blueprint"
        >
          <div className="flex size-9 sm:size-10 lg:size-11 shrink-0 items-center justify-center rounded-xl bg-forest text-gold border border-gold/40 shadow-xs transition-transform group-hover:scale-105">
            <Shield className="size-5 sm:size-6 text-gold" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-display text-xs sm:text-base lg:text-lg font-bold tracking-tight text-forest leading-tight truncate">
              Abeokuta Polo Festival 2026
            </span>
            <span className="mt-0.5 font-serif text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep leading-none flex items-center gap-1.5">
              <span>The Blueprint</span>
              <span className="hidden sm:inline-block size-1 rounded-full bg-gold" />
              <span className="hidden sm:inline-block text-[10px] text-muted-brand font-sans tracking-normal font-normal">
                18–20 Dec
              </span>
            </span>
          </div>
        </Link>

        {/* ── 2. Unified Compact Main Menu with Stable Non-Shaking Submenus ── */}
        <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-0.5 xl:gap-1">
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
                  onClick={() => setActiveCategory(isOpen ? null : category.title)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors outline-none cursor-pointer text-ink/80 hover:bg-sage/50 hover:text-forest ${
                    isOpen ? "bg-sage/60 text-forest" : ""
                  }`}
                  aria-expanded={isOpen}
                >
                  <span>{category.title}</span>
                  <ChevronDown
                    className={`size-3 transition-transform duration-200 opacity-60 ${
                      isOpen ? "rotate-180 opacity-100" : ""
                    }`}
                  />
                </button>

                {/* Inline non-portalled dropdown with invisible hover bridge (Zero Shake!) */}
                <div
                  className={`absolute ${
                    category.title === "Guide" ? "right-0" : "left-0"
                  } top-full pt-1.5 w-72 transition-all duration-150 origin-top z-50 ${
                    isOpen
                      ? "opacity-100 visible translate-y-0 pointer-events-auto"
                      : "opacity-0 invisible -translate-y-2 pointer-events-none"
                  }`}
                >
                  {/* Invisible Hitbox Bridge preventing mouseLeave gap */}
                  <div className="absolute -top-2 left-0 right-0 h-4 bg-transparent" />

                  <div className="rounded-xl border border-line bg-card p-2.5 shadow-xl">
                    <div className="px-2.5 pt-1 pb-1.5 border-b border-line/60">
                      <p className="font-display text-[11px] font-bold uppercase tracking-wider text-forest">
                        {category.title}
                      </p>
                      <p className="text-[10px] text-muted-brand">{category.desc}</p>
                    </div>

                    <div className="mt-1.5 space-y-0.5">
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setActiveCategory(null)}
                            className={`flex items-start gap-2.5 rounded-lg p-2 transition-colors cursor-pointer ${
                              item.isPriority
                                ? "bg-gold/15 border border-gold/50 text-forest hover:bg-gold/25"
                                : "hover:bg-sage/40 text-ink"
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${
                                item.isPriority ? "bg-forest text-gold" : "bg-sage/60 text-forest"
                              }`}
                            >
                              <Icon className="size-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-forest">
                                  {item.label}
                                </span>
                                {item.isPriority && (
                                  <Badge className="bg-forest text-gold text-[8px] px-1.5 py-0 font-bold uppercase tracking-widest border border-gold/40">
                                    Priority
                                  </Badge>
                                )}
                              </div>
                              {item.desc && (
                                <p className="text-[10px] text-muted-brand leading-tight mt-0.5 truncate">
                                  {item.desc}
                                </p>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── 3. High-Priority Registration CTA (Find My Pass removed to keep navbar clean) ── */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {storedPass && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-gold/60 bg-gold/10 text-forest font-semibold text-xs hover:bg-gold/20 h-8 px-2.5"
            >
              <Link href={`/pass/${storedPass.passCode}`} className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-gold-deep" />
                <span>My Pass</span>
              </Link>
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-gold/60 bg-gold/10 text-forest font-semibold text-xs hover:bg-gold/20 h-8 sm:h-9 px-2.5 sm:px-3 hidden xl:inline-flex"
          >
            <Link href="/sponsorship" className="flex items-center gap-1.5">
              <Building2 className="size-3.5 text-gold-deep" />
              <span>Sponsorship</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-gold/60 bg-gold/10 text-forest font-semibold text-xs hover:bg-gold/20 h-8 sm:h-9 px-2.5 sm:px-3 hidden lg:inline-flex"
          >
            <Link href="/affiliates" className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-gold-deep" />
              <span>Affiliates</span>
              <span className="rounded bg-gold/25 px-1 py-0.2 text-[8px] font-bold text-gold uppercase">10%</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-gold/60 bg-gold/10 text-forest font-semibold text-xs hover:bg-gold/20 h-8 sm:h-9 px-2.5 sm:px-3 hidden md:inline-flex"
          >
            <Link href="/tables" className="flex items-center gap-1.5">
              <Crown className="size-3.5 text-gold-deep" />
              <span>VIP Tables</span>
            </Link>
          </Button>

          <Button
            asChild
            className="relative group overflow-hidden bg-forest text-ivory hover:bg-forest-interactive font-semibold text-xs px-3 sm:px-4 py-2 h-8 sm:h-9 shadow-xs border border-gold/50 transition-all hover:shadow-md hover:border-gold hover:scale-[1.01] cursor-pointer"
          >
            <Link href="/register" className="flex items-center gap-1.5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-gold" />
              </span>
              <Ticket className="size-3.5 text-gold shrink-0 transition-transform group-hover:rotate-12" />
              <span className="font-semibold tracking-wide">Register for Pass</span>
              <span className="rounded bg-gold/25 px-1.5 py-0.5 text-[8px] font-bold text-gold uppercase tracking-wider border border-gold/40">
                Day 1 Free
              </span>
            </Link>
          </Button>
        </div>

        {/* ── 4. Mobile Quick Actions & Drawer ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden shrink-0">
          {storedPass && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-gold/60 bg-gold/10 text-forest font-semibold text-xs h-8 px-2 sm:hidden"
            >
              <Link href={`/pass/${storedPass.passCode}`} className="flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-gold-deep" />
                <span>My Pass</span>
              </Link>
            </Button>
          )}

          <Button
            asChild
            size="sm"
            className="bg-forest text-ivory hover:bg-forest-interactive font-semibold text-xs px-2.5 sm:px-3 shadow-xs border border-gold/40 sm:hidden"
          >
            <Link href="/register" className="flex items-center gap-1.5">
              <Ticket className="size-3.5 text-gold" />
              <span>Register</span>
            </Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open Navigation Menu"
                className="border-line bg-card hover:bg-sage/40"
              >
                <Menu className="size-5 text-forest" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-full sm:max-w-md max-w-[100vw] overflow-y-auto overflow-x-hidden bg-ivory p-4 sm:p-6 text-ink border-l border-line min-w-0"
            >
              <div className="flex items-center gap-3 border-b border-line pb-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-forest text-gold border border-gold/40">
                  <Shield className="size-5 text-gold" />
                </div>
                <div>
                  <SheetTitle className="font-display text-base font-bold text-forest leading-tight text-left">
                    Abeokuta Polo Festival 2026
                  </SheetTitle>
                  <p className="font-serif text-[11px] font-semibold uppercase tracking-widest text-gold-deep text-left">
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

              {/* Mobile Quick Action Buttons: Sponsorship, Affiliates, VIP Tables */}
              <div className="mt-4 grid grid-cols-3 gap-1.5">
                <SheetClose asChild>
                  <Link
                    href="/sponsorship"
                    className="flex flex-col items-center justify-center gap-1 rounded-xl border border-gold/40 bg-gold/10 p-2.5 text-center text-[11px] font-semibold text-forest hover:bg-gold/20"
                  >
                    <Building2 className="size-4 text-gold-deep" />
                    <span>Sponsorship</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/affiliates"
                    className="flex flex-col items-center justify-center gap-1 rounded-xl border border-gold/40 bg-gold/10 p-2.5 text-center text-[11px] font-semibold text-forest hover:bg-gold/20"
                  >
                    <Sparkles className="size-4 text-gold-deep" />
                    <span>Affiliates</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/tables"
                    className="flex flex-col items-center justify-center gap-1 rounded-xl border border-gold/40 bg-gold/10 p-2.5 text-center text-[11px] font-semibold text-forest hover:bg-gold/20"
                  >
                    <Crown className="size-4 text-gold-deep" />
                    <span>VIP Tables</span>
                  </Link>
                </SheetClose>
              </div>

              {/* Grouped Submenus */}
              <div className="mt-6 space-y-4">
                {NAV_CATEGORIES.map((category) => (
                  <div key={category.title} className="rounded-xl border border-line bg-card p-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-line/60 pb-1.5 mb-2 px-1">
                      <span className="font-display text-xs font-bold uppercase tracking-wider text-forest">
                        {category.title}
                      </span>
                      <span className="text-[10px] text-muted-brand">{category.desc}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-1">
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <SheetClose asChild key={item.href}>
                            <Link
                              href={item.href}
                              className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                                item.isPriority
                                  ? "bg-gold/15 text-forest font-semibold"
                                  : "text-ink/80 hover:bg-sage/40 hover:text-forest"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <Icon className="size-3.5 text-gold-deep" />
                                {item.label}
                              </span>
                              {item.isPriority ? (
                                <Badge className="bg-forest text-gold text-[9px] px-1 py-0 font-bold uppercase">
                                  Day 1 Free
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-muted-brand">{item.desc}</span>
                              )}
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
    </header>
  );
}

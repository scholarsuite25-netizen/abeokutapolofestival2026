"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Ticket,
  QrCode,
  Search,
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
  Menu,
  ChevronDown,
  UserCheck,
  ArrowRight,
  Sparkle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface SubmenuItem {
  href: string;
  label: string;
  desc: string;
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
    desc: "Chukkas, fixtures & royal cup championship",
    items: [
      {
        href: "/programme",
        label: "Programme",
        desc: "3-day chukka schedules & timetable",
        icon: Calendar,
      },
      {
        href: "/royal-cup",
        label: "Royal Cup",
        desc: "Historic trophy & royal patronage feature",
        icon: Trophy,
      },
      {
        href: "/experiences",
        label: "Experiences",
        desc: "Cultural celebrations & twilight gala",
        icon: Sparkles,
      },
    ],
  },
  {
    title: "Hospitality",
    desc: "VIP suites, chalets & corporate hosting",
    items: [
      {
        href: "/hospitality",
        label: "Enclosures",
        desc: "Royal Dais, chalets & terrace suites",
        icon: Crown,
      },
      {
        href: "/sponsorship",
        label: "Partnerships",
        desc: "Brand sponsorship & executive hosting",
        icon: Building2,
      },
    ],
  },
  {
    title: "Media",
    desc: "Tournament dispatches, gazette & photography",
    items: [
      {
        href: "/news",
        label: "News",
        desc: "Latest festival dispatches & notices",
        icon: Newspaper,
      },
      {
        href: "/gallery",
        label: "Gallery",
        desc: "Match action & equestrian society photos",
        icon: ImageIcon,
      },
      {
        href: "/publications",
        label: "Gazette",
        desc: "Commemorative brochures & magazines",
        icon: BookOpen,
      },
      {
        href: "/press",
        label: "Press",
        desc: "Media protocols & accreditation",
        icon: Camera,
      },
    ],
  },
  {
    title: "Guide",
    desc: "Directions, venue maps & visitor protocols",
    items: [
      {
        href: "/visit",
        label: "Visit",
        desc: "Club location, directions & parking",
        icon: MapPin,
      },
      {
        href: "/faq",
        label: "FAQs",
        desc: "Visitor dress codes & etiquette",
        icon: HelpCircle,
      },
    ],
  },
  {
    title: "Access",
    desc: "Registration, pass retrieval & gate verification",
    items: [
      {
        href: "/register",
        label: "Register for Pass",
        desc: "Instant gate access card with 3-day QR tracking",
        icon: Ticket,
        isPriority: true,
      },
      {
        href: "/pass/lookup",
        label: "Find My Pass",
        desc: "Look up access card by pass code or email",
        icon: Search,
      },
      {
        href: "/scan",
        label: "Gate Scanner",
        desc: "Turnstile attendance verification PWA",
        icon: QrCode,
      },
      {
        href: "/dashboard/pass",
        label: "My Credentials",
        desc: "Member wallet & digital gate pass",
        icon: UserCheck,
      },
    ],
  },
];

export function PublicHeader() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ivory/95 backdrop-blur-md supports-[backdrop-filter]:bg-ivory/85">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* ── 1. Event Brand Name: Clear & Visible ── */}
        <Link
          href="/"
          className="group flex items-center gap-3 transition-opacity hover:opacity-90 shrink-0"
          aria-label="Abeokuta Polo Festival 2026 - The Blueprint"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-forest text-gold border border-gold/40 shadow-xs transition-transform group-hover:scale-105">
            <Shield className="size-6 text-gold" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-base sm:text-lg lg:text-xl font-bold tracking-tight text-forest leading-tight">
              Abeokuta Polo Festival 2026
            </span>
            <span className="mt-0.5 font-serif text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep leading-none flex items-center gap-1.5">
              <span>The Blueprint</span>
              <span className="hidden sm:inline-block size-1 rounded-full bg-gold" />
              <span className="hidden sm:inline-block text-[10px] text-muted-brand font-sans tracking-normal font-normal">
                18–20 Dec
              </span>
            </span>
          </div>
        </Link>

        {/* ── 2. Unified Single-Word Main Menu with Submenus (Desktop) ── */}
        <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-1">
          {NAV_CATEGORIES.map((category) => (
            <div
              key={category.title}
              onMouseEnter={() => setOpenDropdown(category.title)}
              onMouseLeave={() => setOpenDropdown(null)}
              className="relative"
            >
              <DropdownMenu
                open={openDropdown === category.title}
                onOpenChange={(isOpen) => setOpenDropdown(isOpen ? category.title : null)}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all outline-none cursor-pointer ${
                      category.title === "Access"
                        ? "text-forest hover:bg-gold/15 hover:text-forest-deep"
                        : "text-ink/80 hover:bg-sage/50 hover:text-forest"
                    } ${openDropdown === category.title ? "bg-sage/60 text-forest" : ""}`}
                  >
                    <span>{category.title}</span>
                    <ChevronDown
                      className={`size-3.5 transition-transform duration-200 opacity-60 ${
                        openDropdown === category.title ? "rotate-180 opacity-100" : ""
                      }`}
                    />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="start"
                  sideOffset={8}
                  className="w-80 rounded-2xl border border-line bg-card p-3 shadow-xl animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
                >
                  <div className="px-3 pt-1 pb-2 border-b border-line/60">
                    <p className="font-display text-xs font-bold uppercase tracking-wider text-forest">
                      {category.title}
                    </p>
                    <p className="text-[11px] text-muted-brand">{category.desc}</p>
                  </div>

                  <div className="mt-2 space-y-1">
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem asChild key={item.href} className="p-0 focus:bg-transparent">
                          <Link
                            href={item.href}
                            onClick={() => setOpenDropdown(null)}
                            className={`flex items-start gap-3 rounded-xl p-2.5 transition-colors cursor-pointer ${
                              item.isPriority
                                ? "bg-gold/15 border border-gold/50 text-forest hover:bg-gold/25"
                                : "hover:bg-sage/40 text-ink"
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${
                                item.isPriority
                                  ? "bg-forest text-gold"
                                  : "bg-sage/60 text-forest"
                              }`}
                            >
                              <Icon className="size-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-forest">
                                  {item.label}
                                </span>
                                {item.isPriority && (
                                  <Badge className="bg-forest text-gold text-[9px] px-1.5 py-0 font-bold uppercase tracking-widest border border-gold/40">
                                    Priority
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-brand leading-tight mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </nav>

        {/* ── 3. High-Priority Registration Call-to-Action (Desktop) ── */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/pass/lookup"
            className="text-xs font-semibold text-muted-brand hover:text-forest transition-colors px-2 py-1.5"
          >
            Find My Pass
          </Link>

          <Button
            asChild
            className="relative group overflow-hidden bg-forest text-ivory hover:bg-forest-interactive font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 shadow-md border border-gold/50 transition-all hover:shadow-lg hover:border-gold hover:scale-[1.02] cursor-pointer"
          >
            <Link href="/register" className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-gold" />
              </span>
              <Ticket className="size-4 text-gold shrink-0 transition-transform group-hover:rotate-12" />
              <span className="font-semibold tracking-wide">Register for Pass</span>
              <span className="rounded bg-gold/25 px-1.5 py-0.5 text-[9px] font-bold text-gold uppercase tracking-wider border border-gold/40">
                Free
              </span>
            </Link>
          </Button>
        </div>

        {/* ── 4. Mobile Quick Actions & Drawer ── */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* Mobile Direct Register CTA Button */}
          <Button
            asChild
            size="sm"
            className="bg-forest text-ivory hover:bg-forest-interactive font-semibold text-xs px-3 shadow-xs border border-gold/40 sm:hidden"
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
              className="w-full sm:max-w-md overflow-y-auto bg-ivory p-6 text-ink border-l border-line"
            >
              {/* Header inside Drawer */}
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

              {/* ── Priority Registration Hero Card inside Mobile Menu ── */}
              <div className="mt-5 rounded-2xl border-2 border-gold/60 bg-forest p-4 text-ivory shadow-lg relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold border border-gold/30">
                    <Sparkle className="size-3" /> Priority Accreditation
                  </div>
                  <Badge variant="outline" className="border-gold text-gold text-[10px]">
                    COMPLIMENTARY
                  </Badge>
                </div>

                <h3 className="mt-2 font-display text-lg font-bold text-ivory">
                  Official Gate Access Card
                </h3>
                <p className="mt-1 text-xs text-ivory/80 leading-relaxed">
                  Register to get your digital access card with instant QR daily turnstile check-in for all 3 days.
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

              {/* ── Submenus Grouped by Relationship ── */}
              <div className="mt-6 space-y-5">
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
                                  Free Pass
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
                  <a href="tel:+2348181888884" className="hover:text-forest">
                    +234 818 188 8884
                  </a>
                  <a href="tel:08036818916" className="hover:text-forest">
                    0803 681 8916
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

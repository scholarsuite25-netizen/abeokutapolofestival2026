import Link from "next/link";
import { Menu, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const PRIMARY_NAV = [
  { href: "/", label: "Home" },
  { href: "/programme", label: "Programme" },
  { href: "/experiences", label: "Experiences" },
  { href: "/royal-cup", label: "Royal Cup" },
  { href: "/hospitality", label: "Hospitality" },
  { href: "/sponsorship", label: "Sponsorship" },
  { href: "/gallery", label: "Gallery" },
  { href: "/news", label: "News" },
  { href: "/visit", label: "Visit" },
  { href: "/faq", label: "FAQ" },
] as const;

const UTILITY_NAV = [
  { href: "/publications", label: "Publications" },
  { href: "/press", label: "Press" },
  { href: "/dashboard/pass", label: "My Pass" },
  { href: "/sign-in", label: "Sign In" },
] as const;

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ivory/90 backdrop-blur supports-[backdrop-filter]:bg-ivory/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-forest">
          <span aria-hidden className="inline-block size-2.5 rounded-full bg-gold" />
          Abeokuta Polo Festival
          <span className="sr-only">— home</span>
        </Link>

        <nav aria-label="Primary" className="ml-6 hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-2.5 py-1.5 text-sm font-medium text-ink/80 transition-colors hover:bg-sage hover:text-forest-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-interactive"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-1 md:flex">
          {UTILITY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-2.5 py-1.5 text-sm font-medium text-muted-brand transition-colors hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-interactive"
            >
              {item.label}
            </Link>
          ))}
          <Button asChild size="sm" className="ml-2 bg-gold font-semibold text-forest-deep hover:bg-gold/90">
            <Link href="/register">Register</Link>
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <Button asChild variant="ghost" size="icon" aria-label="Call the festival office">
            <a href="tel:+2348181888884">
              <Phone className="size-4" />
            </a>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="font-display text-forest">Menu</SheetTitle>
              <nav aria-label="Mobile" className="mt-6 flex flex-col gap-1">
                {[...PRIMARY_NAV, ...UTILITY_NAV].map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded px-3 py-2 text-base font-medium text-ink hover:bg-sage hover:text-forest-deep"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Button asChild className="mt-4 bg-gold font-semibold text-forest-deep hover:bg-gold/90">
                    <Link href="/register">Register — free entry</Link>
                  </Button>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import {
  Camera,
  FileText,
  ShieldCheck,
  Tv,
  Video,
  Clock,
  ArrowRight,
  CheckCircle2,
  Phone,
  Mail,
  AlertTriangle,
  FolderArchive,
  Calendar,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReadMoreSection } from "@/components/shared/read-more-section";

interface MediaCategory {
  id: string;
  title: string;
  badge: string;
  icon: typeof Camera;
  description: string;
  privileges: string[];
  equipmentAllowed: string;
}

const MEDIA_CATEGORIES: MediaCategory[] = [
  {
    id: "broadcast",
    title: "Live Broadcast & Television Syndicate",
    badge: "Commentary / Broadcast",
    icon: Tv,
    description:
      "Accredited national and regional broadcast crews, camera operators, commentary personnel, and transmission engineers.",
    privileges: [
      "Access to Elevated Commentary and Media Area",
      "Designated mixed-zone post-match player interviews",
      "Power tap-in access at Media Compound",
    ],
    equipmentAllowed: "Broadcast cameras, boom mics, mobile transmission units",
  },
  {
    id: "photo",
    title: "Pitch-Side Photojournalists",
    badge: "Pitch Boards / Ceremony",
    icon: Camera,
    description:
      "Accredited photojournalists representing international wire agencies, national dailies, and equestrian sporting publications.",
    privileges: [
      "Designated fieldboard photo pits during match play",
      "Royal Trophy presentation court access",
      "Pony lines and ceremonial procession access",
    ],
    equipmentAllowed: "Telephoto lenses, monopod, official hi-vis safety vest",
  },
  {
    id: "print",
    title: "Print & Wire Correspondents",
    badge: "Press Box",
    icon: FileText,
    description:
      "Sports reporters, feature writers, and correspondents documenting match reports, tournament culture, and festival proceedings.",
    privileges: [
      "Seating in the designated Media Enclosure",
      "Chukker-by-chukker scoresheet delivery",
      "Official post-match Q&A with Team Captains",
    ],
    equipmentAllowed: "Laptops, audio recorders, mobile reporting kits",
  },
  {
    id: "digital",
    title: "Digital Creators & Equestrian Documentarians",
    badge: "Lifestyle & Culture",
    icon: Video,
    description:
      "Accredited documentary film crews, lifestyle video producers, and cultural storytellers documenting the festival pageantry.",
    privileges: [
      "Kings Procession and ceremonial opening access",
      "Adire fashion and pavilion lifestyle documentation",
      "Post-match trophy gala coverage",
    ],
    equipmentAllowed: "Gimbal rigs, mirrorless cinema bodies, lapel audio",
  },
];

export function PressHub() {
  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. OFFICIAL FESTIVAL MEDIA OVERVIEW                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-line bg-card p-4 sm:p-5 shadow-sm min-w-0">
          <div className="flex size-10 items-center justify-center rounded-lg bg-forest/10 text-forest">
            <Calendar className="size-5" />
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-forest">18–20 Dec</p>
          <p className="text-xs text-muted-brand font-medium uppercase tracking-wide">Festival Dates</p>
          <p className="mt-1 text-[11px] text-muted-brand">3 ceremonial days of polo &amp; culture</p>
        </div>

        <div className="rounded-xl border border-line bg-card p-4 sm:p-5 shadow-sm min-w-0">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gold/15 text-gold-dim">
            <MapPin className="size-5" />
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-forest">Kobape Turf</p>
          <p className="text-xs text-muted-brand font-medium uppercase tracking-wide">Host Grounds</p>
          <p className="mt-1 text-[11px] text-muted-brand">Abeokuta–Sagamu Expressway, Ogun State</p>
        </div>

        <div className="rounded-xl border border-line bg-card p-4 sm:p-5 shadow-sm min-w-0">
          <div className="flex size-10 items-center justify-center rounded-lg bg-forest/10 text-forest">
            <Mail className="size-5" />
          </div>
          <p className="mt-3 font-display text-xl font-bold text-forest truncate">Email Desk</p>
          <p className="text-xs text-muted-brand font-medium uppercase tracking-wide">Press Inquiries</p>
          <p className="mt-1 text-[11px] text-muted-brand truncate">abeokutapolo@gmail.com</p>
        </div>

        <div className="rounded-xl border border-line bg-card p-4 sm:p-5 shadow-sm min-w-0">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gold/15 text-gold-dim">
            <ShieldCheck className="size-5" />
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-forest">Gate 1 VIP</p>
          <p className="text-xs text-muted-brand font-medium uppercase tracking-wide">Accreditation Access</p>
          <p className="mt-1 text-[11px] text-muted-brand">Dedicated media &amp; VIP turnstile ingress</p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. OFFICIAL SECRETARIAT MEDIA DESK STATEMENT                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-forest text-ivory p-4 sm:p-8 min-w-0 max-w-full">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -right-20 size-80 rounded-full bg-gold/15 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between min-w-0">
          <div className="space-y-2 max-w-2xl min-w-0">
            <div className="flex items-center gap-2">
              <Badge className="bg-gold text-forest-deep text-[10px] font-bold uppercase tracking-wider">
                Media &amp; Public Relations
              </Badge>
              <span className="text-xs text-ivory/70">Abeokuta Polo Club</span>
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl text-ivory">
              Secretariat Media Inquiries & Accreditation Desk
            </h2>
            <p className="text-xs sm:text-sm text-ivory/85 leading-relaxed">
              Official press bulletins, match notices, photography access credentials, and tournament releases
              are issued directly by the Secretariat Media Committee. Qualified journalists and media organizations
              may apply for accreditation to receive official credentials.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full sm:w-auto min-w-0">
            <Button
              asChild
              className="h-auto py-2.5 px-4 bg-gold font-semibold text-forest-deep hover:bg-gold/90 shadow text-xs sm:text-sm whitespace-normal w-full sm:w-auto text-center"
            >
              <Link href="/register">
                <span>Apply for Media Accreditation →</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-auto py-2.5 px-4 border-gold/40 bg-white/10 text-ivory hover:bg-white/20 text-xs sm:text-sm whitespace-normal w-full sm:w-auto text-center"
            >
              <Link href="/news">
                <FileText className="mr-2 size-4 text-gold shrink-0" />
                <span>Secretariat Notices</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. MEDIA ACCREDITATION CATEGORIES                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section aria-labelledby="accreditation-categories-title" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-line pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-gold-dim">
              Credential Guidelines
            </span>
            <h2
              id="accreditation-categories-title"
              className="font-display text-2xl font-semibold text-forest sm:text-3xl"
            >
              Media Accreditation Categories
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-brand">
            <Clock className="size-3.5 text-gold" />
            <span>Accreditation Deadline: <strong>27 November 2026</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {MEDIA_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className="flex flex-col justify-between rounded-2xl border border-line bg-card p-6 shadow-sm hover:border-gold/50 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="border-gold/40 bg-gold/10 text-forest text-[10px] font-semibold">
                      {cat.badge}
                    </Badge>
                    <span className="flex size-8 items-center justify-center rounded-lg bg-sage/60 text-forest">
                      <Icon className="size-4" />
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-xl font-semibold text-forest">
                    {cat.title}
                  </h3>
                  <p className="mt-2 text-xs text-muted-brand leading-relaxed">
                    {cat.description}
                  </p>

                  <div className="mt-4 rounded-xl border border-line bg-sage/20 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-forest mb-2">
                      Accreditation Privileges:
                    </p>
                    {cat.privileges.length > 2 ? (
                      <ReadMoreSection
                        variant="pill"
                        moreText={`View all ${cat.privileges.length} privileges`}
                        lessText="Show fewer privileges"
                        summary={
                          <ul className="space-y-1.5">
                            {cat.privileges.slice(0, 2).map((priv, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-ink">
                                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-gold-dim" />
                                <span>{priv}</span>
                              </li>
                            ))}
                          </ul>
                        }
                        details={
                          <ul className="space-y-1.5 pt-1.5">
                            {cat.privileges.slice(2).map((priv, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-ink">
                                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-gold-dim" />
                                <span>{priv}</span>
                              </li>
                            ))}
                          </ul>
                        }
                      />
                    ) : (
                      <ul className="space-y-1.5">
                        {cat.privileges.map((priv, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-ink">
                            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-gold-dim" />
                            <span>{priv}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-line/60 pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-muted-brand">
                    <strong>Gear:</strong> {cat.equipmentAllowed}
                  </span>
                  <Button
                    asChild
                    size="sm"
                    className="h-8 bg-forest text-ivory text-xs font-semibold hover:bg-forest-interactive"
                  >
                    <Link href="/register">
                      Apply for Pass <ArrowRight className="ml-1 size-3 text-gold" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. EQUESTRIAN TURF SAFETY PROTOCOLS FOR PRESS                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="safety-protocol-heading"
        className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-900">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-2">
            <h3 id="safety-protocol-heading" className="font-display text-xl font-bold text-amber-950">
              Critical Equestrian Safety Regulations for Media Crews
            </h3>
            <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
              Polo is a high-speed collision equestrian sport. Thoroughbred horses gallop at over 60 km/h,
              and solid plastic balls travel at high velocities. Pitch-side photographers and operators must strictly obey safety marshals:
            </p>
            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-950 font-medium">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-amber-700" />
                No flashes, strobe lighting, or reflective boards during live chukkers.
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-amber-700" />
                Never step inside the wooden boundary sideboards while ball is in play.
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-amber-700" />
                High-visibility media vests must be worn at all times near horse lines.
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-amber-700" />
                Drone flights are strictly prohibited without Ogun Airspace &amp; Club clearance.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. MEDIA DESK CONTACTS & INTERVIEW BOOKING                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="media-liaison-heading"
        className="rounded-2xl border border-line bg-card p-6 sm:p-8 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-gold-dim">
              Secretariat Desk
            </span>
            <h2 id="media-liaison-heading" className="font-display text-2xl font-semibold text-forest">
              Direct Media Protocol Liaison
            </h2>
            <p className="text-xs text-muted-brand mt-1">
              For broadcast arrangements, captain interviews, or royal dais clearance coordination.
            </p>
          </div>

          <Button asChild className="bg-gold font-semibold text-forest-deep hover:bg-gold/90 shadow">
            <Link href="/register">Submit Media Accreditation →</Link>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-sage/20 p-4">
            <Phone className="size-4 text-gold mb-2" />
            <p className="text-xs font-semibold text-forest">Media Protocol Direct Line</p>
            <p className="text-[11px] text-muted-brand mt-0.5">+234 818 188 8884 · 0803 681 8916</p>
            <p className="text-[10px] text-forest-interactive mt-2 font-medium">Available 08:00–20:00 WAT</p>
          </div>

          <div className="rounded-xl border border-line bg-sage/20 p-4">
            <Mail className="size-4 text-gold mb-2" />
            <p className="text-xs font-semibold text-forest">Media Accreditation Email</p>
            <p className="text-[11px] text-muted-brand mt-0.5 break-all">abeokutapolo@gmail.com</p>
            <p className="text-[10px] text-forest-interactive mt-2 font-medium">Responses within 24 hours</p>
          </div>

          <div className="rounded-xl border border-line bg-sage/20 p-4">
            <FolderArchive className="size-4 text-gold mb-2" />
            <p className="text-xs font-semibold text-forest">On-Site Media Workroom</p>
            <p className="text-[11px] text-muted-brand mt-0.5">Western Pavilion Wing, Kobape Turf</p>
            <p className="text-[10px] text-forest-interactive mt-2 font-medium">Opens daily 09:00 AM</p>
          </div>
        </div>
      </section>
    </div>
  );
}

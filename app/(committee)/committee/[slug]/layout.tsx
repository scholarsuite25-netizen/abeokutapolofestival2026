import Link from "next/link";
import { Suspense } from "react";
import { requireCommittee, committeeNav } from "@/lib/auth/committee";
import { isSupabaseConfigured } from "@/lib/env";
import { StatusBadge } from "@/components/shared/status-badge";
import { CardSkeleton } from "@/components/shared/page-skeleton";

async function CommitteeHeader({ slug }: { slug: string }) {
  if (!isSupabaseConfigured()) return null;

  // requireCommittee redirects signed-out users and 404s invisible committees.
  const { committee } = await requireCommittee(slug);

  return (
    <div className="border-b border-line bg-ivory">
      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-xl font-semibold text-forest">
            {committee.name}
          </h1>
          <StatusBadge tone={committee.status === "active" ? "success" : "warning"}>
            {committee.status === "active" ? "Active" : "Proposed — pending approval"}
          </StatusBadge>
        </div>
        <nav aria-label="Committee sections" className="mt-4 flex flex-wrap gap-1">
          {committeeNav(slug).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-sage hover:text-forest-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-interactive"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default function CommitteeSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  return (
    <div>
      <Suspense
        fallback={
          <div className="border-b border-line bg-ivory">
            <div className="mx-auto max-w-6xl px-4 py-5">
              <CardSkeleton className="border-0 bg-sage/40" />
            </div>
          </div>
        }
      >
        <CommitteeHeaderWithParams params={params} />
      </Suspense>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}

async function CommitteeHeaderWithParams({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CommitteeHeader slug={slug} />;
}

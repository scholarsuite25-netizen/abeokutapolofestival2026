import { Suspense } from "react";
import type { Metadata } from "next";
import { AffiliatesCentreClient } from "./affiliates-client";
import { PageSkeleton } from "@/components/shared/page-skeleton";

export const metadata: Metadata = {
  title: "International Affiliate Centre (10% Commission) — 2026 Abeokuta Polo Festival",
  description:
    "Join the official Abeokuta Polo Festival 2026 International Affiliate Centre. Earn guaranteed 10% commission on confirmed passes and exclusive VIP table enclosures. Access promotional kits and global ticketing directories.",
};

export default function AffiliatesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AffiliatesCentreClient />
    </Suspense>
  );
}

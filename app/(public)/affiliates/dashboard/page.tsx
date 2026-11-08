import { Suspense } from "react";
import type { Metadata } from "next";
import { AffiliateDashboardClient } from "./affiliate-dashboard-client";
import { PageSkeleton } from "@/components/shared/page-skeleton";

export const metadata: Metadata = {
  title: "Affiliate Partner Dashboard — Abeokuta Polo Festival 2026",
  description:
    "Real-time affiliate performance portal. Track link clicks, confirmed pass and table sales, 10% commission ledger, and payout requests.",
};

export default function AffiliateDashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AffiliateDashboardClient />
    </Suspense>
  );
}

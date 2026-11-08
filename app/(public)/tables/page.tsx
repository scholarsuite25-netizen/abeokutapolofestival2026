import { Suspense } from "react";
import type { Metadata } from "next";
import { TablesBookingClient } from "./tables-booking-client";
import { PageSkeleton } from "@/components/shared/page-skeleton";

export const metadata: Metadata = {
  title: "VIP Table Packages — Abeokuta Polo Festival 2026 Grand Finale",
  description:
    "Reserve private serial-numbered tables of 10 for the Grand Finale of Abeokuta Polo Festival 2026. Ultra-exclusive hospitality in Kings Arena, Royal Pavilion, Queens Lounge, and Clubhouse Terrace.",
};

export default function TablesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TablesBookingClient />
    </Suspense>
  );
}

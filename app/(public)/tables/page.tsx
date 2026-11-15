import { Suspense } from "react";
import type { Metadata } from "next";
import { TablesBookingClient } from "./tables-booking-client";
import { PageSkeleton } from "@/components/shared/page-skeleton";

export const metadata: Metadata = {
  title: "Day 3 Grand Finale — VIP Tables & VVIP Passes | Abeokuta Polo Festival 2026",
  description:
    "Register for Day 3 (Sunday 20 December 2026): reserve a private serial-numbered VIP table or an individual VVIP pass for the Royal Cup Grand Finale of Abeokuta Polo Festival 2026.",
};

export default function TablesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TablesBookingClient />
    </Suspense>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { InvitationRedemptionClient } from "./invitation-client";
import { PageSkeleton } from "@/components/shared/page-skeleton";

export const metadata: Metadata = {
  title: "Redeem Special VIP Invitation Code — Day 3 Grand Finale",
  description:
    "Redeem the complimentary Special VIP Invitation Code printed on your official invitation for the Day 3 Royal Cup Grand Finale of Abeokuta Polo Festival 2026 (Sunday 20 December 2026).",
};

export default function InvitationRedemptionPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <InvitationRedemptionClient />
    </Suspense>
  );
}

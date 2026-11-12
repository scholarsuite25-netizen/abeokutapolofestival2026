"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { approveBankTransferAction } from "@/lib/actions/registrations";

/**
 * Finance Panel — Official Brochure Pricing (Permanently Active)
 * The ₦100 pilot testing fee has been permanently concluded.
 */
export function FinanceTestingFeePanel() {
  return (
    <div className="rounded-xl border-2 border-gold/60 bg-gradient-to-r from-forest via-forest-deep to-forest p-5 text-ivory shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-gold text-forest font-extrabold uppercase tracking-wider text-[10px]">
              Official Brochure Pricing — Permanently Active
            </Badge>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/90 border border-emerald-400/50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200">
              <CheckCircle2 className="h-3 w-3 text-emerald-300" />
              ₦100 Testing Concluded — Live Pricing Active
            </span>
          </div>

          <h3 className="font-display text-base sm:text-lg font-bold text-ivory flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold shrink-0" />
            <span>Day 3 Grand Finale — Official Brochure Pricing</span>
          </h3>

          <p className="text-xs text-ivory/85 leading-relaxed max-w-3xl">
            <strong>Live Official Brochure Pricing:</strong> All public checkouts on{" "}
            <code className="text-gold">/tables</code> and{" "}
            <code className="text-gold">/register</code> charge official brochure amounts:{" "}
            <strong>₦5,000,000</strong> Kings Table · <strong>₦3,000,000</strong> Royal Table ·{" "}
            <strong>₦2,000,000</strong> Queens Table · <strong>₦500,000</strong> Premium Table ·{" "}
            <strong>₦50,000</strong> Regular Section. Payment is via Direct Wema Bank Transfer
            (Acct: 0126769779). The pilot testing fee has been permanently concluded.
          </p>
        </div>
      </div>
    </div>
  );
}

export function VerifyTableTransferButton({
  reference,
  isConfirmed,
}: {
  reference: string;
  isConfirmed: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(isConfirmed);

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Verified
      </span>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const res = await approveBankTransferAction(reference);
          if (res.ok) {
            setDone(true);
            router.refresh();
          }
        });
      }}
      className="h-7 bg-emerald-800 hover:bg-emerald-900 text-ivory text-[11px] px-2.5 font-semibold cursor-pointer"
    >
      {isPending ? "Verifying..." : "Approve Transfer"}
    </Button>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toggleTestingFeeModeAction } from "@/app/(public)/register/actions";
import { approveBankTransferAction } from "@/lib/actions/registrations";
import type { TestingFeeStatus } from "@/lib/config/testing-fee-mode";

interface FinanceTestingFeePanelProps {
  initialStatus: TestingFeeStatus;
}

export function FinanceTestingFeePanel({ initialStatus }: FinanceTestingFeePanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState<TestingFeeStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (nextEnabled: boolean) => {
    startTransition(async () => {
      const updated = await toggleTestingFeeModeAction(
        nextEnabled,
        nextEnabled
          ? "admin_finance_manual_enable"
          : "admin_finance_manual_disable_official_brochure_active",
      );
      setStatus(updated);
      router.refresh();
    });
  };

  return (
    <div className="rounded-xl border-2 border-gold/60 bg-gradient-to-r from-forest via-forest-deep to-forest p-5 text-ivory shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={
                status.enabled
                  ? "bg-emerald-500 text-black font-extrabold uppercase tracking-wider text-[10px]"
                  : "bg-gold text-forest font-extrabold uppercase tracking-wider text-[10px]"
              }
            >
              {status.enabled
                ? "₦100.00 Pilot Testing Mode Active"
                : "Official Brochure Pricing Active"}
            </Badge>
            {status.autoRemovedAfterPayment && !status.enabled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/90 border border-emerald-400/50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200">
                <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                Auto-Removed After ₦100 Test Payment ({status.lastPaymentRef || "Verified"})
              </span>
            )}
          </div>

          <h3 className="font-display text-base sm:text-lg font-bold text-ivory flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold shrink-0" />
            <span>Day 3 Grand Finale Pricing &amp; ₦100 Pilot Testing Fee Control</span>
          </h3>

          <p className="text-xs text-ivory/85 leading-relaxed max-w-3xl">
            {status.enabled ? (
              <>
                <strong>Pilot Testing Mode (₦100.00):</strong> Public checkouts on{" "}
                <code className="text-gold">/tables</code> and{" "}
                <code className="text-gold">/register</code> currently charge{" "}
                <strong>₦100.00</strong> for live verification and will{" "}
                <strong>automatically disable the testing fee and revert to Official Brochure Pricing</strong>{" "}
                (<strong>₦5,000,000</strong> Kings Table · <strong>₦3,000,000</strong> Royal Table ·{" "}
                <strong>₦2,000,000</strong> Queens Table · <strong>₦500,000</strong> Premium Table ·{" "}
                <strong>₦50,000</strong> Regular Section) immediately after a ₦100 payment succeeds.
              </>
            ) : (
              <>
                <strong>Live Official Brochure Pricing Mode:</strong> Public checkouts are charging
                full brochure amounts (<strong>₦5,000,000</strong> Kings Table ·{" "}
                <strong>₦3,000,000</strong> Royal Table · <strong>₦2,000,000</strong> Queens Table ·{" "}
                <strong>₦500,000</strong> Premium Table · <strong>₦50,000</strong> Regular Section).
                You can re-enable the ₦100.00 testing fee at any time using the button on the right.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            type="button"
            disabled={isPending}
            onClick={() => handleToggle(!status.enabled)}
            className={
              status.enabled
                ? "bg-gold text-forest hover:bg-gold/90 font-bold text-xs cursor-pointer shadow"
                : "bg-emerald-500 text-black hover:bg-emerald-400 font-bold text-xs cursor-pointer shadow"
            }
          >
            {isPending ? (
              <>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Updating Mode...
              </>
            ) : status.enabled ? (
              <>
                <ShieldCheck className="mr-1.5 h-4 w-4" />
                Remove ₦100 Test Fee &amp; Enforce Official Prices
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-4 w-4" />
                Enable ₦100.00 Pilot Testing Fee
              </>
            )}
          </Button>
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

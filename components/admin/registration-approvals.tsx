"use client";

import { useState } from "react";
import { Landmark, CreditCard, ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  approveRegistrationAction,
  denyRegistrationAction,
} from "@/lib/actions/registrations";

interface PendingRegistration {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  category: string;
  group_size: number;
  status: string;
  bank_transfer_ref?: string | null;
  payment_method?: string | null;
  created_at: string;
}

export function RegistrationApprovals({ pending }: { pending: PendingRegistration[] }) {
  const [removed, setRemoved] = useState<string[]>([]);
  const items = pending.filter((r) => !removed.includes(r.id));

  const handleApprove = async (id: string) => {
    const res = await approveRegistrationAction(id);
    if (res.ok) {
      setRemoved((prev) => [...prev, id]);
    } else {
      window.alert(res.error || "Could not approve registration.");
    }
  };

  const handleDeny = async (id: string) => {
    const res = await denyRegistrationAction(id);
    if (res.ok) {
      setRemoved((prev) => [...prev, id]);
    } else {
      window.alert(res.error || "Could not decline registration.");
    }
  };

  if (!items.length) return null;

  return (
    <div className="rounded-xl border border-gold/40 bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-forest">
          Registration &amp; Treasury Approvals
        </h2>
        <StatusBadge tone="warning">{items.length} pending review</StatusBadge>
      </div>
      <p className="mt-1 text-xs text-muted-brand">
        Approving releases the accredited QR credentials and confirms attendance. For Day 3 direct bank wires, verify that the funds have cleared with the Financial Secretary / Secretariat before approving.
      </p>

      <ul className="mt-4 space-y-3">
        {items.map((reg) => {
          const isBankWire = reg.payment_method === "bank_transfer" || Boolean(reg.bank_transfer_ref);

          return (
            <li key={reg.id} className="rounded-lg border border-line bg-ivory p-4 shadow-2xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink text-sm">
                      {reg.first_name} {reg.last_name}
                    </p>
                    {isBankWire ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-bold">
                        <Landmark className="size-3 text-gold-deep" />
                        Bank Wire Ref: {reg.bank_transfer_ref || "WEMA-TRANSFER"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-forest/10 text-forest px-2 py-0.5 text-[10px] font-semibold">
                        Free Pass Approval
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-brand">
                    {reg.email} · {reg.phone}
                  </p>
                  <p className="text-xs text-muted-brand">
                    {reg.category} · {reg.group_size} attendee{reg.group_size === 1 ? "" : "s"} ·{" "}
                    Registered: {new Date(reg.created_at).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleApprove(reg.id)}
                    className="bg-forest text-ivory hover:bg-forest-interactive font-semibold text-xs shadow-xs"
                  >
                    <ShieldCheck className="size-3.5 mr-1 text-gold" />
                    {isBankWire ? "Confirm Wire & Issue Pass" : "Approve & Issue Pass"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeny(reg.id)}
                    className="border-danger/40 text-danger hover:bg-danger/5 font-semibold text-xs"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

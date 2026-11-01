"use client";

import { useState } from "react";
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
          Registration approvals
        </h2>
        <StatusBadge tone="warning">{items.length} pending</StatusBadge>
      </div>
      <p className="mt-1 text-xs text-muted-brand">
        Approving issues the accredited QR credential and emails the pass. No payment is ever
        requested — attendance is free.
      </p>

      <ul className="mt-4 space-y-3">
        {items.map((reg) => (
          <li key={reg.id} className="rounded-lg border border-line bg-ivory p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink">
                  {reg.first_name} {reg.last_name}
                </p>
                <p className="text-xs text-muted-brand">
                  {reg.email} · {reg.phone}
                </p>
                <p className="mt-1 text-xs text-muted-brand">
                  {reg.category} · {reg.group_size} guest{reg.group_size === 1 ? "" : "s"} ·{" "}
                  {new Date(reg.created_at).toLocaleDateString("en-GB")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleApprove(reg.id)}
                  className="bg-forest text-ivory hover:bg-forest-interactive"
                >
                  Approve &amp; issue pass
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeny(reg.id)}
                  className="border-danger/40 text-danger hover:bg-danger/5"
                >
                  Decline
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

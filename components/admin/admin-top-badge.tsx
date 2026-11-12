"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function AdminTopBadge() {
  const [email, setEmail] = useState<string | null>(null);
  const [roleName, setRoleName] = useState<string>("Executive Console");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setEmail(user.email);
        const em = user.email.toLowerCase();
        if (em.startsWith("superadmin@") || em.startsWith("admin@")) {
          setRoleName("Super Administrator");
        } else if (em.startsWith("president@")) {
          setRoleName("Club President");
        } else if (em.startsWith("gensec@") || em.startsWith("secretary@")) {
          setRoleName("General Secretary");
        } else if (em.startsWith("finsec@") || em.startsWith("finance@")) {
          setRoleName("Financial Secretary");
        } else if (em.startsWith("marshal@") || em.startsWith("gate@") || em.startsWith("security@")) {
          setRoleName("Gate Marshal");
        } else {
          setRoleName("Executive Officer");
        }
      }
    });
  }, []);

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-display text-sm sm:text-base font-bold tracking-wide text-ivory">
          Abeokuta Polo 2026 · Operations Console
        </p>
        <span className="rounded-full bg-gold/25 border border-gold/50 px-2.5 py-0.5 text-[10px] font-bold text-gold uppercase tracking-wider">
          {roleName}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <p className="text-[10px] tracking-wider uppercase text-ivory/70 truncate">
          {email || "Authorized Session"} · Level 4 Royal Clearance
        </p>
      </div>
    </div>
  );
}

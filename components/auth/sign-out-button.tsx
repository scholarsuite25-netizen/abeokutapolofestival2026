"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

interface SignOutButtonProps {
  className?: string;
  variant?: "outline" | "ghost" | "default" | "destructive";
  showLabel?: boolean;
}

export function SignOutButton({
  className = "",
  variant = "destructive",
  showLabel = true,
}: SignOutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out client notice:", e);
    } finally {
      router.push("/sign-in");
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      variant={variant}
      size="sm"
      className={className}
      title="Sign out of official console"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <LogOut className="h-3.5 w-3.5" />
      )}
      {showLabel && <span>Log Out</span>}
    </Button>
  );
}

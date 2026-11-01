"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QrCode, ArrowLeft, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PassLookupPage() {
  const router = useRouter();
  const [passInput, setPassInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleaned = passInput.trim();
    if (!cleaned) {
      setErrorMsg("Please enter your Pass Code or reference.");
      return;
    }

    // Direct routing to the pass view
    router.push(`/pass/${encodeURIComponent(cleaned.toUpperCase())}`);
  };

  return (
    <div className="flex min-h-[75vh] w-full flex-col items-center justify-center bg-ivory p-6 text-ink">
      <div className="w-full max-w-md space-y-6">
        <Button asChild variant="ghost" size="sm" className="text-muted-brand hover:text-forest">
          <Link href="/register">
            <ArrowLeft className="mr-2 size-4" /> Back to Registration
          </Link>
        </Button>

        <div className="rounded-2xl border border-line bg-card p-6 shadow-xl sm:p-8 space-y-5">
          <div className="text-center space-y-2">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
              <QrCode className="size-6" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-forest">
              Find Your Digital Access Card
            </h1>
            <p className="text-xs text-muted-brand">
              Enter the unique pass reference code you received upon registration to view or print
              your 3-day gate pass.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLookup} className="space-y-4">
            <div className="space-y-1.5 text-xs">
              <label htmlFor="code" className="font-semibold text-forest">
                Pass Code Reference *
              </label>
              <div className="relative">
                <Ticket className="absolute left-3 top-3 size-4 text-muted-brand" />
                <Input
                  id="code"
                  required
                  placeholder="e.g. ABK-2026-X7K9"
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  className="pl-9 font-mono uppercase bg-ivory text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-forest text-ivory hover:bg-forest-interactive shadow cursor-pointer font-semibold"
            >
              Retrieve Digital Access Card →
            </Button>
          </form>

          <div className="border-t border-line/60 pt-4 text-center text-xs text-muted-brand">
            Haven&apos;t registered yet?{" "}
            <Link href="/register" className="font-semibold text-forest underline">
              Register for Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


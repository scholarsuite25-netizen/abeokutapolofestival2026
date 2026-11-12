"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Smartphone, KeyRound, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

type Stage = "checking" | "enroll" | "verify" | "ready" | "error";

interface EnrollData {
  factorId: string;
  qrCode: string;
  secret: string;
}

export default function MfaSetupPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("checking");
  const [message, setMessage] = useState("");
  const [enroll, setEnroll] = useState<EnrollData | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const begin = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.replace("/sign-in?next=/abawole");
      return;
    }

    try {
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const verified = factors?.all?.find((f) => f.status === "verified" && f.factor_type === "totp");
      if (verified) {
        setStage("verify");
        setMessage("A second factor is already enrolled. Enter the current code from your authenticator app to continue.");
        return;
      }

      const { data: created, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Festival console",
      });
      if (enrollError) throw enrollError;
      if (!created?.totp) throw new Error("Could not start enrolment.");

      setEnroll({
        factorId: created.id,
        qrCode: created.totp.qr_code,
        secret: created.totp.secret,
      });
      setStage("enroll");
    } catch (err) {
      setStage("error");
      setMessage(err instanceof Error ? err.message : "Could not start two-factor enrolment.");
    }
  }, [router]);

  useEffect(() => {
    void begin();
  }, [begin]);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enroll && stage !== "verify") return;
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const target =
        enroll?.factorId ??
        factors?.all?.find((f) => f.status === "verified" && f.factor_type === "totp")?.id;

      if (!target) throw new Error("No enrolled factor found.");

      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: target, code: code.trim() });
      if (error) throw error;

      setStage("ready");
      setMessage("Two-factor authentication is on. Taking you to the console…");
      setTimeout(() => router.replace("/abawole"), 1200);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "That code was not accepted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-gold/40 bg-black/40 p-7 text-ivory shadow-2xl">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-7 text-gold" />
          <div>
            <h1 className="font-display text-xl font-bold text-ivory">Secure your console access</h1>
            <p className="text-xs text-ivory/70">
              This account must confirm a second factor before entering the console.
            </p>
          </div>
        </div>

        {stage === "checking" && (
          <p className="flex items-center gap-2 text-sm text-ivory/80">
            <Loader2 className="size-4 animate-spin" /> Preparing your secure sign-in…
          </p>
        )}

        {stage === "enroll" && enroll && (
          <form onSubmit={verify} className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-ivory/85">
                1. Open your authenticator app (Google Authenticator, Microsoft Authenticator, or 1Password).
                <br />
                2. Scan the code below, or type the setup key by hand.
              </p>
              <div className="flex justify-center rounded-2xl bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={enroll.qrCode} alt="Two-factor setup QR code" className="h-48 w-48" />
              </div>
              <p className="text-center font-mono text-[11px] break-all text-ivory/70">{enroll.secret}</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="mfaCode" className="text-xs font-bold uppercase tracking-wider text-gold">
                3. Enter the 6-digit code from your app
              </label>
              <input
                id="mfaCode"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                className="w-full rounded-lg border border-gold/30 bg-black/50 px-4 py-3 text-center font-mono text-lg tracking-[0.4em] text-ivory focus:border-gold focus:outline-none"
              />
            </div>

            {message && <p className="text-xs text-amber-300">{message}</p>}

            <Button
              type="submit"
              disabled={busy || code.trim().length < 6}
              className="w-full bg-gold py-3 font-bold text-black hover:bg-gold/90"
            >
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <KeyRound className="mr-2 size-4" />}
              Confirm and enter the console
            </Button>
          </form>
        )}

        {stage === "verify" && (
          <form onSubmit={verify} className="space-y-5">
            <p className="flex items-center gap-2 text-xs leading-relaxed text-ivory/85">
              <Smartphone className="size-4 text-gold" />
              {message}
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              className="w-full rounded-lg border border-gold/30 bg-black/50 px-4 py-3 text-center font-mono text-lg tracking-[0.4em] text-ivory focus:border-gold focus:outline-none"
            />
            {message && <p className="text-xs text-amber-300">{message}</p>}
            <Button
              type="submit"
              disabled={busy || code.trim().length < 6}
              className="w-full bg-gold py-3 font-bold text-black hover:bg-gold/90"
            >
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
              Verify and enter the console
            </Button>
          </form>
        )}

        {stage === "ready" && (
          <p className="flex items-center gap-2 text-sm text-emerald-300">
            <ShieldCheck className="size-4" /> {message}
          </p>
        )}

        {stage === "error" && (
          <div className="space-y-3">
            <p className="text-xs text-amber-300">{message}</p>
            <Button
              type="button"
              onClick={() => void begin()}
              className="w-full bg-gold py-3 font-bold text-black hover:bg-gold/90"
            >
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

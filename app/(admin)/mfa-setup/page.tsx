"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Smartphone,
  Laptop,
  KeyRound,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

/**
 * Second-factor enrolment, offered in plain language.
 *
 * Three routes, because not every Club member owns a phone or is comfortable
 * with an authenticator app:
 *
 *  1. PHONE  — any free authenticator app (Google Authenticator, Microsoft
 *     Authenticator, Authy, 1Password). The app shows a 6-digit code.
 *  2. LAPTOP — the same kind of code, but generated on the computer: Microsoft
 *     Authenticator (Windows), 1Password (browser extension), Bitwarden
 *     (browser extension) or Authy (desktop). No phone needed.
 *  3. PASSKEY / SECURITY KEY — the laptop's own fingerprint, face or PIN
 *     (Windows Hello, Touch ID) or a USB/NFC key. Nothing to type, nothing to
 *     install.
 *
 * Whatever is chosen, recovery codes are issued afterwards so nobody can be
 * locked out of the console.
 */

type Method = "phone" | "laptop" | "passkey";
type Stage = "choose" | "totp" | "webauthn" | "verify" | "recovery" | "done" | "error";

interface TotpData {
  factorId: string;
  qrCode: string;
  secret: string;
}

const APPS_PHONE = [
  "Google Authenticator (Android, free)",
  "Microsoft Authenticator (iPhone/Android, free)",
  "Authy (free)",
  "1Password (if you already use it)",
];

const APPS_LAPTOP = [
  "Microsoft Authenticator on Windows (free)",
  "1Password browser extension (fills the code for you)",
  "Bitwarden browser extension (free)",
  "Authy desktop app",
];

export default function MfaSetupPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("choose");
  const [method, setMethod] = useState<Method>("phone");
  const [message, setMessage] = useState("");
  const [totp, setTotp] = useState<TotpData | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const startTotp = useCallback(async () => {
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const existing = factors?.all?.find(
        (f) => f.status === "verified" && f.factor_type === "totp",
      );
      if (existing) {
        setStage("verify");
        setMessage(
          "You already have an authenticator app set up. Enter the 6-digit code it shows.",
        );
        return;
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Festival console",
      });
      if (error) throw error;
      if (!data?.totp) throw new Error("Could not start enrolment.");

      setTotp({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setStage("totp");
    } catch (err) {
      setStage("error");
      setMessage(err instanceof Error ? err.message : "Could not start enrolment.");
    } finally {
      setBusy(false);
    }
  }, []);

  const startPasskey = useCallback(async () => {
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();

      if (typeof window === "undefined" || !window.PublicKeyCredential) {
        throw new Error(
          "This device cannot use a fingerprint or PIN sign-in. Please use the phone or laptop option instead.",
        );
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "webauthn",
        friendlyName: "Festival console",
      });
      if (error) throw error;

      const options = (data as unknown as {
        webauthn?: {
          credential_options?: {
            challenge?: { id?: string };
            rp?: { id?: string };
            rpOrigins?: string[];
          };
        };
      }).webauthn?.credential_options;

      if (!options?.challenge?.id) {
        throw new Error("This device could not start a passkey sign-in.");
      }

      // Ask the platform (Windows Hello / Touch ID / security key) to create a
      // credential, then hand it back to Supabase for verification.
      const { createCredential } = await import("@supabase/auth-js/dist/module/lib/webauthn");
      const credential = await createCredential(
        options as Parameters<typeof createCredential>[0],
      );

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: data.id,
        challengeId: options.challenge.id,
        code: "",
        webauthn: {
          type: "create",
          rpId: options.rp?.id || window.location.hostname,
          rpOrigins: options.rpOrigins || [window.location.origin],
          credential_response: credential as never,
        },
      } as never);
      if (verifyError) throw verifyError;

      // Recovery codes are not exposed by this client version; the recovery
      // path is Admin Hierarchy, where a Super Admin can clear a member's
      // second factor.
      setStage("done");
      return;
    } catch (err) {
      setStage("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "This device could not complete a fingerprint or PIN sign-in. Please use the phone or laptop option instead.",
      );
    } finally {
      setBusy(false);
    }
  }, []);

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const target =
        totp?.factorId ??
        factors?.all?.find(
          (f) => f.status === "verified" && f.factor_type === "totp",
        )?.id;
      if (!target) throw new Error("No enrolled factor found.");

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: target,
        code: code.trim(),
      });
      if (error) throw error;

      // Recovery codes are not exposed by this client version; the recovery
      // path is Admin Hierarchy, where a Super Admin can clear a member's
      // second factor.
      setStage("done");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "That code was not accepted.");
    } finally {
      setBusy(false);
    }
  };

  const choose = (m: Method) => {
    setMethod(m);
    if (m === "passkey") void startPasskey();
    else void startTotp();
  };

  useEffect(() => {
    // A member who has already enrolled is taken straight to verification.
    void (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/sign-in?next=/mfa-setup");
        return;
      }
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.all?.find((f) => f.status === "verified");
      if (verified) {
        if (verified.factor_type === "webauthn") {
          setMethod("passkey");
          setStage("verify");
          setMessage("Tap your fingerprint, face or PIN to continue.");
        } else {
          setMethod("phone");
          setStage("verify");
          setMessage(
            "You already have an authenticator app set up. Enter the 6-digit code it shows.",
          );
        }
      }
    })();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest px-4 py-12">
      <div className="w-full max-w-xl space-y-6 rounded-3xl border border-gold/40 bg-black/40 p-7 text-ivory shadow-2xl">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-7 shrink-0 text-gold" />
          <div>
            <h1 className="font-display text-xl font-bold text-ivory">
              Protect your console sign-in
            </h1>
            <p className="text-xs text-ivory/70">
              One extra step when you sign in. Choose whichever suits you — you can
              change it later.
            </p>
          </div>
        </div>

        {stage === "choose" && (
          <div className="space-y-3">
            <ChoiceCard
              icon={<Smartphone className="size-5 text-gold" />}
              title="Use my phone"
              detail="A free app shows a 6-digit code. Take 2 minutes."
              apps={APPS_PHONE}
              onClick={() => choose("phone")}
              disabled={busy}
            />
            <ChoiceCard
              icon={<Laptop className="size-5 text-gold" />}
              title="Use this laptop"
              detail="The code appears on your computer — no phone needed."
              apps={APPS_LAPTOP}
              onClick={() => choose("laptop")}
              disabled={busy}
            />
            <ChoiceCard
              icon={<KeyRound className="size-5 text-gold" />}
              title="Use my fingerprint or a USB key"
              detail="Your laptop's own sign-in (Windows Hello / Touch ID). Nothing to type."
              apps={["Windows Hello (Windows laptop)", "Touch ID (Mac laptop)", "USB or NFC security key"]}
              onClick={() => choose("passkey")}
              disabled={busy}
            />
            <p className="pt-1 text-[11px] leading-relaxed text-ivory/60">
              If none of these work for you, ask the Super Admin — they can enrol
              you at the desk, or leave second-factor sign-in off for your account
              while the strong password policy applies.
            </p>
          </div>
        )}

        {stage === "totp" && totp && (
          <form onSubmit={verifyCode} className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-ivory/85">
                {method === "laptop" ? (
                  <>
                    <strong className="text-gold">On this laptop:</strong> open one of
                    these (all free), then choose &ldquo;Add a new account&rdquo; and
                    scan the code below:
                    <br />
                    {APPS_LAPTOP.map((a) => (
                      <span key={a} className="block">• {a}</span>
                    ))}
                  </>
                ) : (
                  <>
                    <strong className="text-gold">On your phone:</strong> install one of
                    these (all free), choose &ldquo;Add a new account&rdquo; and scan
                    the code below:
                    <br />
                    {APPS_PHONE.map((a) => (
                      <span key={a} className="block">• {a}</span>
                    ))}
                  </>
                )}
              </p>
              <div className="flex justify-center rounded-2xl bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={totp.qrCode} alt="Setup QR code" className="h-48 w-48" />
              </div>
              <p className="text-center text-[11px] text-ivory/60">
                If the camera will not scan it, type this key in by hand:
                <br />
                <span className="font-mono text-ivory/90">{totp.secret}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="mfaCode" className="text-xs font-bold uppercase tracking-wider text-gold">
                Enter the 6-digit code from your app
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
              Confirm and open the console
            </Button>
          </form>
        )}

        {stage === "verify" && (
          <form onSubmit={verifyCode} className="space-y-5">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-ivory/85">
              {method === "passkey" ? (
                <KeyRound className="mt-0.5 size-4 shrink-0 text-gold" />
              ) : (
                <Smartphone className="mt-0.5 size-4 shrink-0 text-gold" />
              )}
              {message || "Enter the 6-digit code from your app."}
            </p>
            {method !== "passkey" && (
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                className="w-full rounded-lg border border-gold/30 bg-black/50 px-4 py-3 text-center font-mono text-lg tracking-[0.4em] text-ivory focus:border-gold focus:outline-none"
              />
            )}
            {message && <p className="text-xs text-amber-300">{message}</p>}
            <Button
              type="submit"
              disabled={busy || (method !== "passkey" && code.trim().length < 6)}
              className="w-full bg-gold py-3 font-bold text-black hover:bg-gold/90"
            >
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
              {method === "passkey" ? "Sign in with my fingerprint / PIN" : "Verify and open the console"}
            </Button>
          </form>
        )}

        {stage === "done" && (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm text-emerald-300">
              <ShieldCheck className="size-4" /> Second factor is on. Taking you to the
              console…
            </p>
            <p className="text-[11px] leading-relaxed text-ivory/60">
              Lost your phone or laptop? A Super Admin can clear your second factor
              from Admin Hierarchy and you can set it up again.
            </p>
            <Button
              type="button"
              onClick={() => router.replace("/abawole")}
              className="w-full bg-gold py-3 font-bold text-black hover:bg-gold/90"
            >
              Open the console now
            </Button>
          </div>
        )}

        {stage === "error" && (
          <div className="space-y-3">
            <p className="text-xs leading-relaxed text-amber-300">{message}</p>
            <Button
              type="button"
              onClick={() => {
                setStage("choose");
                setMessage("");
              }}
              className="w-full bg-gold py-3 font-bold text-black hover:bg-gold/90"
            >
              Back to the choices
            </Button>
          </div>
        )}

        {busy && stage !== "totp" && stage !== "verify" && (
          <p className="flex items-center gap-2 text-xs text-ivory/70">
            <Loader2 className="size-3.5 animate-spin" /> Setting up…
          </p>
        )}
      </div>
    </div>
  );
}

function ChoiceCard({
  icon,
  title,
  detail,
  apps,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  apps: string[];
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl border border-gold/30 bg-forest-deep/60 p-4 text-left transition-colors hover:border-gold/70 hover:bg-forest-deep disabled:opacity-60"
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-bold text-ivory">{title}</p>
          <p className="text-[11px] text-ivory/70">{detail}</p>
        </div>
      </div>
      <ul className="mt-2 space-y-0.5 pl-8 text-[11px] text-ivory/60">
        {apps.map((a) => (
          <li key={a}>• {a}</li>
        ))}
      </ul>
    </button>
  );
}

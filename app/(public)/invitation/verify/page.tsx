import { Suspense } from "react";
import NextLink from "next/link";
import Image from "next/image";
import {
  ShieldAlert,
  Crown,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  verifyInvitationSeal,
  verifyInvitationToken,
  ROYAL_SECURITY_SEAL,
} from "@/lib/invitations/issuance";
import { getInvitationByCode, bindInvitationToDevice } from "@/lib/invitations/storage";
import { verifyPassDeviceBinding } from "@/lib/security/device-binding";
import type { ComplimentaryInvitation } from "@/lib/invitations/types";
import { PortraitInvitationDeviceGuard } from "@/components/shared/portrait-invitation-card";
import { PageSkeleton } from "@/components/shared/page-skeleton";

interface VerifyPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata = {
  title: "Aare Elesin Security Verification — Abeokuta Polo Festival 2026",
  description:
    "Official public verification portal for complimentary dignitary invitations sealed with Aare Elesin royal authentication.",
};

export default function InvitationVerifyPage(props: VerifyPageProps) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <VerifyContent {...props} />
    </Suspense>
  );
}

async function VerifyContent({ searchParams }: VerifyPageProps) {
  const sp = await searchParams;

  const rawId = Array.isArray(sp.id) ? sp.id[0] : sp.id || (Array.isArray(sp.code) ? sp.code[0] : sp.code);
  const rawSeal = Array.isArray(sp.seal) ? sp.seal[0] : sp.seal;
  const rawSig = Array.isArray(sp.sig) ? sp.sig[0] : sp.sig || (Array.isArray(sp.token) ? sp.token[0] : sp.token);

  const invitationCode = rawId ? decodeURIComponent(rawId).trim().toUpperCase() : "";
  const sealParam = rawSeal ? decodeURIComponent(rawSeal).trim() : "";
  const tokenParam = rawSig ? decodeURIComponent(rawSig).trim() : "";

  let isValid = false;
  let signatureVerified = false;
  let failureReason = "";
  let invitation: ComplimentaryInvitation | null = null;

  // 1. If cryptographic token is provided, verify HMAC-SHA256 signature
  if (tokenParam) {
    const tokenResult = verifyInvitationToken(tokenParam);
    if (tokenResult.valid && tokenResult.payload) {
      if (tokenResult.payload.securitySeal === ROYAL_SECURITY_SEAL) {
        signatureVerified = true;
        isValid = true;
        const codeToFind = tokenResult.payload.credentialId || invitationCode;
        if (codeToFind) {
          invitation = await getInvitationByCode(codeToFind);
        }
        if (!invitation && tokenResult.payload) {
          // Construct invitation display model from verified cryptographic payload
          invitation = {
            id: tokenResult.payload.credentialId,
            invitationCode: tokenResult.payload.credentialId,
            firstName: null,
            surname: null,
            designation: tokenResult.payload.designation,
            category: tokenResult.payload.category,
            isCustomCategory: false,
            securitySeal: ROYAL_SECURITY_SEAL,
            qrPayload: `/invitation/verify?id=${tokenResult.payload.credentialId}&seal=Aare+Elesin`,
            isLockedToDevice: true,
            createdAt: new Date(tokenResult.payload.issuedAt).toISOString(),
          };
        }
      } else {
        failureReason = `Cryptographic payload missing mandatory '${ROYAL_SECURITY_SEAL}' royal seal.`;
      }
    } else {
      failureReason = tokenResult.error || "Cryptographic pass signature is invalid or tampered.";
    }
  }

  // 2. If seal and ID are provided, verify seal validity
  if (!isValid && invitationCode) {
    if (sealParam) {
      const sealCheck = verifyInvitationSeal(invitationCode, sealParam);
      if (sealCheck.valid) {
        isValid = true;
        invitation = await getInvitationByCode(invitationCode);
      } else {
        failureReason = sealCheck.error || `Invalid security seal. Expected '${ROYAL_SECURITY_SEAL}'.`;
      }
    } else {
      // Direct lookup by code
      invitation = await getInvitationByCode(invitationCode);
      if (invitation) {
        isValid = true;
      } else {
        failureReason = "No invitation found matching this code.";
      }
    }
  }

  // 3. Check revocation status
  if (invitation && invitation.status === "revoked") {
    isValid = false;
    failureReason = "This complimentary invitation has been officially revoked by tournament security.";
  }

  const dignitaryName = invitation
    ? [invitation.firstName, invitation.surname].filter(Boolean).join(" ") ||
      invitation.designation ||
      "Distinguished Guest"
    : "Distinguished Guest";

  async function bindDeviceOnVerifyAction(deviceId: string) {
    "use server";
    if (!invitation) {
      return { authorized: false, status: "not_found", message: "Invitation not found." };
    }
    try {
      await verifyPassDeviceBinding(invitation.invitationCode, deviceId, dignitaryName);
    } catch {
      // Non-fatal fallback
    }
    return await bindInvitationToDevice(invitation.invitationCode, deviceId);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#060503] text-[#FCF9F8] p-4 sm:p-6">
      <div className="w-full max-w-lg space-y-4">
        {/* Top return link */}
        <div className="flex items-center justify-between text-xs text-[#C9A84C]/80 px-1">
          <NextLink
            href="/"
            className="inline-flex items-center gap-1 hover:text-[#E5C768] transition"
          >
            <ArrowLeft className="size-3.5" />
            <span>Abeokuta Polo Festival 2026</span>
          </NextLink>
          <span className="font-mono text-[10px] tracking-widest uppercase text-[#C9A84C]">
            Royal Seal Oracle
          </span>
        </div>

        {isValid && invitation ? (
          <PortraitInvitationDeviceGuard
            invitation={invitation}
            onBindDevice={bindDeviceOnVerifyAction}
          >
          {/* ── AUTHENTIC ROYAL SEAL CARD ── */}
          <div className="rounded-3xl border-2 border-[#C9A84C]/90 bg-gradient-to-b from-[#161208] via-[#0E0C06] to-[#050402] p-6 sm:p-8 shadow-[0_0_50px_rgba(201,168,76,0.25)] text-center relative overflow-hidden">
            {/* Background filigree / crest glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 size-72 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Official Festival Crest */}
            <div className="relative size-20 mx-auto mb-3">
              <Image
                src="/icons/icon.svg"
                alt="Abeokuta Polo Festival"
                width={80}
                height={80}
                className="object-contain drop-shadow-[0_0_15px_rgba(201,168,76,0.4)]"
                priority
              />
            </div>

            {/* Seal Authenticated Badge */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full border border-emerald-500/50 bg-emerald-950/60 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              <span>Authentic & Verified Royal Seal</span>
            </div>

            {/* "Aare Elesin" Royal Security Title */}
            <div className="my-2 space-y-0.5">
              <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-[0.18em] text-[#FFF2CE] drop-shadow-sm">
                Aare Elesin
              </h1>
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.25em] text-[#C9A84C]">
                Official Security Verification Seal
              </p>
            </div>

            {/* Dignitary & Access Details Box */}
            <div className="my-5 rounded-2xl border border-[#C9A84C]/35 bg-[#120E05]/80 p-5 space-y-3 text-left">
              <div className="flex items-center justify-between border-b border-[#C9A84C]/20 pb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#C9A84C]">
                  Invitation Pass Code
                </span>
                <span className="font-mono text-sm font-extrabold text-[#E5C768]">
                  {invitation.invitationCode}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#C9A84C]">
                  Invited Dignitary
                </span>
                <p className="font-display text-xl font-bold text-white tracking-wide">
                  {dignitaryName}
                </p>
                <p className="text-xs font-semibold text-[#E5C768]">
                  {invitation.designation}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#C9A84C]">
                  Access Category
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full border border-[#C9A84C] bg-[#1E1708] text-[#F3E5AB] text-xs font-extrabold uppercase tracking-wider">
                  <Sparkles className="size-3 text-[#E5C768]" />
                  <span>{invitation.category}</span>
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-[#C9A84C]/20 pt-2 text-[11px] text-[#FCF9F8]/80">
                <span className="flex items-center gap-1 text-[#C9A84C]">
                  <Lock className="size-3" />
                  <span>Cryptographic Proof</span>
                </span>
                <span className="font-mono text-[10px] text-emerald-400 font-bold">
                  {signatureVerified ? "HMAC-SHA256 SIGNED" : "SEAL VALIDATED"}
                </span>
              </div>
            </div>

            {/* Admission Entitlement Notice */}
            <div className="rounded-xl border border-[#C9A84C]/25 bg-[#1A1407]/50 p-3 text-xs text-[#FCF9F8]/85 space-y-1 leading-relaxed">
              <div className="flex items-center justify-center gap-1.5 font-bold text-[#E5C768] text-[11px] uppercase tracking-wider">
                <Crown className="size-3 text-[#C9A84C]" />
                <span>Turnstile Gate Admission Entitlement</span>
              </div>
              <p className="text-[10.5px]">
                Admitted at <strong>Gate 1 (Royal Box & VVIP Enclosure)</strong> and <strong>Gate 2 (General Turnstiles)</strong> across all three festival days (18–20 Dec 2026).
              </p>
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex flex-col sm:flex-row gap-2">
              <NextLink
                href={`/invitation/${invitation.invitationCode}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-[#C9A84C] bg-[#1E180A] hover:bg-[#2A200E] text-[#FFF2CE] text-xs font-bold shadow-md transition active:scale-[0.98]"
              >
                <span>View Full Digital Portrait Card</span>
                <ExternalLink className="size-3.5" />
              </NextLink>
            </div>
          </div>
          </PortraitInvitationDeviceGuard>
        ) : (
          /* ── VERIFICATION REJECTION SCREEN ── */
          <div className="rounded-3xl border-2 border-red-500/60 bg-[#140606] p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <div className="size-16 mx-auto rounded-full bg-red-950/80 border-2 border-red-500 flex items-center justify-center text-red-400">
              <ShieldAlert className="size-8" />
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest bg-red-500 text-black">
                Security Protocol Check Failed
              </span>
              <h1 className="font-display text-2xl font-bold text-red-200">
                Invalid or Unverified Royal Seal
              </h1>
              {invitationCode && (
                <p className="font-mono text-xs text-[#C9A84C]">{invitationCode}</p>
              )}
            </div>

            <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-100 text-left space-y-2">
              <p className="font-semibold text-red-200">
                Turnstile Admission Denied
              </p>
              <p className="text-[11.5px] leading-relaxed text-red-100/90">
                {failureReason ||
                  "The presented QR code does not contain an authentic 'Aare Elesin' royal verification seal or matches an unrecognized token. Turnstile admission cannot be granted."}
              </p>
            </div>

            <p className="text-[11px] text-[#FCF9F8]/60 leading-relaxed">
              If you have been issued a complimentary invitation, please check the original link sent by the Abeokuta Polo Club Secretariat.
            </p>

            <div className="pt-2">
              <NextLink
                href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-500/40 bg-[#200A0A] text-red-200 text-xs font-bold hover:bg-[#2C0E0E] transition"
              >
                <ArrowLeft className="size-3.5" />
                <span>Return to Festival Homepage</span>
              </NextLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

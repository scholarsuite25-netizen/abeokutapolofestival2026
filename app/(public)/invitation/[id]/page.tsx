import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getInvitationByCode, bindInvitationToDevice } from "@/lib/invitations/storage";
import { verifyPassDeviceBinding } from "@/lib/security/device-binding";
import { PortraitInvitationDeviceGuard } from "@/components/shared/portrait-invitation-card";
import { PageSkeleton } from "@/components/shared/page-skeleton";

interface InvitationPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: InvitationPageProps) {
  const { id } = await params;
  const invitation = await getInvitationByCode(id);

  if (!invitation) {
    return {
      title: "Invitation Not Found — Abeokuta Polo Festival 2026",
    };
  }

  const dignitaryName =
    [invitation.firstName, invitation.surname].filter(Boolean).join(" ") ||
    invitation.designation;

  return {
    title: `${dignitaryName} — Royal Invitation · 2026 Abeokuta Polo Festival`,
    description: `Official Complimentary Access Card (${invitation.category}) for the Abeokuta Polo Festival 2026. Sealed with Aare Elesin.`,
  };
}

export default function PublicInvitationPage(props: InvitationPageProps) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <InvitationContent {...props} />
    </Suspense>
  );
}

async function InvitationContent({ params }: InvitationPageProps) {
  const { id } = await params;
  const normalizedId = decodeURIComponent(id).trim();
  const invitation = await getInvitationByCode(normalizedId);

  if (!invitation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#070603] text-[#FCF9F8] p-4 text-center">
        <div className="max-w-md w-full rounded-3xl border border-[#C9A84C]/40 bg-[#0E0C06] p-8 space-y-4 shadow-2xl">
          <div className="relative size-16 mx-auto">
            <Image
              src="/icons/icon.svg"
              alt="Abeokuta Polo Club"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C9A84C]">
              Abeokuta Polo Club Secretariat
            </span>
            <h1 className="font-display text-2xl font-bold text-[#FCF9F8]">
              Invitation Not Found
            </h1>
            <p className="font-mono text-xs text-[#C9A84C]">{normalizedId}</p>
          </div>

          <p className="text-xs text-[#FCF9F8]/70 leading-relaxed font-sans">
            The requested complimentary invitation reference could not be located in the official royal accreditation registry. Please verify the link or consult the tournament secretariat.
          </p>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#C9A84C]/40 bg-[#161208] text-[#E5C768] text-xs font-bold hover:bg-[#201A0B] transition"
            >
              <ArrowLeft className="size-3.5" />
              <span>Return to Festival Homepage</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Server action to securely bind this invitation to the recipient device.
   * Leverages lib/invitations/storage.ts and lib/security/device-binding.ts.
   */
  async function bindDeviceAction(deviceId: string) {
    "use server";
    const holderName =
      [invitation!.firstName, invitation!.surname].filter(Boolean).join(" ") ||
      invitation!.designation;

    // Cross-system binding sync
    try {
      await verifyPassDeviceBinding(invitation!.invitationCode, deviceId, holderName);
    } catch {
      // Non-fatal if legacy table is bypassed
    }

    return await bindInvitationToDevice(invitation!.invitationCode, deviceId);
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#060503] text-[#FCF9F8] py-6 sm:py-10 px-3 sm:px-4 print:py-0 print:bg-white print:text-black">
      {/* Top Header / Breadcrumb navigation */}
      <div className="w-full max-w-[480px] mb-4 flex items-center justify-between text-xs text-[#C9A84C] print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E5C768]/80 hover:text-[#E5C768] transition"
        >
          <ArrowLeft className="size-3.5" />
          <span>Abeokuta Polo 2026</span>
        </Link>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#C9A84C]/70">
          <Sparkles className="size-3" />
          <span>Royal Protocol</span>
        </span>
      </div>

      {/* Main Portrait Card with Non-Transferable Device Guard */}
      <PortraitInvitationDeviceGuard
        invitation={invitation}
        onBindDevice={bindDeviceAction}
      />
    </div>
  );
}

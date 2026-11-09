/**
 * Complimentary Invitations Data Engine Types
 * Abeokuta Polo Festival 2026 - Royal Access & Secretariat Issuance
 */

export const STANDARD_INVITATION_CATEGORIES = [
  "VVIP",
  "VIP",
  "MEMBER",
  "ABEOKUTA POLO CLUB",
  "PRESS",
  "SPONSORS",
  "VENDORS",
  "PROGRAMME OFFICIALS",
] as const;

export type StandardInvitationCategory = (typeof STANDARD_INVITATION_CATEGORIES)[number];

export type InvitationCategory =
  | "VVIP"
  | "VIP"
  | "MEMBER"
  | "ABEOKUTA POLO CLUB"
  | "PRESS"
  | "SPONSORS"
  | "VENDORS"
  | "PROGRAMME OFFICIALS"
  | string; // custom category

export interface ComplimentaryInvitation {
  id: string; // UUID
  invitationCode: string; // e.g. ABK-2026-INV-XXXX
  firstName?: string | null;
  surname?: string | null;
  designation: string; // Required honorary / professional title
  category: InvitationCategory;
  isCustomCategory: boolean;
  securitySeal: "Aare Elesin";
  qrPayload: string;
  qrToken?: string;
  boundDeviceId?: string | null;
  isLockedToDevice: boolean;
  claimedAt?: string | null;
  status?: "active" | "revoked";
  createdByName?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateInvitationInput {
  firstName?: string | null;
  surname?: string | null;
  designation: string;
  category: InvitationCategory;
  isCustomCategory?: boolean;
}

export interface InvitationSealVerificationResult {
  valid: boolean;
  invitation?: ComplimentaryInvitation;
  error?: string;
  securitySeal?: string;
}

export interface InvitationDeviceBindingResult {
  authorized: boolean;
  status: "newly_bound" | "already_bound" | "forwarding_blocked" | "not_found";
  boundDeviceId?: string;
  message?: string;
}

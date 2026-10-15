"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSignedPassToken, hashPassToken } from "@/lib/qr/token";
import { sendEmail } from "@/lib/email/client";
import { isSupabaseConfigured } from "@/lib/env";

const registrationSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters."),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters."),
  email: z.string().trim().email("Please provide a valid email address."),
  phone: z.string().trim().min(7, "Please provide a valid phone number."),
  category: z.string().default("General Public Admission"),
  groupSize: z.coerce.number().int().min(1).max(5).default(1),
});

export interface RegisterResult {
  success: boolean;
  passCode?: string;
  qrToken?: string;
  holderName?: string;
  category?: string;
  error?: string;
}

export async function submitRegistration(rawInput: unknown): Promise<RegisterResult> {
  const parsed = registrationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(". "),
    };
  }

  const { firstName, lastName, email, phone, category, groupSize } = parsed.data;
  const fullName = `${firstName} ${lastName}`;

  // Generate unique pass code
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const passCode = `ABK-2026-${randomSuffix}`;

  const tempCredentialId = crypto.randomUUID();
  const qrToken = generateSignedPassToken({
    credentialId: tempCredentialId,
    holderName: fullName,
    passType: category,
    editionYear: 2026,
    issuedAt: Date.now(),
  });
  const tokenHash = hashPassToken(qrToken);

  // If Supabase is live, persist in DB
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();

      // 1. Get current 2026 edition ID
      const { data: edition } = await supabase
        .from("festival_editions")
        .select("id")
        .eq("slug", "2026")
        .maybeSingle();

      // 2. Insert registration
      const { data: reg, error: regError } = await supabase
        .from("registrations")
        .insert({
          edition_id: edition?.id || null,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          category,
          group_size: groupSize,
          status: "confirmed",
        })
        .select("id")
        .single();

      if (regError) {
        console.error("[Registration] DB Insert error:", regError);
      } else if (reg) {
        // 3. Insert credential
        await supabase.from("credentials").insert({
          registration_id: reg.id,
          holder_name: fullName,
          token_hash: tokenHash,
          pass_code: passCode,
          pass_type: category,
          zone_access: category.includes("Patron") || category.includes("VIP")
            ? ["general_lawn", "chukka_terrace", "clubhouse", "royal_dais"]
            : ["general_lawn"],
          status: "active",
        });
      }
    } catch (dbErr) {
      console.warn("[Registration] Supabase write skipped or pending DB connection:", dbErr);
    }
  }

  // 4. Send Confirmation Email via EmailBump
  try {
    await sendEmail({
      to: email,
      subject: `Your Accredited Pass: 2026 Abeokuta Polo Festival (${passCode})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111827; background-color: #FAF9F5; border-radius: 12px; border: 1px solid #DCD5C2;">
          <div style="background-color: #062D1D; padding: 20px; border-radius: 8px; text-align: center; color: #FAF9F5;">
            <p style="color: #DFBE75; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 6px 0;">Official Digital Credential</p>
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">2026 Abeokuta Polo Festival</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #DCD5C2;">18–20 December 2026 · Abeokuta Polo Club Grounds</p>
          </div>

          <div style="padding: 24px 0;">
            <p style="font-size: 16px; margin: 0 0 12px 0;">Dear <strong>${fullName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #414843;">
              Your complimentary registration for the 2026 Abeokuta Polo Festival has been confirmed. Below are your official gate pass details:
            </p>

            <div style="background-color: #FFFFFF; border: 2px dashed #062D1D; border-radius: 8px; padding: 18px; margin: 20px 0; text-align: center;">
              <p style="color: #795910; font-size: 11px; text-transform: uppercase; font-weight: 700; margin: 0;">Pass Code / Ref</p>
              <h2 style="font-size: 26px; color: #062D1D; margin: 6px 0; letter-spacing: 0.1em; font-family: monospace;">${passCode}</h2>
              <p style="color: #414843; font-size: 13px; margin: 0;">Pass Category: <strong>${category}</strong></p>
              <p style="color: #414843; font-size: 13px; margin: 4px 0 0 0;">Attendees Admitted: <strong>${groupSize}</strong></p>
            </div>

            <div style="background-color: #F4F4F0; border-radius: 6px; padding: 14px; font-size: 13px; color: #414843;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #062D1D;">Important Gate Protocol:</p>
              <ul style="margin: 0; padding-left: 18px; line-height: 1.5;">
                <li>Present this pass code or your digital QR pass at Gate 2 or Gate 3.</li>
                <li>Gates open daily at 10:00 AM (18–20 December 2026).</li>
                <li>This website and tournament do not charge admission fees. Attendance is free.</li>
              </ul>
            </div>
          </div>

          <div style="border-top: 1px solid #DCD5C2; padding-top: 16px; font-size: 11px; color: #727973; text-align: center;">
            <p style="margin: 0;">Abeokuta Polo Club · Abeokuta-Sagamu Expressway, Kobape, Ogun State</p>
            <p style="margin: 4px 0 0 0;">Inquiries / Hotline: +234 818 188 8884 · 0803 681 8916 · abeokutapolo@gmail.com</p>
          </div>
        </div>
      `,
    });
  } catch (emailErr) {
    console.warn("[Registration] Email notification dispatch error:", emailErr);
  }

  return {
    success: true,
    passCode,
    qrToken,
    holderName: fullName,
    category,
  };
}

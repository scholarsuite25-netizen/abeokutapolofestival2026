import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Records the outcome of every outbound message (email today, WhatsApp and
 * SMS later) so the Secretariat can prove what was sent, to whom, and what
 * the provider replied.
 *
 * Deliberately non-blocking: a logging failure must never delay or fail a
 * guest-facing email. If the table is not present yet the write is skipped.
 */

export interface NotificationLogInput {
  channel: "email" | "whatsapp" | "sms";
  recipient: string;
  template?: string;
  subject?: string;
  status: "sent" | "failed" | "skipped";
  provider?: string;
  providerId?: string;
  error?: string;
  registrationId?: string;
}

export async function recordNotification(input: NotificationLogInput): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createAdminClient();
    await supabase.from("notification_log").insert({
      channel: input.channel,
      recipient: input.recipient,
      template: input.template ?? null,
      subject: input.subject ?? null,
      status: input.status,
      provider: input.provider ?? null,
      provider_id: input.providerId ?? null,
      error: input.error ?? null,
      registration_id: input.registrationId ?? null,
    });
  } catch {
    // Silent by design — the message itself has already been handled.
  }
}

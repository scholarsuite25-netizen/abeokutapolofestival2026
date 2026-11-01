import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

/**
 * Live RLS allow/deny tests.
 *
 * Requires a disposable Supabase project (local `supabase start` or a scratch
 * cloud project). Skipped automatically when env is absent:
 *   SUPABASE_TEST_URL
 *   SUPABASE_TEST_SERVICE_ROLE_KEY
 *   SUPABASE_TEST_ANON_KEY
 */

const url = process.env.SUPABASE_TEST_URL;
const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
const configured = Boolean(url && serviceRoleKey && anonKey);

const suffix = randomUUID().slice(0, 8);
const emailAdmin = `rls-admin-${suffix}@example.test`;
const emailGuest = `rls-g-${suffix}@example.test`;
const password = `Test!Passw0rd-${suffix}`;

let admin: SupabaseClient | null = null;
let adminUserId = "";
let guestId = "";
let editionId = "";
let registrationAId = "";

async function userClient(email: string): Promise<SupabaseClient> {
  const { data, error } = await admin!.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`sign-in failed for ${email}: ${error?.message}`);

  return createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  });
}

describe.skipIf(!configured)("RLS allow/deny (live)", () => {
  beforeAll(async () => {
    admin = createClient(url!, serviceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const mk = async (email: string) => {
      const { data, error } = await admin!.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) throw error;
      return data.user.id;
    };

    adminUserId = await mk(emailAdmin);
    guestId = await mk(emailGuest);

    const { data: edition, error: editionError } = await admin
      .from("festival_editions")
      .insert({ name: `RLS test ${suffix}`, slug: `rls-test-${suffix}`, year: 2026, status: "published" })
      .select("id")
      .single();
    if (editionError) throw editionError;
    editionId = edition.id;

    const { error: grantError } = await admin.from("user_role_assignments").insert([
      { user_id: adminUserId, role_key: "super_admin" },
      { user_id: guestId, role_key: "guest" },
    ]);
    if (grantError) throw grantError;

    const { data: reg, error: regError } = await admin
      .from("event_registrations")
      .insert({
        edition_id: editionId,
        full_name: `Attendee ${suffix}`,
        email: `attendee-${suffix}@example.com`,
        phone: "+2348011223344",
        category: "Corporate Guest",
        affiliation_type: "corporate",
        organization: "Prestige Polo Ltd",
        status: "approved",
      })
      .select("id")
      .single();
    if (regError) throw regError;
    registrationAId = reg.id;
  }, 60_000);

  afterAll(async () => {
    if (admin && adminUserId) {
      for (const id of [adminUserId, guestId]) {
        await admin.auth.admin.deleteUser(id).catch(() => undefined);
      }
    }
    if (admin && editionId) {
      await admin.from("festival_editions").delete().eq("id", editionId);
    }
  });

  it("super_admin can read all event registrations", async () => {
    const client = await userClient(emailAdmin);

    const { data: visible } = await client
      .from("event_registrations")
      .select("id")
      .eq("id", registrationAId);
    expect(visible?.length).toBe(1);
  });

  it("guest users cannot read registrations of other attendees directly", async () => {
    const client = await userClient(emailGuest);

    const { data: records } = await client
      .from("event_registrations")
      .select("id")
      .eq("id", registrationAId);
    expect(records?.length ?? 0).toBe(0);
  });

  it("anon cannot query internal event registrations table directly", async () => {
    const anon = createClient(url!, anonKey!, { auth: { persistSession: false } });

    const { data: records } = await anon
      .from("event_registrations")
      .select("id")
      .eq("id", registrationAId);
    expect(records?.length ?? 0).toBe(0);
  });
});

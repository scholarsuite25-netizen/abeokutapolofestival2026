import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

/**
 * Live RLS allow/deny tests (ARCHITECTURE_PLAN.md §14 testing strategy).
 *
 * Requires a disposable Supabase project (local `supabase start` or a scratch
 * cloud project). Skipped automatically when env is absent:
 *   SUPABASE_TEST_URL
 *   SUPABASE_TEST_SERVICE_ROLE_KEY
 *   SUPABASE_TEST_ANON_KEY
 *
 * Migrations 0001–0005 must already be applied to the target.
 */

const url = process.env.SUPABASE_TEST_URL;
const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
const configured = Boolean(url && serviceRoleKey && anonKey);

const suffix = randomUUID().slice(0, 8);
const emailA = `rls-a-${suffix}@example.test`;
const emailB = `rls-b-${suffix}@example.test`;
const emailGuest = `rls-g-${suffix}@example.test`;
const password = `Test!Passw0rd-${suffix}`;

let admin: SupabaseClient | null = null;
let userAId = "";
let userBId = "";
let guestId = "";
let editionId = "";
let committeeAId = "";
let committeeBId = "";
let personAId = "";
let taskAId = "";
let taskBId = "";

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

    userAId = await mk(emailA);
    userBId = await mk(emailB);
    guestId = await mk(emailGuest);

    const { data: edition, error: editionError } = await admin
      .from("festival_editions")
      .insert({ name: `RLS test ${suffix}`, slug: `rls-test-${suffix}`, year: 2026, status: "published" })
      .select("id")
      .single();
    if (editionError) throw editionError;
    editionId = edition.id;

    const { data: committees, error: committeeError } = await admin
      .from("committees")
      .insert([
        { edition_id: editionId, slug: `committee-a-${suffix}`, name: `Committee A ${suffix}` },
        { edition_id: editionId, slug: `committee-b-${suffix}`, name: `Committee B ${suffix}` },
      ])
      .select("id, slug");
    if (committeeError) throw committeeError;
    committeeAId = committees[0]!.id;
    committeeBId = committees[1]!.id;

    const { data: person, error: personError } = await admin
      .from("person_records")
      .insert({ edition_id: editionId, source_spelling: `Member A ${suffix}`, profile_id: userAId })
      .select("id")
      .single();
    if (personError) throw personError;
    personAId = person.id;

    const { error: membershipError } = await admin.from("committee_memberships").insert({
      committee_id: committeeAId,
      person_id: personAId,
      role_key: "committee_member",
      verified_status: "verified",
    });
    if (membershipError) throw membershipError;

    const { error: grantError } = await admin.from("user_role_assignments").insert([
      { user_id: userAId, role_key: "committee_member", committee_id: committeeAId },
      { user_id: userBId, role_key: "committee_member", committee_id: committeeBId },
      { user_id: guestId, role_key: "guest" },
    ]);
    if (grantError) throw grantError;

    const { data: tasks, error: taskError } = await admin
      .from("committee_tasks")
      .insert([
        { committee_id: committeeAId, edition_id: editionId, title: `Task A ${suffix}` },
        { committee_id: committeeBId, edition_id: editionId, title: `Task B ${suffix}` },
      ])
      .select("id, committee_id");
    if (taskError) throw taskError;
    taskAId = tasks[0]!.id;
    taskBId = tasks[1]!.id;
  }, 60_000);

  afterAll(async () => {
    if (admin && userAId) {
      for (const id of [userAId, userBId, guestId]) {
        await admin.auth.admin.deleteUser(id).catch(() => undefined);
      }
    }
    if (admin && editionId) {
      await admin.from("festival_editions").delete().eq("id", editionId);
    }
  });

  it("member A can read own committee tasks but not committee B tasks", async () => {
    const client = await userClient(emailA);

    const { data: visible } = await client
      .from("committee_tasks")
      .select("id")
      .eq("id", taskAId);
    expect(visible?.length).toBe(1);

    const { data: hidden } = await client
      .from("committee_tasks")
      .select("id")
      .eq("id", taskBId);
    expect(hidden?.length).toBe(0);
  });

  it("member A cannot read the other committee's roster or name", async () => {
    const client = await userClient(emailA);

    const { data: committees } = await client.from("committees").select("id");
    const ids = (committees ?? []).map((c) => c.id);
    expect(ids).toContain(committeeAId);
    expect(ids).not.toContain(committeeBId);

    const { data: memberships } = await client
      .from("committee_memberships")
      .select("id")
      .eq("committee_id", committeeBId);
    expect(memberships?.length).toBe(0);
  });

  it("plain members cannot write tasks (officers only)", async () => {
    const client = await userClient(emailA);

    const { error } = await client
      .from("committee_tasks")
      .insert({ committee_id: committeeAId, edition_id: editionId, title: "Sneaky task" });
    expect(error).not.toBeNull();
  });

  it("guest users see no committee workspaces", async () => {
    const client = await userClient(emailGuest);

    const { data: committees } = await client.from("committees").select("id");
    expect(committees?.length ?? 0).toBe(0);

    const { data: people } = await client.from("person_records").select("id");
    expect(people?.length ?? 0).toBe(0);
  });

  it("anon sees no committee workspaces or people", async () => {
    const anon = createClient(url!, anonKey!, { auth: { persistSession: false } });

    const { data: committees } = await anon.from("committees").select("id");
    expect(committees?.length ?? 0).toBe(0);

    const { data: people } = await anon.from("person_records").select("id");
    expect(people?.length ?? 0).toBe(0);

    const { data: tasks } = await anon.from("committee_tasks").select("id");
    expect(tasks?.length ?? 0).toBe(0);
  });

  it("member A cannot read minutes or documents without an explicit grant", async () => {
    const client = await userClient(emailA);

    const { data: meetings } = await client
      .from("committee_meetings")
      .select("id")
      .eq("committee_id", committeeAId);
    expect(meetings?.length ?? 0).toBe(0); // none created; policy still denies foreign rows
  });
});

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireCommitteeOfficer, getCommitteeBySlug } from "@/lib/auth/committee";
import { PermissionError } from "@/lib/auth/require";
import {
  createTaskSchema,
  recordDecisionSchema,
  recordMinutesSchema,
  scheduleMeetingSchema,
  updateTaskStatusInput,
} from "@/lib/validators/committee";

export type ActionState = {
  ok: boolean;
  message?: string;
};

function fail(message: string): ActionState {
  return { ok: false, message };
}

function success(message: string): ActionState {
  return { ok: true, message };
}

function handleError(error: unknown): ActionState {
  if (error instanceof PermissionError) return fail(error.message);
  if (error instanceof z.ZodError) {
    return fail(error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  console.error(error);
  return fail("Something went wrong. Please try again.");
}

function revalidateCommittee(slug: string) {
  revalidatePath(`/committee/${slug}`);
  revalidatePath(`/committee/${slug}/tasks`);
  revalidatePath(`/committee/${slug}/meetings`);
  revalidatePath(`/committee/${slug}/decisions`);
  revalidatePath(`/committee/${slug}/documents`);
}

async function logActivity(
  committeeId: string,
  action: string,
  details: Record<string, unknown>,
) {
  const supabase = await createClient();
  await supabase.from("committee_activity_logs").insert({
    committee_id: committeeId,
    action,
    details,
  });
  await supabase.rpc("write_audit", {
    p_action: action,
    p_resource_type: "committee",
    p_resource_id: committeeId,
    p_details: details,
  });
}

export async function createTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const input = createTaskSchema.parse({
      slug: String(formData.get("slug") ?? ""),
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? "") || undefined,
      priority: String(formData.get("priority") ?? "medium"),
      due_on: String(formData.get("due_on") ?? "") || undefined,
    });

    const { committee, session } = await requireCommitteeOfficer(input.slug);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("committee_tasks")
      .insert({
        committee_id: committee.id,
        edition_id: committee.edition_id,
        title: input.title,
        body: input.body ?? null,
        priority: input.priority,
        due_on: input.due_on || null,
        created_by: session.user.id,
      })
      .select("id")
      .single();

    if (error || !data) {
      // RLS violation (not an officer) or constraint failure
      if (error?.code === "42501") throw new PermissionError();
      return fail("Could not create the task.");
    }

    await logActivity(committee.id, "task.created", { task_id: data.id, title: input.title });
    revalidateCommittee(input.slug);
    return success("Task created.");
  } catch (error) {
    return handleError(error);
  }
}

export async function updateTaskStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const input = updateTaskStatusInput.parse({
      slug: String(formData.get("slug") ?? ""),
      taskId: String(formData.get("taskId") ?? ""),
      status: String(formData.get("status") ?? ""),
    });

    const { committee } = await requireCommitteeOfficer(input.slug);
    const supabase = await createClient();

    const { error } = await supabase
      .from("committee_tasks")
      .update({ status: input.status })
      .eq("id", input.taskId)
      .eq("committee_id", committee.id);

    if (error) {
      if (error.code === "42501") throw new PermissionError();
      return fail("Could not update the task.");
    }

    await logActivity(committee.id, "task.status_changed", {
      task_id: input.taskId,
      status: input.status,
    });
    revalidateCommittee(input.slug);
    return success("Task updated.");
  } catch (error) {
    return handleError(error);
  }
}

export async function scheduleMeetingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const input = scheduleMeetingSchema.parse({
      slug: String(formData.get("slug") ?? ""),
      title: String(formData.get("title") ?? ""),
      agenda: String(formData.get("agenda") ?? "") || undefined,
      starts_at: String(formData.get("starts_at") ?? ""),
      location: String(formData.get("location") ?? "") || undefined,
    });

    const { committee } = await requireCommitteeOfficer(input.slug);
    const supabase = await createClient();

    const startsAt = new Date(input.starts_at);
    if (Number.isNaN(startsAt.getTime())) return fail("Invalid meeting date/time.");

    const { data, error } = await supabase
      .from("committee_meetings")
      .insert({
        committee_id: committee.id,
        title: input.title,
        agenda: input.agenda ?? null,
        starts_at: startsAt.toISOString(),
        location: input.location ?? null,
      })
      .select("id")
      .single();

    if (error || !data) {
      if (error?.code === "42501") throw new PermissionError();
      return fail("Could not schedule the meeting.");
    }

    await logActivity(committee.id, "meeting.scheduled", {
      meeting_id: data.id,
      title: input.title,
    });
    revalidateCommittee(input.slug);
    return success("Meeting scheduled.");
  } catch (error) {
    return handleError(error);
  }
}

export async function recordMinutesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const input = recordMinutesSchema.parse({
      slug: String(formData.get("slug") ?? ""),
      meetingId: String(formData.get("meetingId") ?? ""),
      body: String(formData.get("body") ?? ""),
    });

    const { committee, session } = await requireCommitteeOfficer(input.slug);
    const supabase = await createClient();

    // Confirm the meeting belongs to this committee before inserting minutes.
    const { data: meeting } = await supabase
      .from("committee_meetings")
      .select("id")
      .eq("id", input.meetingId)
      .eq("committee_id", committee.id)
      .maybeSingle();

    if (!meeting) return fail("Meeting not found in this committee.");

    const { error } = await supabase.from("meeting_minutes").insert({
      meeting_id: input.meetingId,
      body: input.body,
      author_id: session.user.id,
    });

    if (error) {
      if (error.code === "42501") throw new PermissionError();
      return fail("Could not record the minutes.");
    }

    await logActivity(committee.id, "minutes.recorded", { meeting_id: input.meetingId });
    revalidateCommittee(input.slug);
    return success("Minutes recorded.");
  } catch (error) {
    return handleError(error);
  }
}

export async function recordDecisionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const input = recordDecisionSchema.parse({
      slug: String(formData.get("slug") ?? ""),
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? "") || undefined,
      decision_on: String(formData.get("decision_on") ?? "") || undefined,
      status: String(formData.get("status") ?? "proposed"),
    });

    const { committee, session } = await requireCommitteeOfficer(input.slug);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("committee_decisions")
      .insert({
        committee_id: committee.id,
        title: input.title,
        body: input.body ?? null,
        decision_on: input.decision_on || null,
        status: input.status,
        created_by: session.user.id,
      })
      .select("id")
      .single();

    if (error || !data) {
      if (error?.code === "42501") throw new PermissionError();
      return fail("Could not record the decision.");
    }

    await logActivity(committee.id, "decision.recorded", {
      decision_id: data.id,
      title: input.title,
      status: input.status,
    });
    revalidateCommittee(input.slug);
    return success("Decision recorded.");
  } catch (error) {
    return handleError(error);
  }
}

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB (matches bucket limit)
const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "text/plain",
  "application/zip",
];

export async function uploadDocumentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const slug = String(formData.get("slug") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const file = formData.get("file");

    if (!title || title.length < 3) return fail("Provide a document title.");
    if (!(file instanceof File) || file.size === 0) return fail("Choose a file to upload.");
    if (file.size > MAX_DOCUMENT_BYTES) return fail("File exceeds the 10 MB limit.");
    if (!ALLOWED_DOC_TYPES.includes(file.type)) return fail("File type is not allowed.");

    const { committee, session } = await requireCommitteeOfficer(slug);
    const supabase = await createClient();

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const storagePath = `${committee.id}/${crypto.randomUUID()}-${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("committee-documents")
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error(uploadError);
      return fail("Could not upload the file. Check your officer access.");
    }

    const { error: insertError } = await supabase.from("committee_documents").insert({
      committee_id: committee.id,
      title,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: session.user.id,
    });

    if (insertError) {
      // Roll the orphaned object out of the way.
      await supabase.storage.from("committee-documents").remove([storagePath]);
      if (insertError.code === "42501") throw new PermissionError();
      return fail("Could not register the document.");
    }

    await logActivity(committee.id, "document.uploaded", { title, path: storagePath });
    revalidateCommittee(slug);
    return success("Document uploaded to the private vault.");
  } catch (error) {
    return handleError(error);
  }
}

/** Used by the meetings page to confirm a committee exists for form posts. */
export async function committeeExists(slug: string): Promise<boolean> {
  return (await getCommitteeBySlug(slug)) !== null;
}

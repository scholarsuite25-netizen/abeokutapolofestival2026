"use client";

import { useActionState } from "react";
import { updateTaskStatusAction, type ActionState } from "@/lib/actions/committee";

const OPTIONS = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "awaiting_approval", label: "Awaiting approval" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
  { value: "cancelled", label: "Cancelled" },
] as const;

/**
 * Native select (auto-submits on change) — Radix Select does not submit
 * parent forms on value change without extra wiring.
 */
export function TaskStatusSelect({
  slug,
  taskId,
  current,
}: {
  slug: string;
  taskId: string;
  current: string;
}) {
  const [, formAction] = useActionState<ActionState, FormData>(updateTaskStatusAction, {
    ok: false,
  });

  return (
    <form action={formAction} className="inline-flex">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="taskId" value={taskId} />
      <select
        name="status"
        defaultValue={current}
        aria-label="Update task status"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-8 w-40 rounded border border-line bg-card px-2 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-interactive"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </form>
  );
}

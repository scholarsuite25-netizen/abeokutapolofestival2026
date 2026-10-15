"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTaskAction, type ActionState } from "@/lib/actions/committee";

export function TaskForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createTaskAction,
    { ok: false },
  );

  return (
    <details className="rounded-lg border border-line bg-card">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-forest">
        New task (officers)
      </summary>
      <form action={formAction} className="flex flex-col gap-4 border-t border-line p-4">
        <input type="hidden" name="slug" value={slug} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="task-title">Title</Label>
          <Input id="task-title" name="title" required minLength={3} maxLength={200} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="task-body">Details</Label>
          <Textarea id="task-body" name="body" rows={3} maxLength={4000} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Priority</Label>
            <Select name="priority" defaultValue="medium">
              <SelectTrigger aria-label="Priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="task-due">Due date</Label>
            <Input id="task-due" name="due_on" type="date" />
          </div>
        </div>

        {state.message ? (
          <p
            role={state.ok ? "status" : "alert"}
            className={
              state.ok
                ? "rounded border border-success/40 bg-success/10 px-3 py-2 text-sm text-success"
                : "rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
            }
          >
            {state.message}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="sm:self-start">
          {pending ? "Creating…" : "Create task"}
        </Button>
      </form>
    </details>
  );
}

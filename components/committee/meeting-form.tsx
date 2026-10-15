"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { scheduleMeetingAction, type ActionState } from "@/lib/actions/committee";

export function MeetingForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    scheduleMeetingAction,
    { ok: false },
  );

  return (
    <details className="rounded-lg border border-line bg-card">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-forest">
        Schedule a meeting (officers)
      </summary>
      <form action={formAction} className="flex flex-col gap-4 border-t border-line p-4">
        <input type="hidden" name="slug" value={slug} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="meeting-title">Title</Label>
          <Input id="meeting-title" name="title" required minLength={3} maxLength={200} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="meeting-agenda">Agenda</Label>
          <Textarea id="meeting-agenda" name="agenda" rows={3} maxLength={4000} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="meeting-starts">Starts at</Label>
            <Input id="meeting-starts" name="starts_at" type="datetime-local" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="meeting-location">Location</Label>
            <Input id="meeting-location" name="location" maxLength={200} />
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
          {pending ? "Scheduling…" : "Schedule meeting"}
        </Button>
      </form>
    </details>
  );
}

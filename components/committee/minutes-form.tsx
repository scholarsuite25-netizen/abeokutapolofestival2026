"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recordMinutesAction, type ActionState } from "@/lib/actions/committee";

export function MinutesForm({ slug, meetingId }: { slug: string; meetingId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    recordMinutesAction,
    { ok: false },
  );

  return (
    <details className="mt-3 rounded border border-line/70 bg-sage/30">
      <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-forest">
        Record minutes (officers)
      </summary>
      <form action={formAction} className="flex flex-col gap-3 border-t border-line p-3">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="meetingId" value={meetingId} />

        <div className="flex flex-col gap-2">
          <Label htmlFor={`minutes-${meetingId}`}>Minutes</Label>
          <Textarea
            id={`minutes-${meetingId}`}
            name="body"
            rows={5}
            required
            minLength={10}
            maxLength={20000}
          />
        </div>

        {state.message ? (
          <p
            role={state.ok ? "status" : "alert"}
            className={
              state.ok
                ? "text-sm text-success"
                : "text-sm text-danger"
            }
          >
            {state.message}
          </p>
        ) : null}

        <Button type="submit" size="sm" disabled={pending} className="self-start">
          {pending ? "Saving…" : "Save minutes"}
        </Button>
      </form>
    </details>
  );
}

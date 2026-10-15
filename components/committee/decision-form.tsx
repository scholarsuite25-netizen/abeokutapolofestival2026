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
import { recordDecisionAction, type ActionState } from "@/lib/actions/committee";

export function DecisionForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    recordDecisionAction,
    { ok: false },
  );

  return (
    <details className="rounded-lg border border-line bg-card">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-forest">
        Record a decision (officers)
      </summary>
      <form action={formAction} className="flex flex-col gap-4 border-t border-line p-4">
        <input type="hidden" name="slug" value={slug} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="decision-title">Title</Label>
          <Input id="decision-title" name="title" required minLength={3} maxLength={200} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="decision-body">Detail</Label>
          <Textarea id="decision-body" name="body" rows={4} maxLength={8000} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="decision-on">Decision date</Label>
            <Input id="decision-on" name="decision_on" type="date" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select name="status" defaultValue="proposed">
              <SelectTrigger aria-label="Decision status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proposed">Proposed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
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
          {pending ? "Recording…" : "Record decision"}
        </Button>
      </form>
    </details>
  );
}

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { importRosterAction, type ImportResult } from "@/lib/actions/roster";

export function RosterImportForm({ committees }: { committees: { slug: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<ImportResult, FormData>(
    importRosterAction,
    { ok: false },
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-line bg-card p-4"
      encType="multipart/form-data"
    >
      <div className="flex flex-col gap-2">
        <Label>Committee</Label>
        <Select name="slug">
          <SelectTrigger aria-label="Committee">
            <SelectValue placeholder="Choose a committee" />
          </SelectTrigger>
          <SelectContent>
            {committees.map((committee) => (
              <SelectItem key={committee.slug} value={committee.slug}>
                {committee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="roster-file">CSV file</Label>
        <Input id="roster-file" name="file" type="file" required accept=".csv,text/csv" />
        <p className="text-xs text-muted-brand">
          Columns: <code className="font-mono">name, email, phone, position, role</code> —{" "}
          <code className="font-mono">role</code> is{" "}
          <code className="font-mono">committee_member</code> (default) or{" "}
          <code className="font-mono">committee_officer</code>. All imported rows are
          provisional until verified. Identities are never auto-merged.
        </p>
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
        {pending ? "Importing…" : "Import roster"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadDocumentAction, type ActionState } from "@/lib/actions/committee";

export function DocumentUploadForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    uploadDocumentAction,
    { ok: false },
  );

  return (
    <details className="rounded-lg border border-line bg-card">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-forest">
        Upload a document (officers · 10 MB max)
      </summary>
      <form
        action={formAction}
        className="flex flex-col gap-4 border-t border-line p-4"
        encType="multipart/form-data"
      >
        <input type="hidden" name="slug" value={slug} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="doc-title">Title</Label>
          <Input id="doc-title" name="title" required minLength={3} maxLength={200} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="doc-file">File</Label>
          <Input
            id="doc-file"
            name="file"
            type="file"
            required
            accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.txt,.zip"
          />
          <p className="text-xs text-muted-brand">
            PDF, Word, Excel, PNG, JPEG, TXT or ZIP. Stored in the private vault —
            access is officer-only.
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
          {pending ? "Uploading…" : "Upload document"}
        </Button>
      </form>
    </details>
  );
}

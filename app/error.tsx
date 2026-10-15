"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-2xl font-semibold text-forest">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-brand">
        An unexpected error occurred on this page. You can try again, or return
        to the festival site.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-forest-interactive"
        >
          Try again
        </button>
        <Link href="/" className="rounded border border-line px-4 py-2 text-sm font-medium text-forest">
          Home
        </Link>
      </div>
    </div>
  );
}

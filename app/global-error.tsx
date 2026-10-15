"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this is wired to the error reporting sink in Phase 2.
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Something went wrong</h1>
        <p style={{ color: "#737873", marginTop: "0.5rem" }}>
          An unexpected error occurred. Please try again.
        </p>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button
            type="button"
            onClick={reset}
            style={{ padding: "0.5rem 1rem", border: "1px solid #dce3db", borderRadius: "0.25rem", background: "#fff" }}
          >
            Try again
          </button>
          <Link href="/" style={{ padding: "0.5rem 1rem", color: "#123d32" }}>
            Home
          </Link>
        </div>
      </body>
    </html>
  );
}

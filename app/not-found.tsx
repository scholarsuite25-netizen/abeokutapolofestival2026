import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl font-semibold text-forest">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
        This page could not be found
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-brand">
        The link may be out of date, or the page may not have been published yet.
      </p>
      <Link
        href="/"
        className="mt-6 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-forest-interactive"
      >
        Return to the festival site
      </Link>
    </div>
  );
}

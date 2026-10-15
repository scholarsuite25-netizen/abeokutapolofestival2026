import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="rounded-lg border border-line bg-card p-6 text-center">
      <h1 className="font-display text-xl font-semibold text-forest">
        Check your email
      </h1>
      <p className="mt-2 text-sm text-muted-brand">
        We sent you a verification link. Once you confirm your address you can
        sign in and complete your accreditation.
      </p>
      <Link
        href="/sign-in"
        className="mt-4 inline-block text-sm font-medium text-forest-interactive underline-offset-4 hover:underline"
      >
        Return to sign in
      </Link>
    </div>
  );
}

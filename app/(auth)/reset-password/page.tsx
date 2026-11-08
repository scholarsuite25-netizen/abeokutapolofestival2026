import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "Set New Password | 2026 Abeokuta Polo Festival",
  description: "Set a new secure password for your Abeokuta Polo Festival account.",
};

export default function ResetPasswordPage() {
  return (
    <Card className="border-line shadow-sm">
      <CardHeader>
        <CardTitle className="font-display text-forest">Set New Password</CardTitle>
        <CardDescription>
          Enter and confirm your new password below to regain access to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Suspense fallback={<p className="text-sm text-muted-brand">Loading reset form…</p>}>
          <ResetPasswordForm />
        </Suspense>
        <p className="text-center text-xs text-muted-brand pt-2">
          Remembered your password?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-forest-interactive underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

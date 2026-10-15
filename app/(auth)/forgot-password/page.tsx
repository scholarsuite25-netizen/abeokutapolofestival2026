import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <Card className="border-line">
      <CardHeader>
        <CardTitle className="font-display text-forest">Reset your password</CardTitle>
        <CardDescription>
          We will email you a secure link to set a new password.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ForgotPasswordForm />
        <p className="text-center text-sm text-muted-brand">
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

import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <Card className="border-line">
      <CardHeader>
        <CardTitle className="font-display text-forest">Sign in</CardTitle>
        <CardDescription>
          Access your registration, digital pass and — where granted — committee
          workspaces.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Suspense fallback={<p className="text-sm text-muted-brand">Loading form…</p>}>
          <SignInForm />
        </Suspense>
        <p className="text-center text-sm text-muted-brand">
          No account yet?{" "}
          <Link
            href="/register"
            className="font-medium text-forest-interactive underline-offset-4 hover:underline"
          >
            Register for free entry
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

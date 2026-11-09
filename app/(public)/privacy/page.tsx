import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Policy — 2026 Abeokuta Polo Festival",
  description: "Privacy policy, data retention, and attendee credential confidentiality protocols.",
};

export default function PrivacyPage() {
  return (
    <div className="flex w-full max-w-full flex-col bg-ivory text-ink overflow-x-clip min-w-0">
      <section className="relative overflow-hidden bg-forest py-14 text-ivory sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold uppercase tracking-widest text-[11px]">
            Legal &amp; Data Protection
          </Badge>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-5xl text-ivory">
            Privacy Policy
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ivory/80 sm:text-base">
            How attendee personal information, pass credentials, and contact logs are safeguarded in accordance with the Nigeria Data Protection Act (NDPA).
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8 text-sm leading-relaxed text-muted-brand">
          <div className="rounded-2xl border border-line bg-card p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="font-display text-xl font-semibold text-forest">1. Information We Collect</h2>
            <p>
              When you register for an access pass or apply for corporate hospitality, we collect your name, email address, phone number, guest affiliations, and attending festival days. For paid passes, transactions are processed securely through accredited payment gateways; we do not store full payment card numbers on our servers.
            </p>

            <h2 className="font-display text-xl font-semibold text-forest pt-4">2. Use of Attendee Data</h2>
            <p>
              Your personal data is used solely for tournament administration, gate access verification via turnstile QR readers, issuing emergency logistical notices, and dispatching event reminders. We do not sell or lease attendee data to third parties.
            </p>

            <h2 className="font-display text-xl font-semibold text-forest pt-4">3. QR Pass &amp; Credential Security</h2>
            <p>
              Digital access cards carry cryptographically signed HMAC-SHA256 tokens. Pass details are stored locally on your device for offline entry verification at Kobape Turf.
            </p>

            <h2 className="font-display text-xl font-semibold text-forest pt-4">4. Data Subject Rights &amp; Contact</h2>
            <p>
              Attendees may request access, rectification, or deletion of their registration records by contacting the Secretariat at{" "}
              <a href="mailto:abeokutapolo@gmail.com" className="text-forest font-semibold underline">
                abeokutapolo@gmail.com
              </a>.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-line">
            <Button asChild variant="outline" size="sm" className="border-line text-forest">
              <Link href="/">
                <ArrowLeft className="mr-1.5 size-3.5" /> Back to Home
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-gold font-semibold text-forest-deep hover:bg-gold/90">
              <Link href="/register">Register for Pass</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}


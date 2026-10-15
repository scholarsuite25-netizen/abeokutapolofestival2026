import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FAQAccordion } from "@/components/design/public/faq-accordion";
import { EnquiryDialog } from "@/components/design/public/enquiry-dialog";

export const metadata = {
  title: "Frequently Asked Questions — 2026 Abeokuta Polo Festival",
  description:
    "Official attendee guidelines, entry pass rules, venue location, and tournament protocols.",
};

export default function FAQPage() {
  return (
    <div className="flex w-full flex-col bg-ivory text-ink">
      <section className="relative overflow-hidden bg-forest text-ivory py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold uppercase tracking-widest text-[11px]">
            Visitor Assistance & Guidelines
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ivory/80 sm:text-lg">
            Everything you need to know about attendance, gate access, digital passes, dress codes, and equestrian safety.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FAQAccordion />

          <div className="mt-16 rounded-2xl border border-line bg-sage/30 p-8 text-center sm:p-12">
            <h3 className="font-display text-2xl font-semibold text-forest">Have a Question Not Listed Here?</h3>
            <p className="mt-2 text-sm text-muted-brand max-w-md mx-auto">
              Our Secretariat liaison team is on standby to assist with diplomatic delegations, press accreditation, and private hosting inquiries.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <EnquiryDialog
                title="Liaison Desk Inquiries"
                triggerText="Chat with Liaison via WhatsApp"
                className="bg-gold font-semibold text-forest-deep shadow hover:bg-gold/90"
              />
              <Button asChild variant="outline" className="border-line text-forest">
                <Link href="/register">Register For Free Pass</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

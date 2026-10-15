"use client";

import { useState } from "react";
import { MessageSquare, Phone, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface EnquiryDialogProps {
  title?: string;
  category?: "hospitality" | "sponsorship" | "general";
  tierName?: string;
  triggerText?: string;
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

export function EnquiryDialog({
  title = "Inquire with the Festival Secretariat",
  category = "general",
  tierName,
  triggerText = "Inquire via WhatsApp / Call",
  variant = "default",
  className,
}: EnquiryDialogProps) {
  const [open, setOpen] = useState(false);

  const defaultMessage = tierName
    ? `Hello Secretariat, I would like to inquire about ${category === "sponsorship" ? "the sponsorship package: " : "hospitality enclosure: "}${tierName} for the 2026 Abeokuta Polo Festival.`
    : `Hello Secretariat, I would like to inquire about ${category} protocols for the 2026 Abeokuta Polo Festival.`;

  const whatsappUrl = `https://wa.me/2348181888884?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          className={
            className ||
            "bg-gold font-semibold text-forest-deep shadow hover:bg-gold/90"
          }
        >
          <MessageSquare className="mr-2 size-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-line bg-ivory text-ink sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-forest">{title}</DialogTitle>
          <DialogDescription className="text-muted-brand text-sm">
            {tierName ? `Inquiry regarding: ${tierName}` : "Official protocol and liaison lines."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-gold/40 bg-sage/50 p-4 text-xs leading-relaxed text-forest-deep">
            <div className="flex items-center gap-1.5 font-semibold text-forest">
              <CheckCircle2 className="size-4 text-forest" />
              <span>Direct Commercial & Protocol Protocols</span>
            </div>
            <p className="mt-1">
              In accordance with festival governance, all hospitality chalets, corporate suites, and
              sponsorship allocations are processed directly through the Secretariat. No online payments are taken.
            </p>
          </div>

          <div className="space-y-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg border border-emerald-600/30 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="size-5 text-emerald-700" />
                <div>
                  <p className="font-semibold">WhatsApp Secretariat Direct</p>
                  <p className="text-xs text-emerald-700">+234 818 188 8884</p>
                </div>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Instant Chat →
              </span>
            </a>

            <a
              href="tel:+2348181888884"
              className="flex items-center justify-between rounded-lg border border-line bg-card px-4 py-3 text-sm font-medium text-forest transition hover:bg-sage"
            >
              <div className="flex items-center gap-3">
                <Phone className="size-5 text-gold" />
                <div>
                  <p className="font-semibold">Festival Helpline 1</p>
                  <p className="text-xs text-muted-brand">+234 818 188 8884</p>
                </div>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-brand">
                Call Now →
              </span>
            </a>

            <a
              href="tel:08036818916"
              className="flex items-center justify-between rounded-lg border border-line bg-card px-4 py-3 text-sm font-medium text-forest transition hover:bg-sage"
            >
              <div className="flex items-center gap-3">
                <Phone className="size-5 text-gold" />
                <div>
                  <p className="font-semibold">Festival Helpline 2</p>
                  <p className="text-xs text-muted-brand">0803 681 8916</p>
                </div>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-brand">
                Call Now →
              </span>
            </a>

            <a
              href={`mailto:abeokutapolo@gmail.com?subject=${encodeURIComponent(
                `Festival Inquiry - ${tierName || category}`
              )}&body=${encodeURIComponent(defaultMessage)}`}
              className="flex items-center justify-between rounded-lg border border-line bg-card px-4 py-3 text-sm font-medium text-forest transition hover:bg-sage"
            >
              <div className="flex items-center gap-3">
                <Mail className="size-5 text-gold" />
                <div>
                  <p className="font-semibold">Secretariat Email</p>
                  <p className="text-xs text-muted-brand">abeokutapolo@gmail.com</p>
                </div>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-brand">
                Send Email →
              </span>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

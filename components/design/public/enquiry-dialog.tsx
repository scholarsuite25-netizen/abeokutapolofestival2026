"use client";

import { useState } from "react";
import { MessageSquare, Phone, Mail, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { submitEnquiryAction } from "@/app/(public)/register/actions";

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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const defaultMessage = tierName
    ? `Hello Secretariat, I would like to inquire about ${category === "sponsorship" ? "the sponsorship package: " : "hospitality enclosure: "}${tierName} for the 2026 Abeokuta Polo Festival.`
    : `Hello Secretariat, I would like to inquire about ${category} protocols for the 2026 Abeokuta Polo Festival.`;

  const whatsappUrl = `https://wa.me/2348181888884?text=${encodeURIComponent(defaultMessage)}`;

  const handleDirectEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setErrorNotice(null);
    setSentNotice(null);
    const res = await submitEnquiryAction({
      fullName,
      email,
      phone,
      organization,
      category,
      tierName,
      message: customMessage.trim() || defaultMessage,
    });
    setSending(false);
    if (res.success) {
      setSentNotice(res.message || "Enquiry sent! Check your email for confirmation.");
      setFullName("");
      setEmail("");
      setPhone("");
      setOrganization("");
      setCustomMessage("");
    } else {
      setErrorNotice(res.error || "Could not send enquiry.");
    }
  };

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
      <DialogContent className="border-line bg-ivory text-ink w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md p-4 sm:p-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-forest">{title}</DialogTitle>
          <DialogDescription className="text-muted-brand text-sm">
            {tierName ? `Inquiry regarding: ${tierName}` : "Official protocol and liaison lines."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-gold/40 bg-sage/50 p-3 sm:p-4 text-xs leading-relaxed text-forest-deep space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-forest">
              <CheckCircle2 className="size-4 text-forest" />
              <span>Direct Commercial & Protocol Protocols</span>
            </div>
            <p>
              In accordance with festival governance, all hospitality chalets, corporate suites, and
              sponsorship allocations are processed directly through the Secretariat.
            </p>
            <div className="pt-2 border-t border-forest/15 text-[11px] text-forest/90 space-y-0.5">
              <span className="font-bold text-forest block">Physical Secretariat (General Enquiries):</span>
              <p>Abeokuta Polo Club Secretariat, 4th Floor, Conference Hotel, Presidential Boulevard, Oke-Mosan, Abeokuta, Ogun State.</p>
            </div>
          </div>

          <div className="space-y-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-600/30 bg-emerald-50 px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100 min-w-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <MessageSquare className="size-5 text-emerald-700 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">WhatsApp Secretariat Direct</p>
                  <p className="text-xs text-emerald-700 truncate">+234 818 188 8884</p>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-800 shrink-0">
                Instant Chat →
              </span>
            </a>

            <a
              href="tel:+2348181888884"
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-card px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm font-medium text-forest transition hover:bg-sage min-w-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Phone className="size-5 text-gold shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">Festival Helpline 1</p>
                  <p className="text-xs text-muted-brand truncate">+234 818 188 8884</p>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-brand shrink-0">
                Call Now →
              </span>
            </a>

            <a
              href="tel:08036818916"
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-card px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm font-medium text-forest transition hover:bg-sage min-w-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Phone className="size-5 text-gold shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">Festival Helpline 2</p>
                  <p className="text-xs text-muted-brand truncate">0803 681 8916</p>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-brand shrink-0">
                Call Now →
              </span>
            </a>

            <a
              href={`mailto:abeokutapolo@gmail.com?subject=${encodeURIComponent(
                `Festival Inquiry - ${tierName || category}`
              )}&body=${encodeURIComponent(defaultMessage)}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-card px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm font-medium text-forest transition hover:bg-sage min-w-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Mail className="size-5 text-gold shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">Secretariat Email</p>
                  <p className="text-xs text-muted-brand truncate break-all">abeokutapolo@gmail.com</p>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-brand shrink-0">
                Send Email →
              </span>
            </a>
          </div>

          {/* Direct Automated Email Inquiry Form (Dispatched via Resend) */}
          <form onSubmit={handleDirectEmailSubmit} className="space-y-2.5 border-t border-line pt-3">
            <p className="text-xs font-bold uppercase tracking-wider text-forest">
              Or Send Direct Instant Email Inquiry:
            </p>
            {sentNotice && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-400 p-2.5 text-xs text-emerald-900 font-medium">
                ✅ {sentNotice}
              </div>
            )}
            {errorNotice && (
              <div className="rounded-lg bg-red-50 border border-red-400 p-2.5 text-xs text-red-900 font-medium">
                {errorNotice}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] text-forest">Full Name *</Label>
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Name"
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div>
                <Label className="text-[11px] text-forest">Email Address *</Label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] text-forest">Phone / WhatsApp *</Label>
                <Input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0803 123 4567"
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div>
                <Label className="text-[11px] text-forest">Organization (Optional)</Label>
                <Input
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Company / Title"
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={sending}
              className="w-full bg-forest text-ivory hover:bg-forest-interactive text-xs font-semibold h-9 cursor-pointer"
            >
              <Send className="mr-1.5 size-3.5" />
              {sending ? "Sending Inquiry & Confirmation Email..." : "Dispatch Inquiry & Receive Instant Email Copy"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

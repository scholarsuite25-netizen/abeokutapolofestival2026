"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: "dates",
    question: "When does the 2026 Abeokuta Polo Festival take place?",
    answer:
      "18–20 December 2026. The overall three-day date range is officially approved; daily fixture schedules and ceremonial timings are published as confirmed by the Tournament Committee.",
  },
  {
    id: "venue",
    question: "Where is the tournament venue located?",
    answer:
      "The tournament is hosted on the historic grounds of the Abeokuta Polo Club, along the Abeokuta-Sagamu Expressway, Kobape, Ogun State, Nigeria.",
  },
  {
    id: "host",
    question: "Who hosts and organizes the festival?",
    answer:
      "The festival is hosted by the Abeokuta Polo Club (established 1928), in partnership with the Ogun State Government and held under the sporting auspices of the Nigerian Polo Federation.",
  },
  {
    id: "registration-fee",
    question: "Is there an entry fee to attend?",
    answer:
      "Attendance is completely free of charge. However, prior digital registration is mandatory to receive your accredited QR entry pass. This website does not process or take payments.",
  },
  {
    id: "hospitality",
    question: "How do I secure VIP Chalets or Corporate Hospitality?",
    answer:
      "Corporate hospitality suites, private chukka chalets, and Royal Patrons Circle access are allocated through protocol reservations. Inquiries can be made directly to the Secretariat via our official WhatsApp or telephone helplines.",
  },
  {
    id: "qr-pass",
    question: "How will I receive my festival credential pass?",
    answer:
      "Upon completing the free registration form, your unique accreditation record is generated. Your personalized digital QR pass is delivered via email and can be added to your mobile wallet or accessed anytime under 'My Pass'.",
  },
];

export function FAQAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {FAQS.map((faq) => (
        <AccordionItem
          key={faq.id}
          value={faq.id}
          className="rounded-xl border border-line bg-card/60 px-5 shadow-sm transition-all hover:bg-card"
        >
          <AccordionTrigger className="text-left font-display text-base font-semibold text-forest hover:no-underline sm:text-lg">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="font-sans text-sm leading-relaxed text-muted-brand sm:text-base">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

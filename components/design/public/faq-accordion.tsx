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
      "The Abeokuta Polo Festival 2026 (The Blueprint) takes place over three ceremonial days from Friday, 18th December to Sunday, 20th December 2026.",
  },
  {
    id: "venue",
    question: "Where is the tournament venue located?",
    answer:
      "The tournament is hosted at the Abeokuta Polo Club & Country Resort, located along the Abeokuta-Sagamu Expressway, Kobape, Abeokuta, Ogun State, Nigeria.",
  },
  {
    id: "host",
    question: "When was the Abeokuta Polo Club established?",
    answer:
      "Abeokuta Polo Club was established in 2025. The festival is held under the leadership of Club President Dr. Sheriff Adams Abdulrahman and under the royal patronage of His Royal Majesty, Oba Dr. Michael Aremu Gbadebo, CFR, the Alake and Paramount Ruler of Egbaland.",
  },
  {
    id: "admission-policy",
    question: "What is the admission policy for the 3-day tournament?",
    answer:
      "Day 1 (Friday, 18th December 2026) is 100% Free Public Admission upon completing digital registration. Day 2 (Saturday, 19th December) and Day 3 (Sunday, 20th December) gate admission is strictly Through Ticket. Registered participants must present their digital pass QR code at the turnstiles each day.",
  },
  {
    id: "programme-schedule",
    question: "What are the confirmed programmes for each tournament day?",
    answer:
      "Day 1 (Fri 18 Dec): Media, Tour & Festival Light-Up with 10:00 AM Press Conference, guided resort tour, and Evening Light-Up & Welcome Dinner. Day 2 (Sat 19 Dec): Royal Opening by HRM The Alake of Egbaland, Opening of Festival Market Square, 3 Foundation-Laying Ceremonies (Trauma Centre, Festival Complex, 500-Horse Stable), Queens Polo Match, Two-Team Literary Debate, Poetry Recitation, Sip and Paint Experience, DJ performances, and Evening Polo Match. Day 3 (Sun 20 Dec): The Grand Finale with Royal Cup Final Match, Queens Cup Final Match, Presidential Address by Dr. Sheriff Adams Abdulrahman, live sets by ARISTOS BAND, Celebrating the 100 Kings ('ONE FIELD, ONE LEGACY'), and headline closing concert by BERRYOLA.",
  },
  {
    id: "persistent-pass",
    question: "How do I retrieve and keep my digital gate access card?",
    answer:
      "Once you register, your pass code and QR card are permanently saved on your device (stored in local storage and persistent cookie). An offline HTML pass card file is automatically downloaded to your phone files for offline turnstile presentation. When you return to the website, your pass code is automatically recognized and ready for 1-click access.",
  },
  {
    id: "pdf-schedule",
    question: "Can I download the official schedule on my phone?",
    answer:
      "Yes. The beautifully formatted 3-page Official Programme PDF matching the festival blueprint is available for instant download on the website and sent directly to your registered email address.",
  },
  {
    id: "corporate-sponsorship",
    question: "What corporate sponsorship tiers are available?",
    answer:
      "The official corporate sponsorship structure includes: Title Sponsor (₦200 Million and Above — Principal Festival Partner), Platinum Sponsor (₦50 Million), Gold Sponsor (₦25 Million), Silver Sponsor (₦15 Million), Bronze Sponsor (₦5 Million), Supporting Sponsor (₦2–₦4 Million), and Patron & Individual Sponsors (₦10 Million and Above). Specialised event sponsorships are available for The Royal Cup, Queens Polo Team, Governor's Cup, and Grand Finale & Awards.",
  },
  {
    id: "reminders",
    question: "Will registered participants receive reminders on WhatsApp and Email?",
    answer:
      "Yes. When registering, you can opt in to receive weekly countdown updates and daily tournament notifications via email and our official WhatsApp helpline (+234 818 188 8884) to stay informed on match times, gate openings, and royal ceremonies.",
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

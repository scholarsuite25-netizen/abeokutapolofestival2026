"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadSponsorshipPDF } from "@/lib/pdf/sponsorship-pdf";

export function SponsorshipPdfButton({
  variant = "default",
  size = "default",
  className = "",
  showIcon = true,
  label = "Download Corporate Sponsorship Brochure (PDF)",
}: {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  label?: string;
}) {
  return (
    <Button
      onClick={() => downloadSponsorshipPDF()}
      variant={variant}
      size={size}
      className={`cursor-pointer ${className}`}
    >
      {showIcon && <FileDown className="mr-2 size-4 text-gold" />}
      {label}
    </Button>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReadMoreSectionProps {
  /**
   * Always visible summary / preview content.
   */
  summary: React.ReactNode;
  /**
   * Detailed information revealed when toggled.
   */
  details: React.ReactNode;
  /**
   * Label on toggle button when collapsed (default: "Read More Details").
   */
  moreText?: string;
  /**
   * Label on toggle button when expanded (default: "Show Less").
   */
  lessText?: string;
  /**
   * Optional container className.
   */
  className?: string;
  /**
   * Button styling variant: "link" | "button" | "pill"
   */
  variant?: "link" | "button" | "pill";
  /**
   * Initially expanded
   */
  defaultExpanded?: boolean;
}

export function ReadMoreSection({
  summary,
  details,
  moreText = "Read More Details",
  lessText = "Show Less",
  className = "",
  variant = "link",
  defaultExpanded = false,
}: ReadMoreSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Summary Content */}
      <div>{summary}</div>

      {/* Expandable Details */}
      {expanded && (
        <div className="pt-2 animate-in fade-in-50 slide-in-from-top-2 duration-200">
          {details}
        </div>
      )}

      {/* Interactive Toggle Button */}
      <div className="pt-1">
        {variant === "button" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="border-gold/40 text-forest hover:bg-gold/10 text-xs font-semibold py-1 h-8 cursor-pointer"
          >
            <span>{expanded ? lessText : moreText}</span>
            {expanded ? (
              <ChevronUp className="ml-1.5 size-3.5 text-gold-deep" />
            ) : (
              <ChevronDown className="ml-1.5 size-3.5 text-gold-deep" />
            )}
          </Button>
        ) : variant === "pill" ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-bold text-forest transition-colors hover:bg-gold/20 cursor-pointer"
          >
            <span>{expanded ? lessText : moreText}</span>
            {expanded ? (
              <ChevronUp className="size-3 text-gold-deep" />
            ) : (
              <ChevronDown className="size-3 text-gold-deep" />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gold-deep hover:text-forest transition-colors cursor-pointer group"
          >
            <span className="underline-offset-4 group-hover:underline">
              {expanded ? lessText : moreText}
            </span>
            {expanded ? (
              <ChevronUp className="size-3.5 transition-transform group-hover:-translate-y-0.5" />
            ) : (
              <ChevronDown className="size-3.5 transition-transform group-hover:translate-y-0.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

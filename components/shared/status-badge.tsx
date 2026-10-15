import { cn } from "@/lib/utils";

const TONES = {
  neutral: "border-line bg-sage text-ink",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  info: "border-forest/20 bg-forest/10 text-forest",
  gold: "border-gold/40 bg-gold/15 text-forest-deep",
} as const;

export type StatusBadgeTone = keyof typeof TONES;

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: StatusBadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

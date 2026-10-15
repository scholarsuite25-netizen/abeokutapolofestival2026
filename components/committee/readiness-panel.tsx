import { cn } from "@/lib/utils";
import { StatusBadge, type StatusBadgeTone } from "@/components/shared/status-badge";
import { BAND_LABEL, type ReadinessReport } from "@/lib/readiness";

const BAND_TONE: Record<ReadinessReport["band"], StatusBadgeTone> = {
  not_started: "neutral",
  in_progress: "info",
  nearly_ready: "warning",
  ready: "success",
};

export function ReadinessPanel({
  report,
  className,
}: {
  report: ReadinessReport;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-line bg-card p-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-brand">
          Readiness
        </h2>
        <StatusBadge tone={BAND_TONE[report.band]}>{BAND_LABEL[report.band]}</StatusBadge>
      </div>

      <p className="mt-2 font-display text-3xl font-semibold text-forest">
        {report.overallPercent}%
      </p>

      <ul className="mt-4 space-y-3">
        {report.dimensions.map((dimension) => (
          <li key={dimension.key}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-ink">{dimension.label}</span>
              <span className="text-muted-brand">
                {dimension.numerator}/{dimension.denominator || "—"}
              </span>
            </div>
            <div
              className="mt-1 h-1.5 overflow-hidden rounded-full bg-sage"
              role="presentation"
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  dimension.percent >= 90
                    ? "bg-success"
                    : dimension.percent >= 50
                      ? "bg-gold"
                      : "bg-forest-interactive",
                )}
                style={{ width: `${dimension.percent}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

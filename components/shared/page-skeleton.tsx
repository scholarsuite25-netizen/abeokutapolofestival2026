import { cn } from "@/lib/utils";

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg border border-line bg-card p-4", className)}
      aria-hidden
    >
      <div className="h-4 w-1/3 rounded bg-sage" />
      <div className="mt-3 h-3 w-2/3 rounded bg-sage/70" />
      <div className="mt-2 h-3 w-1/2 rounded bg-sage/50" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

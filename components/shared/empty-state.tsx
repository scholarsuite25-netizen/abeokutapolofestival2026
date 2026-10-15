import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-line bg-card/60 px-6 py-12 text-center",
        className,
      )}
    >
      <p className="font-display text-lg font-semibold text-forest">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-brand">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

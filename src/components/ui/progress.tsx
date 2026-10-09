import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  label,
}: {
  value: number;
  className?: string;
  label?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-2.5 overflow-hidden rounded-full bg-[var(--secondary)]", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safeValue)}
      aria-label={label}
    >
      <div
        className="h-full rounded-full bg-[var(--primary)] transition-[width]"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

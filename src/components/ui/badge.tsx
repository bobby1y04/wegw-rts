import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[var(--secondary)] px-2.5 py-1 text-xs font-semibold text-[var(--secondary-foreground)]",
        className,
      )}
      {...props}
    />
  );
}

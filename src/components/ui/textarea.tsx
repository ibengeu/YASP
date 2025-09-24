import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "font-sans text-sm font-normal leading-[1.29] tracking-[0.16px]",
        "flex min-h-16 w-full rounded-none resize-none",
        "bg-input-background border border-border px-4 py-3",
        "text-foreground placeholder:text-muted-foreground",
        "selection:bg-primary selection:text-primary-foreground",
        "transition-all duration-75 ease-in-out outline-none",
        "focus:border-primary focus:shadow-[inset_0_0_0_1px_var(--primary),0_0_0_1px_var(--primary)]",
        "hover:border-border-strong",
        "aria-invalid:border-destructive aria-invalid:focus:border-destructive",
        "aria-invalid:focus:shadow-[inset_0_0_0_1px_var(--destructive),0_0_0_1px_var(--destructive)]",
        "disabled:bg-muted disabled:border-border disabled:text-muted-foreground",
        "disabled:pointer-events-none disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };

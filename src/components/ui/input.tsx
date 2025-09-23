import * as React from "react";

import { cn } from "./utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Carbon input base styles - clean with proper spacing
        "font-sans text-sm font-normal leading-[1.29] tracking-[0.16px]",
        "flex h-10 w-full min-w-0 bg-input-background border border-border",
        "px-4 py-2 text-foreground placeholder:text-muted-foreground",
        "selection:bg-primary selection:text-primary-foreground",
        // Carbon focus states - box shadow focus indicator
        "transition-all duration-75 ease-in-out outline-none", 
        "focus:border-primary focus:shadow-[inset_0_0_0_1px_var(--primary),0_0_0_1px_var(--primary)]",
        "hover:border-border-strong",
        // Error states
        "aria-invalid:border-destructive aria-invalid:focus:border-destructive",
        "aria-invalid:focus:shadow-[inset_0_0_0_1px_var(--destructive),0_0_0_1px_var(--destructive)]",
        // Disabled states  
        "disabled:bg-muted disabled:border-border disabled:text-muted-foreground",
        "disabled:pointer-events-none disabled:cursor-not-allowed",
        // File input styles
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // Carbon radius
        "rounded-none",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };

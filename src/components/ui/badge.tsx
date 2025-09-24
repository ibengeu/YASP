import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Carbon tag/badge base styles - sharp edges, proper typography
  "inline-flex items-center justify-center rounded-none px-2 py-0.5 font-sans text-xs font-normal leading-[1.33] tracking-[0.32px] w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all duration-75 ease-in-out overflow-hidden border-0",
  {
    variants: {
      variant: {
        // Carbon filled tags
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "bg-muted text-muted-foreground [a&]:hover:bg-muted/80",
        destructive: "bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90",
        warning: "bg-warning text-warning-foreground [a&]:hover:bg-warning/90",
        success: "bg-success text-success-foreground [a&]:hover:bg-success/90",
        
        // Carbon outline tags - clean borders
        outline: "border border-border bg-transparent text-foreground [a&]:hover:bg-muted",
        "outline-primary": "border border-primary bg-transparent text-primary [a&]:hover:bg-primary/10",
        "outline-destructive": "border border-destructive bg-transparent text-destructive [a&]:hover:bg-destructive/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

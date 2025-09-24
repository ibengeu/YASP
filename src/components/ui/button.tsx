import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] transition-all duration-75 ease-in-out disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--primary),inset_0_0_0_2px_var(--background)] focus-visible:ring-0",
  {
    variants: {
      variant: {
        // Carbon primary button - main call-to-action
        default: "bg-primary text-primary-foreground hover:bg-primary/90 border-0",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 border-0",
        
        // Carbon secondary button - outlined button
        secondary: "bg-transparent text-primary border border-primary hover:bg-primary/10 focus-visible:shadow-[inset_0_0_0_1px_var(--primary),inset_0_0_0_2px_var(--background)]",
        outline: "bg-transparent text-primary border border-primary hover:bg-primary/10 focus-visible:shadow-[inset_0_0_0_1px_var(--primary),inset_0_0_0_2px_var(--background)]",
        
        // Carbon tertiary button - text button
        tertiary: "bg-transparent text-primary hover:bg-primary/10 border-0 focus-visible:shadow-[inset_0_0_0_1px_var(--primary),inset_0_0_0_2px_var(--background)]",
        ghost: "bg-transparent text-foreground hover:bg-muted border-0 focus-visible:shadow-[inset_0_0_0_1px_var(--foreground),inset_0_0_0_2px_var(--background)]",
        
        // Carbon danger buttons
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-0 focus-visible:shadow-[inset_0_0_0_1px_var(--destructive),inset_0_0_0_2px_var(--background)]",
        "destructive-secondary": "bg-transparent text-destructive border border-destructive hover:bg-destructive/10 focus-visible:shadow-[inset_0_0_0_1px_var(--destructive),inset_0_0_0_2px_var(--background)]",
        "destructive-tertiary": "bg-transparent text-destructive hover:bg-destructive/10 border-0 focus-visible:shadow-[inset_0_0_0_1px_var(--destructive),inset_0_0_0_2px_var(--background)]",
        
        // Utility variants
        link: "text-primary underline-offset-4 hover:underline border-0 cursor-pointer",
      },
      size: {
        sm: "h-8 px-4 text-sm gap-2", /* 32px height */
        default: "h-10 px-4 text-sm gap-2", /* 40px height - Carbon default */
        md: "h-10 px-4 text-sm gap-2",
        lg: "h-12 px-6 text-sm gap-2", /* 48px height */
        xl: "h-16 px-8 text-base gap-3", /* 64px height */
        icon: "size-10 p-0", /* 40px square */
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };

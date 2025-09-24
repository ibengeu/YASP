"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import {cn} from "@/lib/utils";

function Label({
                   className,
                   ...props
               }: React.ComponentProps<typeof LabelPrimitive.Root>) {
    return (
        <LabelPrimitive.Root
            data-slot="label"
            className={cn(
                "font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] text-foreground select-none mb-2 block group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                className,
            )}
            {...props}
        />
    );
}

export {Label};

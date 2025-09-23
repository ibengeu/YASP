import React from 'react';
import { cn } from '../ui/utils';

/**
 * Carbon Design System inspired Card component (Tile)
 * 
 * Carbon uses "Tiles" instead of "Cards" - they are flatter with minimal elevation
 * and rely on borders rather than shadows for definition.
 */

interface CarbonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'clickable' | 'selectable' | 'expandable';
  selected?: boolean;
  disabled?: boolean;
}

export function CarbonCard({
  className,
  variant = 'default',
  selected = false,
  disabled = false,
  children,
  ...props
}: CarbonCardProps) {
  const baseClasses = cn(
    // Carbon tile base styles
    "bg-card text-card-foreground border border-border",
    "transition-all duration-150 ease-out",
    
    // Remove rounded corners for Carbon's sharp aesthetic
    "rounded-none",
    
    // Carbon spacing using 8px grid
    "p-4", // 16px padding (spacing-05)
    
    // Carbon elevation - minimal
    "shadow-none",
    
    // Conditional styles based on variant
    {
      // Default tile - static
      "": variant === 'default',
      
      // Clickable tile - interactive
      "cursor-pointer hover:bg-secondary/50 hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0": 
        variant === 'clickable' && !disabled,
      
      // Selectable tile - can be selected
      "cursor-pointer hover:bg-secondary/50 hover:border-border-strong": 
        variant === 'selectable' && !disabled,
      
      // Selected state
      "bg-primary/5 border-primary": selected && !disabled,
      
      // Disabled state
      "opacity-50 cursor-not-allowed": disabled,
    },
    
    className
  );

  const Component = variant === 'clickable' || variant === 'selectable' ? 'button' : 'div';

  return (
    <Component
      className={baseClasses}
      disabled={disabled}
      aria-selected={variant === 'selectable' ? selected : undefined}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Carbon Card Header - for structured content
 */
interface CarbonCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CarbonCardHeader({ className, children, ...props }: CarbonCardHeaderProps) {
  return (
    <div 
      className={cn("mb-3 space-y-1", className)} // spacing-03 margin bottom
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Carbon Card Title - follows Carbon typography
 */
interface CarbonCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CarbonCardTitle({ className, children, ...props }: CarbonCardTitleProps) {
  return (
    <h3 
      className={cn(
        "text-lg font-regular leading-tight", // Carbon heading-03 equivalent
        className
      )} 
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * Carbon Card Description - body text
 */
interface CarbonCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CarbonCardDescription({ className, children, ...props }: CarbonCardDescriptionProps) {
  return (
    <p 
      className={cn(
        "text-sm text-muted-foreground", // Carbon body-compact-01
        className
      )} 
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Carbon Card Content - main content area
 */
interface CarbonCardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CarbonCardContent({ className, children, ...props }: CarbonCardContentProps) {
  return (
    <div 
      className={cn("", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Carbon Card Footer - for actions
 */
interface CarbonCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CarbonCardFooter({ className, children, ...props }: CarbonCardFooterProps) {
  return (
    <div 
      className={cn(
        "mt-4 pt-3 border-t border-border flex items-center justify-between", // spacing-04 margin, spacing-03 padding
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}
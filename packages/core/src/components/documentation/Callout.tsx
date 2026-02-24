/**
 * Callout — highlighted note, warning, tip, or danger block for documentation pages.
 * Accessibility: role="note" or role="alert" depending on variant; clear icon labels.
 */

import { Info, AlertTriangle, Lightbulb, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type CalloutVariant = 'info' | 'warning' | 'tip' | 'danger';

interface CalloutProps {
    variant?: CalloutVariant;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

const variantConfig: Record<CalloutVariant, {
    icon: React.ElementType;
    label: string;
    classes: string;
    iconClasses: string;
    titleClasses: string;
}> = {
    info: {
        icon: Info,
        label: 'Note',
        classes: 'border-blue-500/40 bg-blue-500/8 dark:bg-blue-500/10',
        iconClasses: 'text-blue-500',
        titleClasses: 'text-blue-700 dark:text-blue-400',
    },
    tip: {
        icon: Lightbulb,
        label: 'Tip',
        classes: 'border-green-500/40 bg-green-500/8 dark:bg-green-500/10',
        iconClasses: 'text-green-500',
        titleClasses: 'text-green-700 dark:text-green-400',
    },
    warning: {
        icon: AlertTriangle,
        label: 'Warning',
        classes: 'border-yellow-500/40 bg-yellow-500/8 dark:bg-yellow-500/10',
        iconClasses: 'text-yellow-500',
        titleClasses: 'text-yellow-700 dark:text-yellow-400',
    },
    danger: {
        icon: XCircle,
        label: 'Danger',
        classes: 'border-red-500/40 bg-red-500/8 dark:bg-red-500/10',
        iconClasses: 'text-red-500',
        titleClasses: 'text-red-700 dark:text-red-400',
    },
};

export function Callout({ variant = 'info', title, children, className }: CalloutProps) {
    const config = variantConfig[variant];
    const Icon = config.icon;
    const role = variant === 'danger' || variant === 'warning' ? 'alert' : 'note';

    return (
        <div
            role={role}
            className={cn(
                'my-4 flex gap-3 rounded-lg border px-4 py-3 text-sm',
                config.classes,
                className
            )}
        >
            <Icon
                className={cn('mt-0.5 h-4 w-4 shrink-0', config.iconClasses)}
                aria-hidden="true"
            />
            <div className="flex-1 leading-relaxed">
                {title ? (
                    <p className={cn('font-semibold mb-1', config.titleClasses)}>
                        {title}
                    </p>
                ) : (
                    <span className="sr-only">{config.label}: </span>
                )}
                <div className="text-foreground/80">{children}</div>
            </div>
        </div>
    );
}

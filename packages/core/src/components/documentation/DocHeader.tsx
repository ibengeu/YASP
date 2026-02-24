/**
 * DocHeader — page-level title, subtitle, and breadcrumb for documentation pages.
 * Accessibility: uses semantic <header> with nav landmark for breadcrumbs (ARIA A11y).
 */

import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocBreadcrumb } from './types';

interface DocHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: DocBreadcrumb[];
    className?: string;
}

export function DocHeader({ title, subtitle, breadcrumbs, className }: DocHeaderProps) {
    return (
        <header className={cn('mb-8', className)}>
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="mb-3">
                    <ol className="flex items-center gap-1 text-sm text-muted-foreground">
                        {breadcrumbs.map((crumb, i) => (
                            <li key={i} className="flex items-center gap-1">
                                {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                                {crumb.href ? (
                                    <a
                                        href={crumb.href}
                                        className="hover:text-foreground transition-colors"
                                    >
                                        {crumb.label}
                                    </a>
                                ) : (
                                    <span aria-current="page" className="text-foreground font-medium">
                                        {crumb.label}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && (
                <p className="mt-2 text-lg text-muted-foreground leading-relaxed">{subtitle}</p>
            )}
            <div className="mt-6 h-px bg-border" />
        </header>
    );
}

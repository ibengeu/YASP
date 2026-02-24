/**
 * DocFooter — prev/next page navigation and last-updated info for documentation pages.
 * Accessibility: uses <nav> landmark with aria-label.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocNavLink {
    label: string;
    href: string;
}

interface DocFooterProps {
    prev?: DocNavLink;
    next?: DocNavLink;
    lastUpdated?: string;
    className?: string;
}

export function DocFooter({ prev, next, lastUpdated, className }: DocFooterProps) {
    return (
        <footer className={cn('mt-12 border-t pt-6', className)}>
            {(prev || next) && (
                <nav aria-label="Documentation page navigation" className="flex items-center justify-between gap-4 mb-6">
                    {prev ? (
                        <a
                            href={prev.href}
                            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg border px-4 py-3 hover:border-foreground/20 max-w-[45%]"
                        >
                            <ChevronLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                            <div className="text-left min-w-0">
                                <div className="text-xs text-muted-foreground mb-0.5">Previous</div>
                                <div className="font-medium truncate">{prev.label}</div>
                            </div>
                        </a>
                    ) : (
                        <div />
                    )}

                    {next ? (
                        <a
                            href={next.href}
                            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg border px-4 py-3 hover:border-foreground/20 max-w-[45%] ml-auto"
                        >
                            <div className="text-right min-w-0">
                                <div className="text-xs text-muted-foreground mb-0.5">Next</div>
                                <div className="font-medium truncate">{next.label}</div>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </a>
                    ) : (
                        <div />
                    )}
                </nav>
            )}

            {lastUpdated && (
                <p className="text-xs text-muted-foreground text-center">
                    Last updated: <time>{lastUpdated}</time>
                </p>
            )}
        </footer>
    );
}

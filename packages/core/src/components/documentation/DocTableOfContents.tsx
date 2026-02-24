/**
 * DocTableOfContents — right-side in-page heading navigator, auto-highlights active heading.
 * Uses IntersectionObserver to track which section is currently in view.
 * Accessibility: <nav> landmark with aria-label, aria-current for active link.
 */

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { DocHeading } from './types';

interface DocTableOfContentsProps {
    headings: DocHeading[];
    className?: string;
}

export function DocTableOfContents({ headings, className }: DocTableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? '');
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        if (headings.length === 0 || typeof IntersectionObserver === 'undefined') return;

        observerRef.current?.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                        break;
                    }
                }
            },
            { rootMargin: '0px 0px -70% 0px', threshold: 0 }
        );

        headings.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observerRef.current?.observe(el);
        });

        return () => observerRef.current?.disconnect();
    }, [headings]);

    if (headings.length === 0) return null;

    return (
        <nav
            aria-label="Table of contents"
            className={cn('w-56 shrink-0 overflow-y-auto py-6 px-2', className)}
        >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
                On this page
            </p>
            <ul className="space-y-0.5">
                {headings.map(({ id, text, level }) => (
                    <li key={id}>
                        <a
                            href={`#${id}`}
                            aria-current={activeId === id ? 'location' : undefined}
                            className={cn(
                                'block rounded-md px-2 py-1 text-xs leading-relaxed transition-colors',
                                level === 3 && 'pl-4',
                                level === 4 && 'pl-6',
                                activeId === id
                                    ? 'text-primary font-medium bg-primary/8'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

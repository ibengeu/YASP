/**
 * DocSection — a titled content section within a documentation page.
 * Automatically registers a heading anchor for table-of-contents linking.
 * Accessibility: semantic <section> with aria-labelledby pointing to heading.
 */

import { cn } from '@/lib/utils';

interface DocSectionProps {
    title: string;
    id?: string;
    level?: 2 | 3 | 4;
    children: React.ReactNode;
    className?: string;
}

const headingClasses: Record<2 | 3 | 4, string> = {
    2: 'text-2xl font-semibold tracking-tight text-foreground mt-10 mb-4',
    3: 'text-xl font-semibold tracking-tight text-foreground mt-8 mb-3',
    4: 'text-base font-semibold text-foreground mt-6 mb-2',
};

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

export function DocSection({ title, id, level = 2, children, className }: DocSectionProps) {
    const headingId = id ?? slugify(title);
    const Tag = `h${level}` as 'h2' | 'h3' | 'h4';

    return (
        <section aria-labelledby={headingId} className={cn('scroll-mt-20', className)}>
            <Tag
                id={headingId}
                className={cn(headingClasses[level], 'group flex items-center gap-2')}
            >
                <a
                    href={`#${headingId}`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground text-sm font-normal"
                    aria-label={`Link to section: ${title}`}
                >
                    #
                </a>
                {title}
            </Tag>
            <div className="text-sm leading-7 text-foreground/90 [&_p]:mb-4 [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:ml-4">
                {children}
            </div>
        </section>
    );
}

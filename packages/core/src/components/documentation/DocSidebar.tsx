/**
 * DocSidebar — hierarchical navigation sidebar for documentation pages.
 * Supports collapsible sections and active route highlighting.
 * Accessibility: <nav> landmark with aria-label, aria-current for active item.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocNavSection, DocNavItem } from './types';

interface NavItemProps {
    item: DocNavItem;
    currentPath: string;
    depth?: number;
}

function NavItem({ item, currentPath, depth = 0 }: NavItemProps) {
    const isActive = currentPath === item.href;
    const hasChildren = item.items && item.items.length > 0;
    const isChildActive = hasChildren && item.items!.some(
        (child) => currentPath === child.href || currentPath.startsWith(child.href + '/')
    );
    const [open, setOpen] = useState(isChildActive || isActive);

    return (
        <li>
            <div className="flex items-center gap-1">
                <a
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                        'flex-1 flex items-center rounded-md px-2 py-1.5 text-sm transition-colors',
                        depth > 0 && 'ml-3',
                        isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    )}
                >
                    {item.title}
                </a>
                {hasChildren && (
                    <button
                        type="button"
                        onClick={() => setOpen((o) => !o)}
                        aria-label={open ? `Collapse ${item.title}` : `Expand ${item.title}`}
                        aria-expanded={open}
                        className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        {open
                            ? <ChevronDown className="h-3.5 w-3.5" />
                            : <ChevronRight className="h-3.5 w-3.5" />
                        }
                    </button>
                )}
            </div>
            {hasChildren && open && (
                <ul className="mt-0.5 space-y-0.5 border-l border-border ml-3 pl-2">
                    {item.items!.map((child) => (
                        <NavItem key={child.href} item={child} currentPath={currentPath} depth={depth + 1} />
                    ))}
                </ul>
            )}
        </li>
    );
}

interface DocSidebarProps {
    sections: DocNavSection[];
    currentPath: string;
    className?: string;
}

export function DocSidebar({ sections, currentPath, className }: DocSidebarProps) {
    return (
        <nav
            aria-label="Documentation navigation"
            className={cn(
                'w-64 shrink-0 flex flex-col gap-6 overflow-y-auto py-6 px-3',
                className
            )}
        >
            {sections.map((section) => (
                <div key={section.title}>
                    <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {section.title}
                    </p>
                    <ul className="space-y-0.5">
                        {section.items.map((item) => (
                            <NavItem key={item.href} item={item} currentPath={currentPath} />
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    );
}

/**
 * DocumentationLayout — composable shell for all documentation pages.
 *
 * Uses slot-based composition rather than prop-heavy configuration:
 *
 *   <DocumentationLayout
 *     topNav={<MyTopNav />}
 *     sidebar={<MySidebar />}
 *     rightPanel={<MyRightPanel />}   // optional
 *   >
 *     <DocHeader … />
 *     <DocSection … />
 *   </DocumentationLayout>
 *
 * The default sidebar slot renders DocSidebar from nav + currentPath props
 * for backwards-compatibility with the prose docs usage.
 *
 * Accessibility: ARIA landmarks throughout (banner, nav, main).
 * Dark mode: inherits from the app ThemeProvider via Tailwind CSS.
 */

import { cn } from '@/lib/utils';
import { DocSidebar } from './DocSidebar';
import { DocTableOfContents } from './DocTableOfContents';
import type { DocNavSection, DocHeading } from './types';

// ── Slot sub-components ──────────────────────────────────────────────────────

/** Top navigation bar slot — renders across the full width above the body. */
export function DocTopNav({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <header
            className={cn(
                'h-14 shrink-0 border-b border-border bg-background/80 backdrop-blur-md z-50',
                'flex items-center justify-between px-4 lg:px-6',
                className
            )}
        >
            {children}
        </header>
    );
}

/** Left sidebar slot — scrolls independently inside the layout. */
export function DocSidebarSlot({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'hidden lg:flex shrink-0 border-r border-border/60 bg-background/80 backdrop-blur-sm overflow-y-auto',
                className
            )}
        >
            {children}
        </div>
    );
}

/** Right panel slot — sits alongside the main content. */
export function DocRightPanelSlot({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'hidden lg:flex shrink-0 border-l border-border/60 bg-background/80 backdrop-blur-sm overflow-y-auto',
                className
            )}
        >
            {children}
        </div>
    );
}

// ── Layout component ─────────────────────────────────────────────────────────

interface DocumentationLayoutProps {
    // ── Slot-based composition ──
    /** Renders above the sidebar+content row. If omitted, no top nav is shown. */
    topNav?: React.ReactNode;
    /** Left sidebar slot. Overrides nav+currentPath when provided. */
    sidebar?: React.ReactNode;
    /** Right panel slot. Overrides headings-based ToC when provided. */
    rightPanel?: React.ReactNode;

    // ── Convenience props (prose docs) ──
    /** Prose nav sections — used to auto-render DocSidebar when sidebar slot is not set. */
    nav?: DocNavSection[];
    /** Active route path for DocSidebar active-state. */
    currentPath?: string;
    /** Page headings for the auto-rendered right-side ToC (used when rightPanel is not set). */
    headings?: DocHeading[];

    /** Main content area children. */
    children: React.ReactNode;
    className?: string;
}

export function DocumentationLayout({
    topNav,
    sidebar,
    rightPanel,
    nav,
    currentPath = '',
    headings = [],
    children,
    className,
}: DocumentationLayoutProps) {
    // Resolve sidebar: explicit slot > auto DocSidebar if nav provided > nothing
    const resolvedSidebar =
        sidebar !== undefined ? sidebar
        : nav ? (
            <DocSidebar sections={nav} currentPath={currentPath} className="h-full" />
        ) : null;

    // Resolve right panel: explicit slot > auto ToC if headings > nothing
    const resolvedRight =
        rightPanel !== undefined ? rightPanel
        : headings.length > 0 ? (
            <DocTableOfContents headings={headings} className="h-full" />
        ) : null;

    return (
        <div className={cn('h-screen flex flex-col bg-background text-foreground overflow-hidden', className)}>
            {/* Background decorations */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-background" />
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `linear-gradient(to right, var(--color-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--color-grid) 1px, transparent 1px)`,
                        backgroundSize: '24px 24px',
                    }}
                />
            </div>

            {/* Top nav slot */}
            {topNav}

            {/* Body row */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left sidebar */}
                {resolvedSidebar && (
                    <DocSidebarSlot>{resolvedSidebar}</DocSidebarSlot>
                )}

                {/* Main content */}
                <main
                    id="main-content"
                    className="flex-1 overflow-y-auto"
                    aria-label="Documentation content"
                >
                    {children}
                </main>

                {/* Right panel */}
                {resolvedRight && (
                    <DocRightPanelSlot>{resolvedRight}</DocRightPanelSlot>
                )}
            </div>
        </div>
    );
}

/**
 * Types for the Documentation Layout System
 */

export interface DocNavItem {
    title: string;
    href: string;
    items?: DocNavItem[];
}

export interface DocNavSection {
    title: string;
    items: DocNavItem[];
}

export interface DocBreadcrumb {
    label: string;
    href?: string;
}

export interface DocHeading {
    id: string;
    text: string;
    level: 2 | 3 | 4;
}

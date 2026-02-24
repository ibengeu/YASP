/**
 * Documentation content registry.
 *
 * Defines the sidebar navigation structure and the set of valid doc page slugs.
 * Content is rendered in DocsPage via the slug → page component map.
 */

import type { DocNavSection, DocHeading } from './types';

export const DOC_NAV: DocNavSection[] = [
    {
        title: 'Getting Started',
        items: [
            { title: 'Introduction', href: '/docs' },
            { title: 'Installation', href: '/docs/installation' },
            { title: 'Quick Start', href: '/docs/quick-start' },
        ],
    },
    {
        title: 'Core Concepts',
        items: [
            { title: 'API Catalog', href: '/docs/api-catalog' },
            { title: 'Editor', href: '/docs/editor' },
            { title: 'Try It Out', href: '/docs/try-it-out' },
        ],
    },
    {
        title: 'Integrations',
        items: [
            { title: 'OpenAPI 3.x', href: '/docs/openapi' },
            { title: 'Swagger 2.0', href: '/docs/swagger' },
        ],
    },
];

/** Ordered list of all slugs for prev/next navigation */
export const DOC_SLUGS = [
    'introduction',
    'installation',
    'quick-start',
    'api-catalog',
    'editor',
    'try-it-out',
    'openapi',
    'swagger',
] as const;

export type DocSlug = typeof DOC_SLUGS[number];

/** Map index slug "" (root /docs) to "introduction" */
export const SLUG_ALIASES: Record<string, DocSlug> = {
    '': 'introduction',
};

/** Metadata per page: title, subtitle, headings for ToC, prev/next */
export interface DocPageMeta {
    slug: DocSlug;
    title: string;
    subtitle?: string;
    breadcrumbs: { label: string; href?: string }[];
    headings: DocHeading[];
    lastUpdated?: string;
}

export const DOC_PAGE_META: Record<DocSlug, DocPageMeta> = {
    introduction: {
        slug: 'introduction',
        title: 'Introduction',
        subtitle: 'Learn what YASP is and how it can help you manage your APIs.',
        breadcrumbs: [{ label: 'Docs', href: '/docs' }, { label: 'Introduction' }],
        headings: [
            { id: 'what-is-yasp', text: 'What is YASP?', level: 2 },
            { id: 'key-features', text: 'Key Features', level: 2 },
            { id: 'who-is-it-for', text: 'Who is it for?', level: 2 },
        ],
        lastUpdated: '2026-02-24',
    },
    installation: {
        slug: 'installation',
        title: 'Installation',
        subtitle: 'Get YASP up and running in your project.',
        breadcrumbs: [{ label: 'Docs', href: '/docs' }, { label: 'Getting Started', href: '/docs' }, { label: 'Installation' }],
        headings: [
            { id: 'requirements', text: 'Requirements', level: 2 },
            { id: 'install-via-bun', text: 'Install via Bun', level: 2 },
            { id: 'install-via-npm', text: 'Install via npm', level: 2 },
            { id: 'environment-variables', text: 'Environment Variables', level: 2 },
        ],
        lastUpdated: '2026-02-24',
    },
    'quick-start': {
        slug: 'quick-start',
        title: 'Quick Start',
        subtitle: 'Upload your first API spec and explore it in minutes.',
        breadcrumbs: [{ label: 'Docs', href: '/docs' }, { label: 'Getting Started', href: '/docs' }, { label: 'Quick Start' }],
        headings: [
            { id: 'upload-a-spec', text: 'Upload a Spec', level: 2 },
            { id: 'browse-endpoints', text: 'Browse Endpoints', level: 2 },
            { id: 'make-your-first-request', text: 'Make Your First Request', level: 2 },
        ],
        lastUpdated: '2026-02-24',
    },
    'api-catalog': {
        slug: 'api-catalog',
        title: 'API Catalog',
        subtitle: 'Manage and organise all your OpenAPI specifications in one place.',
        breadcrumbs: [{ label: 'Docs', href: '/docs' }, { label: 'Core Concepts', href: '/docs/api-catalog' }, { label: 'API Catalog' }],
        headings: [
            { id: 'importing-specs', text: 'Importing Specs', level: 2 },
            { id: 'tagging-and-filtering', text: 'Tagging & Filtering', level: 2 },
            { id: 'workspace-types', text: 'Workspace Types', level: 2 },
        ],
        lastUpdated: '2026-02-24',
    },
    editor: {
        slug: 'editor',
        title: 'Editor',
        subtitle: 'Write and validate OpenAPI specs with real-time linting.',
        breadcrumbs: [{ label: 'Docs', href: '/docs' }, { label: 'Core Concepts', href: '/docs/api-catalog' }, { label: 'Editor' }],
        headings: [
            { id: 'yaml-and-json', text: 'YAML & JSON Support', level: 2 },
            { id: 'linting', text: 'Linting', level: 2 },
            { id: 'keyboard-shortcuts', text: 'Keyboard Shortcuts', level: 2 },
        ],
        lastUpdated: '2026-02-24',
    },
    'try-it-out': {
        slug: 'try-it-out',
        title: 'Try It Out',
        subtitle: 'Send live requests to your API directly from the documentation.',
        breadcrumbs: [{ label: 'Docs', href: '/docs' }, { label: 'Core Concepts', href: '/docs/api-catalog' }, { label: 'Try It Out' }],
        headings: [
            { id: 'setting-a-server', text: 'Setting a Server', level: 2 },
            { id: 'authentication', text: 'Authentication', level: 2 },
            { id: 'request-body', text: 'Request Body', level: 2 },
            { id: 'reading-responses', text: 'Reading Responses', level: 2 },
        ],
        lastUpdated: '2026-02-24',
    },
    openapi: {
        slug: 'openapi',
        title: 'OpenAPI 3.x',
        subtitle: 'Full support for OpenAPI 3.0 and 3.1 specifications.',
        breadcrumbs: [{ label: 'Docs', href: '/docs' }, { label: 'Integrations', href: '/docs/openapi' }, { label: 'OpenAPI 3.x' }],
        headings: [
            { id: 'supported-features', text: 'Supported Features', level: 2 },
            { id: 'schema-components', text: 'Schema Components', level: 2 },
        ],
        lastUpdated: '2026-02-24',
    },
    swagger: {
        slug: 'swagger',
        title: 'Swagger 2.0',
        subtitle: 'Import and explore legacy Swagger 2.0 specifications.',
        breadcrumbs: [{ label: 'Docs', href: '/docs' }, { label: 'Integrations', href: '/docs/openapi' }, { label: 'Swagger 2.0' }],
        headings: [
            { id: 'swagger-support', text: 'Swagger Support', level: 2 },
            { id: 'migrating-to-openapi', text: 'Migrating to OpenAPI 3.x', level: 2 },
        ],
        lastUpdated: '2026-02-24',
    },
};

/** Resolve prev/next page links for a given slug */
export function getAdjacentPages(slug: DocSlug): {
    prev?: { label: string; href: string };
    next?: { label: string; href: string };
} {
    const idx = DOC_SLUGS.indexOf(slug);
    const prevSlug = DOC_SLUGS[idx - 1];
    const nextSlug = DOC_SLUGS[idx + 1];

    const hrefFor = (s: DocSlug) => s === 'introduction' ? '/docs' : `/docs/${s}`;

    return {
        prev: prevSlug ? { label: DOC_PAGE_META[prevSlug].title, href: hrefFor(prevSlug) } : undefined,
        next: nextSlug ? { label: DOC_PAGE_META[nextSlug].title, href: hrefFor(nextSlug) } : undefined,
    };
}

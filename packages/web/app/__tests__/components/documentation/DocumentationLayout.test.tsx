/**
 * TDD: Documentation layout system
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    DocumentationLayout,
    DocHeader,
    DocSection,
    CodeBlock,
    Callout,
    DocFooter,
    DocSidebar,
} from '@yasp/core/components/documentation';
import type { DocNavSection, DocHeading } from '@yasp/core/components/documentation';

const NAV: DocNavSection[] = [
    {
        title: 'Getting Started',
        items: [
            { title: 'Introduction', href: '/docs' },
            { title: 'Installation', href: '/docs/installation' },
            {
                title: 'Configuration',
                href: '/docs/configuration',
                items: [
                    { title: 'Basic', href: '/docs/configuration/basic' },
                    { title: 'Advanced', href: '/docs/configuration/advanced' },
                ],
            },
        ],
    },
];

const HEADINGS: DocHeading[] = [
    { id: 'installation', text: 'Installation', level: 2 },
    { id: 'basic-setup', text: 'Basic Setup', level: 3 },
];

// ── DocHeader ────────────────────────────────────────────────────────────────

describe('DocHeader', () => {
    it('renders title', () => {
        render(<DocHeader title="Getting Started" />);
        expect(screen.getByRole('heading', { level: 1, name: 'Getting Started' })).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
        render(<DocHeader title="Getting Started" subtitle="Everything you need to begin." />);
        expect(screen.getByText('Everything you need to begin.')).toBeInTheDocument();
    });

    it('renders breadcrumbs with nav landmark', () => {
        render(
            <DocHeader
                title="Quick Start"
                breadcrumbs={[
                    { label: 'Docs', href: '/docs' },
                    { label: 'Getting Started', href: '/docs/start' },
                    { label: 'Quick Start' },
                ]}
            />
        );
        const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
        expect(nav).toBeInTheDocument();
        expect(screen.getByText('Docs')).toBeInTheDocument();
        expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    it('marks last breadcrumb as current page', () => {
        render(
            <DocHeader
                title="Setup"
                breadcrumbs={[
                    { label: 'Docs', href: '/docs' },
                    { label: 'Setup' },
                ]}
            />
        );
        // The breadcrumb "Setup" span should have aria-current="page"
        const currentSpan = screen.getAllByText('Setup').find(
            (el) => el.getAttribute('aria-current') === 'page'
        );
        expect(currentSpan).toBeDefined();
    });
});

// ── DocSection ───────────────────────────────────────────────────────────────

describe('DocSection', () => {
    it('renders as a section with h2 by default', () => {
        render(<DocSection title="Installation"><p>Install the package.</p></DocSection>);
        expect(screen.getByRole('heading', { level: 2, name: /Installation/ })).toBeInTheDocument();
        expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('renders h3 when level=3', () => {
        render(<DocSection title="Basic Setup" level={3}><p>content</p></DocSection>);
        expect(screen.getByRole('heading', { level: 3, name: /Basic Setup/ })).toBeInTheDocument();
    });

    it('generates a slug id from title', () => {
        render(<DocSection title="My Section"><p>content</p></DocSection>);
        const heading = screen.getByRole('heading', { name: /My Section/ });
        expect(heading).toHaveAttribute('id', 'my-section');
    });

    it('uses custom id when provided', () => {
        render(<DocSection title="My Section" id="custom-id"><p>content</p></DocSection>);
        expect(screen.getByRole('heading', { name: /My Section/ })).toHaveAttribute('id', 'custom-id');
    });

    it('renders children', () => {
        render(<DocSection title="Usage"><p>Hello world</p></DocSection>);
        expect(screen.getByText('Hello world')).toBeInTheDocument();
    });
});

// ── CodeBlock ────────────────────────────────────────────────────────────────

describe('CodeBlock', () => {
    it('renders code content', () => {
        render(<CodeBlock language="bash">npm install yasp</CodeBlock>);
        expect(screen.getByText('npm install yasp')).toBeInTheDocument();
    });

    it('shows language label', () => {
        render(<CodeBlock language="bash">echo hi</CodeBlock>);
        expect(screen.getByText('bash')).toBeInTheDocument();
    });

    it('shows filename when provided', () => {
        render(<CodeBlock language="ts" filename="index.ts">const x = 1;</CodeBlock>);
        expect(screen.getByText('index.ts')).toBeInTheDocument();
    });

    it('has a copy button', () => {
        render(<CodeBlock language="ts">const x = 1;</CodeBlock>);
        expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('has accessible region label', () => {
        render(<CodeBlock language="bash">echo hi</CodeBlock>);
        expect(screen.getByRole('region', { name: /bash code block/i })).toBeInTheDocument();
    });
});

// ── Callout ──────────────────────────────────────────────────────────────────

describe('Callout', () => {
    it('renders children', () => {
        render(<Callout>This is a note.</Callout>);
        expect(screen.getByText('This is a note.')).toBeInTheDocument();
    });

    it('renders title when provided', () => {
        render(<Callout title="Remember">Do not forget.</Callout>);
        expect(screen.getByText('Remember')).toBeInTheDocument();
    });

    it('uses role="note" for info variant', () => {
        render(<Callout variant="info">Info content</Callout>);
        expect(screen.getByRole('note')).toBeInTheDocument();
    });

    it('uses role="alert" for warning variant', () => {
        render(<Callout variant="warning">Warning content</Callout>);
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('uses role="alert" for danger variant', () => {
        render(<Callout variant="danger">Danger content</Callout>);
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });
});

// ── DocFooter ────────────────────────────────────────────────────────────────

describe('DocFooter', () => {
    it('renders prev and next links', () => {
        render(
            <DocFooter
                prev={{ label: 'Introduction', href: '/docs' }}
                next={{ label: 'Configuration', href: '/docs/configuration' }}
            />
        );
        expect(screen.getByText('Introduction')).toBeInTheDocument();
        expect(screen.getByText('Configuration')).toBeInTheDocument();
        expect(screen.getByRole('navigation', { name: /page navigation/i })).toBeInTheDocument();
    });

    it('renders lastUpdated date', () => {
        render(<DocFooter lastUpdated="2026-02-24" />);
        expect(screen.getByText('2026-02-24')).toBeInTheDocument();
    });

    it('renders without nav when neither prev nor next provided', () => {
        render(<DocFooter lastUpdated="2026-02-24" />);
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });
});

// ── DocSidebar ───────────────────────────────────────────────────────────────

describe('DocSidebar', () => {
    it('renders all section titles', () => {
        render(<DocSidebar sections={NAV} currentPath="/docs" />);
        expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    it('renders nav items as links', () => {
        render(<DocSidebar sections={NAV} currentPath="/docs" />);
        expect(screen.getByRole('link', { name: 'Introduction' })).toHaveAttribute('href', '/docs');
    });

    it('marks active link with aria-current="page"', () => {
        render(<DocSidebar sections={NAV} currentPath="/docs" />);
        expect(screen.getByRole('link', { name: 'Introduction' })).toHaveAttribute('aria-current', 'page');
    });

    it('does not mark inactive links as current', () => {
        render(<DocSidebar sections={NAV} currentPath="/docs" />);
        expect(screen.getByRole('link', { name: 'Installation' })).not.toHaveAttribute('aria-current');
    });

    it('renders with nav landmark', () => {
        render(<DocSidebar sections={NAV} currentPath="/docs" />);
        expect(screen.getByRole('navigation', { name: 'Documentation navigation' })).toBeInTheDocument();
    });

    it('expands child items for the active parent', async () => {
        render(<DocSidebar sections={NAV} currentPath="/docs/configuration/basic" />);
        // Child items should be visible when parent is active
        expect(screen.getByRole('link', { name: 'Basic' })).toBeInTheDocument();
    });
});

// ── DocumentationLayout ──────────────────────────────────────────────────────

describe('DocumentationLayout', () => {
    it('renders children in main content area', () => {
        render(
            <DocumentationLayout nav={NAV} currentPath="/docs">
                <p>Hello documentation</p>
            </DocumentationLayout>
        );
        expect(screen.getByText('Hello documentation')).toBeInTheDocument();
    });

    it('renders sidebar navigation', () => {
        render(
            <DocumentationLayout nav={NAV} currentPath="/docs">
                <p>content</p>
            </DocumentationLayout>
        );
        expect(screen.getByRole('navigation', { name: 'Documentation navigation' })).toBeInTheDocument();
    });

    it('renders composition of DocHeader + DocSection together', () => {
        render(
            <DocumentationLayout nav={NAV} currentPath="/docs/installation" headings={HEADINGS}>
                <DocHeader title="Installation" subtitle="Set up YASP in minutes." />
                <DocSection title="Installation">
                    <CodeBlock language="bash">bun add @yasp/core</CodeBlock>
                </DocSection>
            </DocumentationLayout>
        );
        expect(screen.getByRole('heading', { level: 1, name: 'Installation' })).toBeInTheDocument();
        expect(screen.getByText('bun add @yasp/core')).toBeInTheDocument();
    });
});

/**
 * TDD: DocsPage route integration
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import DocsPage from '@yasp/core/pages/DocsPage';

function renderAt(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/docs/:slug" element={<DocsPage />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('DocsPage', () => {
    it('renders Introduction page at /docs', () => {
        renderAt('/docs');
        expect(screen.getByRole('heading', { level: 1, name: 'Introduction' })).toBeInTheDocument();
    });

    it('renders Installation page at /docs/installation', () => {
        renderAt('/docs/installation');
        expect(screen.getByRole('heading', { level: 1, name: 'Installation' })).toBeInTheDocument();
    });

    it('renders Quick Start page at /docs/quick-start', () => {
        renderAt('/docs/quick-start');
        expect(screen.getByRole('heading', { level: 1, name: 'Quick Start' })).toBeInTheDocument();
    });

    it('renders generic placeholder for unwritten pages', () => {
        renderAt('/docs/editor');
        expect(screen.getByRole('heading', { level: 1, name: 'Editor' })).toBeInTheDocument();
        expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    });

    it('redirects unknown slugs back to /docs', () => {
        renderAt('/docs/does-not-exist');
        // After redirect, Introduction page is rendered
        expect(screen.getByRole('heading', { level: 1, name: 'Introduction' })).toBeInTheDocument();
    });

    it('renders the sidebar navigation', () => {
        renderAt('/docs');
        expect(screen.getByRole('navigation', { name: 'Documentation navigation' })).toBeInTheDocument();
    });

    it('renders prev/next footer navigation', () => {
        renderAt('/docs/installation');
        // Installation is index 1 — prev=Introduction, next=Quick Start
        const footer = screen.getByRole('navigation', { name: /page navigation/i });
        expect(footer).toBeInTheDocument();
        // Links inside the footer nav
        expect(footer.querySelector('[href="/docs"]')).toBeInTheDocument();
        expect(footer.querySelector('[href="/docs/quick-start"]')).toBeInTheDocument();
    });

    it('marks active nav link with aria-current on the sidebar', () => {
        renderAt('/docs/installation');
        const installLink = screen.getByRole('link', { name: 'Installation' });
        expect(installLink).toHaveAttribute('aria-current', 'page');
    });
});

describe('docs-content helpers', () => {
    it('getAdjacentPages returns correct prev/next', async () => {
        const { getAdjacentPages } = await import('@yasp/core/components/documentation/docs-content');
        const { prev, next } = getAdjacentPages('installation');
        expect(prev?.label).toBe('Introduction');
        expect(next?.label).toBe('Quick Start');
    });

    it('getAdjacentPages returns undefined for first page', async () => {
        const { getAdjacentPages } = await import('@yasp/core/components/documentation/docs-content');
        const { prev } = getAdjacentPages('introduction');
        expect(prev).toBeUndefined();
    });

    it('getAdjacentPages returns undefined for last page', async () => {
        const { getAdjacentPages } = await import('@yasp/core/components/documentation/docs-content');
        const { next } = getAdjacentPages('swagger');
        expect(next).toBeUndefined();
    });
});

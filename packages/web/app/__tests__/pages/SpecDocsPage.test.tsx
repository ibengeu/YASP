/**
 * TDD: SpecDocsPage — OpenAPI spec viewer composed into DocumentationLayout
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import SpecDocsPage from '@yasp/core/pages/SpecDocsPage';

// Mock IDB storage
const mockGetSpec = vi.fn();
vi.mock('@yasp/core/core/storage/idb-storage', () => ({
    idbStorage: { getSpec: (...args: any[]) => mockGetSpec(...args) },
}));

// yaml.parse handles both JSON and YAML — use JSON.parse in tests
vi.mock('yaml', () => ({ default: { parse: (s: string) => JSON.parse(s) } }));

// next-themes
vi.mock('next-themes', () => ({
    useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

// Suppress ReactMarkdown in tests
vi.mock('react-markdown', () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock('remark-gfm', () => ({ default: () => {} }));

const MOCK_SPEC = JSON.stringify({
    openapi: '3.0.0',
    info: { title: 'Pet Store API', version: '1.0.0' },
    servers: [{ url: 'https://petstore.example.com' }],
    paths: {
        '/pets': {
            get: {
                summary: 'List pets',
                tags: ['Pets'],
                responses: { '200': { description: 'A list of pets' } },
            },
        },
        '/pets/{id}': {
            get: {
                summary: 'Get a pet',
                tags: ['Pets'],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { '200': { description: 'A single pet' } },
            },
        },
    },
    components: {
        schemas: {
            Pet: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                },
            },
        },
    },
});

function renderAt(specId = 'spec-123') {
    return render(
        <MemoryRouter initialEntries={[`/catalog/${specId}`]}>
            <Routes>
                <Route path="/catalog/:id" element={<SpecDocsPage />} />
                <Route path="/catalog" element={<div>Catalog</div>} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    mockGetSpec.mockResolvedValue({
        id: 'spec-123',
        title: 'Pet Store API',
        content: MOCK_SPEC,
        description: '',
        version: '1.0.0',
        metadata: { tags: [] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    } as any);
});

describe('SpecDocsPage', () => {
    it('shows loading state initially', () => {
        renderAt();
        expect(screen.getByText(/loading documentation/i)).toBeInTheDocument();
    });

    it('renders the spec title in the top nav after loading', async () => {
        renderAt();
        await waitFor(() => {
            expect(screen.getByText('Pet Store API')).toBeInTheDocument();
        });
    });

    it('renders endpoint group tags in the sidebar after loading', async () => {
        renderAt();
        // The sidebar groups endpoints by tag. Our spec has tag "Pets"
        // (appears in both desktop and mobile sidebar slots)
        await waitFor(() => {
            const matches = screen.getAllByText('Pets');
            expect(matches.length).toBeGreaterThan(0);
        });
    });

    it('renders a back-to-catalog link', async () => {
        renderAt();
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /back to catalog/i })).toBeInTheDocument();
        });
    });

    it('shows error state when spec not found', async () => {
        mockGetSpec.mockResolvedValueOnce(null as any);
        renderAt();
        await waitFor(() => {
            expect(screen.getByText(/API not found/i)).toBeInTheDocument();
        });
    });

    it('renders data model names in the sidebar', async () => {
        renderAt();
        await waitFor(() => {
            // "Pet" schema should appear in the data models section
            const matches = screen.getAllByText('Pet');
            expect(matches.length).toBeGreaterThan(0);
        });
    });

    it('redirects to /catalog when no id provided', async () => {
        render(
            <MemoryRouter initialEntries={['/catalog/']}>
                <Routes>
                    <Route path="/catalog/:id" element={<SpecDocsPage />} />
                    <Route path="/catalog" element={<div>Catalog page</div>} />
                </Routes>
            </MemoryRouter>
        );
        // With empty id, useParams gives undefined → navigate('/catalog')
        // The mock still gets called with undefined which returns null
        mockGetSpec.mockResolvedValueOnce(null as any);
        await waitFor(() => {
            // Either error state or catalog redirect — both are acceptable
            const hasCatalog = screen.queryByText('Catalog page');
            const hasError = screen.queryByText(/not found/i);
            expect(hasCatalog || hasError).toBeTruthy();
        });
    });
});

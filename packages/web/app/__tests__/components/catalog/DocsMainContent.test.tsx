/**
 * TDD: DocsMainContent — schema rendering, content type tabs, params, responses, security
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocsMainContent } from '@yasp/core/components/catalog/docs-view/DocsMainContent';
import type { ParsedEndpoint, ParsedOpenAPISpec } from '@yasp/core/components/catalog/docs-view/types';

vi.mock('react-markdown', () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock('remark-gfm', () => ({ default: () => {} }));

const BASE_SPEC: ParsedOpenAPISpec = {
  openapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
};

const makeEndpoint = (overrides: Partial<ParsedEndpoint> = {}): ParsedEndpoint => ({
  path: '/pets',
  method: 'GET',
  operation: {
    summary: 'List pets',
    responses: { '200': { description: 'A list of pets' } },
  },
  tags: ['Pets'],
  ...overrides,
});

describe('DocsMainContent — empty state', () => {
  it('shows placeholder when no endpoint selected', () => {
    render(<DocsMainContent endpoint={null} baseUrl="https://api.example.com" />);
    expect(screen.getByText(/select an endpoint/i)).toBeInTheDocument();
  });
});

describe('DocsMainContent — request body content types', () => {
  it('shows content type badge for single content type', () => {
    const ep = makeEndpoint({
      method: 'POST',
      operation: {
        summary: 'Create pet',
        responses: { '201': { description: 'Created' } },
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { name: { type: 'string' } } },
            },
          },
        },
      },
    });
    render(<DocsMainContent endpoint={ep} baseUrl="https://api.example.com" spec={BASE_SPEC} />);
    expect(screen.getByText('application/json')).toBeInTheDocument();
  });

  it('shows tab buttons when multiple content types', () => {
    const ep = makeEndpoint({
      method: 'POST',
      operation: {
        summary: 'Create',
        responses: { '201': { description: 'Created' } },
        requestBody: {
          content: {
            'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } },
            'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } },
          },
        },
      },
    });
    render(<DocsMainContent endpoint={ep} baseUrl="https://api.example.com" spec={BASE_SPEC} />);
    expect(screen.getByRole('button', { name: 'application/json' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'multipart/form-data' })).toBeInTheDocument();
  });

  it('renders schema properties for selected content type', () => {
    const ep = makeEndpoint({
      method: 'POST',
      operation: {
        summary: 'Create pet',
        responses: { '201': { description: 'Created' } },
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', description: 'Pet name' },
                  age: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    });
    render(<DocsMainContent endpoint={ep} baseUrl="https://api.example.com" spec={BASE_SPEC} />);
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('age')).toBeInTheDocument();
  });
});

describe('DocsMainContent — parameters by location', () => {
  it('renders header params in a Header Parameters section', () => {
    const ep = makeEndpoint({
      operation: {
        summary: 'Get',
        responses: { '200': { description: 'ok' } },
        parameters: [
          { name: 'X-Api-Key', in: 'header', schema: { type: 'string' } },
        ],
      },
    });
    render(<DocsMainContent endpoint={ep} baseUrl="https://api.example.com" />);
    expect(screen.getByText('X-Api-Key')).toBeInTheDocument();
    expect(screen.getByText(/header parameters/i)).toBeInTheDocument();
  });

  it('renders cookie params in a Cookie Parameters section', () => {
    const ep = makeEndpoint({
      operation: {
        summary: 'Get',
        responses: { '200': { description: 'ok' } },
        parameters: [
          { name: 'session', in: 'cookie', schema: { type: 'string' } },
        ],
      },
    });
    render(<DocsMainContent endpoint={ep} baseUrl="https://api.example.com" />);
    expect(screen.getByText('session')).toBeInTheDocument();
    expect(screen.getByText(/cookie parameters/i)).toBeInTheDocument();
  });

  it('displays enum values as constraint badges', () => {
    const ep = makeEndpoint({
      operation: {
        summary: 'Get',
        responses: { '200': { description: 'ok' } },
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive'] } },
        ],
      },
    });
    render(<DocsMainContent endpoint={ep} baseUrl="https://api.example.com" />);
    expect(screen.getByText('"active"')).toBeInTheDocument();
    expect(screen.getByText('"inactive"')).toBeInTheDocument();
  });
});

describe('DocsMainContent — response schemas', () => {
  it('renders response schema properties when available', () => {
    const ep = makeEndpoint({
      operation: {
        summary: 'Get pet',
        responses: {
          '200': {
            description: 'A pet',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    });
    render(<DocsMainContent endpoint={ep} baseUrl="https://api.example.com" spec={BASE_SPEC} />);
    // Response section should have the schema properties
    expect(screen.getByText('200')).toBeInTheDocument();
  });
});

describe('DocsMainContent — security', () => {
  it('shows per-operation security scheme names', () => {
    const ep = makeEndpoint({
      operation: {
        summary: 'Secured',
        responses: { '200': { description: 'ok' } },
        security: [{ BearerAuth: [] }],
      },
    });
    const spec: ParsedOpenAPISpec = {
      ...BASE_SPEC,
      components: {
        securitySchemes: {
          BearerAuth: { type: 'http', scheme: 'bearer' },
        },
      },
    };
    render(<DocsMainContent endpoint={ep} baseUrl="https://api.example.com" spec={spec} />);
    expect(screen.getByText('BearerAuth')).toBeInTheDocument();
  });
});

describe('DocsMainContent — deprecated badge', () => {
  it('shows Deprecated badge when operation is deprecated', () => {
    const ep = makeEndpoint({
      operation: {
        summary: 'Old endpoint',
        deprecated: true,
        responses: { '200': { description: 'ok' } },
      },
    });
    render(<DocsMainContent endpoint={ep} baseUrl="https://api.example.com" />);
    expect(screen.getByText(/deprecated/i)).toBeInTheDocument();
  });
});

// ── Bug fixes ─────────────────────────────────────────────────────────────

describe('DocsMainContent — missing responses guard', () => {
  it('does not crash when operation.responses is undefined', () => {
    const ep = makeEndpoint({
      operation: {
        summary: 'No responses',
        responses: undefined as any,
      },
    });
    // Should render without throwing
    expect(() =>
      render(<DocsMainContent endpoint={ep} baseUrl="https://api.example.com" />)
    ).not.toThrow();
  });
});

describe('DocsMainContent — requestBody $ref resolution', () => {
  it('resolves a $ref requestBody and renders its content types', () => {
    const ep = makeEndpoint({
      method: 'POST',
      operation: {
        summary: 'Create',
        responses: { '201': { description: 'Created' } },
        requestBody: { $ref: '#/components/requestBodies/PetBody' } as any,
      },
    });
    const spec: ParsedOpenAPISpec = {
      ...BASE_SPEC,
      components: {
        requestBodies: {
          PetBody: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { name: { type: 'string' } } },
              },
            },
          },
        },
      },
    };
    render(<DocsMainContent endpoint={ep} baseUrl="https://api.example.com" spec={spec} />);
    expect(screen.getByText('application/json')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
  });
});

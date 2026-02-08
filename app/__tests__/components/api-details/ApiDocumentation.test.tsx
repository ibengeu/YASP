import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

// Mock ReactMarkdown to render plain text
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));
vi.mock('remark-gfm', () => ({ default: () => {} }));

import { ApiDocumentation } from '@/components/api-details/ApiDocumentation';

describe('ApiDocumentation', () => {
  afterEach(() => {
    cleanup();
  });

  const mockSpec = {
    openapi: '3.1.0',
    info: {
      title: 'Pet Store API',
      version: '2.0.0',
      description: 'A sample pet store API',
    },
    servers: [{ url: 'https://petstore.example.com' }],
    paths: {
      '/pets': {
        get: {
          summary: 'List all pets',
          description: 'Returns all pets from the store',
          parameters: [
            {
              name: 'limit',
              in: 'query' as const,
              required: false,
              schema: { type: 'integer' },
              description: 'Max items to return',
            },
          ],
          responses: {
            '200': { description: 'A list of pets' },
            '500': { description: 'Server error' },
          },
        },
        post: {
          summary: 'Create a pet',
          description: 'Creates a new pet in the store',
          requestBody: {
            description: 'Pet to add',
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Pet created' },
          },
        },
      },
      '/pets/{petId}': {
        get: {
          summary: 'Get a pet by ID',
          parameters: [
            {
              name: 'petId',
              in: 'path' as const,
              required: true,
              schema: { type: 'string' },
              description: 'The pet ID',
            },
          ],
          responses: {
            '200': { description: 'A pet' },
            '404': { description: 'Not found' },
          },
        },
      },
    },
  };

  it('should render API info header with title and version', () => {
    render(<ApiDocumentation spec={mockSpec} />);

    expect(screen.getByText('Pet Store API')).toBeInTheDocument();
    expect(screen.getByText(/Version 2\.0\.0/)).toBeInTheDocument();
  });

  it('should render API description via markdown', () => {
    render(<ApiDocumentation spec={mockSpec} />);

    expect(screen.getByText('A sample pet store API')).toBeInTheDocument();
  });

  it('should render server URL', () => {
    render(<ApiDocumentation spec={mockSpec} />);

    expect(screen.getByText('https://petstore.example.com')).toBeInTheDocument();
  });

  it('should render all endpoints', () => {
    render(<ApiDocumentation spec={mockSpec} />);

    expect(screen.getByText('List all pets')).toBeInTheDocument();
    expect(screen.getByText('Create a pet')).toBeInTheDocument();
    expect(screen.getByText('Get a pet by ID')).toBeInTheDocument();
  });

  it('should render endpoint method badges', () => {
    const { container } = render(<ApiDocumentation spec={mockSpec} />);

    // Should have GET and POST badges
    const badges = container.querySelectorAll('[class*="uppercase"]');
    const badgeTexts = Array.from(badges).map((el) => el.textContent?.trim());
    expect(badgeTexts).toContain('GET');
    expect(badgeTexts).toContain('POST');
  });

  it('should render parameters table for endpoints with parameters', () => {
    render(<ApiDocumentation spec={mockSpec} />);

    const paramHeaders = screen.getAllByText('Parameters');
    expect(paramHeaders.length).toBeGreaterThan(0);
    expect(screen.getByText('limit')).toBeInTheDocument();
    expect(screen.getByText('Max items to return')).toBeInTheDocument();
  });

  it('should render request body section for POST endpoints', () => {
    render(<ApiDocumentation spec={mockSpec} />);

    expect(screen.getByText('Request Body')).toBeInTheDocument();
    expect(screen.getByText('Pet to add')).toBeInTheDocument();
  });

  it('should render responses table', () => {
    render(<ApiDocumentation spec={mockSpec} />);

    const statusCodes = screen.getAllByText('200');
    expect(statusCodes.length).toBeGreaterThan(0);
    expect(screen.getByText('A list of pets')).toBeInTheDocument();
  });

  it('should render endpoint IDs for scroll targeting', () => {
    const { container } = render(<ApiDocumentation spec={mockSpec} />);

    expect(container.querySelector('#endpoint-get--pets')).toBeTruthy();
    expect(container.querySelector('#endpoint-post--pets')).toBeTruthy();
    // Use getElementById for IDs with special characters
    expect(document.getElementById('endpoint-get--pets-{petId}')).toBeTruthy();
  });

  it('should show empty state when spec has no paths', () => {
    const emptySpec = {
      openapi: '3.1.0',
      info: { title: 'Empty', version: '1.0.0' },
      paths: {},
    };

    render(<ApiDocumentation spec={emptySpec} />);

    expect(screen.getByText(/no api documentation available/i)).toBeInTheDocument();
  });

  it('should handle missing description gracefully', () => {
    const noDescSpec = {
      openapi: '3.1.0',
      info: { title: 'No Desc API', version: '1.0.0' },
      servers: [{ url: 'https://example.com' }],
      paths: {
        '/test': {
          get: {
            summary: 'Test endpoint',
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    };

    render(<ApiDocumentation spec={noDescSpec} />);

    expect(screen.getByText('No description provided')).toBeInTheDocument();
  });
});

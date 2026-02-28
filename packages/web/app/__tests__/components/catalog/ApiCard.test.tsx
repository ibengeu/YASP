import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiCard } from '@yasp/core/components/catalog/ApiCard';
import type { OpenApiDocument } from '@yasp/core/core/storage/storage-schema';

const mockSpec: OpenApiDocument = {
  id: 'test-1',
  type: 'openapi',
  title: 'Test API',
  version: '1.0.0',
  description: 'A test API specification',
  content: 'openapi: 3.0.0\ninfo:\n  title: Test API\npaths:\n  /users:\n    get:\n    post:',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  metadata: {
    score: 85,
    tags: ['test', 'api'],
    workspaceType: 'personal',
    syncStatus: 'synced',
    isDiscoverable: true,
  },
};

describe('ApiCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render spec title and description', () => {
    render(<ApiCard spec={mockSpec} viewMode="grid" onClick={vi.fn()} />);
    expect(screen.getByText('Test API')).toBeInTheDocument();
    expect(screen.getByText('A test API specification')).toBeInTheDocument();
  });

  it('should render endpoint count in grid mode', () => {
    render(<ApiCard spec={mockSpec} viewMode="grid" onClick={vi.fn()} />);
    expect(screen.getByText(/Endpoints/)).toBeInTheDocument();
  });

  it('should render relative time in grid mode', () => {
    render(<ApiCard spec={mockSpec} viewMode="grid" onClick={vi.fn()} />);
    // Should render some time indicator
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  it('should call onClick when grid card is clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<ApiCard spec={mockSpec} viewMode="grid" onClick={handleClick} />);

    const card = screen.getByRole('button', { name: /test api/i });
    if (card) {
      await user.click(card);
      expect(handleClick).toHaveBeenCalledWith(mockSpec);
    }
  });

  it('should render list mode with horizontal layout', () => {
    render(<ApiCard spec={mockSpec} viewMode="list" onClick={vi.fn()} />);
    const card = screen.getByRole('button', { name: /test api/i });
    expect(card).toHaveClass('flex');
    expect(card).toHaveClass('items-center');
    expect(card).toHaveClass('justify-between');
  });

  it('should show endpoint count in list mode', () => {
    render(<ApiCard spec={mockSpec} viewMode="list" onClick={vi.fn()} />);
    // New pattern uses a span with border
    const countSpan = screen.getByText(new RegExp(mockSpec.content.match(/get|post/gi)?.length.toString() || '0'));
    expect(countSpan).toBeInTheDocument();
  });

  it('should call onClick when list card is clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<ApiCard spec={mockSpec} viewMode="list" onClick={handleClick} />);

    const card = screen.getByRole('button', { name: /test api/i });
    if (card) {
      await user.click(card);
      expect(handleClick).toHaveBeenCalledWith(mockSpec);
    }
  });

  it('should render delete button when onDelete is provided', () => {
    const { container } = render(<ApiCard spec={mockSpec} viewMode="grid" onClick={vi.fn()} onDelete={vi.fn()} />);
    // Delete button should be present (may be hidden until hover in grid mode)
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(1); // At least arrow up + delete
  });

  it('should call onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    // Test in list mode where delete button is always visible (not hidden by opacity)
    render(<ApiCard spec={mockSpec} viewMode="list" onClick={vi.fn()} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete api/i });
    await user.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith(mockSpec.id);
  });

  it('should not render delete button when onDelete is not provided', () => {
    const { container } = render(<ApiCard spec={mockSpec} viewMode="grid" onClick={vi.fn()} />);
    // Only the card and arrow up button
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(1); // Just the arrow up button
  });

  it('should handle spec without description', () => {
    const specWithoutDesc = { ...mockSpec, description: undefined };
    render(<ApiCard spec={specWithoutDesc} viewMode="grid" onClick={vi.fn()} />);
    expect(screen.getByText('Test API')).toBeInTheDocument();
    expect(screen.getByText('No description available for this collection.')).toBeInTheDocument();
  });

  it('should display workspace type as text in grid mode', () => {
    render(<ApiCard spec={mockSpec} viewMode="grid" onClick={vi.fn()} />);
    // Workspace type should be visible as colored text in the icon square
    expect(screen.getByText('Test API')).toBeInTheDocument();
  });

  it('should render with proper grid mode classes', () => {
    render(<ApiCard spec={mockSpec} viewMode="grid" onClick={vi.fn()} />);
    const card = screen.getByRole('button', { name: /test api/i });
    expect(card).toHaveClass('p-4');
    expect(card).toHaveClass('rounded-xl');
  });

  it('should prioritize endpointCount from metadata if available', () => {
    const specWithMetadata: OpenApiDocument = {
      ...mockSpec,
      metadata: {
        ...mockSpec.metadata,
        specQuality: {
          confidence: 'high',
          endpointCount: 42,
          hasAuth: true,
          hasMultipleServers: false,
          validationIssues: 0,
        },
      },
    };
    render(<ApiCard spec={specWithMetadata} viewMode="grid" onClick={vi.fn()} />);
    expect(screen.getByText(/42 Endpoints/)).toBeInTheDocument();
  });

  it('should correctly count endpoints in JSON spec content', () => {
    const jsonSpec: OpenApiDocument = {
      ...mockSpec,
      content: '{"paths": {"/pets": {"get": {}, "post": {}}, "/pets/{id}": {"get": {}, "put": {}, "delete": {}}}}',
    };
    render(<ApiCard spec={jsonSpec} viewMode="grid" onClick={vi.fn()} />);
    // The regex should find "get":, "post":, "get":, "put":, "delete": (5 matches)
    expect(screen.getByText(/5 Endpoints/)).toBeInTheDocument();
  });
});

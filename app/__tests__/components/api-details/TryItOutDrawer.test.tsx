import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TryItOutDrawer } from '@/components/api-details/TryItOutDrawer';

describe('TryItOutDrawer', () => {
  afterEach(() => {
    cleanup();
  });

  const mockOperation = {
    summary: 'Get user by ID',
    parameters: [
      {
        name: 'userId',
        in: 'path' as const,
        required: true,
        schema: { type: 'string' },
      },
    ],
    responses: {
      '200': {
        description: 'Success',
      },
    },
  };

  const mockSpec = {
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {
      '/users/{userId}': {
        get: {
          summary: 'Get user by ID',
          operationId: 'getUserById',
          tags: ['Users'],
          parameters: [
            {
              name: 'userId',
              in: 'path' as const,
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Success',
            },
          },
        },
      },
    },
  };

  it('should not render when closed', () => {
    render(
      <TryItOutDrawer
        open={false}
        onClose={vi.fn()}
        operation={mockOperation}
        path="/users/{userId}"
        method="GET"
        baseUrl="https://api.example.com"
        spec={mockSpec}
      />
    );

    expect(screen.queryByText('API Testing Console')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(
      <TryItOutDrawer
        open={true}
        onClose={vi.fn()}
        operation={mockOperation}
        path="/users/{userId}"
        method="GET"
        baseUrl="https://api.example.com"
        spec={mockSpec}
      />
    );

    expect(screen.getByText('API Testing Console')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    const { container } = render(
      <TryItOutDrawer
        open={true}
        onClose={handleClose}
        operation={mockOperation}
        path="/users/{userId}"
        method="GET"
        baseUrl="https://api.example.com"
        spec={mockSpec}
      />
    );

    // Find close button by X icon SVG
    const closeButtons = container.querySelectorAll('button');
    const closeButton = Array.from(closeButtons).find(
      (button) => button.querySelector('svg.lucide-x')
    );
    expect(closeButton).toBeTruthy();
    fireEvent.click(closeButton!);

    expect(handleClose).toHaveBeenCalled();
  });

  it('should render bottom drawer with resizable handle', () => {
    const { container } = render(
      <TryItOutDrawer
        open={true}
        onClose={vi.fn()}
        operation={mockOperation}
        path="/users/{userId}"
        method="GET"
        baseUrl="https://api.example.com"
        spec={mockSpec}
      />
    );

    // Check for bottom drawer (uses fixed, inset-x-0, bottom-0)
    const drawer = container.querySelector('.fixed.inset-x-0.bottom-0');
    expect(drawer).toBeTruthy();

    // Check for resize handle (cursor-row-resize instead of cursor-ns-resize)
    const resizeHandle = container.querySelector('.cursor-row-resize');
    expect(resizeHandle).toBeTruthy();
  });

  it('should display method badge and Send button', () => {
    render(
      <TryItOutDrawer
        open={true}
        onClose={vi.fn()}
        operation={mockOperation}
        path="/users/{userId}"
        method="GET"
        baseUrl="https://api.example.com"
        spec={mockSpec}
      />
    );

    // Check for GET method badge
    const getMethods = screen.getAllByText('GET');
    expect(getMethods.length).toBeGreaterThan(0);

    // Check for Send button
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  it('should render endpoint explorer sidebar with endpoints', () => {
    const { container } = render(
      <TryItOutDrawer
        open={true}
        onClose={vi.fn()}
        operation={mockOperation}
        path="/users/{userId}"
        method="GET"
        baseUrl="https://api.example.com"
        spec={mockSpec}
      />
    );

    // Check for sidebar (not collapsed)
    const sidebar = container.querySelector('.w-72');
    expect(sidebar).toBeTruthy();

    // Check for search input in sidebar
    const searchInputs = container.querySelectorAll('input');
    const hasSearchInput = Array.from(searchInputs).some(
      input => input.placeholder?.includes('Search') || input.placeholder?.includes('search')
    );
    expect(hasSearchInput).toBeTruthy();
  });

  it('should render request form and Send button', () => {
    const { container } = render(
      <TryItOutDrawer
        open={true}
        onClose={vi.fn()}
        operation={mockOperation}
        path="/users/{userId}"
        method="GET"
        baseUrl="https://api.example.com"
        spec={mockSpec}
      />
    );

    // Check for Send button
    const sendButton = screen.getByText('Send');
    expect(sendButton).toBeInTheDocument();

    // Check for URL input
    const urlInputs = container.querySelectorAll('input[type="text"]');
    expect(urlInputs.length).toBeGreaterThan(0);

    // Check for request form structure (main content area)
    const mainContent = container.querySelector('.flex-1.flex.flex-col');
    expect(mainContent).toBeTruthy();
  });
});

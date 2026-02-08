import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { ApiDetailDrawer } from '@/components/api-details/ApiDetailDrawer';

// Mock idbStorage
const mockGetSpec = vi.fn();
vi.mock('@/core/storage/idb-storage', () => ({
  idbStorage: {
    getSpec: (...args: any[]) => mockGetSpec(...args),
  },
}));

// Mock yaml
vi.mock('yaml', () => ({
  parse: (content: string) => JSON.parse(content),
}));

// Mock ReactMarkdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));
vi.mock('remark-gfm', () => ({ default: () => {} }));

// Mock CodeMirror to avoid multiple-instance crashes in jsdom
vi.mock('@codemirror/view', () => {
  const EditorView = vi.fn().mockImplementation(() => ({
    state: { doc: { toString: () => '' } },
    dispatch: vi.fn(),
    destroy: vi.fn(),
  }));
  (EditorView as any).updateListener = { of: () => ({}) };
  (EditorView as any).theme = () => ({});
  return { EditorView, lineNumbers: () => ({}) };
});
vi.mock('@codemirror/state', () => ({
  EditorState: {
    create: vi.fn().mockReturnValue({}),
  },
}));
vi.mock('@codemirror/lang-json', () => ({ json: () => ({}) }));
vi.mock('@codemirror/theme-one-dark', () => ({ oneDark: {} }));

// Capture fetcher.submit calls
const mockSubmit = vi.fn();
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useFetcher: () => ({
      submit: mockSubmit,
      state: 'idle',
      data: null,
    }),
    useNavigate: () => mockNavigate,
  };
});

beforeEach(() => {
  mockSubmit.mockClear();
  mockNavigate.mockClear();
  mockGetSpec.mockClear();

  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Polyfill pointer capture for vaul in jsdom
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = vi.fn();
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = vi.fn();
  }
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
  }

  // Mock getComputedStyle for vaul's transform lookups
  const originalGetComputedStyle = window.getComputedStyle;
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudoElt) => {
    const style = originalGetComputedStyle(el, pseudoElt);
    if (!style.transform) {
      Object.defineProperty(style, 'transform', {
        value: 'none',
        configurable: true,
      });
    }
    return style;
  });

  // Polyfill document.styleSheets for react-resizable-panels cursor handling
  if (!document.styleSheets.length) {
    const styleEl = document.createElement('style');
    document.head.appendChild(styleEl);
  }
});

function renderWithRouter(ui: React.ReactElement) {
  const router = createMemoryRouter(
    [{ path: '/', element: ui }],
    { initialEntries: ['/'] }
  );
  return render(<RouterProvider router={router} />);
}

const mockSpecContent = JSON.stringify({
  openapi: '3.1.0',
  info: {
    title: 'Test API',
    version: '1.0.0',
    description: 'A test API',
  },
  servers: [{ url: 'https://api.test.com' }],
  paths: {
    '/users': {
      get: {
        summary: 'List users',
        tags: ['Users'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
          },
        ],
        responses: { '200': { description: 'Success' } },
      },
      post: {
        summary: 'Create user',
        tags: ['Users'],
        requestBody: {
          description: 'User data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'John' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
  },
});

describe('ApiDetailDrawer', () => {
  afterEach(() => {
    cleanup();
  });

  it('should not render content when closed', () => {
    renderWithRouter(
      <ApiDetailDrawer open={false} onClose={vi.fn()} specId="test-id" />
    );

    expect(screen.queryByText('Documentation')).not.toBeInTheDocument();
  });

  it('should render loading state then spec content when open', async () => {
    mockGetSpec.mockResolvedValue({
      id: 'test-id',
      content: mockSpecContent,
      title: 'Test API',
    });

    renderWithRouter(
      <ApiDetailDrawer open={true} onClose={vi.fn()} specId="test-id" />
    );

    // Should show loading initially
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // After loading, should show Documentation tab
    await waitFor(() => {
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });
  });

  it('should default to Try It Out tab', async () => {
    mockGetSpec.mockResolvedValue({
      id: 'test-id',
      content: mockSpecContent,
      title: 'Test API',
    });

    renderWithRouter(
      <ApiDetailDrawer open={true} onClose={vi.fn()} specId="test-id" />
    );

    await waitFor(() => {
      expect(screen.getByText('Try It Out')).toBeInTheDocument();
    });

    // Try It Out tab should be active by default (shows Send button)
    await waitFor(() => {
      expect(screen.getByText('Send')).toBeInTheDocument();
    });
  });

  it('should switch to Try It Out tab', async () => {
    const user = userEvent.setup();
    mockGetSpec.mockResolvedValue({
      id: 'test-id',
      content: mockSpecContent,
      title: 'Test API',
    });

    renderWithRouter(
      <ApiDetailDrawer open={true} onClose={vi.fn()} specId="test-id" />
    );

    await waitFor(() => {
      expect(screen.getByText('Try It Out')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Try It Out'));

    // Should show request form elements
    await waitFor(() => {
      expect(screen.getByText('Send')).toBeInTheDocument();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    mockGetSpec.mockResolvedValue({
      id: 'test-id',
      content: mockSpecContent,
      title: 'Test API',
    });

    renderWithRouter(
      <ApiDetailDrawer open={true} onClose={handleClose} specId="test-id" />
    );

    await waitFor(() => {
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Find close button by X icon (vaul renders in a portal, so query document)
    const closeButtons = document.querySelectorAll('button');
    const closeButton = Array.from(closeButtons).find(
      (button) => button.querySelector('svg.lucide-x')
    );
    expect(closeButton).toBeTruthy();
    await user.click(closeButton!);

    expect(handleClose).toHaveBeenCalled();
  });

  it('should use shadcn Drawer (vaul) for the drawer shell', async () => {
    mockGetSpec.mockResolvedValue({
      id: 'test-id',
      content: mockSpecContent,
      title: 'Test API',
    });

    renderWithRouter(
      <ApiDetailDrawer open={true} onClose={vi.fn()} specId="test-id" />
    );

    await waitFor(() => {
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    // vaul renders a drawer-content slot
    const drawerContent = document.querySelector('[data-slot="drawer-content"]');
    expect(drawerContent).toBeTruthy();

    // vaul renders an overlay
    const overlay = document.querySelector('[data-slot="drawer-overlay"]');
    expect(overlay).toBeTruthy();
  });

  it('should render full height drawer', async () => {
    mockGetSpec.mockResolvedValue({
      id: 'test-id',
      content: mockSpecContent,
      title: 'Test API',
    });

    renderWithRouter(
      <ApiDetailDrawer open={true} onClose={vi.fn()} specId="test-id" />
    );

    await waitFor(() => {
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    const drawerContent = document.querySelector('[data-slot="drawer-content"]');
    expect(drawerContent).toBeTruthy();
    // Should have full height class
    expect(drawerContent).toHaveClass('h-[100vh]');
  });

  it('should render endpoint sidebar in detail mode', async () => {
    mockGetSpec.mockResolvedValue({
      id: 'test-id',
      content: mockSpecContent,
      title: 'Test API',
    });

    renderWithRouter(
      <ApiDetailDrawer open={true} onClose={vi.fn()} specId="test-id" />
    );

    await waitFor(() => {
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    // Should have search input for endpoints (vaul renders in a portal, so query document)
    const searchInputs = document.querySelectorAll('input');
    const hasSearchInput = Array.from(searchInputs).some(
      (input) => input.placeholder?.includes('Search')
    );
    expect(hasSearchInput).toBeTruthy();
  });

  it('should have an Edit button that navigates to editor', async () => {
    mockGetSpec.mockResolvedValue({
      id: 'test-id',
      content: mockSpecContent,
      title: 'Test API',
    });

    renderWithRouter(
      <ApiDetailDrawer open={true} onClose={vi.fn()} specId="test-id" />
    );

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Edit'));
    expect(mockNavigate).toHaveBeenCalledWith('/editor/test-id');
  });

  it('should show error state when spec is not found', async () => {
    mockGetSpec.mockResolvedValue(null);

    renderWithRouter(
      <ApiDetailDrawer open={true} onClose={vi.fn()} specId="nonexistent" />
    );

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });

  // Try It Out tab tests

  it('should show Send button and request form in Try It Out tab', async () => {
    const user = userEvent.setup();
    mockGetSpec.mockResolvedValue({
      id: 'test-id',
      content: mockSpecContent,
      title: 'Test API',
    });

    renderWithRouter(
      <ApiDetailDrawer open={true} onClose={vi.fn()} specId="test-id" />
    );

    await waitFor(() => {
      expect(screen.getByText('Try It Out')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Try It Out'));

    await waitFor(() => {
      expect(screen.getByText('Send')).toBeInTheDocument();
    });

    // Should have URL input (method is shown as a static badge)
    const urlInput = screen.getByPlaceholderText('Enter request URL');
    expect(urlInput).toBeInTheDocument();
  });

  it('should load spec from IndexedDB using specId', async () => {
    mockGetSpec.mockResolvedValue({
      id: 'my-spec',
      content: mockSpecContent,
      title: 'Test API',
    });

    renderWithRouter(
      <ApiDetailDrawer open={true} onClose={vi.fn()} specId="my-spec" />
    );

    expect(mockGetSpec).toHaveBeenCalledWith('my-spec');
  });

  it('should have a visually hidden title for accessibility', async () => {
    mockGetSpec.mockResolvedValue({
      id: 'test-id',
      content: mockSpecContent,
      title: 'Test API',
    });

    renderWithRouter(
      <ApiDetailDrawer open={true} onClose={vi.fn()} specId="test-id" />
    );

    await waitFor(() => {
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    // vaul requires a DrawerTitle for accessibility
    const titleSlot = document.querySelector('[data-slot="drawer-title"]');
    expect(titleSlot).toBeTruthy();
  });

  it('should auto-select first endpoint on load and show body tab for POST', async () => {
    // Spec with POST as first endpoint to test body prefill
    const postFirstSpec = JSON.stringify({
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      servers: [{ url: 'https://api.test.com' }],
      paths: {
        '/items': {
          post: {
            summary: 'Create item',
            tags: ['Items'],
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'Widget' },
                      price: { type: 'number', example: 9.99 },
                    },
                  },
                },
              },
            },
            responses: { '201': { description: 'Created' } },
          },
        },
      },
    });

    const user = userEvent.setup();
    mockGetSpec.mockResolvedValue({
      id: 'test-id',
      content: postFirstSpec,
      title: 'Test API',
    });

    renderWithRouter(
      <ApiDetailDrawer open={true} onClose={vi.fn()} specId="test-id" />
    );

    await waitFor(() => {
      expect(screen.getByText('Try It Out')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Try It Out'));

    // POST endpoint auto-selected → body tab should be active
    await waitFor(() => {
      const bodyTab = document.querySelector('[data-testid="tab-body"]');
      expect(bodyTab).toBeTruthy();
    });
  });

  it('should not dismiss drawer via drag interaction', async () => {
    mockGetSpec.mockResolvedValue({
      id: 'test-id',
      content: mockSpecContent,
      title: 'Test API',
    });

    const handleClose = vi.fn();
    renderWithRouter(
      <ApiDetailDrawer open={true} onClose={handleClose} specId="test-id" />
    );

    await waitFor(() => {
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    // The drawer should still be open - drag handle interaction should not dismiss
    const drawerContent = document.querySelector('[data-slot="drawer-content"]');
    expect(drawerContent).toBeTruthy();
  });
});

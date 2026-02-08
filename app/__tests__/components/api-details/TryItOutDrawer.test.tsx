import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { TryItOutDrawer } from '@/components/api-details/TryItOutDrawer';

// Capture fetcher.submit calls for request verification
const mockSubmit = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useFetcher: () => ({
      submit: mockSubmit,
      state: 'idle',
      data: null,
    }),
  };
});

// Mock ResizeObserver for react-resizable-panels in jsdom
beforeEach(() => {
  mockSubmit.mockClear();
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

// Helper to wrap component in router for useFetcher
function renderWithRouter(ui: React.ReactElement) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: ui,
      },
    ],
    {
      initialEntries: ['/'],
    }
  );

  return render(<RouterProvider router={router} />);
}

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
    renderWithRouter(
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
    renderWithRouter(
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
    const { container } = renderWithRouter(
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
    const { container } = renderWithRouter(
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
    renderWithRouter(
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
    const { container } = renderWithRouter(
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
    const { container } = renderWithRouter(
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

  // --- Cycle 2: Auth Pre-Population (Gap 1) ---

  describe('auth pre-population', () => {
    it('should pre-select bearer auth when spec has bearer securityScheme', () => {
      const specWithBearer = {
        ...mockSpec,
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [{ bearerAuth: [] }],
      };

      renderWithRouter(
        <TryItOutDrawer
          open={true}
          onClose={vi.fn()}
          operation={mockOperation}
          path="/users/{userId}"
          method="GET"
          baseUrl="https://api.example.com"
          spec={specWithBearer}
        />
      );

      // Navigate to auth tab
      fireEvent.click(screen.getByTestId('tab-auth'));

      // Bearer Token should be selected
      const authSelect = screen.getByDisplayValue('Bearer Token');
      expect(authSelect).toBeInTheDocument();
    });

    it('should pre-select api-key auth when spec has apiKey securityScheme', () => {
      const specWithApiKey = {
        ...mockSpec,
        components: {
          securitySchemes: {
            apiKey: {
              type: 'apiKey',
              in: 'header' as const,
              name: 'X-API-Key',
            },
          },
        },
        security: [{ apiKey: [] }],
      };

      renderWithRouter(
        <TryItOutDrawer
          open={true}
          onClose={vi.fn()}
          operation={mockOperation}
          path="/users/{userId}"
          method="GET"
          baseUrl="https://api.example.com"
          spec={specWithApiKey}
        />
      );

      // Navigate to auth tab
      fireEvent.click(screen.getByTestId('tab-auth'));

      // API Key should be selected
      const authSelect = screen.getByDisplayValue('API Key');
      expect(authSelect).toBeInTheDocument();
    });

    it('should default to none when spec has no securitySchemes', () => {
      renderWithRouter(
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

      // Navigate to auth tab
      fireEvent.click(screen.getByTestId('tab-auth'));

      // No Auth should be selected
      const authSelect = screen.getByDisplayValue('No Auth');
      expect(authSelect).toBeInTheDocument();
    });

    it('should show hint when auth is auto-detected from spec', () => {
      const specWithBearer = {
        ...mockSpec,
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
            },
          },
        },
        security: [{ bearerAuth: [] }],
      };

      renderWithRouter(
        <TryItOutDrawer
          open={true}
          onClose={vi.fn()}
          operation={mockOperation}
          path="/users/{userId}"
          method="GET"
          baseUrl="https://api.example.com"
          spec={specWithBearer}
        />
      );

      // Navigate to auth tab
      fireEvent.click(screen.getByTestId('tab-auth'));

      expect(screen.getByText(/pre-selected from/i)).toBeInTheDocument();
    });
  });

  // --- Cycle 3: Fallback URL Warning (Gap 4) ---

  describe('fallback URL warning', () => {
    it('should show warning when baseUrl is the dummy fallback', () => {
      renderWithRouter(
        <TryItOutDrawer
          open={true}
          onClose={vi.fn()}
          operation={mockOperation}
          path="/users/{userId}"
          method="GET"
          baseUrl="https://api.example.com"
          spec={{ ...mockSpec, servers: [] }}
        />
      );

      expect(screen.getByText(/no server url configured/i)).toBeInTheDocument();
    });

    it('should not show warning when spec has valid servers', () => {
      const specWithServers = {
        ...mockSpec,
        servers: [{ url: 'https://api.real-server.com' }],
      };

      renderWithRouter(
        <TryItOutDrawer
          open={true}
          onClose={vi.fn()}
          operation={mockOperation}
          path="/users/{userId}"
          method="GET"
          baseUrl="https://api.real-server.com"
          spec={specWithServers}
        />
      );

      expect(screen.queryByText(/no server url configured/i)).not.toBeInTheDocument();
    });
  });

  // --- Cycle 4: Multi-Server Selector (Gap 3) ---

  describe('multi-server selector', () => {
    const multiServerSpec = {
      ...mockSpec,
      servers: [
        { url: 'https://api.dev.example.com', description: 'Development' },
        { url: 'https://api.staging.example.com', description: 'Staging' },
        { url: 'https://api.example.com', description: 'Production' },
      ],
    };

    it('should render server selector when spec has multiple servers', () => {
      renderWithRouter(
        <TryItOutDrawer
          open={true}
          onClose={vi.fn()}
          operation={mockOperation}
          path="/users/{userId}"
          method="GET"
          baseUrl="https://api.dev.example.com"
          spec={multiServerSpec}
        />
      );

      // Should have a server selector in the header
      const serverSelect = screen.getByTestId('server-selector');
      expect(serverSelect).toBeInTheDocument();
    });

    it('should not render selector when spec has one or zero servers', () => {
      renderWithRouter(
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

      expect(screen.queryByTestId('server-selector')).not.toBeInTheDocument();
    });

    it('should update request URL when server is changed', () => {
      const { container } = renderWithRouter(
        <TryItOutDrawer
          open={true}
          onClose={vi.fn()}
          operation={mockOperation}
          path="/users/{userId}"
          method="GET"
          baseUrl="https://api.dev.example.com"
          spec={multiServerSpec}
        />
      );

      // Change server
      const serverSelect = screen.getByTestId('server-selector');
      fireEvent.change(serverSelect, { target: { value: 'https://api.staging.example.com' } });

      // URL input should update
      const urlInput = container.querySelector('input[placeholder="Enter request URL"]') as HTMLInputElement;
      expect(urlInput.value).toContain('api.staging.example.com');
    });
  });

  // --- Cycle 5: Path Parameter Substitution & Parameter Separation ---

  describe('path parameter substitution', () => {
    it('should substitute path parameters into the URL when sending request', async () => {
      const { container } = renderWithRouter(
        <TryItOutDrawer
          open={true}
          onClose={vi.fn()}
          operation={mockOperation}
          path="/users/{userId}"
          method="GET"
          baseUrl="https://api.test.com"
          spec={{
            ...mockSpec,
            servers: [{ url: 'https://api.test.com' }],
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
                  responses: { '200': { description: 'Success' } },
                },
              },
            },
          }}
        />
      );

      // Fill in path param value: find the param value input for userId
      const paramValueInputs = container.querySelectorAll('table input[placeholder="Value"]');
      expect(paramValueInputs.length).toBeGreaterThan(0);
      fireEvent.change(paramValueInputs[0], { target: { value: '123' } });

      // Click Send
      fireEvent.click(screen.getByText('Send'));

      // Verify the submitted URL has path param substituted
      expect(mockSubmit).toHaveBeenCalledTimes(1);
      const submittedData = JSON.parse(mockSubmit.mock.calls[0][0]);
      // URL should be /users/123, NOT /users/{userId}?userId=123
      expect(submittedData.url).toBe('https://api.test.com/users/123');
      // Should NOT have userId as a query param
      expect(submittedData.url).not.toContain('?');
    });

    it('should only include query parameters in the query string, not path parameters', async () => {
      const specWithMixedParams = {
        ...mockSpec,
        servers: [{ url: 'https://api.test.com' }],
        paths: {
          '/users/{userId}/posts': {
            get: {
              summary: 'Get user posts',
              operationId: 'getUserPosts',
              tags: ['Users'],
              parameters: [
                {
                  name: 'userId',
                  in: 'path' as const,
                  required: true,
                  schema: { type: 'string' },
                },
                {
                  name: 'page',
                  in: 'query' as const,
                  required: false,
                  schema: { type: 'integer', default: 1 },
                  description: 'Page number',
                },
                {
                  name: 'limit',
                  in: 'query' as const,
                  required: false,
                  schema: { type: 'integer', default: 10 },
                  description: 'Items per page',
                },
              ],
              responses: { '200': { description: 'Success' } },
            },
          },
        },
      };

      const { container } = renderWithRouter(
        <TryItOutDrawer
          open={true}
          onClose={vi.fn()}
          operation={specWithMixedParams.paths['/users/{userId}/posts'].get}
          path="/users/{userId}/posts"
          method="GET"
          baseUrl="https://api.test.com"
          spec={specWithMixedParams}
        />
      );

      // Fill in param values
      const paramValueInputs = container.querySelectorAll('table input[placeholder="Value"]');
      // Find and fill userId (path param)
      const paramKeyInputs = container.querySelectorAll('table input[placeholder="Parameter name"]');
      // Set values for all params
      for (let i = 0; i < paramKeyInputs.length; i++) {
        const keyInput = paramKeyInputs[i] as HTMLInputElement;
        if (keyInput.value === 'userId') {
          fireEvent.change(paramValueInputs[i], { target: { value: 'abc' } });
        } else if (keyInput.value === 'page') {
          // Enable the query param checkbox first
          const checkboxes = container.querySelectorAll('table input[type="checkbox"]');
          fireEvent.click(checkboxes[i]);
          fireEvent.change(paramValueInputs[i], { target: { value: '2' } });
        } else if (keyInput.value === 'limit') {
          const checkboxes = container.querySelectorAll('table input[type="checkbox"]');
          fireEvent.click(checkboxes[i]);
          fireEvent.change(paramValueInputs[i], { target: { value: '25' } });
        }
      }

      // Click Send
      fireEvent.click(screen.getByText('Send'));

      expect(mockSubmit).toHaveBeenCalledTimes(1);
      const submittedData = JSON.parse(mockSubmit.mock.calls[0][0]);
      // Path param should be substituted
      expect(submittedData.url).toContain('/users/abc/posts');
      // Query params should be in query string
      expect(submittedData.url).toContain('page=2');
      expect(submittedData.url).toContain('limit=25');
      // userId should NOT be in query string
      expect(submittedData.url).not.toContain('userId=abc');
    });

    it('should add header parameters to request headers', () => {
      const specWithHeaderParam = {
        ...mockSpec,
        servers: [{ url: 'https://api.test.com' }],
        paths: {
          '/data': {
            get: {
              summary: 'Get data',
              operationId: 'getData',
              tags: ['Data'],
              parameters: [
                {
                  name: 'X-Request-ID',
                  in: 'header' as const,
                  required: true,
                  schema: { type: 'string' },
                  description: 'Request tracking ID',
                },
                {
                  name: 'filter',
                  in: 'query' as const,
                  required: false,
                  schema: { type: 'string' },
                },
              ],
              responses: { '200': { description: 'Success' } },
            },
          },
        },
      };

      renderWithRouter(
        <TryItOutDrawer
          open={true}
          onClose={vi.fn()}
          operation={specWithHeaderParam.paths['/data'].get}
          path="/data"
          method="GET"
          baseUrl="https://api.test.com"
          spec={specWithHeaderParam}
        />
      );

      // Switch to headers tab to check that header param was added
      fireEvent.click(screen.getByTestId('tab-headers'));

      // X-Request-ID should appear in the headers table
      const headerInputs = screen.getAllByPlaceholderText('Header name');
      const headerKeys = headerInputs.map((input) => (input as HTMLInputElement).value);
      expect(headerKeys).toContain('X-Request-ID');
    });

    it('should merge path-level and operation-level parameters', () => {
      const specWithPathLevelParams = {
        ...mockSpec,
        servers: [{ url: 'https://api.test.com' }],
        paths: {
          '/orgs/{orgId}/users/{userId}': {
            // Path-level parameters shared across all operations
            parameters: [
              {
                name: 'orgId',
                in: 'path' as const,
                required: true,
                schema: { type: 'string' },
                description: 'Organization ID',
              },
            ],
            get: {
              summary: 'Get org user',
              operationId: 'getOrgUser',
              tags: ['Orgs'],
              // Operation-level parameter
              parameters: [
                {
                  name: 'userId',
                  in: 'path' as const,
                  required: true,
                  schema: { type: 'string' },
                  description: 'User ID',
                },
              ],
              responses: { '200': { description: 'Success' } },
            },
          },
        },
      };

      const { container } = renderWithRouter(
        <TryItOutDrawer
          open={true}
          onClose={vi.fn()}
          operation={specWithPathLevelParams.paths['/orgs/{orgId}/users/{userId}'].get}
          path="/orgs/{orgId}/users/{userId}"
          method="GET"
          baseUrl="https://api.test.com"
          spec={specWithPathLevelParams}
        />
      );

      // Both orgId and userId should appear in the params table
      const paramKeyInputs = container.querySelectorAll('table input[placeholder="Parameter name"]');
      const keys = Array.from(paramKeyInputs).map((input) => (input as HTMLInputElement).value);
      expect(keys).toContain('orgId');
      expect(keys).toContain('userId');
    });

    it('should auto-enable path parameters since they are always required', () => {
      const { container } = renderWithRouter(
        <TryItOutDrawer
          open={true}
          onClose={vi.fn()}
          operation={mockOperation}
          path="/users/{userId}"
          method="GET"
          baseUrl="https://api.test.com"
          spec={{
            ...mockSpec,
            servers: [{ url: 'https://api.test.com' }],
          }}
        />
      );

      // Path params should be auto-enabled (checkbox checked)
      const checkboxes = container.querySelectorAll('table input[type="checkbox"]');
      // First checkbox should be for userId (path param) and should be checked
      expect(checkboxes.length).toBeGreaterThan(0);
      expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    });
  });

  describe('param auto-enable on value input', () => {
    it('should auto-enable a query param when the user types a value', () => {
      const specWithQueryParam = {
        ...mockSpec,
        servers: [{ url: 'https://api.test.com' }],
        paths: {
          '/accounts': {
            get: {
              summary: 'Get account',
              operationId: 'getAccount',
              tags: ['Accounts'],
              parameters: [
                {
                  name: 'accountNo',
                  in: 'query' as const,
                  required: false,
                  schema: { type: 'string' },
                  description: 'Account number',
                },
              ],
              responses: { '200': { description: 'Success' } },
            },
          },
        },
      };

      const { container } = renderWithRouter(
        <TryItOutDrawer
          open={true}
          onClose={vi.fn()}
          operation={specWithQueryParam.paths['/accounts'].get}
          path="/accounts"
          method="GET"
          baseUrl="https://api.test.com"
          spec={specWithQueryParam}
        />
      );

      // The query param checkbox should start unchecked (required: false)
      const checkboxes = container.querySelectorAll('table input[type="checkbox"]');
      expect((checkboxes[0] as HTMLInputElement).checked).toBe(false);

      // Type a value into the param
      const valueInputs = container.querySelectorAll('table input[placeholder="Value"]');
      fireEvent.change(valueInputs[0], { target: { value: '12345' } });

      // Checkbox should now be auto-enabled
      const checkboxesAfter = container.querySelectorAll('table input[type="checkbox"]');
      expect((checkboxesAfter[0] as HTMLInputElement).checked).toBe(true);
    });

    it('should include auto-enabled query params in the sent request', () => {
      const specWithQueryParam = {
        ...mockSpec,
        servers: [{ url: 'https://api.test.com' }],
        paths: {
          '/accounts': {
            get: {
              summary: 'Get account',
              operationId: 'getAccount',
              tags: ['Accounts'],
              parameters: [
                {
                  name: 'accountNo',
                  in: 'query' as const,
                  required: false,
                  schema: { type: 'string' },
                },
              ],
              responses: { '200': { description: 'Success' } },
            },
          },
        },
      };

      const { container } = renderWithRouter(
        <TryItOutDrawer
          open={true}
          onClose={vi.fn()}
          operation={specWithQueryParam.paths['/accounts'].get}
          path="/accounts"
          method="GET"
          baseUrl="https://api.test.com"
          spec={specWithQueryParam}
        />
      );

      // Type a value into the param
      const valueInputs = container.querySelectorAll('table input[placeholder="Value"]');
      fireEvent.change(valueInputs[0], { target: { value: '12345' } });

      // Send the request
      fireEvent.click(screen.getByText('Send'));

      expect(mockSubmit).toHaveBeenCalledTimes(1);
      const submittedData = JSON.parse(mockSubmit.mock.calls[0][0]);
      expect(submittedData.url).toBe('https://api.test.com/accounts?accountNo=12345');
    });
  });

  // --- Cycle 6: Body Forwarding ---

  describe('body forwarding', () => {
    it('should include request body for POST methods', () => {
      const specWithPost = {
        ...mockSpec,
        servers: [{ url: 'https://api.test.com' }],
        paths: {
          '/users': {
            post: {
              summary: 'Create user',
              operationId: 'createUser',
              tags: ['Users'],
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', example: 'John' },
                        email: { type: 'string', example: 'john@test.com' },
                      },
                    },
                  },
                },
              },
              responses: { '201': { description: 'Created' } },
            },
          },
        },
      };

      renderWithRouter(
        <TryItOutDrawer
          open={true}
          onClose={vi.fn()}
          operation={specWithPost.paths['/users'].post}
          path="/users"
          method="POST"
          baseUrl="https://api.test.com"
          spec={specWithPost}
        />
      );

      // Click Send
      fireEvent.click(screen.getByText('Send'));

      expect(mockSubmit).toHaveBeenCalledTimes(1);
      const submittedData = JSON.parse(mockSubmit.mock.calls[0][0]);
      // Body should be included for POST
      expect(submittedData.body).toBeDefined();
      expect(submittedData.method).toBe('POST');
    });

    it('should not include body for GET methods', () => {
      renderWithRouter(
        <TryItOutDrawer
          open={true}
          onClose={vi.fn()}
          operation={mockOperation}
          path="/users/{userId}"
          method="GET"
          baseUrl="https://api.test.com"
          spec={{
            ...mockSpec,
            servers: [{ url: 'https://api.test.com' }],
          }}
        />
      );

      // Click Send
      fireEvent.click(screen.getByText('Send'));

      expect(mockSubmit).toHaveBeenCalledTimes(1);
      const submittedData = JSON.parse(mockSubmit.mock.calls[0][0]);
      // Body should NOT be included for GET
      expect(submittedData.body).toBeUndefined();
      expect(submittedData.method).toBe('GET');
    });
  });
});

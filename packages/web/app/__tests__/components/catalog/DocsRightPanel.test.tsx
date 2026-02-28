/**
 * Tests for DocsRightPanel core logic
 * Covers: response example derivation, request execution, response state, clear, error
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocsRightPanel } from '@yasp/core/components/catalog/docs-view/DocsRightPanel';
import type { ParsedEndpoint, ParsedOpenAPISpec } from '@yasp/core/components/catalog/docs-view/types';

// Mock executeApiRequest — must target core's module path since the component lives in core
vi.mock('@yasp/core/actions/execute-api-request', () => ({
  executeApiRequest: vi.fn(),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

import { executeApiRequest } from '@yasp/core/actions/execute-api-request';
const mockExecute = vi.mocked(executeApiRequest);

const baseEndpoint: ParsedEndpoint = {
  path: '/users',
  method: 'GET',
  summary: 'List users',
  operation: {
    responses: {
      '200': {
        description: 'OK',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'user-123' },
                email: { type: 'string', example: 'test@example.com' },
              },
            },
          },
        },
      },
    },
  },
};

const minimalSpec: ParsedOpenAPISpec = {
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
};

describe('DocsRightPanel — UI structure', () => {
  it('displays Try it header (no tabs)', async () => {
    render(
      <DocsRightPanel
        endpoint={baseEndpoint}
        baseUrl="https://api.example.com"
        spec={minimalSpec}
      />
    );

    // Should have Try It in the header as a title (not as a tab)
    expect(screen.getByText(/Try it/i)).toBeInTheDocument();

    // Should NOT have Example tab
    expect(screen.queryByRole('tab', { name: /example/i })).not.toBeInTheDocument();

    // Should NOT have Try It as a tab
    expect(screen.queryByRole('tab', { name: /try it/i })).not.toBeInTheDocument();
  });

  it('displays Execute Request footer immediately (not conditionally)', async () => {
    render(
      <DocsRightPanel
        endpoint={baseEndpoint}
        baseUrl="https://api.example.com"
        spec={minimalSpec}
      />
    );

    // Execute Request button should always be visible
    expect(screen.getByRole('button', { name: /execute request/i })).toBeInTheDocument();
  });
});

describe('DocsRightPanel — Content-Type preference order', () => {
  it('prefers form-data over JSON for request body', async () => {
    const formDataEndpoint: ParsedEndpoint = {
      path: '/upload',
      method: 'POST',
      summary: 'Upload file',
      operation: {
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { name: { type: 'string' } } },
            },
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  description: { type: 'string', example: 'My file' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'OK' } },
      },
    };

    render(
      <DocsRightPanel
        endpoint={formDataEndpoint}
        baseUrl="https://api.example.com"
        spec={minimalSpec}
      />
    );

    // Body section should show Form-Data, not JSON
    await waitFor(() => {
      expect(screen.getByText('Form-Data')).toBeInTheDocument();
    });

    // Form fields should render (description field)
    expect(screen.getByDisplayValue('My file')).toBeInTheDocument();
  });

  it('prefers form-urlencoded over JSON when form-data unavailable', async () => {
    const formUrlEncodedEndpoint: ParsedEndpoint = {
      path: '/auth',
      method: 'POST',
      summary: 'Authenticate',
      operation: {
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { token: { type: 'string' } } },
            },
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'john' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'OK' } },
      },
    };

    render(
      <DocsRightPanel
        endpoint={formUrlEncodedEndpoint}
        baseUrl="https://api.example.com"
        spec={minimalSpec}
      />
    );

    // Body section should show Form, not JSON
    await waitFor(() => {
      expect(screen.getByText('Form')).toBeInTheDocument();
    });

    // Form fields should render
    expect(screen.getByDisplayValue('john')).toBeInTheDocument();
  });
});

describe('DocsRightPanel — InteractiveConsole execution', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  it('calls executeApiRequest with correct method and url on Execute click', async () => {
    const user = userEvent.setup();
    mockExecute.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      body: { success: true },
      time: 50,
      size: 0.1,
    });

    render(
      <DocsRightPanel
        endpoint={baseEndpoint}
        baseUrl="https://api.example.com"
        spec={minimalSpec}
      />
    );

    // Click Execute
    await user.click(screen.getByRole('button', { name: /execute request/i }));

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    const call = mockExecute.mock.calls[0][0];
    expect(call.method).toBe('GET');
    expect(call.url).toBe('https://api.example.com/users');
  });

  it('displays response status and body after successful execution', async () => {
    const user = userEvent.setup();
    mockExecute.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      body: { id: 'user-1', email: 'result@example.com' },
      time: 42,
      size: 0.5,
    });

    render(
      <DocsRightPanel
        endpoint={baseEndpoint}
        baseUrl="https://api.example.com"
        spec={minimalSpec}
      />
    );

    await user.click(screen.getByRole('button', { name: /execute request/i }));

    await waitFor(() => {
      expect(screen.getByText(/200/)).toBeInTheDocument();
    });
    expect(screen.getByText(/result@example\.com/)).toBeInTheDocument();
  });

  it('shows error message when executeApiRequest throws', async () => {
    const user = userEvent.setup();
    mockExecute.mockRejectedValue(new Error('Network error'));

    render(
      <DocsRightPanel
        endpoint={baseEndpoint}
        baseUrl="https://api.example.com"
        spec={minimalSpec}
      />
    );

    await user.click(screen.getByRole('button', { name: /execute request/i }));

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('Clear button resets response state and restores form fields to spec defaults', async () => {
    const user = userEvent.setup();
    mockExecute.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      body: { data: 'something' },
      time: 10,
      size: 0.1,
    });

    const formEndpoint: ParsedEndpoint = {
      path: '/submit',
      method: 'POST',
      summary: 'Submit form',
      operation: {
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'John' },
                  email: { type: 'string', example: 'john@example.com' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'OK' } },
      },
    };

    render(
      <DocsRightPanel
        endpoint={formEndpoint}
        baseUrl="https://api.example.com"
        spec={minimalSpec}
      />
    );

    // Verify initial form field values match spec examples
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();

    // Modify form field value
    const nameInput = screen.getByDisplayValue('John') as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane');

    // Execute to get a response
    await user.click(screen.getByRole('button', { name: /execute request/i }));

    await waitFor(() => {
      expect(screen.getByText(/200/)).toBeInTheDocument();
    });

    // Click the footer Clear button (the one before Execute Request)
    const buttons = screen.getAllByRole('button', { name: /clear/i });
    // The footer Clear button should be the last one
    await user.click(buttons[buttons.length - 1]);

    // Response should reset
    await waitFor(() => {
      expect(screen.getByText(/not executed yet/i)).toBeInTheDocument();
    });

    // Form fields should be restored to spec defaults
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
  });

  it('includes auth token in headers when provided', async () => {
    const user = userEvent.setup();
    mockExecute.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      body: {},
      time: 10,
      size: 0,
    });

    render(
      <DocsRightPanel
        endpoint={baseEndpoint}
        baseUrl="https://api.example.com"
        spec={minimalSpec}
      />
    );

    // Type auth token
    const tokenInput = screen.getByPlaceholderText(/Bearer sk_test/i);
    await user.clear(tokenInput);
    await user.type(tokenInput, 'Bearer mytoken123');

    await user.click(screen.getByRole('button', { name: /execute request/i }));

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    const call = mockExecute.mock.calls[0][0];
    expect(call.headers['Authorization']).toBe('Bearer mytoken123');
  });

  it('pre-populates JSON textarea with generated example from schema', async () => {
    const postEndpoint: ParsedEndpoint = {
      path: '/pets',
      method: 'POST',
      summary: 'Create pet',
      operation: {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Buddy' },
                  status: { type: 'string', enum: ['available', 'pending'] },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'OK' } },
      },
    };

    render(
      <DocsRightPanel
        endpoint={postEndpoint}
        baseUrl="https://api.example.com"
        spec={minimalSpec}
      />
    );

    // JSON textarea should be pre-populated with the generated example including the 'name' example value
    await waitFor(() => {
      const textarea = screen.getByRole('textbox', { name: '' });
      expect((textarea as HTMLTextAreaElement).value).toContain('Buddy');
    });
  });

  it('shows "No fields defined" placeholder when form schema has empty properties', async () => {
    const formEndpoint: ParsedEndpoint = {
      path: '/submit',
      method: 'POST',
      summary: 'Submit',
      operation: {
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {}, // No properties defined in spec
              },
            },
          },
        },
        responses: { '200': { description: 'OK' } },
      },
    };

    render(
      <DocsRightPanel
        endpoint={formEndpoint}
        baseUrl="https://api.example.com"
        spec={minimalSpec}
      />
    );

    // Empty properties → form fields list is empty → placeholder should be visible
    expect(screen.getByText(/No fields defined/i)).toBeInTheDocument();
  });
});

describe('DocsRightPanel — DELETE with requestBody', () => {
  const deleteEndpoint: ParsedEndpoint = {
    path: '/resources/{id}',
    method: 'DELETE',
    summary: 'Delete resource',
    operation: {
      responses: { '204': { description: 'No content' } },
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { reason: { type: 'string' } },
            },
          },
        },
      },
    },
  };

  const minimalSpec: ParsedOpenAPISpec = {
    openapi: '3.0.0',
    info: { title: 'Test', version: '1.0.0' },
  };

  it('shows the Body section for DELETE endpoints that have a requestBody', () => {
    render(
      <DocsRightPanel
        endpoint={deleteEndpoint}
        baseUrl="https://api.example.com"
        spec={minimalSpec}
      />
    );
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('sends the request body when executing a DELETE with requestBody', async () => {
    mockExecute.mockResolvedValueOnce({ status: 204, statusText: 'No Content', body: '', headers: {}, time: 0, size: 0 });

    render(
      <DocsRightPanel
        endpoint={deleteEndpoint}
        baseUrl="https://api.example.com"
        spec={minimalSpec}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /execute request/i }));

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});

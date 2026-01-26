/**
 * TryItOut Component Tests
 * Tests for interactive API request builder
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TryItOut } from '../TryItOut';
import type { OperationObject } from '@/types/openapi-spec';

describe('TryItOut', () => {
  const mockOperation: OperationObject = {
    summary: 'Get user by ID',
    operationId: 'getUserById',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'User ID',
      },
      {
        name: 'include',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['profile', 'settings'] },
        description: 'Fields to include',
      },
    ],
    responses: {
      '200': {
        description: 'Success',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render Try It Out section', () => {
      render(
        <TryItOut
          operation={mockOperation}
          path="/users/{id}"
          method="get"
          baseUrl="https://api.example.com"
        />
      );

      expect(screen.getByText('Try It Out')).toBeInTheDocument();
    });

    it('should display HTTP method badge', () => {
      render(
        <TryItOut
          operation={mockOperation}
          path="/users/{id}"
          method="get"
          baseUrl="https://api.example.com"
        />
      );

      expect(screen.getByText('GET')).toBeInTheDocument();
    });

    it('should display endpoint path', () => {
      render(
        <TryItOut
          operation={mockOperation}
          path="/users/{id}"
          method="get"
          baseUrl="https://api.example.com"
        />
      );

      expect(screen.getByText(/\/users\/{id}/)).toBeInTheDocument();
    });

    it('should render parameter inputs', () => {
      render(
        <TryItOut
          operation={mockOperation}
          path="/users/{id}"
          method="get"
          baseUrl="https://api.example.com"
        />
      );

      expect(screen.getByLabelText(/id/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/include/i)).toBeInTheDocument();
    });

    it('should mark required parameters with asterisk', () => {
      render(
        <TryItOut
          operation={mockOperation}
          path="/users/{id}"
          method="get"
          baseUrl="https://api.example.com"
        />
      );

      // Required parameter should have asterisk or required indicator
      const idInput = screen.getByLabelText(/id/i);
      expect(idInput).toHaveAttribute('required');
    });

    it('should render enum parameters as dropdowns', () => {
      render(
        <TryItOut
          operation={mockOperation}
          path="/users/{id}"
          method="get"
          baseUrl="https://api.example.com"
        />
      );

      // Include parameter is an enum
      const includeSelect = screen.getByLabelText(/include/i);
      expect(includeSelect.tagName).toBe('SELECT');
    });

    it('should have Send Request button', () => {
      render(
        <TryItOut
          operation={mockOperation}
          path="/users/{id}"
          method="get"
          baseUrl="https://api.example.com"
        />
      );

      expect(screen.getByText('Send Request')).toBeInTheDocument();
    });
  });

  describe('parameter input handling', () => {
    it('should update parameter value on input change', () => {
      render(
        <TryItOut
          operation={mockOperation}
          path="/users/{id}"
          method="get"
          baseUrl="https://api.example.com"
        />
      );

      const idInput = screen.getByLabelText(/id/i) as HTMLInputElement;
      fireEvent.change(idInput, { target: { value: 'user123' } });

      expect(idInput.value).toBe('user123');
    });

    it('should validate required parameters before submit', async () => {
      const onSubmit = vi.fn();
      render(
        <TryItOut
          operation={mockOperation}
          path="/users/{id}"
          method="get"
          baseUrl="https://api.example.com"
          onSubmit={onSubmit}
        />
      );

      const sendButton = screen.getByText('Send Request');
      fireEvent.click(sendButton);

      // Should not submit with empty required field
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should submit when all required parameters are filled', async () => {
      const onSubmit = vi.fn();
      render(
        <TryItOut
          operation={mockOperation}
          path="/users/{id}"
          method="get"
          baseUrl="https://api.example.com"
          onSubmit={onSubmit}
        />
      );

      const idInput = screen.getByLabelText(/id/i);
      fireEvent.change(idInput, { target: { value: 'user123' } });

      const sendButton = screen.getByText('Send Request');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          url: 'https://api.example.com/users/user123',
          method: 'GET',
          headers: {},
          body: undefined,
        });
      });
    });
  });

  describe('request body editor', () => {
    const operationWithBody: OperationObject = {
      summary: 'Create user',
      operationId: 'createUser',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Created' },
      },
    };

    it('should render request body editor for POST requests', () => {
      render(
        <TryItOut
          operation={operationWithBody}
          path="/users"
          method="post"
          baseUrl="https://api.example.com"
        />
      );

      expect(screen.getByText(/Request Body/i)).toBeInTheDocument();
    });

    it('should not render request body editor for GET requests', () => {
      render(
        <TryItOut
          operation={mockOperation}
          path="/users/{id}"
          method="get"
          baseUrl="https://api.example.com"
        />
      );

      expect(screen.queryByText(/Request Body/i)).not.toBeInTheDocument();
    });
  });

  describe('response display', () => {
    it('should show loading state during request', async () => {
      render(
        <TryItOut
          operation={mockOperation}
          path="/users/{id}"
          method="get"
          baseUrl="https://api.example.com"
        />
      );

      const idInput = screen.getByLabelText(/id/i);
      fireEvent.change(idInput, { target: { value: 'user123' } });

      const sendButton = screen.getByText('Send Request');
      fireEvent.click(sendButton);

      expect(screen.getByText(/Sending/i)).toBeInTheDocument();
    });

    it('should display response status code', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        body: { id: 'user123', name: 'John' },
      };

      render(
        <TryItOut
          operation={mockOperation}
          path="/users/{id}"
          method="get"
          baseUrl="https://api.example.com"
          mockResponse={mockResponse}
        />
      );

      const idInput = screen.getByLabelText(/id/i);
      fireEvent.change(idInput, { target: { value: 'user123' } });

      const sendButton = screen.getByText('Send Request');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('200 OK')).toBeInTheDocument();
      });
    });

    it('should display response body as formatted JSON', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        body: { id: 'user123', name: 'John Doe' },
      };

      render(
        <TryItOut
          operation={mockOperation}
          path="/users/{id}"
          method="get"
          baseUrl="https://api.example.com"
          mockResponse={mockResponse}
        />
      );

      const idInput = screen.getByLabelText(/id/i);
      fireEvent.change(idInput, { target: { value: 'user123' } });

      const sendButton = screen.getByText('Send Request');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/"id": "user123"/)).toBeInTheDocument();
      });
    });

    it('should show error message on request failure', async () => {
      const mockError = new Error('Network error');

      render(
        <TryItOut
          operation={mockOperation}
          path="/users/{id}"
          method="get"
          baseUrl="https://api.example.com"
          mockError={mockError}
        />
      );

      const idInput = screen.getByLabelText(/id/i);
      fireEvent.change(idInput, { target: { value: 'user123' } });

      const sendButton = screen.getByText('Send Request');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('URL building', () => {
    it('should replace path parameters in URL', () => {
      const onSubmit = vi.fn();
      render(
        <TryItOut
          operation={mockOperation}
          path="/users/{id}"
          method="get"
          baseUrl="https://api.example.com"
          onSubmit={onSubmit}
        />
      );

      const idInput = screen.getByLabelText(/id/i);
      fireEvent.change(idInput, { target: { value: 'user123' } });

      const sendButton = screen.getByText('Send Request');
      fireEvent.click(sendButton);

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.example.com/users/user123',
        })
      );
    });

    it('should append query parameters to URL', () => {
      const onSubmit = vi.fn();
      render(
        <TryItOut
          operation={mockOperation}
          path="/users/{id}"
          method="get"
          baseUrl="https://api.example.com"
          onSubmit={onSubmit}
        />
      );

      const idInput = screen.getByLabelText(/id/i);
      fireEvent.change(idInput, { target: { value: 'user123' } });

      const includeSelect = screen.getByLabelText(/include/i);
      fireEvent.change(includeSelect, { target: { value: 'profile' } });

      const sendButton = screen.getByText('Send Request');
      fireEvent.click(sendButton);

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.example.com/users/user123?include=profile',
        })
      );
    });
  });
});

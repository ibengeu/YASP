/**
 * Form field rendering tests for DocsRightPanel
 * Validates that typed inputs are rendered for form-data and urlencoded bodies
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocsRightPanel } from '@yasp/core/components/catalog/docs-view/DocsRightPanel';
import type { ParsedEndpoint, ParsedOpenAPISpec } from '@yasp/core/components/catalog/docs-view/types';

// Mock executeApiRequest
vi.mock('@yasp/core/actions/execute-api-request', () => ({
  executeApiRequest: vi.fn(),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

const minimalSpec: ParsedOpenAPISpec = {
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
};

describe('DocsRightPanel — Form Field Rendering', () => {
  describe('multipart/form-data rendering', () => {
    it('renders individual file input for binary field', () => {
      const endpoint: ParsedEndpoint = {
        path: '/upload',
        method: 'POST',
        summary: 'Upload file',
        operation: {
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary' },
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
          endpoint={endpoint}
          baseUrl="https://api.example.com"
          spec={minimalSpec}
        />
      );

      // Check that file input is rendered with correct field name
      const fileInputs = screen.getAllByDisplayValue('');
      expect(fileInputs.length).toBeGreaterThan(0);

      // Field name should be visible
      expect(screen.getByText('file')).toBeInTheDocument();
    });

    it('renders text input for string field', () => {
      const endpoint: ParsedEndpoint = {
        path: '/upload',
        method: 'POST',
        summary: 'Upload file',
        operation: {
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
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
          endpoint={endpoint}
          baseUrl="https://api.example.com"
          spec={minimalSpec}
        />
      );

      // Field name should be visible
      expect(screen.getByText('description')).toBeInTheDocument();

      // Input should have the pre-filled value
      expect(screen.getByDisplayValue('My file')).toBeInTheDocument();
    });

    it('renders checkbox for boolean field', () => {
      const endpoint: ParsedEndpoint = {
        path: '/upload',
        method: 'POST',
        summary: 'Upload file',
        operation: {
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    isPublic: { type: 'boolean' },
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
          endpoint={endpoint}
          baseUrl="https://api.example.com"
          spec={minimalSpec}
        />
      );

      // Field name should be visible
      expect(screen.getByText('isPublic')).toBeInTheDocument();

      // Checkbox should be rendered
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('renders all field types in single form', () => {
      const endpoint: ParsedEndpoint = {
        path: '/submit',
        method: 'POST',
        summary: 'Submit form',
        operation: {
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    fileUpload: { type: 'string', format: 'binary' },
                    description: { type: 'string', example: 'Details' },
                    isPublic: { type: 'boolean' },
                    email: { type: 'string', format: 'email' },
                    count: { type: 'number', example: 5 },
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
          endpoint={endpoint}
          baseUrl="https://api.example.com"
          spec={minimalSpec}
        />
      );

      // All field names should be visible
      expect(screen.getByText('fileUpload')).toBeInTheDocument();
      expect(screen.getByText('description')).toBeInTheDocument();
      expect(screen.getByText('isPublic')).toBeInTheDocument();
      expect(screen.getByText('email')).toBeInTheDocument();
      expect(screen.getByText('count')).toBeInTheDocument();

      // Verify pre-filled values
      expect(screen.getByDisplayValue('Details')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });
  });

  describe('application/x-www-form-urlencoded rendering', () => {
    it('renders form fields for urlencoded body', () => {
      const endpoint: ParsedEndpoint = {
        path: '/login',
        method: 'POST',
        summary: 'Login',
        operation: {
          requestBody: {
            content: {
              'application/x-www-form-urlencoded': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string', example: 'john' },
                    password: { type: 'string' },
                    rememberMe: { type: 'boolean' },
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
          endpoint={endpoint}
          baseUrl="https://api.example.com"
          spec={minimalSpec}
        />
      );

      // All field names should be visible
      expect(screen.getByText('username')).toBeInTheDocument();
      expect(screen.getByText('password')).toBeInTheDocument();
      expect(screen.getByText('rememberMe')).toBeInTheDocument();

      // Pre-filled value
      expect(screen.getByDisplayValue('john')).toBeInTheDocument();
    });
  });

  describe('No fields edge cases', () => {
    it('does not crash when form schema has no properties', () => {
      const endpoint: ParsedEndpoint = {
        path: '/submit',
        method: 'POST',
        summary: 'Submit',
        operation: {
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: { type: 'object' }, // No properties
              },
            },
          },
          responses: { '200': { description: 'OK' } },
        },
      };

      render(
        <DocsRightPanel
          endpoint={endpoint}
          baseUrl="https://api.example.com"
          spec={minimalSpec}
        />
      );

      // Should render without crashing
      expect(screen.getByText(/Try it/i)).toBeInTheDocument();
    });

    it('prefers form-data over JSON when both are available', () => {
      const endpoint: ParsedEndpoint = {
        path: '/submit',
        method: 'POST',
        summary: 'Submit',
        operation: {
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    jsonField: { type: 'string' },
                  },
                },
              },
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    formField: { type: 'string', example: 'form value' },
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
          endpoint={endpoint}
          baseUrl="https://api.example.com"
          spec={minimalSpec}
        />
      );

      // Should render form field (from form-data), not JSON field
      expect(screen.getByText('formField')).toBeInTheDocument();
      expect(screen.queryByText('jsonField')).not.toBeInTheDocument();
    });
  });
});

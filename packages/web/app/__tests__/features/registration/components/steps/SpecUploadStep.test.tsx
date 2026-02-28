/**
 * Tests for SpecUploadStep
 * Verifies spec upload, paste (auto-parse on blur), and URL fetch behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpecUploadStep } from '@yasp/core/features/registration/components/steps/SpecUploadStep';
import type { RegistrationFormData } from '@yasp/core/features/registration/schemas/registration-schema';

// Mock sonner toast
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
};
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToast.success(...args),
    error: (...args: unknown[]) => mockToast.error(...args),
  },
}));

// Mock global fetch
const mockFetch = vi.fn();
const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = mockFetch;
  vi.clearAllMocks();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const defaultFormData: RegistrationFormData = {
  name: '',
  description: '',
  version: '',
  endpoint: 'https://example.com',
  tags: [],
  openapiSpec: { source: '', content: '' },
  status: 'draft',
};

function renderSpecUploadStep(overrides = {}) {
  const props = {
    formData: defaultFormData,
    setValue: vi.fn(),
    register: vi.fn().mockReturnValue({}),
    errors: {},
    onSpecParsed: vi.fn().mockResolvedValue(undefined),
    inferredData: null,
    isParsingSpec: false,
    fieldSources: {},
    setFieldSources: vi.fn(),
    ...overrides,
  };

  render(<SpecUploadStep {...props} />);
  return props;
}

describe('SpecUploadStep - URL Fetch', () => {
  it('should call server-side /api/fetch-spec route when fetching from URL', async () => {
    const specContent = '{"openapi":"3.0.0","info":{"title":"Test","version":"1.0"}}';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, content: specContent }),
    });

    const { setValue, onSpecParsed } = renderSpecUploadStep();
    const user = userEvent.setup();

    // Switch to URL tab
    await user.click(screen.getByRole('tab', { name: /URL/i }));

    // Enter a URL
    const urlInput = screen.getByPlaceholderText(/https:\/\/api\.example\.com\/openapi\.yaml/i);
    await user.type(urlInput, 'https://api.example.com:8025/swagger.json');

    // Click Fetch
    await user.click(screen.getByRole('button', { name: /Fetch/i }));

    // Verify it called the server-side route, NOT the URL directly
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/fetch-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://api.example.com:8025/swagger.json' }),
      });
    });

    // Verify onSpecParsed was called with the content and the source URL
    await waitFor(() => {
      expect(onSpecParsed).toHaveBeenCalledWith(
        specContent,
        'https://api.example.com:8025/swagger.json'
      );
    });

    // Verify setValue was called to store the spec
    expect(setValue).toHaveBeenCalledWith('openapiSpec', {
      source: 'url',
      content: specContent,
      fileName: 'swagger.json',
    });
  });

  it('should show error toast on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: false, error: 'HTTP error 404: Not Found' }),
    });

    renderSpecUploadStep();
    const user = userEvent.setup();

    // Switch to URL tab and enter URL
    await user.click(screen.getByRole('tab', { name: /URL/i }));
    const urlInput = screen.getByPlaceholderText(/https:\/\/api\.example\.com\/openapi\.yaml/i);
    await user.type(urlInput, 'https://api.example.com/nonexistent.json');
    await user.click(screen.getByRole('button', { name: /Fetch/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('404')
      );
    });
  });

  it('should show error for network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderSpecUploadStep();
    const user = userEvent.setup();

    await user.click(screen.getByRole('tab', { name: /URL/i }));
    const urlInput = screen.getByPlaceholderText(/https:\/\/api\.example\.com\/openapi\.yaml/i);
    await user.type(urlInput, 'https://api.example.com/spec.json');
    await user.click(screen.getByRole('button', { name: /Fetch/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });
  });

  it('should disable Fetch button when URL is empty', async () => {
    renderSpecUploadStep();
    const user = userEvent.setup();

    await user.click(screen.getByRole('tab', { name: /URL/i }));

    const fetchButton = screen.getByRole('button', { name: /Fetch/i });
    expect(fetchButton).toBeDisabled();
  });
});

describe('SpecUploadStep - Paste auto-parse', () => {
  it('should auto-parse when user pastes content from clipboard', async () => {
    const { setValue, onSpecParsed } = renderSpecUploadStep();
    const user = userEvent.setup();

    // Switch to Paste tab
    await user.click(screen.getByRole('tab', { name: /Paste/i }));

    const textarea = screen.getByPlaceholderText(/Paste your spec here/i);
    await user.click(textarea);
    // userEvent.paste triggers the native clipboard paste event
    await user.paste('openapi: 3.0.0');

    await waitFor(() => {
      expect(setValue).toHaveBeenCalledWith('openapiSpec', {
        source: 'paste',
        content: 'openapi: 3.0.0',
      });
      expect(onSpecParsed).toHaveBeenCalledWith('openapi: 3.0.0');
    });
  });
});

describe('SpecUploadStep - UI states', () => {
  it('should show loading state when parsing', () => {
    renderSpecUploadStep({ isParsingSpec: true });

    expect(screen.getByText(/Reading your spec/i)).toBeInTheDocument();
  });

  it('should show "Uploaded" badge when spec has content', () => {
    renderSpecUploadStep({
      formData: {
        ...defaultFormData,
        openapiSpec: { source: 'upload', content: '{"openapi":"3.0.0"}' },
      },
    });

    expect(screen.getByText('Uploaded')).toBeInTheDocument();
  });

  it('should show helper text when no spec is provided', () => {
    renderSpecUploadStep();

    expect(screen.getByText(/Upload, paste, or fetch your OpenAPI\/AsyncAPI spec/i)).toBeInTheDocument();
  });
});

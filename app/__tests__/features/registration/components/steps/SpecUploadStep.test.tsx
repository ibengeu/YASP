/**
 * Tests for SpecUploadStep URL import behavior
 * Verifies that URL imports go through the server-side proxy route
 * to bypass CORS restrictions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpecUploadStep } from '@/features/registration/components/steps/SpecUploadStep';
import type { RegistrationFormData } from '@/features/registration/schemas/registration-schema';

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

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  vi.clearAllMocks();
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
    onSpecParsed: vi.fn().mockResolvedValue(undefined),
    inferredData: null,
    isParsingSpec: false,
    ...overrides,
  };

  render(<SpecUploadStep {...props} />);
  return props;
}

describe('SpecUploadStep - URL Import', () => {
  it('should call server-side /api/fetch-spec route when importing from URL', async () => {
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
    const urlInput = screen.getByPlaceholderText(/https:\/\/api\.example\.com/i);
    await user.type(urlInput, 'https://api.example.com:8025/swagger.json');

    // Click Import
    await user.click(screen.getByRole('button', { name: /Import/i }));

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
    const urlInput = screen.getByPlaceholderText(/https:\/\/api\.example\.com/i);
    await user.type(urlInput, 'https://api.example.com/nonexistent.json');
    await user.click(screen.getByRole('button', { name: /Import/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('404')
      );
    });
  });

  it('should show success toast on successful import', async () => {
    const specContent = '{"openapi":"3.0.0"}';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, content: specContent }),
    });

    renderSpecUploadStep();
    const user = userEvent.setup();

    await user.click(screen.getByRole('tab', { name: /URL/i }));
    const urlInput = screen.getByPlaceholderText(/https:\/\/api\.example\.com/i);
    await user.type(urlInput, 'https://api.example.com/openapi.json');
    await user.click(screen.getByRole('button', { name: /Import/i }));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining('fetched')
      );
    });
  });

  it('should show error for network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderSpecUploadStep();
    const user = userEvent.setup();

    await user.click(screen.getByRole('tab', { name: /URL/i }));
    const urlInput = screen.getByPlaceholderText(/https:\/\/api\.example\.com/i);
    await user.type(urlInput, 'https://api.example.com/spec.json');
    await user.click(screen.getByRole('button', { name: /Import/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });
  });

  it('should not fetch when URL is empty', async () => {
    renderSpecUploadStep();
    const user = userEvent.setup();

    await user.click(screen.getByRole('tab', { name: /URL/i }));

    // The Import button should be disabled when URL is empty
    const importButton = screen.getByRole('button', { name: /Import/i });
    expect(importButton).toBeDisabled();
  });
});

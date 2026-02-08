/**
 * Unit tests for server-side spec fetch action
 * Following TDD approach: tests written before implementation
 *
 * Security: OWASP A09:2025 (SSRF) - Validates URL before server-side fetch
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchSpec } from '@/actions/fetch-spec';

// Mock global fetch
const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchSpec', () => {
  describe('successful fetches', () => {
    it('should fetch and return spec content from valid URL', async () => {
      const specContent = '{"openapi":"3.0.0","info":{"title":"Test","version":"1.0"}}';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(specContent),
      });

      const result = await fetchSpec('https://api.example.com/openapi.json');

      expect(result).toEqual({ content: specContent });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/openapi.json',
        expect.objectContaining({
          method: 'GET',
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('should allow non-standard ports commonly used for API specs', async () => {
      const specContent = '{"openapi":"3.0.0"}';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(specContent),
      });

      const result = await fetchSpec(
        'https://optiweb.optimusbank.com:8025/account-api-2/swagger/v1/swagger.json'
      );

      expect(result).toEqual({ content: specContent });
    });

    it('should allow port 5000', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('openapi: "3.0.0"'),
      });

      const result = await fetchSpec('http://api.example.com:5000/swagger.json');

      expect(result).toEqual({ content: 'openapi: "3.0.0"' });
    });

    it('should allow port 3000', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('openapi: "3.0.0"'),
      });

      const result = await fetchSpec('http://api.example.com:3000/openapi.yaml');

      expect(result).toEqual({ content: 'openapi: "3.0.0"' });
    });
  });

  describe('SSRF protection', () => {
    it('should reject non-HTTP(S) URLs', async () => {
      const result = await fetchSpec('ftp://example.com/spec.json');

      expect(result).toEqual({
        error: expect.stringContaining('Protocol not allowed'),
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should reject file:// protocol', async () => {
      const result = await fetchSpec('file:///etc/passwd');

      expect(result).toEqual({
        error: expect.stringContaining('Protocol not allowed'),
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should reject private IP 127.0.0.1', async () => {
      const result = await fetchSpec('http://127.0.0.1/spec.json');

      expect(result).toEqual({
        error: expect.stringContaining('private'),
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should reject private IP 10.0.0.1', async () => {
      const result = await fetchSpec('http://10.0.0.1/spec.json');

      expect(result).toEqual({
        error: expect.stringContaining('private'),
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should reject private IP 192.168.1.1', async () => {
      const result = await fetchSpec('http://192.168.1.1/spec.json');

      expect(result).toEqual({
        error: expect.stringContaining('private'),
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should reject private IP 172.16.0.1', async () => {
      const result = await fetchSpec('http://172.16.0.1/spec.json');

      expect(result).toEqual({
        error: expect.stringContaining('private'),
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should reject AWS metadata IP 169.254.169.254', async () => {
      const result = await fetchSpec('http://169.254.169.254/latest/meta-data/');

      expect(result).toEqual({
        error: expect.stringContaining('private'),
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should reject localhost hostname', async () => {
      const result = await fetchSpec('http://localhost:3000/spec.json');

      expect(result).toEqual({
        error: expect.stringContaining('blocked'),
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should reject internal hostnames', async () => {
      const result = await fetchSpec('http://internal.company.com/spec.json');

      expect(result).toEqual({
        error: expect.stringContaining('blocked'),
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return error for invalid URL format', async () => {
      const result = await fetchSpec('not-a-valid-url');

      expect(result).toEqual({
        error: expect.stringContaining('Invalid URL'),
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return error for empty URL', async () => {
      const result = await fetchSpec('');

      expect(result).toEqual({
        error: expect.stringContaining('Invalid URL'),
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await fetchSpec('https://api.example.com/nonexistent.json');

      expect(result).toEqual({
        error: expect.stringContaining('404'),
      });
    });

    it('should handle HTTP 500 error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await fetchSpec('https://api.example.com/spec.json');

      expect(result).toEqual({
        error: expect.stringContaining('500'),
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchSpec('https://api.example.com/spec.json');

      expect(result).toEqual({
        error: expect.stringContaining('Network error'),
      });
    });

    it('should handle timeout errors', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      mockFetch.mockRejectedValueOnce(abortError);

      const result = await fetchSpec('https://api.example.com/spec.json');

      expect(result).toEqual({
        error: expect.stringContaining('timeout'),
      });
    });

    it('should enforce response size limit', async () => {
      // Create a response larger than 5MB
      const largeContent = 'x'.repeat(6 * 1024 * 1024);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-length' ? String(6 * 1024 * 1024) : null,
        },
        text: () => Promise.resolve(largeContent),
      });

      const result = await fetchSpec('https://api.example.com/huge-spec.json');

      expect(result).toEqual({
        error: expect.stringContaining('too large'),
      });
    });
  });
});

/**
 * Unit tests for resolveServerUrl utility
 * Resolves relative OpenAPI server URLs against a source URL.
 *
 * Security: OWASP A09:2025 (SSRF) - Uses URL constructor for safe URL manipulation
 */

import { describe, it, expect } from 'vitest';
import { resolveServerUrl } from '@yasp/core/features/registration/utils/resolve-server-url';

describe('resolveServerUrl', () => {
  it('should return absolute URL unchanged', () => {
    const result = resolveServerUrl('https://api.example.com/v1');
    expect(result).toBe('https://api.example.com/v1');
  });

  it('should return absolute HTTP URL unchanged', () => {
    const result = resolveServerUrl(
      'http://api.example.com/v1',
      'https://other.com/spec.json'
    );
    expect(result).toBe('http://api.example.com/v1');
  });

  it('should resolve root-relative path against source URL', () => {
    const result = resolveServerUrl(
      '/account-api-2',
      'https://api.example.com:8025/account-api-2/swagger/v1/swagger.json'
    );
    expect(result).toBe('https://api.example.com:8025/account-api-2');
  });

  it('should resolve relative path against source URL (scheme + host + port)', () => {
    const result = resolveServerUrl(
      '/api/v1',
      'https://example.com:9090/docs/openapi.yaml'
    );
    expect(result).toBe('https://example.com:9090/api/v1');
  });

  it('should handle source URL with trailing path (swagger.json)', () => {
    const result = resolveServerUrl(
      '/api',
      'https://host.com/some/path/swagger.json'
    );
    expect(result).toBe('https://host.com/api');
  });

  it('should handle source URL with non-standard port', () => {
    const result = resolveServerUrl(
      '/v2',
      'http://myhost.com:5000/openapi.json'
    );
    expect(result).toBe('http://myhost.com:5000/v2');
  });

  it('should handle source URL without explicit port', () => {
    const result = resolveServerUrl(
      '/api',
      'https://api.example.com/spec.json'
    );
    expect(result).toBe('https://api.example.com/api');
  });

  it('should return original URL when no sourceUrl provided', () => {
    const result = resolveServerUrl('/account-api-2');
    expect(result).toBe('/account-api-2');
  });

  it('should return original URL when sourceUrl is empty string', () => {
    const result = resolveServerUrl('/account-api-2', '');
    expect(result).toBe('/account-api-2');
  });

  it('should handle empty server URL', () => {
    const result = resolveServerUrl(
      '',
      'https://example.com/spec.json'
    );
    expect(result).toBe('');
  });

  it('should handle server URL that is just a slash', () => {
    const result = resolveServerUrl(
      '/',
      'https://example.com:8025/spec.json'
    );
    expect(result).toBe('https://example.com:8025/');
  });

  it('should handle relative path without leading slash', () => {
    const result = resolveServerUrl(
      'api/v1',
      'https://example.com:3000/docs/spec.json'
    );
    expect(result).toBe('https://example.com:3000/api/v1');
  });
});

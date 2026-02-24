/**
 * Security Tests - SSRF Prevention
 * Tests for OWASP A09:2025 - Server-Side Request Forgery
 *
 * Policy: Block cloud metadata endpoints only.
 * Localhost and private IPs are allowed for local API development.
 *
 * Test Coverage:
 * - URL validation blocks cloud metadata endpoints
 * - URL validation blocks non-HTTP protocols
 * - URL validation allows localhost and private IPs
 * - Allowed domains enforcement (when specified)
 */

import { describe, it, expect } from 'vitest';
import { validateApiUrl } from '@yasp/core/core/security/validators';

describe('SSRF Prevention - URL Validation', () => {
  describe('Localhost and Private IPs (allowed)', () => {
    it('should allow localhost', () => {
      expect(validateApiUrl('http://localhost:3000/api').valid).toBe(true);
      expect(validateApiUrl('https://localhost/api').valid).toBe(true);
    });

    it('should allow 127.0.0.1', () => {
      expect(validateApiUrl('http://127.0.0.1:8080/api').valid).toBe(true);
      expect(validateApiUrl('https://127.0.0.1/api').valid).toBe(true);
    });

    it('should allow 0.0.0.0', () => {
      expect(validateApiUrl('http://0.0.0.0:3000/api').valid).toBe(true);
    });

    it('should allow 10.x.x.x range', () => {
      expect(validateApiUrl('http://10.0.0.1/api').valid).toBe(true);
      expect(validateApiUrl('http://10.255.255.255/api').valid).toBe(true);
    });

    it('should allow 172.16.x.x - 172.31.x.x range', () => {
      expect(validateApiUrl('http://172.16.0.1/api').valid).toBe(true);
      expect(validateApiUrl('http://172.31.255.255/api').valid).toBe(true);
    });

    it('should allow 192.168.x.x range', () => {
      expect(validateApiUrl('http://192.168.0.1/api').valid).toBe(true);
      expect(validateApiUrl('http://192.168.1.1/api').valid).toBe(true);
    });
  });

  describe('Cloud Metadata Blocking', () => {
    it('should block AWS metadata IP 169.254.169.254', () => {
      expect(validateApiUrl('http://169.254.169.254/latest/meta-data/').valid).toBe(false);
    });

    it('should block link-local 169.254.x.x range', () => {
      expect(validateApiUrl('http://169.254.1.1/api').valid).toBe(false);
    });

    it('should block metadata hostname', () => {
      expect(validateApiUrl('http://metadata.google.internal/computeMetadata/v1/').valid).toBe(false);
    });

    it('should block instance-data hostname', () => {
      expect(validateApiUrl('http://instance-data/latest/meta-data/').valid).toBe(false);
    });
  });

  describe('Protocol Validation', () => {
    it('should reject file:// protocol', () => {
      expect(validateApiUrl('file:///etc/passwd').valid).toBe(false);
    });

    it('should reject ftp:// protocol', () => {
      expect(validateApiUrl('ftp://example.com/file').valid).toBe(false);
    });

    it('should reject gopher:// protocol', () => {
      expect(validateApiUrl('gopher://example.com').valid).toBe(false);
    });

    it('should accept http:// protocol', () => {
      expect(validateApiUrl('http://api.example.com/endpoint').valid).toBe(true);
    });

    it('should accept https:// protocol', () => {
      expect(validateApiUrl('https://api.example.com/endpoint').valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid URLs', () => {
      expect(validateApiUrl('not-a-url').valid).toBe(false);
      expect(validateApiUrl('://malformed').valid).toBe(false);
      expect(validateApiUrl('').valid).toBe(false);
    });

    it('should handle URLs with ports', () => {
      expect(validateApiUrl('https://api.example.com:443/test').valid).toBe(true);
    });

    it('should handle URLs with authentication', () => {
      expect(validateApiUrl('https://user:pass@api.example.com/test').valid).toBe(true);
    });

    it('should handle URLs with query parameters', () => {
      expect(validateApiUrl('https://api.example.com/test?param=value').valid).toBe(true);
    });

    it('should handle URLs with fragments', () => {
      expect(validateApiUrl('https://api.example.com/test#section').valid).toBe(true);
    });
  });

  describe('Public IP Acceptance', () => {
    it('should accept valid public IPs', () => {
      expect(validateApiUrl('http://8.8.8.8/api').valid).toBe(true);
      expect(validateApiUrl('http://1.1.1.1/api').valid).toBe(true);
      expect(validateApiUrl('http://93.184.216.34/api').valid).toBe(true);
    });

    it('should accept valid public domains', () => {
      expect(validateApiUrl('https://api.github.com/users').valid).toBe(true);
      expect(validateApiUrl('https://httpbin.org/get').valid).toBe(true);
      expect(validateApiUrl('https://jsonplaceholder.typicode.com/posts').valid).toBe(true);
    });
  });
});

describe('SSRF Prevention - Real-world Attack Scenarios', () => {
  it('should block AWS metadata service access', () => {
    expect(validateApiUrl('http://169.254.169.254/latest/meta-data/').valid).toBe(false);
  });

  it('should block Google Cloud metadata', () => {
    expect(validateApiUrl('http://metadata.google.internal/computeMetadata/v1/').valid).toBe(false);
  });

  it('should block instance-data endpoints', () => {
    expect(validateApiUrl('http://instance-data/latest/meta-data/').valid).toBe(false);
  });
});

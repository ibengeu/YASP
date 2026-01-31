/**
 * Security Tests - SSRF Prevention
 * Tests for OWASP A09:2025 – Server-Side Request Forgery
 *
 * Test Coverage:
 * - URL validation rejects private IPs
 * - URL validation rejects localhost
 * - URL validation rejects internal networks
 * - Allowed domains are enforced
 */

import { describe, it, expect } from 'vitest';

/**
 * URL Validation Helper
 * Validates URLs for API testing to prevent SSRF attacks
 *
 * Mitigation for OWASP A09:2025 – SSRF:
 * - Rejects private IP ranges (10.x, 172.16-31.x, 192.168.x)
 * - Rejects localhost and loopback addresses
 * - Rejects link-local addresses (169.254.x)
 * - Enforces allowed domain list for production
 */
function validateApiUrl(url: string, allowedDomains?: string[]): boolean {
  try {
    const parsed = new URL(url);

    // Reject non-HTTP(S) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Reject localhost variations
    const localhostPatterns = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '[::1]',
      '::1',
      '0:0:0:0:0:0:0:1',
    ];
    if (localhostPatterns.some(pattern => hostname === pattern || hostname.includes(pattern))) {
      return false;
    }

    // Reject internal DNS patterns (Kubernetes, etc.)
    const internalDnsPatterns = [
      '.local',
      '.cluster.local',
      '.svc',
      '.internal',
    ];
    if (internalDnsPatterns.some(pattern => hostname.endsWith(pattern))) {
      return false;
    }

    // Reject private IP ranges
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Pattern);
    if (ipMatch) {
      const [, a, b, c, d] = ipMatch.map(Number);

      // 10.0.0.0/8
      if (a === 10) return false;

      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) return false;

      // 192.168.0.0/16
      if (a === 192 && b === 168) return false;

      // 169.254.0.0/16 (link-local)
      if (a === 169 && b === 254) return false;
    }

    // If allowed domains specified, enforce them
    if (allowedDomains && allowedDomains.length > 0) {
      return allowedDomains.some(domain =>
        hostname === domain || hostname.endsWith(`.${domain}`)
      );
    }

    return true;
  } catch {
    return false;
  }
}

describe('SSRF Prevention - URL Validation', () => {
  describe('Localhost Rejection', () => {
    it('should reject localhost', () => {
      expect(validateApiUrl('http://localhost:3000/api')).toBe(false);
      expect(validateApiUrl('https://localhost/api')).toBe(false);
    });

    it('should reject 127.0.0.1', () => {
      expect(validateApiUrl('http://127.0.0.1:8080/api')).toBe(false);
      expect(validateApiUrl('https://127.0.0.1/api')).toBe(false);
    });

    it('should reject 0.0.0.0', () => {
      expect(validateApiUrl('http://0.0.0.0:3000/api')).toBe(false);
    });

    it('should reject IPv6 localhost (::1)', () => {
      expect(validateApiUrl('http://[::1]:3000/api')).toBe(false);
    });
  });

  describe('Private IP Rejection', () => {
    it('should reject 10.x.x.x range', () => {
      expect(validateApiUrl('http://10.0.0.1/api')).toBe(false);
      expect(validateApiUrl('http://10.255.255.255/api')).toBe(false);
      expect(validateApiUrl('http://10.10.10.10:8080/api')).toBe(false);
    });

    it('should reject 172.16.x.x - 172.31.x.x range', () => {
      expect(validateApiUrl('http://172.16.0.1/api')).toBe(false);
      expect(validateApiUrl('http://172.31.255.255/api')).toBe(false);
      expect(validateApiUrl('http://172.20.10.5:3000/api')).toBe(false);
    });

    it('should reject 192.168.x.x range', () => {
      expect(validateApiUrl('http://192.168.0.1/api')).toBe(false);
      expect(validateApiUrl('http://192.168.1.1/api')).toBe(false);
      expect(validateApiUrl('http://192.168.255.255:8080/api')).toBe(false);
    });

    it('should reject link-local 169.254.x.x range', () => {
      expect(validateApiUrl('http://169.254.1.1/api')).toBe(false);
      expect(validateApiUrl('http://169.254.169.254/api')).toBe(false); // AWS metadata service
    });
  });

  describe('Protocol Validation', () => {
    it('should reject file:// protocol', () => {
      expect(validateApiUrl('file:///etc/passwd')).toBe(false);
    });

    it('should reject ftp:// protocol', () => {
      expect(validateApiUrl('ftp://example.com/file')).toBe(false);
    });

    it('should reject gopher:// protocol', () => {
      expect(validateApiUrl('gopher://example.com')).toBe(false);
    });

    it('should accept http:// protocol', () => {
      expect(validateApiUrl('http://api.example.com/endpoint')).toBe(true);
    });

    it('should accept https:// protocol', () => {
      expect(validateApiUrl('https://api.example.com/endpoint')).toBe(true);
    });
  });

  describe('Allowed Domains Enforcement', () => {
    const allowedDomains = ['api.example.com', 'httpbin.org'];

    it('should accept allowed domains', () => {
      expect(validateApiUrl('https://api.example.com/test', allowedDomains)).toBe(true);
      expect(validateApiUrl('https://httpbin.org/get', allowedDomains)).toBe(true);
    });

    it('should accept subdomains of allowed domains', () => {
      expect(validateApiUrl('https://v1.api.example.com/test', allowedDomains)).toBe(true);
      expect(validateApiUrl('https://test.httpbin.org/get', allowedDomains)).toBe(true);
    });

    it('should reject non-allowed domains', () => {
      expect(validateApiUrl('https://evil.com/api', allowedDomains)).toBe(false);
      expect(validateApiUrl('https://attacker.net/endpoint', allowedDomains)).toBe(false);
    });

    it('should reject domains that partially match', () => {
      expect(validateApiUrl('https://fakeapi.example.com.evil.com/test', allowedDomains)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid URLs', () => {
      expect(validateApiUrl('not-a-url')).toBe(false);
      expect(validateApiUrl('://malformed')).toBe(false);
      expect(validateApiUrl('')).toBe(false);
    });

    it('should handle URLs with ports', () => {
      expect(validateApiUrl('https://api.example.com:443/test')).toBe(true);
      expect(validateApiUrl('http://192.168.1.1:8080/api')).toBe(false);
    });

    it('should handle URLs with authentication', () => {
      expect(validateApiUrl('https://user:pass@api.example.com/test')).toBe(true);
      expect(validateApiUrl('http://user:pass@localhost/api')).toBe(false);
    });

    it('should handle URLs with query parameters', () => {
      expect(validateApiUrl('https://api.example.com/test?param=value')).toBe(true);
      expect(validateApiUrl('http://10.0.0.1/api?exploit=true')).toBe(false);
    });

    it('should handle URLs with fragments', () => {
      expect(validateApiUrl('https://api.example.com/test#section')).toBe(true);
    });
  });

  describe('Public IP Acceptance', () => {
    it('should accept valid public IPs', () => {
      expect(validateApiUrl('http://8.8.8.8/api')).toBe(true); // Google DNS
      expect(validateApiUrl('http://1.1.1.1/api')).toBe(true); // Cloudflare DNS
      expect(validateApiUrl('http://93.184.216.34/api')).toBe(true); // example.com IP
    });

    it('should accept valid public domains', () => {
      expect(validateApiUrl('https://api.github.com/users')).toBe(true);
      expect(validateApiUrl('https://httpbin.org/get')).toBe(true);
      expect(validateApiUrl('https://jsonplaceholder.typicode.com/posts')).toBe(true);
    });
  });
});

describe('SSRF Prevention - Real-world Attack Scenarios', () => {
  it('should block AWS metadata service access', () => {
    // AWS metadata service (common SSRF target)
    expect(validateApiUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
  });

  it('should block internal Kubernetes service access', () => {
    // Kubernetes internal DNS
    expect(validateApiUrl('http://kubernetes.default.svc.cluster.local/api')).toBe(false);
  });

  it('should block Docker daemon access', () => {
    // Docker daemon socket (if exposed via HTTP)
    expect(validateApiUrl('http://localhost:2375/containers/json')).toBe(false);
  });

  it('should block Redis access attempts', () => {
    // Redis default port
    expect(validateApiUrl('http://localhost:6379/')).toBe(false);
    expect(validateApiUrl('http://127.0.0.1:6379/')).toBe(false);
  });
});

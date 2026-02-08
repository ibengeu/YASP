/**
 * Proxy URL Validator Tests
 * Tests for SSRF protection and URL validation
 *
 * Security: OWASP A10:2021 (SSRF)
 * Based on: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
 */

import { describe, it, expect } from 'vitest';
import {
  validateProxyUrl,
  isPrivateIP,
  isAllowedPort,
} from '../proxy-validator';

describe('ProxyValidator - SSRF Protection', () => {
  describe('validateProxyUrl', () => {
    it('should allow public HTTPS APIs', async () => {
      const result = await validateProxyUrl('https://api.github.com/users');
      expect(result.valid).toBe(true);
    });

    it('should allow public HTTP APIs on port 80', async () => {
      const result = await validateProxyUrl('http://httpbin.org/get');
      expect(result.valid).toBe(true);
    });

    it('should block localhost', async () => {
      const result = await validateProxyUrl('http://localhost:3000/admin');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('localhost');
    });

    it('should block 127.0.0.1 (loopback)', async () => {
      const result = await validateProxyUrl('http://127.0.0.1:8080/api');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('private');
    });

    it('should block private IP 10.0.0.1', async () => {
      const result = await validateProxyUrl('http://10.0.0.1/internal');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('private');
    });

    it('should block private IP 192.168.1.1', async () => {
      const result = await validateProxyUrl('http://192.168.1.1/router');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('private');
    });

    it('should block private IP 172.16.0.1', async () => {
      const result = await validateProxyUrl('http://172.16.0.1/internal');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('private');
    });

    it('should block AWS metadata endpoint 169.254.169.254', async () => {
      const result = await validateProxyUrl('http://169.254.169.254/latest/meta-data/');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('private');
    });

    it('should block IPv6 localhost ::1', async () => {
      const result = await validateProxyUrl('http://[::1]/admin');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('private');
    });

    it('should block IPv6 link-local fe80::1', async () => {
      const result = await validateProxyUrl('http://[fe80::1]/api');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('private');
    });

    it('should block IPv4-mapped IPv6 ::ffff:127.0.0.1', async () => {
      const result = await validateProxyUrl('http://[::ffff:127.0.0.1]/api');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('private');
    });

    it('should block file:// protocol', async () => {
      const result = await validateProxyUrl('file:///etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Protocol');
    });

    it('should block ftp:// protocol', async () => {
      const result = await validateProxyUrl('ftp://example.com/files');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Protocol');
    });

    it('should block gopher:// protocol', async () => {
      const result = await validateProxyUrl('gopher://example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Protocol');
    });

    it('should reject invalid URLs', async () => {
      const result = await validateProxyUrl('not-a-valid-url');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid URL');
    });

    it('should block dangerous port 22 (SSH)', async () => {
      const result = await validateProxyUrl('http://example.com:22/');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Port');
    });

    it('should block dangerous port 3306 (MySQL)', async () => {
      const result = await validateProxyUrl('http://example.com:3306/');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Port');
    });

    it('should allow port 8080', async () => {
      const result = await validateProxyUrl('http://example.com:8080/api');
      expect(result.valid).toBe(true);
    });

    it('should allow port 8443', async () => {
      const result = await validateProxyUrl('https://example.com:8443/api');
      expect(result.valid).toBe(true);
    });

    it('should allow non-standard API port 8025', async () => {
      const result = await validateProxyUrl('https://example.com:8025/api');
      expect(result.valid).toBe(true);
    });

    it('should allow port 5000 (common dev API port)', async () => {
      const result = await validateProxyUrl('http://example.com:5000/api');
      expect(result.valid).toBe(true);
    });

    it('should allow port 3000 (common dev API port)', async () => {
      const result = await validateProxyUrl('http://example.com:3000/api');
      expect(result.valid).toBe(true);
    });

    it('should allow port 9090', async () => {
      const result = await validateProxyUrl('http://example.com:9090/api');
      expect(result.valid).toBe(true);
    });

    it('should block dangerous port 5432 (PostgreSQL)', async () => {
      const result = await validateProxyUrl('http://example.com:5432/');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Port');
    });

    it('should block dangerous port 6379 (Redis)', async () => {
      const result = await validateProxyUrl('http://example.com:6379/');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Port');
    });

    it('should block dangerous port 27017 (MongoDB)', async () => {
      const result = await validateProxyUrl('http://example.com:27017/');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Port');
    });

    it('should block hostname containing "internal"', async () => {
      const result = await validateProxyUrl('http://internal.company.com/api');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Hostname');
    });

    it('should block hostname containing "metadata"', async () => {
      const result = await validateProxyUrl('http://metadata.cloud.local/api');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Hostname');
    });
  });

  describe('isPrivateIP', () => {
    // IPv4 private ranges
    it('should detect 10.0.0.0/8 as private', () => {
      expect(isPrivateIP('10.0.0.1')).toBe(true);
      expect(isPrivateIP('10.255.255.254')).toBe(true);
    });

    it('should detect 172.16.0.0/12 as private', () => {
      expect(isPrivateIP('172.16.0.1')).toBe(true);
      expect(isPrivateIP('172.31.255.254')).toBe(true);
    });

    it('should detect 192.168.0.0/16 as private', () => {
      expect(isPrivateIP('192.168.0.1')).toBe(true);
      expect(isPrivateIP('192.168.255.254')).toBe(true);
    });

    it('should detect 127.0.0.0/8 as loopback', () => {
      expect(isPrivateIP('127.0.0.1')).toBe(true);
      expect(isPrivateIP('127.0.0.2')).toBe(true);
      expect(isPrivateIP('127.255.255.254')).toBe(true);
    });

    it('should detect 169.254.0.0/16 as link-local', () => {
      expect(isPrivateIP('169.254.0.1')).toBe(true);
      expect(isPrivateIP('169.254.169.254')).toBe(true); // AWS metadata
    });

    // Public IPs should be allowed
    it('should allow public IP 8.8.8.8 (Google DNS)', () => {
      expect(isPrivateIP('8.8.8.8')).toBe(false);
    });

    it('should allow public IP 1.1.1.1 (Cloudflare DNS)', () => {
      expect(isPrivateIP('1.1.1.1')).toBe(false);
    });

    // IPv6 tests
    it('should detect ::1 as loopback', () => {
      expect(isPrivateIP('::1')).toBe(true);
    });

    it('should detect fe80:: as link-local', () => {
      expect(isPrivateIP('fe80::1')).toBe(true);
      expect(isPrivateIP('fe80:0000:0000:0000:0000:0000:0000:0001')).toBe(true);
    });

    it('should detect fc00::/7 as unique local', () => {
      expect(isPrivateIP('fc00::1')).toBe(true);
      expect(isPrivateIP('fd00::1')).toBe(true);
    });

    it('should detect ::ffff:127.0.0.1 as IPv4-mapped loopback', () => {
      expect(isPrivateIP('::ffff:127.0.0.1')).toBe(true);
    });

    it('should detect ::ffff:192.168.1.1 as IPv4-mapped private', () => {
      expect(isPrivateIP('::ffff:192.168.1.1')).toBe(true);
    });
  });

  describe('isAllowedPort', () => {
    it('should allow port 80 (HTTP)', () => {
      expect(isAllowedPort(80)).toBe(true);
    });

    it('should allow port 443 (HTTPS)', () => {
      expect(isAllowedPort(443)).toBe(true);
    });

    it('should allow port 8080', () => {
      expect(isAllowedPort(8080)).toBe(true);
    });

    it('should allow port 8443', () => {
      expect(isAllowedPort(8443)).toBe(true);
    });

    it('should allow port 8025 (non-standard API port)', () => {
      expect(isAllowedPort(8025)).toBe(true);
    });

    it('should allow port 3000 (common dev port)', () => {
      expect(isAllowedPort(3000)).toBe(true);
    });

    it('should allow port 5000 (common dev port)', () => {
      expect(isAllowedPort(5000)).toBe(true);
    });

    it('should allow port 9090', () => {
      expect(isAllowedPort(9090)).toBe(true);
    });

    it('should block port 22 (SSH)', () => {
      expect(isAllowedPort(22)).toBe(false);
    });

    it('should block port 23 (Telnet)', () => {
      expect(isAllowedPort(23)).toBe(false);
    });

    it('should block port 25 (SMTP)', () => {
      expect(isAllowedPort(25)).toBe(false);
    });

    it('should block port 135 (MSRPC)', () => {
      expect(isAllowedPort(135)).toBe(false);
    });

    it('should block port 445 (SMB)', () => {
      expect(isAllowedPort(445)).toBe(false);
    });

    it('should block port 3306 (MySQL)', () => {
      expect(isAllowedPort(3306)).toBe(false);
    });

    it('should block port 5432 (PostgreSQL)', () => {
      expect(isAllowedPort(5432)).toBe(false);
    });

    it('should block port 6379 (Redis)', () => {
      expect(isAllowedPort(6379)).toBe(false);
    });

    it('should block port 9200 (Elasticsearch)', () => {
      expect(isAllowedPort(9200)).toBe(false);
    });

    it('should block port 27017 (MongoDB)', () => {
      expect(isAllowedPort(27017)).toBe(false);
    });
  });
});

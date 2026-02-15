/**
 * Unit tests for patchSpecServers utility
 * Ensures stored spec content always has correct server URLs for Try It Out.
 *
 * Security: OWASP A07:2025 (Injection) - Uses parse-modify-serialize, never string interpolation
 */

import { describe, it, expect } from 'vitest';
import { patchSpecServers } from '@/features/registration/utils/patch-spec-servers';
import type { ServerConfig } from '@/features/registration/utils/spec-inference';

describe('patchSpecServers', () => {
  describe('spec with existing servers', () => {
    it('should patch relative server URL with resolved absolute URL in JSON', () => {
      const content = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0' },
        servers: [{ url: '/account-api-2' }],
        paths: {},
      });

      const resolvedServers: ServerConfig[] = [
        { url: 'https://host.com:8025/account-api-2', isDefault: true },
      ];

      const result = patchSpecServers(content, resolvedServers, 'https://host.com:8025/account-api-2');
      const parsed = JSON.parse(result);

      // Endpoint matches resolved server, so no prepend — just the patched URL
      expect(parsed.servers[0].url).toBe('https://host.com:8025/account-api-2');
    });

    it('should patch relative server URL in YAML content', () => {
      const content = `openapi: '3.0.0'
info:
  title: Test
  version: '1.0'
servers:
  - url: /account-api-2
paths: {}
`;

      const resolvedServers: ServerConfig[] = [
        { url: 'https://host.com:8025/account-api-2', isDefault: true },
      ];

      const result = patchSpecServers(content, resolvedServers, 'https://host.com:8025/account-api-2');
      expect(result).toContain('https://host.com:8025/account-api-2');
    });

    it('should handle multiple servers', () => {
      const content = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0' },
        servers: [
          { url: '/api/v1', description: 'V1' },
          { url: '/api/v2', description: 'V2' },
        ],
        paths: {},
      });

      const resolvedServers: ServerConfig[] = [
        { url: 'https://host.com:5000/api/v1', description: 'V1', isDefault: true },
        { url: 'https://host.com:5000/api/v2', description: 'V2', isDefault: false },
      ];

      const result = patchSpecServers(content, resolvedServers, 'https://host.com:5000/api/v1');
      const parsed = JSON.parse(result);

      expect(parsed.servers[0].url).toBe('https://host.com:5000/api/v1');
      expect(parsed.servers[1].url).toBe('https://host.com:5000/api/v2');
    });

    it('should prepend endpoint if it differs from all server URLs', () => {
      const content = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0' },
        servers: [{ url: 'https://production.example.com/api' }],
        paths: {},
      });

      const result = patchSpecServers(content, [], 'http://localhost:3000');
      const parsed = JSON.parse(result);

      expect(parsed.servers[0].url).toBe('http://localhost:3000');
      expect(parsed.servers[1].url).toBe('https://production.example.com/api');
    });

    it('should not prepend endpoint if it already matches a server URL', () => {
      const content = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0' },
        servers: [{ url: 'http://localhost:3000' }],
        paths: {},
      });

      const result = patchSpecServers(content, [], 'http://localhost:3000');
      const parsed = JSON.parse(result);

      expect(parsed.servers).toHaveLength(1);
      expect(parsed.servers[0].url).toBe('http://localhost:3000');
    });

    it('should normalize trailing slashes when comparing endpoint to servers', () => {
      const content = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0' },
        servers: [{ url: 'http://localhost:3000/' }],
        paths: {},
      });

      const result = patchSpecServers(content, [], 'http://localhost:3000');
      const parsed = JSON.parse(result);

      // Should not duplicate — trailing slash difference is normalized
      expect(parsed.servers).toHaveLength(1);
    });

    it('should not modify URLs when resolvedServers is empty', () => {
      const content = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0' },
        servers: [{ url: '/api' }],
        paths: {},
      });

      const result = patchSpecServers(content, [], 'http://localhost:5000');
      const parsed = JSON.parse(result);

      // Endpoint prepended, original URL preserved
      expect(parsed.servers[0].url).toBe('http://localhost:5000');
      expect(parsed.servers[1].url).toBe('/api');
    });
  });

  describe('spec without servers', () => {
    it('should inject endpoint as the server when spec has no servers array', () => {
      const content = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0' },
        paths: {},
      });

      const result = patchSpecServers(content, [], 'http://localhost:3000');
      const parsed = JSON.parse(result);

      expect(parsed.servers).toEqual([{ url: 'http://localhost:3000' }]);
    });

    it('should strip trailing slash from injected endpoint', () => {
      const content = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0' },
        paths: {},
      });

      const result = patchSpecServers(content, [], 'http://localhost:3000/');
      const parsed = JSON.parse(result);

      expect(parsed.servers[0].url).toBe('http://localhost:3000');
    });

    it('should not inject servers when endpoint is empty', () => {
      const content = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0' },
        paths: {},
      });

      const result = patchSpecServers(content, [], '');
      const parsed = JSON.parse(result);

      expect(parsed.servers).toBeUndefined();
    });
  });

  describe('format preservation', () => {
    it('should preserve JSON format', () => {
      const content = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0' },
        servers: [{ url: '/api' }],
        paths: {},
      });

      const result = patchSpecServers(content, [], 'http://localhost:3000');

      // Result should be valid JSON
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should preserve YAML format', () => {
      const content = `openapi: "3.0.0"
info:
  title: Test
  version: "1.0"
servers:
  - url: /api
paths: {}
`;

      const result = patchSpecServers(content, [], 'http://localhost:3000');

      // Result should still be YAML (not JSON)
      expect(result.trimStart().startsWith('{')).toBe(false);
      expect(result).toContain('http://localhost:3000');
    });

    it('should preserve other spec fields when patching servers', () => {
      const content = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'My API', version: '2.0', description: 'A test API' },
        servers: [{ url: '/api', description: 'Main server' }],
        paths: { '/users': { get: { summary: 'List users' } } },
        components: { schemas: { User: { type: 'object' } } },
      });

      const resolvedServers: ServerConfig[] = [
        { url: 'https://host.com/api', description: 'Main server', isDefault: true },
      ];

      const result = patchSpecServers(content, resolvedServers, 'https://host.com/api');
      const parsed = JSON.parse(result);

      expect(parsed.info.title).toBe('My API');
      expect(parsed.info.description).toBe('A test API');
      expect(parsed.paths['/users'].get.summary).toBe('List users');
      expect(parsed.components.schemas.User.type).toBe('object');
    });
  });

  describe('error handling', () => {
    it('should return content unchanged when parsing fails', () => {
      const invalidContent = 'this is not valid json or yaml: [[[';

      const result = patchSpecServers(invalidContent, [], 'http://localhost:3000');

      expect(result).toBe(invalidContent);
    });
  });
});

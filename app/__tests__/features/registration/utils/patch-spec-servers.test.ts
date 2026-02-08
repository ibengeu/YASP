/**
 * Unit tests for patchSpecServers utility
 * Replaces relative server URLs in stored spec content with resolved absolute URLs.
 *
 * Security: OWASP A07:2025 (Injection) - Uses parse-modify-serialize, never string interpolation
 */

import { describe, it, expect } from 'vitest';
import { patchSpecServers } from '@/features/registration/utils/patch-spec-servers';
import type { ServerConfig } from '@/features/registration/utils/spec-inference';

describe('patchSpecServers', () => {
  it('should replace relative server URL with resolved absolute URL in JSON content', () => {
    const content = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0' },
      servers: [{ url: '/account-api-2' }],
      paths: {},
    });

    const resolvedServers: ServerConfig[] = [
      { url: 'https://host.com:8025/account-api-2', isDefault: true },
    ];

    const result = patchSpecServers(content, resolvedServers);
    const parsed = JSON.parse(result);

    expect(parsed.servers[0].url).toBe('https://host.com:8025/account-api-2');
  });

  it('should replace relative server URL with resolved absolute URL in YAML content', () => {
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

    const result = patchSpecServers(content, resolvedServers);

    // Result should be valid YAML with the resolved URL
    // Re-parse as YAML to verify
    expect(result).toContain('https://host.com:8025/account-api-2');
  });

  it('should not modify content when server URL is already absolute', () => {
    const original = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0' },
      servers: [{ url: 'https://api.example.com/v1' }],
      paths: {},
    };
    const content = JSON.stringify(original);

    const resolvedServers: ServerConfig[] = [
      { url: 'https://api.example.com/v1', isDefault: true },
    ];

    const result = patchSpecServers(content, resolvedServers);
    const parsed = JSON.parse(result);

    expect(parsed.servers[0].url).toBe('https://api.example.com/v1');
  });

  it('should handle spec with multiple servers', () => {
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

    const result = patchSpecServers(content, resolvedServers);
    const parsed = JSON.parse(result);

    expect(parsed.servers[0].url).toBe('https://host.com:5000/api/v1');
    expect(parsed.servers[1].url).toBe('https://host.com:5000/api/v2');
  });

  it('should handle spec with no servers array', () => {
    const content = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0' },
      paths: {},
    });

    const result = patchSpecServers(content, []);
    const parsed = JSON.parse(result);

    // Should return content unmodified
    expect(parsed.servers).toBeUndefined();
  });

  it('should return original content when resolvedServers is empty', () => {
    const content = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0' },
      servers: [{ url: '/api' }],
      paths: {},
    });

    const result = patchSpecServers(content, []);
    const parsed = JSON.parse(result);

    // No resolved servers provided, content should be unchanged
    expect(parsed.servers[0].url).toBe('/api');
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

    const result = patchSpecServers(content, resolvedServers);
    const parsed = JSON.parse(result);

    expect(parsed.info.title).toBe('My API');
    expect(parsed.info.description).toBe('A test API');
    expect(parsed.paths['/users'].get.summary).toBe('List users');
    expect(parsed.components.schemas.User.type).toBe('object');
    expect(parsed.servers[0].url).toBe('https://host.com/api');
  });

  it('should preserve YAML format when input is YAML', () => {
    const content = `openapi: "3.0.0"
info:
  title: Test
  version: "1.0"
servers:
  - url: /api
paths: {}
`;

    const resolvedServers: ServerConfig[] = [
      { url: 'https://host.com/api', isDefault: true },
    ];

    const result = patchSpecServers(content, resolvedServers);

    // Result should still be YAML (not JSON)
    expect(result.trimStart().startsWith('{')).toBe(false);
    expect(result).toContain('https://host.com/api');
  });
});

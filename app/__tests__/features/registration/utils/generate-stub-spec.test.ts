/**
 * Unit tests for stub spec generation utility
 * TDD Cycle 1 (Red phase): Tests written before implementation
 *
 * Gap 2 fix: Manual registration generates paths: {} which breaks Try It Out.
 * The generate-stub-spec utility creates a minimal but functional OpenAPI spec
 * with at least one endpoint so Try It Out has something to render.
 */

import { describe, it, expect } from 'vitest';
import { generateStubSpec } from '@/features/registration/utils/generate-stub-spec';

describe('generateStubSpec', () => {
  it('should generate valid OpenAPI 3.1.0 spec with GET / endpoint', () => {
    const result = generateStubSpec({
      name: 'My API',
      version: '1.0.0',
      endpoint: 'https://api.example.com',
    });

    expect(result.openapi).toBe('3.1.0');
    expect(result.paths).toBeDefined();
    expect(result.paths['/']).toBeDefined();
    expect(result.paths['/'].get).toBeDefined();
  });

  it('should include provided name, version, and description', () => {
    const result = generateStubSpec({
      name: 'Payment API',
      version: '2.0.0',
      description: 'Handles payments',
      endpoint: 'https://pay.example.com',
    });

    expect(result.info.title).toBe('Payment API');
    expect(result.info.version).toBe('2.0.0');
    expect(result.info.description).toBe('Handles payments');
  });

  it('should have a paths object with at least one operation', () => {
    const result = generateStubSpec({
      name: 'Test API',
      version: '1.0.0',
      endpoint: 'https://api.test.com',
    });

    const paths = Object.keys(result.paths);
    expect(paths.length).toBeGreaterThanOrEqual(1);

    // At least one path should have a GET operation
    const hasOperation = paths.some((path) => {
      const item = result.paths[path];
      return item.get || item.post || item.put || item.delete || item.patch;
    });
    expect(hasOperation).toBe(true);
  });

  it('should set endpoint as server URL', () => {
    const result = generateStubSpec({
      name: 'My API',
      version: '1.0.0',
      endpoint: 'https://api.myservice.com/v1',
    });

    expect(result.servers).toBeDefined();
    expect(result.servers).toHaveLength(1);
    expect(result.servers[0].url).toBe('https://api.myservice.com/v1');
  });

  it('should include a JSON response schema on the stub endpoint', () => {
    const result = generateStubSpec({
      name: 'My API',
      version: '1.0.0',
      endpoint: 'https://api.example.com',
    });

    const getOp = result.paths['/'].get;
    expect(getOp.responses).toBeDefined();
    expect(getOp.responses['200']).toBeDefined();
    expect(getOp.responses['200'].content?.['application/json']).toBeDefined();
  });

  it('should use safe defaults when description is omitted', () => {
    const result = generateStubSpec({
      name: 'Minimal',
      version: '0.1.0',
      endpoint: 'https://api.example.com',
    });

    // Should still have a valid info block
    expect(result.info.title).toBe('Minimal');
    expect(result.info.version).toBe('0.1.0');
    // Description should default to empty string or a sensible placeholder
    expect(typeof result.info.description).toBe('string');
  });

  it('should return a serializable object (no circular refs)', () => {
    const result = generateStubSpec({
      name: 'Serialization Test',
      version: '1.0.0',
      endpoint: 'https://api.example.com',
    });

    // Should not throw
    const json = JSON.stringify(result);
    expect(json).toBeTruthy();

    // Round-trip should preserve structure
    const parsed = JSON.parse(json);
    expect(parsed.openapi).toBe('3.1.0');
    expect(parsed.info.title).toBe('Serialization Test');
  });
});

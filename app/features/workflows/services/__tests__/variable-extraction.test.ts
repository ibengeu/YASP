import { describe, it, expect } from 'vitest';
import {
  extractVariables,
  validateJsonPath,
  previewExtraction,
} from '../variable-extraction';

describe('extractVariables', () => {
  it('should extract a simple top-level value', () => {
    const body = { access_token: 'abc123', expires_in: 3600 };
    const result = extractVariables(body, [
      { id: 'e1', name: 'token', jsonPath: '$.access_token' },
    ]);
    expect(result.extracted).toEqual({ token: 'abc123' });
    expect(result.errors).toEqual([]);
  });

  it('should extract nested values', () => {
    const body = { data: { user: { id: 42, email: 'test@test.com' } } };
    const result = extractVariables(body, [
      { id: 'e1', name: 'userId', jsonPath: '$.data.user.id' },
      { id: 'e2', name: 'email', jsonPath: '$.data.user.email' },
    ]);
    expect(result.extracted).toEqual({ userId: 42, email: 'test@test.com' });
  });

  it('should extract array element', () => {
    const body = { items: [{ id: 1 }, { id: 2 }] };
    const result = extractVariables(body, [
      { id: 'e1', name: 'firstId', jsonPath: '$.items[0].id' },
    ]);
    expect(result.extracted).toEqual({ firstId: 1 });
  });

  it('should report error for missing path', () => {
    const body = { foo: 'bar' };
    const result = extractVariables(body, [
      { id: 'e1', name: 'missing', jsonPath: '$.nonexistent.path' },
    ]);
    expect(result.extracted).toEqual({});
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('missing');
  });

  it('should handle non-object response body gracefully', () => {
    const result = extractVariables('plain text response', [
      { id: 'e1', name: 'val', jsonPath: '$.foo' },
    ]);
    expect(result.extracted).toEqual({});
    expect(result.errors).toHaveLength(1);
  });

  it('should handle empty extractions list', () => {
    const result = extractVariables({ foo: 'bar' }, []);
    expect(result.extracted).toEqual({});
    expect(result.errors).toEqual([]);
  });
});

describe('validateJsonPath', () => {
  it('should accept valid JSONPath expressions', () => {
    expect(validateJsonPath('$.foo')).toEqual({ valid: true });
    expect(validateJsonPath('$.data.items[0].id')).toEqual({ valid: true });
    expect(validateJsonPath('$..name')).toEqual({ valid: true });
  });

  it('should reject empty expression', () => {
    const result = validateJsonPath('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should reject expression exceeding max length', () => {
    const longPath = '$.' + 'a'.repeat(500);
    const result = validateJsonPath(longPath);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('500');
  });
});

describe('previewExtraction', () => {
  it('should return extracted value', () => {
    const result = previewExtraction({ token: 'abc' }, '$.token');
    expect(result.value).toBe('abc');
    expect(result.error).toBeUndefined();
  });

  it('should return error for invalid path', () => {
    const result = previewExtraction({ token: 'abc' }, '$.missing');
    expect(result.error).toBeTruthy();
  });
});

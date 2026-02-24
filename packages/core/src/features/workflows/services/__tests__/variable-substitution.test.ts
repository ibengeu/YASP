import { describe, it, expect } from 'vitest';
import {
  substituteVariables,
  extractVariableReferences,
  validateVariableReferences,
} from '../variable-substitution';

describe('substituteVariables', () => {
  it('should replace a single variable', () => {
    expect(substituteVariables('Bearer {{token}}', { token: 'abc123' }, 'header'))
      .toBe('Bearer abc123');
  });

  it('should replace multiple variables', () => {
    expect(substituteVariables('{{base}}/users/{{id}}', { base: 'https://api.example.com', id: '42' }, 'body'))
      .toBe('https://api.example.com/users/42');
  });

  it('should leave unresolved variables as-is', () => {
    expect(substituteVariables('{{known}}/{{unknown}}', { known: 'val' }, 'body'))
      .toBe('val/{{unknown}}');
  });

  it('should URL-encode values in url context', () => {
    // Mitigation for OWASP A07:2025 – Injection: URL encoding prevents injection
    expect(substituteVariables('/search?q={{query}}', { query: 'hello world&foo=bar' }, 'url'))
      .toBe('/search?q=hello%20world%26foo%3Dbar');
  });

  it('should URL-encode values in query context', () => {
    expect(substituteVariables('{{value}}', { value: 'a=b&c=d' }, 'query'))
      .toBe('a%3Db%26c%3Dd');
  });

  it('should strip newlines in header context', () => {
    // Mitigation for OWASP A07:2025 – Injection: header injection prevention
    expect(substituteVariables('{{token}}', { token: 'abc\r\nX-Injected: true' }, 'header'))
      .toBe('abcX-Injected: true');
  });

  it('should insert raw values in body context', () => {
    expect(substituteVariables('{"token": "{{token}}"}', { token: 'abc123' }, 'body'))
      .toBe('{"token": "abc123"}');
  });

  it('should coerce numbers to strings in body context', () => {
    expect(substituteVariables('{{count}}', { count: 42 }, 'body'))
      .toBe('42');
  });

  it('should handle empty template', () => {
    expect(substituteVariables('', { token: 'abc' }, 'body')).toBe('');
  });

  it('should handle template with no variables', () => {
    expect(substituteVariables('just plain text', { token: 'abc' }, 'body'))
      .toBe('just plain text');
  });
});

describe('extractVariableReferences', () => {
  it('should extract variable names from template', () => {
    expect(extractVariableReferences('{{token}} and {{userId}}')).toEqual(['token', 'userId']);
  });

  it('should return empty array for no variables', () => {
    expect(extractVariableReferences('no variables here')).toEqual([]);
  });

  it('should handle duplicate references', () => {
    expect(extractVariableReferences('{{a}} {{a}}')).toEqual(['a']);
  });
});

describe('validateVariableReferences', () => {
  it('should return empty array when all variables are in scope', () => {
    expect(validateVariableReferences('{{token}}', ['token', 'userId'])).toEqual([]);
  });

  it('should return missing variable names', () => {
    expect(validateVariableReferences('{{token}} {{missing}}', ['token'])).toEqual(['missing']);
  });

  it('should return empty for no references', () => {
    expect(validateVariableReferences('no vars', [])).toEqual([]);
  });
});

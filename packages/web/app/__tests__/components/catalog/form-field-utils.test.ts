/**
 * Tests for form field utilities: type inference, normalization, extraction
 */

import { describe, it, expect } from 'vitest';
import {
  inferInputType,
  normalizeSchema,
  extractFormFields,
} from '@yasp/core/components/api-details/utils';
import type { FormField } from '@yasp/core/components/api-details/types';

describe('inferInputType — type inference from field name + schema', () => {
  describe('schema format takes priority', () => {
    it('returns file for binary format', () => {
      expect(inferInputType('fieldName', { type: 'string', format: 'binary' })).toBe('file');
    });

    it('returns file for base64 format', () => {
      expect(inferInputType('fieldName', { type: 'string', format: 'base64' })).toBe('file');
    });

    it('returns email for email format', () => {
      expect(inferInputType('fieldName', { type: 'string', format: 'email' })).toBe('email');
    });

    it('returns tel for phone format', () => {
      expect(inferInputType('fieldName', { type: 'string', format: 'phone' })).toBe('tel');
    });

    it('returns url for uri format', () => {
      expect(inferInputType('fieldName', { type: 'string', format: 'uri' })).toBe('url');
    });

    it('returns url for url format', () => {
      expect(inferInputType('fieldName', { type: 'string', format: 'url' })).toBe('url');
    });
  });

  describe('schema type inference', () => {
    it('returns checkbox for boolean type', () => {
      expect(inferInputType('fieldName', { type: 'boolean' })).toBe('checkbox');
    });

    it('returns number for number type', () => {
      expect(inferInputType('fieldName', { type: 'number' })).toBe('number');
    });

    it('returns number for integer type', () => {
      expect(inferInputType('fieldName', { type: 'integer' })).toBe('number');
    });

    it('returns text for string type (default)', () => {
      expect(inferInputType('fieldName', { type: 'string' })).toBe('text');
    });
  });

  describe('name-based heuristics (fallback)', () => {
    it('detects file uploads from field name', () => {
      expect(inferInputType('fileUpload', {})).toBe('file');
      expect(inferInputType('upload', {})).toBe('file');
      expect(inferInputType('attachment', {})).toBe('file');
      expect(inferInputType('image', {})).toBe('file');
      expect(inferInputType('document', {})).toBe('file');
    });

    it('detects email from field name', () => {
      expect(inferInputType('email', {})).toBe('email');
      expect(inferInputType('emailAddress', {})).toBe('email');
      expect(inferInputType('user_email', {})).toBe('email');
    });

    it('detects phone from field name', () => {
      expect(inferInputType('phone', {})).toBe('tel');
      expect(inferInputType('phoneNumber', {})).toBe('tel');
      expect(inferInputType('tel', {})).toBe('tel');
    });

    it('detects URL from field name', () => {
      expect(inferInputType('url', {})).toBe('url');
      expect(inferInputType('website', {})).toBe('url');
      expect(inferInputType('link', {})).toBe('url');
    });

    it('detects number from field name', () => {
      expect(inferInputType('count', {})).toBe('number');
      expect(inferInputType('quantity', {})).toBe('number');
      expect(inferInputType('amount', {})).toBe('number');
    });

    it('detects boolean from field name', () => {
      expect(inferInputType('isActive', {})).toBe('checkbox');
      expect(inferInputType('isPublic', {})).toBe('checkbox');
      expect(inferInputType('hasPermission', {})).toBe('checkbox');
      expect(inferInputType('shouldNotify', {})).toBe('checkbox');
      expect(inferInputType('enabled', {})).toBe('checkbox');
    });
  });

  describe('edge cases', () => {
    it('handles null/undefined schema property', () => {
      expect(inferInputType('fieldName', null)).toBe('text');
      expect(inferInputType('fieldName', undefined)).toBe('text');
    });

    it('handles empty key name', () => {
      expect(inferInputType('', {})).toBe('text');
      expect(inferInputType('', { type: 'string' })).toBe('text');
    });

    it('handles unknown type', () => {
      expect(inferInputType('fieldName', { type: 'unknown' })).toBe('text');
    });
  });
});

describe('normalizeSchema — schema edge case handling', () => {
  it('returns empty properties for null schema', () => {
    expect(normalizeSchema(null)).toEqual({ properties: {} });
  });

  it('returns empty properties for undefined schema', () => {
    expect(normalizeSchema(undefined)).toEqual({ properties: {} });
  });

  it('preserves properly structured schema', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    };
    const result = normalizeSchema(schema);
    // normalizeSchema returns {properties: {...}}, extracting the properties object
    expect(result.properties).toEqual(schema.properties);
  });

  it('treats loose object with property hints as properties', () => {
    const looseSchema = {
      name: { type: 'string' },
      age: { type: 'number' },
    };
    expect(normalizeSchema(looseSchema)).toEqual({ properties: looseSchema });
  });

  it('handles schema with type but no properties', () => {
    const schema = { type: 'object' };
    expect(normalizeSchema(schema)).toEqual({ properties: {} });
  });

  it('wraps non-standard schema as properties', () => {
    const schema = { description: 'not a standard schema' };
    expect(normalizeSchema(schema)).toEqual({ properties: { value: { description: 'not a standard schema' } } });
  });
});

describe('extractFormFields — full extraction workflow', () => {
  it('extracts fields from OpenAPI 3.x form-data', () => {
    const endpoint = {
      operation: {
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  description: { type: 'string', example: 'My file' },
                },
              },
            },
          },
        },
      },
    };

    const fields = extractFormFields(endpoint);

    expect(fields).toHaveLength(2);
    expect(fields[0]).toMatchObject({
      key: 'file',
      type: 'file',
      value: '',
    });
    expect(fields[1]).toMatchObject({
      key: 'description',
      type: 'text',
      value: 'My file',
    });
  });

  it('extracts fields from OpenAPI 3.x form-urlencoded', () => {
    const endpoint = {
      operation: {
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                properties: {
                  username: { type: 'string', example: 'john' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
      },
    };

    const fields = extractFormFields(endpoint);

    expect(fields).toHaveLength(2);
    expect(fields[0]).toMatchObject({
      key: 'username',
      type: 'text',
      value: 'john',
    });
    expect(fields[1]).toMatchObject({
      key: 'password',
      type: 'text',
      value: '',
    });
  });

  it('extracts fields from Swagger 2.0 form parameter', () => {
    const endpoint = {
      operation: {
        parameters: [
          {
            in: 'body',
            schema: {
              properties: {
                isPublic: { type: 'boolean', example: true },
                tags: { type: 'string' },
              },
            },
          },
        ],
        consumes: ['application/x-www-form-urlencoded'],
      },
    };

    const fields = extractFormFields(endpoint as any);

    expect(fields).toHaveLength(2);
    expect(fields[0]).toMatchObject({
      key: 'isPublic',
      type: 'checkbox',
      value: 'true',
    });
    expect(fields[1]).toMatchObject({
      key: 'tags',
      type: 'text',
      value: '',
    });
  });

  it('handles schema with no properties', () => {
    const endpoint = {
      operation: {
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: { type: 'object' },
            },
          },
        },
      },
    };

    const fields = extractFormFields(endpoint);
    expect(fields).toEqual([]);
  });

  it('handles endpoint with no requestBody', () => {
    const endpoint = {
      operation: {
        responses: {},
      },
    };

    const fields = extractFormFields(endpoint);
    expect(fields).toEqual([]);
  });

  it('renders all field types in single form', () => {
    // Complex schema with all supported types
    const endpoint = {
      operation: {
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                properties: {
                  fileUpload: { type: 'string', format: 'binary' },
                  description: { type: 'string', example: 'My file' },
                  isPublic: { type: 'boolean' },
                  email: { type: 'string', format: 'email' },
                  count: { type: 'number', example: 5 },
                },
              },
            },
          },
        },
      },
    };

    const fields = extractFormFields(endpoint);

    expect(fields).toHaveLength(5);
    expect(fields[0]).toMatchObject({ key: 'fileUpload', type: 'file' });
    expect(fields[1]).toMatchObject({ key: 'description', type: 'text' });
    expect(fields[2]).toMatchObject({ key: 'isPublic', type: 'checkbox' });
    expect(fields[3]).toMatchObject({ key: 'email', type: 'email' });
    expect(fields[4]).toMatchObject({ key: 'count', type: 'number' });
  });

  it('never skips keys, even with missing schema properties', () => {
    const endpoint = {
      operation: {
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                properties: {
                  field1: {}, // Missing type, example, etc.
                  field2: { example: 'value' },
                  field3: { type: 'string' },
                },
              },
            },
          },
        },
      },
    };

    const fields = extractFormFields(endpoint);

    // All 3 fields should be extracted
    expect(fields).toHaveLength(3);
    expect(fields.map((f: FormField) => f.key)).toEqual(['field1', 'field2', 'field3']);
  });
});

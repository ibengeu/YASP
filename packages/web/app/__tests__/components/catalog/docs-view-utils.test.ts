/**
 * TDD: docs-view/utils.ts — parser upgrades
 */

import { describe, it, expect } from 'vitest';
import {
  parseEndpoints,
  groupByTag,
  extractDataModels,
  substituteServerVariables,
} from '@yasp/core/components/catalog/docs-view/utils';
import type { ParsedOpenAPISpec } from '@yasp/core/components/catalog/docs-view/types';

const BASE_SPEC: ParsedOpenAPISpec = {
  openapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
  paths: {},
};

describe('parseEndpoints — HTTP methods', () => {
  it('parses GET, POST, PUT, DELETE, PATCH', () => {
    const spec: ParsedOpenAPISpec = {
      ...BASE_SPEC,
      paths: {
        '/items': {
          get: { summary: 'List', responses: { '200': { description: 'ok' } } },
          post: { summary: 'Create', responses: { '201': { description: 'created' } } },
          put: { summary: 'Replace', responses: { '200': { description: 'ok' } } },
          delete: { summary: 'Delete', responses: { '204': { description: 'no content' } } },
          patch: { summary: 'Update', responses: { '200': { description: 'ok' } } },
        },
      },
    };
    const eps = parseEndpoints(spec);
    const methods = eps.map((e) => e.method);
    expect(methods).toContain('GET');
    expect(methods).toContain('POST');
    expect(methods).toContain('PUT');
    expect(methods).toContain('DELETE');
    expect(methods).toContain('PATCH');
  });

  it('parses OPTIONS method', () => {
    const spec: ParsedOpenAPISpec = {
      ...BASE_SPEC,
      paths: {
        '/items': {
          options: { summary: 'Preflight', responses: { '200': { description: 'ok' } } },
        },
      },
    };
    const eps = parseEndpoints(spec);
    expect(eps.map((e) => e.method)).toContain('OPTIONS');
  });

  it('parses HEAD method', () => {
    const spec: ParsedOpenAPISpec = {
      ...BASE_SPEC,
      paths: {
        '/items': {
          head: { summary: 'Check', responses: { '200': { description: 'ok' } } },
        },
      },
    };
    const eps = parseEndpoints(spec);
    expect(eps.map((e) => e.method)).toContain('HEAD');
  });

  it('parses TRACE method', () => {
    const spec: ParsedOpenAPISpec = {
      ...BASE_SPEC,
      paths: {
        '/items': {
          trace: { summary: 'Trace', responses: { '200': { description: 'ok' } } },
        },
      },
    };
    const eps = parseEndpoints(spec);
    expect(eps.map((e) => e.method)).toContain('TRACE');
  });
});

describe('parseEndpoints — path-level parameter merging', () => {
  it('merges path-level params with operation-level params', () => {
    const spec: ParsedOpenAPISpec = {
      ...BASE_SPEC,
      paths: {
        '/items/{id}': {
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          get: {
            summary: 'Get item',
            parameters: [{ name: 'format', in: 'query', schema: { type: 'string' } }],
            responses: { '200': { description: 'ok' } },
          },
        },
      },
    };
    const eps = parseEndpoints(spec);
    expect(eps).toHaveLength(1);
    const params = eps[0].operation.parameters as any[];
    const paramNames = params.map((p: any) => p.name);
    expect(paramNames).toContain('id');
    expect(paramNames).toContain('format');
  });

  it('operation-level params override path-level params with same name+in', () => {
    const spec: ParsedOpenAPISpec = {
      ...BASE_SPEC,
      paths: {
        '/items/{id}': {
          parameters: [{ name: 'id', in: 'path', required: true, description: 'path-level', schema: { type: 'string' } }],
          get: {
            summary: 'Get item',
            parameters: [{ name: 'id', in: 'path', required: true, description: 'op-level', schema: { type: 'integer' } }],
            responses: { '200': { description: 'ok' } },
          },
        },
      },
    };
    const eps = parseEndpoints(spec);
    const idParam = (eps[0].operation.parameters as any[]).find((p: any) => p.name === 'id');
    expect(idParam.description).toBe('op-level');
    expect(idParam.schema.type).toBe('integer');
  });
});

describe('extractDataModels', () => {
  it('returns empty array when no schemas', () => {
    expect(extractDataModels(BASE_SPEC)).toEqual([]);
  });

  it('returns SchemaEntry[] with name and schema', () => {
    const spec: ParsedOpenAPISpec = {
      ...BASE_SPEC,
      components: {
        schemas: {
          Pet: { type: 'object', properties: { id: { type: 'integer' } } },
          User: { type: 'object', properties: { name: { type: 'string' } } },
        },
      },
    };
    const models = extractDataModels(spec);
    expect(models).toHaveLength(2);
    const petEntry = models.find((m) => m.name === 'Pet');
    expect(petEntry).toBeDefined();
    expect(petEntry?.schema).toEqual({ type: 'object', properties: { id: { type: 'integer' } } });
    const userEntry = models.find((m) => m.name === 'User');
    expect(userEntry).toBeDefined();
    expect(userEntry?.schema.properties).toHaveProperty('name');
  });
});

describe('groupByTag', () => {
  it('adds count field to each group', () => {
    const spec: ParsedOpenAPISpec = {
      ...BASE_SPEC,
      paths: {
        '/a': { get: { summary: 'A1', tags: ['Alpha'], responses: {} } },
        '/b': { get: { summary: 'A2', tags: ['Alpha'], responses: {} } },
        '/c': { get: { summary: 'B1', tags: ['Beta'], responses: {} } },
      },
    };
    const eps = parseEndpoints(spec);
    const groups = groupByTag(eps);
    const alpha = groups.find((g) => g.tag === 'Alpha');
    const beta = groups.find((g) => g.tag === 'Beta');
    expect(alpha?.count).toBe(2);
    expect(beta?.count).toBe(1);
  });
});

describe('substituteServerVariables', () => {
  it('replaces {var} with default value', () => {
    const url = 'https://{env}.api.example.com/{version}';
    const variables = {
      env: { default: 'production' },
      version: { default: 'v2' },
    };
    expect(substituteServerVariables(url, variables)).toBe('https://production.api.example.com/v2');
  });

  it('leaves unmatched placeholders intact', () => {
    const url = 'https://{env}.api.example.com/{unknown}';
    const variables = { env: { default: 'staging' } };
    expect(substituteServerVariables(url, variables)).toBe('https://staging.api.example.com/{unknown}');
  });

  it('returns url unchanged when no variables', () => {
    const url = 'https://api.example.com';
    expect(substituteServerVariables(url, {})).toBe('https://api.example.com');
  });
});

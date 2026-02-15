import { describe, it, expect } from 'vitest';
import { exportWorkflow, importWorkflow } from '../workflow-io';
import type { WorkflowDocument } from '../../types/workflow.types';

const sampleWorkflow: WorkflowDocument = {
  id: 'wf-123',
  name: 'Test Workflow',
  description: 'A test workflow',
  serverUrl: 'https://api.example.com',
  steps: [
    {
      id: 's1',
      order: 0,
      name: 'Get Token',
      request: {
        method: 'POST',
        path: '/auth/token',
        headers: { 'Content-Type': 'application/json' },
        queryParams: {},
        body: '{"user":"admin"}',
        serverUrl: 'https://auth.example.com',
      },
      extractions: [{ id: 'e1', name: 'token', jsonPath: '$.access_token' }],
      specEndpoint: { specId: 'spec-1', path: '/auth/token', method: 'post' },
    },
    {
      id: 's2',
      order: 1,
      name: 'Get Users',
      request: {
        method: 'GET',
        path: '/users',
        headers: { Authorization: 'Bearer {{token}}' },
        queryParams: {},
      },
      extractions: [],
      specEndpoint: { specId: 'spec-2', path: '/users', method: 'get' },
    },
  ],
  sharedAuth: { type: 'bearer', token: 'shared-token' },
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-06-01T00:00:00.000Z',
};

describe('exportWorkflow', () => {
  it('should produce valid JSON without IDB-only fields', () => {
    const json = exportWorkflow(sampleWorkflow);
    const parsed = JSON.parse(json);

    expect(parsed.id).toBeUndefined();
    expect(parsed.created_at).toBeUndefined();
    expect(parsed.updated_at).toBeUndefined();
    expect(parsed.name).toBe('Test Workflow');
    expect(parsed.steps).toHaveLength(2);
    expect(parsed.serverUrl).toBe('https://api.example.com');
  });

  it('should preserve step data including specEndpoint and serverUrl', () => {
    const json = exportWorkflow(sampleWorkflow);
    const parsed = JSON.parse(json);

    expect(parsed.steps[0].specEndpoint.specId).toBe('spec-1');
    expect(parsed.steps[0].request.serverUrl).toBe('https://auth.example.com');
    expect(parsed.steps[1].specEndpoint.specId).toBe('spec-2');
  });
});

describe('importWorkflow', () => {
  it('should reject invalid JSON', () => {
    expect(() => importWorkflow('not valid json')).toThrow('Invalid JSON');
  });

  it('should reject missing required fields', () => {
    expect(() => importWorkflow(JSON.stringify({ name: 'no steps' }))).toThrow();
    expect(() => importWorkflow(JSON.stringify({ steps: [] }))).toThrow();
    expect(() => importWorkflow(JSON.stringify({ name: 'x', steps: [], serverUrl: '' }))).toThrow();
  });

  it('should reject non-array steps', () => {
    expect(() =>
      importWorkflow(JSON.stringify({ name: 'x', steps: 'not-array', serverUrl: 'http://x.com' }))
    ).toThrow();
  });

  // Mitigation for OWASP A07:2025 – Injection: reject unexpected/malicious fields
  it('should strip unexpected top-level fields', () => {
    const input = {
      name: 'Clean Workflow',
      steps: [],
      serverUrl: 'https://api.example.com',
      __proto__: { admin: true },
      maliciousField: '<script>alert(1)</script>',
    };
    const result = importWorkflow(JSON.stringify(input));
    expect((result as any).maliciousField).toBeUndefined();
    expect((result as any).__proto__?.admin).toBeUndefined();
  });

  it('should round-trip preserving data', () => {
    const json = exportWorkflow(sampleWorkflow);
    const imported = importWorkflow(json);

    expect(imported.name).toBe(sampleWorkflow.name);
    expect(imported.description).toBe(sampleWorkflow.description);
    expect(imported.serverUrl).toBe(sampleWorkflow.serverUrl);
    expect(imported.steps).toHaveLength(sampleWorkflow.steps.length);
    expect(imported.steps[0].name).toBe(sampleWorkflow.steps[0].name);
    expect(imported.steps[0].request.serverUrl).toBe('https://auth.example.com');
    expect(imported.steps[0].specEndpoint?.specId).toBe('spec-1');
    expect(imported.sharedAuth).toEqual(sampleWorkflow.sharedAuth);
  });

  it('should accept workflow with empty steps array', () => {
    const input = { name: 'Empty', steps: [], serverUrl: 'https://api.example.com' };
    const result = importWorkflow(JSON.stringify(input));
    expect(result.name).toBe('Empty');
    expect(result.steps).toEqual([]);
  });
});

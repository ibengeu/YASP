import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowEngine } from '../workflow-engine';
import type { WorkflowDocument } from '../../types/workflow.types';

// Mock fetch for the engine's requests to /api/execute-request
const mockFetch = vi.fn();
global.fetch = mockFetch;

function createWorkflow(overrides: Partial<WorkflowDocument> = {}): WorkflowDocument {
  return {
    id: 'wf-1',
    name: 'Test Workflow',
    serverUrl: 'https://api.example.com',
    steps: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
    mockFetch.mockReset();
  });

  it('should execute a 2-step chain with variable passing', async () => {
    const workflow = createWorkflow({
      steps: [
        {
          id: 's1', order: 0, name: 'Auth',
          request: { method: 'POST', path: '/auth/token', headers: { 'Content-Type': 'application/json' }, queryParams: {}, body: '{"username":"admin"}' },
          extractions: [{ id: 'e1', name: 'token', jsonPath: '$.access_token' }],
        },
        {
          id: 's2', order: 1, name: 'Get Users',
          request: { method: 'GET', path: '/users', headers: { 'Authorization': 'Bearer {{token}}' }, queryParams: {} },
          extractions: [],
        },
      ],
    });

    // Mock step 1 response
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: { status: 200, statusText: 'OK', headers: {}, body: { access_token: 'jwt123' }, time: 100, size: 0.5 } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
    // Mock step 2 response
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: { status: 200, statusText: 'OK', headers: {}, body: [{ id: 1 }], time: 80, size: 0.3 } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const onStepComplete = vi.fn();
    const result = await engine.execute(workflow, { onStepComplete });

    expect(result.status).toBe('completed');
    expect(result.results).toHaveLength(2);
    expect(result.variables.token).toBe('jwt123');
    expect(onStepComplete).toHaveBeenCalledTimes(2);

    // Verify step 2 used the extracted token in its Authorization header
    const step2Call = mockFetch.mock.calls[1];
    const step2Body = JSON.parse(step2Call[1].body);
    expect(step2Body.headers['Authorization']).toBe('Bearer jwt123');
  });

  it('should halt execution on step failure', async () => {
    const workflow = createWorkflow({
      steps: [
        {
          id: 's1', order: 0, name: 'Fail Step',
          request: { method: 'GET', path: '/fail', headers: {}, queryParams: {} },
          extractions: [],
        },
        {
          id: 's2', order: 1, name: 'Never Reached',
          request: { method: 'GET', path: '/ok', headers: {}, queryParams: {} },
          extractions: [],
        },
      ],
    });

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, error: 'Server error' }), { status: 400 })
    );

    const result = await engine.execute(workflow);

    expect(result.status).toBe('failed');
    expect(result.results).toHaveLength(2);
    expect(result.results[0].status).toBe('failure');
    expect(result.results[1].status).toBe('skipped');
  });

  it('should handle abort mid-run', async () => {
    const workflow = createWorkflow({
      steps: [
        {
          id: 's1', order: 0, name: 'Slow Step',
          request: { method: 'GET', path: '/slow', headers: {}, queryParams: {} },
          extractions: [],
        },
        {
          id: 's2', order: 1, name: 'After Slow',
          request: { method: 'GET', path: '/after', headers: {}, queryParams: {} },
          extractions: [],
        },
      ],
    });

    // First step takes a while; abort during it
    mockFetch.mockImplementationOnce(() => {
      engine.abort();
      return Promise.resolve(
        new Response(JSON.stringify({ success: true, data: { status: 200, statusText: 'OK', headers: {}, body: {}, time: 100, size: 0 } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );
    });

    const result = await engine.execute(workflow);
    expect(result.status).toBe('aborted');
  });

  it('should handle empty workflow', async () => {
    const workflow = createWorkflow({ steps: [] });
    const result = await engine.execute(workflow);
    expect(result.status).toBe('completed');
    expect(result.results).toEqual([]);
  });

  it('should use shared auth when step has no auth', async () => {
    const workflow = createWorkflow({
      sharedAuth: { type: 'bearer', token: 'shared-token' },
      steps: [
        {
          id: 's1', order: 0, name: 'Step with shared auth',
          request: { method: 'GET', path: '/resource', headers: {}, queryParams: {} },
          extractions: [],
        },
      ],
    });

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: { status: 200, statusText: 'OK', headers: {}, body: {}, time: 50, size: 0 } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    await engine.execute(workflow);

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.auth).toEqual({ type: 'bearer', token: 'shared-token' });
  });

  it('should use per-step serverUrl when provided, falling back to workflow serverUrl', async () => {
    const workflow = createWorkflow({
      serverUrl: 'https://default.example.com',
      steps: [
        {
          id: 's1', order: 0, name: 'Step with custom server',
          request: {
            method: 'GET', path: '/resource', headers: {}, queryParams: {},
            serverUrl: 'https://custom.example.com',
          },
          extractions: [],
        },
        {
          id: 's2', order: 1, name: 'Step with default server',
          request: { method: 'GET', path: '/other', headers: {}, queryParams: {} },
          extractions: [],
        },
      ],
    });

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: { status: 200, statusText: 'OK', headers: {}, body: {}, time: 50, size: 0 } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: { status: 200, statusText: 'OK', headers: {}, body: {}, time: 50, size: 0 } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    await engine.execute(workflow);

    // Step 1 should use custom server URL
    const step1Body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(step1Body.url).toBe('https://custom.example.com/resource');

    // Step 2 should fall back to workflow server URL
    const step2Body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(step2Body.url).toBe('https://default.example.com/other');
  });
});

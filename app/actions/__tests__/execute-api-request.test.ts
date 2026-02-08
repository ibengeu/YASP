import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeApiRequest } from '../execute-api-request';

describe('executeApiRequest', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should make successful GET request', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('content-type', 'application/json');
    mockHeaders.set('x-request-id', 'test-123');

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: mockHeaders,
      json: async () => ({ data: 'test' }),
    });

    const result = await executeApiRequest({
      method: 'GET',
      url: 'https://api.example.com/test',
      headers: {},
    });

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ data: 'test' });
    expect(result.headers['content-type']).toBe('application/json');
  });

  it('should reject SSRF attempts - localhost', async () => {
    await expect(executeApiRequest({
      method: 'GET',
      url: 'http://localhost:8080/admin',
      headers: {},
    })).rejects.toThrow(/Hostname blocked/);
  });

  it('should reject SSRF attempts - private IP', async () => {
    await expect(executeApiRequest({
      method: 'GET',
      url: 'http://192.168.1.1/admin',
      headers: {},
    })).rejects.toThrow(/private\/internal range/);
  });

  it('should add Bearer auth header', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('content-type', 'application/json');

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: mockHeaders,
      json: async () => ({}),
    });

    await executeApiRequest({
      method: 'GET',
      url: 'https://api.example.com/test',
      headers: {},
      auth: { type: 'bearer', token: 'secret-token' },
    });

    const fetchCall = (global.fetch as any).mock.calls[0];
    const headers = fetchCall[1].headers;
    expect(headers.get('Authorization')).toBe('Bearer secret-token');
  });

  it('should add API key header', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('content-type', 'application/json');

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: mockHeaders,
      json: async () => ({}),
    });

    await executeApiRequest({
      method: 'GET',
      url: 'https://api.example.com/test',
      headers: {},
      auth: { type: 'api-key', apiKey: 'my-api-key' },
    });

    const fetchCall = (global.fetch as any).mock.calls[0];
    const headers = fetchCall[1].headers;
    expect(headers.get('X-API-Key')).toBe('my-api-key');
  });

  it('should add Basic auth header', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('content-type', 'application/json');

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: mockHeaders,
      json: async () => ({}),
    });

    await executeApiRequest({
      method: 'GET',
      url: 'https://api.example.com/test',
      headers: {},
      auth: { type: 'basic', username: 'user', password: 'pass' },
    });

    const fetchCall = (global.fetch as any).mock.calls[0];
    const headers = fetchCall[1].headers;
    const expectedAuth = 'Basic ' + btoa('user:pass');
    expect(headers.get('Authorization')).toBe(expectedAuth);
  });

  it('should handle POST with body', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('content-type', 'application/json');

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 201,
      statusText: 'Created',
      headers: mockHeaders,
      json: async () => ({ id: 123 }),
    });

    const result = await executeApiRequest({
      method: 'POST',
      url: 'https://api.example.com/create',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });

    expect(result.status).toBe(201);
    expect(result.body).toEqual({ id: 123 });

    const fetchCall = (global.fetch as any).mock.calls[0];
    expect(fetchCall[1].body).toBe(JSON.stringify({ name: 'Test' }));
  });

  it('should handle text responses', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('content-type', 'text/plain');

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: mockHeaders,
      text: async () => 'Plain text response',
    });

    const result = await executeApiRequest({
      method: 'GET',
      url: 'https://api.example.com/text',
      headers: {},
    });

    expect(result.body).toBe('Plain text response');
  });

  it('should handle timeout', async () => {
    // Mock AbortSignal.timeout if not available (older Node versions)
    if (!AbortSignal.timeout) {
      (AbortSignal as any).timeout = (ms: number) => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), ms);
        return controller.signal;
      };
    }

    (global.fetch as any).mockRejectedValue(
      Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
    );

    await expect(executeApiRequest({
      method: 'GET',
      url: 'https://api.example.com/slow',
      headers: {},
    })).rejects.toThrow('Request timeout');
  });

  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network failure'));

    await expect(executeApiRequest({
      method: 'GET',
      url: 'https://api.example.com/test',
      headers: {},
    })).rejects.toThrow('Network failure');
  });

  it('should handle HTTP error responses', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('content-type', 'application/json');

    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: mockHeaders,
      json: async () => ({ error: 'Resource not found' }),
    });

    const result = await executeApiRequest({
      method: 'GET',
      url: 'https://api.example.com/missing',
      headers: {},
    });

    expect(result.status).toBe(404);
    expect(result.statusText).toBe('Not Found');
    expect(result.body).toEqual({ error: 'Resource not found' });
  });

  it('should parse application/problem+json as JSON (RFC 7807)', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('content-type', 'application/problem+json; charset=utf-8');

    const problemBody = {
      type: 'https://example.com/errors/not-found',
      title: 'Not Found',
      status: 404,
      detail: 'The requested resource was not found',
    };

    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: mockHeaders,
      json: async () => problemBody,
    });

    const result = await executeApiRequest({
      method: 'GET',
      url: 'https://api.example.com/missing',
      headers: {},
    });

    expect(result.status).toBe(404);
    expect(result.body).toEqual(problemBody);
    expect(result.body.title).toBe('Not Found');
  });

  it('should parse application/vnd.api+json as JSON (JSON:API)', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('content-type', 'application/vnd.api+json');

    const jsonApiBody = {
      errors: [{ status: '422', title: 'Invalid Attribute' }],
    };

    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: mockHeaders,
      json: async () => jsonApiBody,
    });

    const result = await executeApiRequest({
      method: 'GET',
      url: 'https://api.example.com/resource',
      headers: {},
    });

    expect(result.status).toBe(422);
    expect(result.body).toEqual(jsonApiBody);
  });

  it('should parse application/hal+json as JSON', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('content-type', 'application/hal+json');

    const halBody = {
      _links: { self: { href: '/orders' } },
      count: 5,
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: mockHeaders,
      json: async () => halBody,
    });

    const result = await executeApiRequest({
      method: 'GET',
      url: 'https://api.example.com/orders',
      headers: {},
    });

    expect(result.status).toBe(200);
    expect(result.body).toEqual(halBody);
  });
});

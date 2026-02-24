/**
 * TDD: /api/leads route — Zod schema validation
 * Security: OWASP A07:2025 (Injection) — strict schema parsing rejects malformed input
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { action } from '@/routes/api.leads';

// Mock submitLead to isolate route logic
vi.mock('@/actions/submit-lead', () => ({
  submitLead: vi.fn().mockResolvedValue({ success: true }),
}));

import { submitLead } from '@/actions/submit-lead';
const mockSubmitLead = vi.mocked(submitLead);

function makeRequest(body: unknown, method = 'POST'): Request {
  return new Request('http://localhost/api/leads', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSubmitLead.mockResolvedValue({ success: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/leads', () => {
  it('returns 200 with valid email and source', async () => {
    const res = await action({ request: makeRequest({ email: 'user@example.com', source: 'join_beta' }) });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSubmitLead).toHaveBeenCalledWith({ email: 'user@example.com', source: 'join_beta' });
  });

  it('returns 400 when email is missing', async () => {
    const res = await action({ request: makeRequest({ source: 'join_beta' }) });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(mockSubmitLead).not.toHaveBeenCalled();
  });

  it('returns 400 when email is not a string', async () => {
    const res = await action({ request: makeRequest({ email: 123, source: 'join_beta' }) });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(mockSubmitLead).not.toHaveBeenCalled();
  });

  it('returns 400 when email is empty string', async () => {
    const res = await action({ request: makeRequest({ email: '', source: 'join_beta' }) });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(mockSubmitLead).not.toHaveBeenCalled();
  });

  it('uses "unknown" when source is missing', async () => {
    const res = await action({ request: makeRequest({ email: 'user@example.com' }) });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSubmitLead).toHaveBeenCalledWith({ email: 'user@example.com', source: 'unknown' });
  });

  it('returns 405 for non-POST methods', async () => {
    const req = new Request('http://localhost/api/leads', { method: 'GET' });
    const res = await action({ request: req });
    expect(res.status).toBe(405);
  });

  it('returns 400 when submitLead fails', async () => {
    mockSubmitLead.mockResolvedValueOnce({ success: false, error: 'Invalid email address' });
    const res = await action({ request: makeRequest({ email: 'user@example.com', source: 'test' }) });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid email address');
  });
});

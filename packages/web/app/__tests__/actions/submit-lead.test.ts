/**
 * TDD: Submit Lead action — adds contact to Resend Contacts API
 * Security: OWASP A09:2025 (SSRF) — hardcoded Resend endpoint
 * Security: OWASP A02:2025 — API key from env, never exposed
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { submitLead } from '@/actions/submit-lead';

const mockFetch = vi.fn();
const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = mockFetch;
  vi.clearAllMocks();
  vi.stubEnv('RESEND_API_KEY', 'test_re_key_12345');
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.unstubAllEnvs();
});

describe('submitLead', () => {
  it('should POST to Resend Contacts API with correct payload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'contact_abc123' }),
    });

    const result = await submitLead({ email: 'user@test.com', source: 'join_beta' });

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.resend.com/contacts',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer test_re_key_12345',
        }),
        body: expect.stringContaining('"email"'),
      })
    );
  });

  it('should include email and unsubscribed=false in contact payload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'contact_abc123' }),
    });

    await submitLead({ email: 'user@test.com', source: 'join_beta' });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.email).toBe('user@test.com');
    expect(body.unsubscribed).toBe(false);
  });

  it('should reject invalid email', async () => {
    const result = await submitLead({ email: 'not-an-email', source: 'test' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid email');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle Resend API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
    });

    const result = await submitLead({ email: 'user@test.com', source: 'test' });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    const result = await submitLead({ email: 'user@test.com', source: 'test' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network failure');
  });

  it('should return error when RESEND_API_KEY is missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '');

    const result = await submitLead({ email: 'user@test.com', source: 'test' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not configured');
  });

  // OWASP A09:2025 — only hits hardcoded Resend contacts URL, never user-controlled
  it('should only call the hardcoded Resend Contacts API URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'contact_abc123' }),
    });

    await submitLead({ email: 'user@test.com', source: 'test' });

    const calledUrl = mockFetch.mock.calls[0]?.[0];
    expect(calledUrl).toBe('https://api.resend.com/contacts');
  });
});

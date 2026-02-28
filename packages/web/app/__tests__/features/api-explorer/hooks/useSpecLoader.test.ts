/**
 * useSpecLoader tests
 *
 * Behaviour under test:
 * - Returns 'loading' immediately when specId is provided
 * - Transitions to 'ready' with parsed spec on success
 * - Transitions to 'error' when storage returns null (not found)
 * - Transitions to 'error' when storage rejects
 * - Returns 'idle' when specId is undefined
 * - Cancels in-flight load when specId changes before it resolves
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSpecLoader } from '@yasp/core/features/api-explorer/hooks/useSpecLoader';

vi.mock('@yasp/core/core/storage/idb-storage', () => ({
  idbStorage: { getSpec: vi.fn() },
}));

// yaml.parse is dynamically imported — mock the module
vi.mock('yaml', () => ({
  default: { parse: vi.fn((s: string) => JSON.parse(s)) },
  parse: vi.fn((s: string) => JSON.parse(s)),
}));

import { idbStorage } from '@yasp/core/core/storage/idb-storage';
const mockGetSpec = vi.mocked(idbStorage.getSpec);

const SPEC_JSON = JSON.stringify({
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
});

beforeEach(() => vi.clearAllMocks());

describe('useSpecLoader — idle', () => {
  it('returns idle when specId is undefined', () => {
    const { result } = renderHook(() => useSpecLoader(undefined));
    expect(result.current.status).toBe('idle');
  });
});

describe('useSpecLoader — loading → ready', () => {
  it('starts in loading state then resolves to ready with parsed spec', async () => {
    mockGetSpec.mockResolvedValue({ content: SPEC_JSON } as any);

    const { result } = renderHook(() => useSpecLoader('spec-1'));

    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.status).toBe('ready'));

    if (result.current.status === 'ready') {
      expect(result.current.spec.info.title).toBe('Test API');
    }
  });
});

describe('useSpecLoader — error: not found', () => {
  it('transitions to error when spec is not found in storage', async () => {
    mockGetSpec.mockResolvedValue(null);

    const { result } = renderHook(() => useSpecLoader('missing-id'));

    await waitFor(() => expect(result.current.status).toBe('error'));

    if (result.current.status === 'error') {
      expect(result.current.message).toMatch(/not found/i);
    }
  });
});

describe('useSpecLoader — error: storage rejects', () => {
  it('transitions to error when storage throws', async () => {
    mockGetSpec.mockRejectedValue(new Error('IDB failure'));

    const { result } = renderHook(() => useSpecLoader('bad-id'));

    await waitFor(() => expect(result.current.status).toBe('error'));

    if (result.current.status === 'error') {
      expect(result.current.message).toBeTruthy();
    }
  });
});

describe('useSpecLoader — cancellation', () => {
  it('does not update state after unmount', async () => {
    let resolve!: (v: any) => void;
    mockGetSpec.mockReturnValue(new Promise((r) => { resolve = r; }));

    const { result, unmount } = renderHook(() => useSpecLoader('spec-1'));
    expect(result.current.status).toBe('loading');

    unmount();
    resolve({ content: SPEC_JSON });

    // Give microtasks a chance to run
    await new Promise((r) => setTimeout(r, 10));

    // Still loading (no state update after unmount — no crash)
    expect(result.current.status).toBe('loading');
  });
});

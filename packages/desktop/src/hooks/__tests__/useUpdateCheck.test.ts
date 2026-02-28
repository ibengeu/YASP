import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUpdateCheck } from '../useUpdateCheck';

const { mockCheck, mockDownloadAndInstall, mockRelaunch } = vi.hoisted(() => ({
  mockCheck: vi.fn(),
  mockDownloadAndInstall: vi.fn(),
  mockRelaunch: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-updater', () => ({ check: mockCheck }));
vi.mock('@tauri-apps/plugin-process', () => ({ relaunch: mockRelaunch }));

function makeUpdate(overrides: object = {}) {
  return {
    available: true,
    version: '2.0.0',
    body: 'Bug fixes',
    downloadAndInstall: mockDownloadAndInstall,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRelaunch.mockResolvedValue(undefined);
  mockDownloadAndInstall.mockResolvedValue(undefined);
});

describe('useUpdateCheck — update available', () => {
  it('opens the dialog and exposes the update when check returns available', async () => {
    mockCheck.mockResolvedValue(makeUpdate());

    const { result } = renderHook(() => useUpdateCheck());

    await waitFor(() => expect(result.current.open).toBe(true));
    expect(result.current.update?.version).toBe('2.0.0');
  });
});

describe('useUpdateCheck — no update', () => {
  it('keeps dialog closed when no update is available', async () => {
    mockCheck.mockResolvedValue({ available: false });

    const { result } = renderHook(() => useUpdateCheck());

    await waitFor(() => mockCheck.mock.calls.length > 0);
    expect(result.current.open).toBe(false);
    expect(result.current.update).toBeNull();
  });

  it('keeps dialog closed when check rejects (silent error)', async () => {
    mockCheck.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useUpdateCheck());

    await waitFor(() => mockCheck.mock.calls.length > 0);
    expect(result.current.open).toBe(false);
    expect(result.current.update).toBeNull();
  });
});

describe('useUpdateCheck — dismiss', () => {
  it('closes the dialog without installing', async () => {
    mockCheck.mockResolvedValue(makeUpdate());

    const { result } = renderHook(() => useUpdateCheck());
    await waitFor(() => expect(result.current.open).toBe(true));

    act(() => result.current.dismiss());

    expect(result.current.open).toBe(false);
    expect(mockDownloadAndInstall).not.toHaveBeenCalled();
  });
});

describe('useUpdateCheck — install', () => {
  it('sets isDownloading to true during install then relaunches', async () => {
    let resolveInstall!: () => void;
    mockDownloadAndInstall.mockReturnValue(
      new Promise<void>((res) => { resolveInstall = res; }),
    );
    mockCheck.mockResolvedValue(makeUpdate());

    const { result } = renderHook(() => useUpdateCheck());
    await waitFor(() => expect(result.current.open).toBe(true));

    let installPromise!: Promise<void>;
    act(() => { installPromise = result.current.install(); });

    await waitFor(() => expect(result.current.isDownloading).toBe(true));

    resolveInstall();
    await act(async () => { await installPromise; });

    expect(mockDownloadAndInstall).toHaveBeenCalledOnce();
    expect(mockRelaunch).toHaveBeenCalledOnce();
  });

  it('does nothing when update is null', async () => {
    mockCheck.mockResolvedValue({ available: false });

    const { result } = renderHook(() => useUpdateCheck());
    await waitFor(() => mockCheck.mock.calls.length > 0);

    await act(async () => { await result.current.install(); });

    expect(mockDownloadAndInstall).not.toHaveBeenCalled();
    expect(mockRelaunch).not.toHaveBeenCalled();
  });
});

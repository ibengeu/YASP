/**
 * useDirtyState tests
 *
 * Behaviour under test:
 * - hasChanges is false when title/content match saved values
 * - hasChanges is true after title is changed
 * - hasChanges is true after content changes (via editorStore)
 * - sync() resets hasChanges to false
 * - setTitle updates the title
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDirtyState } from '@yasp/core/features/editor/hooks/useDirtyState';

// EditorPage reads content from useEditorStore — mock it
vi.mock('@yasp/core/features/editor/store/editor.store', () => ({
  useEditorStore: vi.fn(),
}));

import { useEditorStore } from '@yasp/core/features/editor/store/editor.store';
const mockUseEditorStore = vi.mocked(useEditorStore);

function setupStore(content: string) {
  mockUseEditorStore.mockImplementation((selector: any) =>
    selector({ content, setContent: vi.fn() }),
  );
}

beforeEach(() => vi.clearAllMocks());

describe('useDirtyState — initial state', () => {
  it('hasChanges is false when title and content match saved values', () => {
    setupStore('original content');
    const { result } = renderHook(() =>
      useDirtyState({ title: 'My API', content: 'original content' }),
    );
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.title).toBe('My API');
  });
});

describe('useDirtyState — title changes', () => {
  it('hasChanges becomes true when title is modified', () => {
    setupStore('original content');
    const { result } = renderHook(() =>
      useDirtyState({ title: 'My API', content: 'original content' }),
    );

    act(() => result.current.setTitle('Renamed API'));

    expect(result.current.hasChanges).toBe(true);
    expect(result.current.title).toBe('Renamed API');
  });
});

describe('useDirtyState — content changes', () => {
  it('hasChanges becomes true when editor content diverges from saved content', () => {
    setupStore('modified content');
    const { result } = renderHook(() =>
      useDirtyState({ title: 'My API', content: 'original content' }),
    );
    expect(result.current.hasChanges).toBe(true);
  });
});

describe('useDirtyState — sync', () => {
  it('sync() resets hasChanges to false with new saved values', () => {
    setupStore('new content');
    const { result } = renderHook(() =>
      useDirtyState({ title: 'My API', content: 'original content' }),
    );
    expect(result.current.hasChanges).toBe(true);

    act(() => result.current.sync({ title: 'My API', content: 'new content' }));

    expect(result.current.hasChanges).toBe(false);
  });
});

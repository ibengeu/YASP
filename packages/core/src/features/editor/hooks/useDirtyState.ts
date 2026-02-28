/**
 * useDirtyState
 *
 * Tracks whether the editor has unsaved changes by comparing the live title
 * and editor-store content against the last-saved snapshot.
 *
 * Replaces three separate useState calls in EditorPage:
 *   title / originalTitle / originalContent  →  useDirtyState
 */

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/features/editor/store/editor.store';

interface SavedSnapshot {
  title: string;
  content: string;
}

export interface DirtyState {
  title: string;
  setTitle: (t: string) => void;
  hasChanges: boolean;
  /** Call after a successful save to reset the dirty baseline. */
  sync: (saved: SavedSnapshot) => void;
}

export function useDirtyState(initial: SavedSnapshot): DirtyState {
  const content = useEditorStore((s) => s.content);

  const [title, setTitleState] = useState(initial.title);
  const [savedSnapshot, setSavedSnapshot] = useState<SavedSnapshot>(initial);

  const hasChanges =
    title !== savedSnapshot.title || content !== savedSnapshot.content;

  const setTitle = useCallback((t: string) => setTitleState(t), []);

  const sync = useCallback((saved: SavedSnapshot) => {
    setSavedSnapshot(saved);
    setTitleState(saved.title);
  }, []);

  return { title, setTitle, hasChanges, sync };
}

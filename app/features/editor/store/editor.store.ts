/**
 * Editor Store
 * State management for Visual Designer feature
 *
 * Manages bidirectional sync between Monaco (code) and Tiptap (visual) editors
 * Implements undo/redo, cursor preservation, and position mapping
 */

import { create } from 'zustand';

export interface YAMLPosition {
  yamlPath: string[];
  line: number;
  column: number;
}

export interface EditorSnapshot {
  content: string;
  tiptapJSON: TiptapDocument | null;
  mode: 'visual' | 'code';
  timestamp: number;
}

export interface TiptapDocument {
  type: string;
  content?: any[];
  [key: string]: any;
}

interface EditorState {
  // Content state
  content: string;
  tiptapJSON: TiptapDocument | null;

  // Mode tracking
  mode: 'visual' | 'code';
  lastEditMode: 'visual' | 'code';
  lastEditTimestamp: number;

  // Position mapping for cursor preservation
  positionMap: Map<string, YAMLPosition>;

  // Sync state
  isSyncing: boolean;

  // Undo/Redo
  undoStack: EditorSnapshot[];
  redoStack: EditorSnapshot[];

  // Actions
  setContent: (content: string, mode: 'visual' | 'code') => void;
  setMode: (mode: 'visual' | 'code') => void;
  setTiptapJSON: (json: TiptapDocument | null) => void;
  updatePositionMap: (nodeId: string, position: YAMLPosition) => void;
  clearPositionMap: () => void;
  setSyncing: (syncing: boolean) => void;
  undo: () => void;
  redo: () => void;
}

const MAX_UNDO_STACK_SIZE = 50;

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  content: '',
  tiptapJSON: null,
  mode: 'code',
  lastEditMode: 'code',
  lastEditTimestamp: Date.now(),
  positionMap: new Map(),
  isSyncing: false,
  undoStack: [],
  redoStack: [],

  // Actions
  setContent: (content: string, mode: 'visual' | 'code') => {
    const state = get();

    // Create undo snapshot if content actually changed
    if (content !== state.content) {
      // Only create snapshot if current content is not empty (skip initial state)
      const shouldCreateSnapshot = state.content !== '';

      const newUndoStack = shouldCreateSnapshot
        ? [...state.undoStack, {
            content: state.content,
            tiptapJSON: state.tiptapJSON,
            mode: state.mode,
            timestamp: state.lastEditTimestamp,
          }].slice(-MAX_UNDO_STACK_SIZE)
        : state.undoStack;

      set({
        content,
        lastEditMode: mode,
        lastEditTimestamp: Date.now(),
        undoStack: newUndoStack,
        redoStack: [], // Clear redo stack on new edit
      });
    }
  },

  setMode: (mode: 'visual' | 'code') => {
    set({ mode });
  },

  setTiptapJSON: (json: TiptapDocument | null) => {
    set({ tiptapJSON: json });
  },

  updatePositionMap: (nodeId: string, position: YAMLPosition) => {
    const state = get();
    const newMap = new Map(state.positionMap);
    newMap.set(nodeId, position);
    set({ positionMap: newMap });
  },

  clearPositionMap: () => {
    set({ positionMap: new Map() });
  },

  setSyncing: (syncing: boolean) => {
    set({ isSyncing: syncing });
  },

  undo: () => {
    const state = get();

    if (state.undoStack.length === 0) {
      return; // Nothing to undo
    }

    // Pop from undo stack
    const newUndoStack = [...state.undoStack];
    const snapshot = newUndoStack.pop()!;

    // Push current state to redo stack
    const redoSnapshot: EditorSnapshot = {
      content: state.content,
      tiptapJSON: state.tiptapJSON,
      mode: state.mode,
      timestamp: state.lastEditTimestamp,
    };

    set({
      content: snapshot.content,
      tiptapJSON: snapshot.tiptapJSON,
      mode: snapshot.mode,
      lastEditTimestamp: snapshot.timestamp,
      undoStack: newUndoStack,
      redoStack: [...state.redoStack, redoSnapshot],
    });
  },

  redo: () => {
    const state = get();

    if (state.redoStack.length === 0) {
      return; // Nothing to redo
    }

    // Pop from redo stack
    const newRedoStack = [...state.redoStack];
    const snapshot = newRedoStack.pop()!;

    // Push current state to undo stack
    const undoSnapshot: EditorSnapshot = {
      content: state.content,
      tiptapJSON: state.tiptapJSON,
      mode: state.mode,
      timestamp: state.lastEditTimestamp,
    };

    set({
      content: snapshot.content,
      tiptapJSON: snapshot.tiptapJSON,
      mode: snapshot.mode,
      lastEditTimestamp: snapshot.timestamp,
      undoStack: [...state.undoStack, undoSnapshot],
      redoStack: newRedoStack,
    });
  },
}));

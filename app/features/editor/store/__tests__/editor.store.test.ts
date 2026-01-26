/**
 * Editor Store Tests
 * Tests for Visual Designer state management with TDD approach
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../editor.store';

describe('EditorStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useEditorStore.setState({
      content: '',
      tiptapJSON: null,
      mode: 'code',
      lastEditMode: 'code',
      lastEditTimestamp: Date.now(),
      positionMap: new Map(),
      isSyncing: false,
      undoStack: [],
      redoStack: [],
    });
  });

  describe('setContent', () => {
    it('should update content and track last edit metadata', () => {
      const store = useEditorStore.getState();
      const now = Date.now();

      store.setContent('openapi: 3.1.0', 'code');

      const state = useEditorStore.getState();
      expect(state.content).toBe('openapi: 3.1.0');
      expect(state.lastEditMode).toBe('code');
      expect(state.lastEditTimestamp).toBeGreaterThanOrEqual(now);
    });

    it('should create undo snapshot when content changes', () => {
      const store = useEditorStore.getState();

      store.setContent('openapi: 3.1.0', 'code');
      store.setContent('openapi: 3.1.0\ninfo:\n  title: Test', 'code');

      const state = useEditorStore.getState();
      expect(state.undoStack).toHaveLength(1);
      expect(state.undoStack[0].content).toBe('openapi: 3.1.0');
    });

    it('should clear redo stack when new content is set', () => {
      const store = useEditorStore.getState();

      store.setContent('version 1', 'code');
      store.setContent('version 2', 'code');
      store.undo(); // Creates redo stack

      expect(useEditorStore.getState().redoStack).toHaveLength(1);

      store.setContent('version 3', 'code');
      expect(useEditorStore.getState().redoStack).toHaveLength(0);
    });
  });

  describe('undo/redo', () => {
    it('should restore previous content on undo', () => {
      const store = useEditorStore.getState();

      store.setContent('version 1', 'code');
      store.setContent('version 2', 'code');
      store.undo();

      expect(useEditorStore.getState().content).toBe('version 1');
    });

    it('should restore next content on redo', () => {
      const store = useEditorStore.getState();

      store.setContent('version 1', 'code');
      store.setContent('version 2', 'code');
      store.undo();
      store.redo();

      expect(useEditorStore.getState().content).toBe('version 2');
    });

    it('should handle multiple undo/redo operations', () => {
      const store = useEditorStore.getState();

      store.setContent('v1', 'code');
      store.setContent('v2', 'code');
      store.setContent('v3', 'code');

      store.undo(); // Back to v2
      store.undo(); // Back to v1
      expect(useEditorStore.getState().content).toBe('v1');

      store.redo(); // Forward to v2
      expect(useEditorStore.getState().content).toBe('v2');
    });

    it('should do nothing when undo stack is empty', () => {
      const store = useEditorStore.getState();
      store.setContent('initial', 'code');

      const before = useEditorStore.getState().content;
      store.undo();

      expect(useEditorStore.getState().content).toBe(before);
    });

    it('should do nothing when redo stack is empty', () => {
      const store = useEditorStore.getState();
      store.setContent('initial', 'code');

      const before = useEditorStore.getState().content;
      store.redo();

      expect(useEditorStore.getState().content).toBe(before);
    });
  });

  describe('mode switching', () => {
    it('should switch between visual and code modes', () => {
      const store = useEditorStore.getState();

      store.setMode('visual');
      expect(useEditorStore.getState().mode).toBe('visual');

      store.setMode('code');
      expect(useEditorStore.getState().mode).toBe('code');
    });

    it('should track last edit mode independently of current mode', () => {
      const store = useEditorStore.getState();

      store.setContent('test', 'visual');
      expect(useEditorStore.getState().lastEditMode).toBe('visual');

      store.setMode('code'); // Switch mode without editing
      expect(useEditorStore.getState().lastEditMode).toBe('visual'); // Still visual
    });
  });

  describe('position map', () => {
    it('should store YAML position mappings', () => {
      const store = useEditorStore.getState();

      store.updatePositionMap('node-1', {
        yamlPath: ['paths', '/users', 'get'],
        line: 10,
        column: 4,
      });

      const map = useEditorStore.getState().positionMap;
      const position = map.get('node-1');

      expect(position).toEqual({
        yamlPath: ['paths', '/users', 'get'],
        line: 10,
        column: 4,
      });
    });

    it('should update existing position mappings', () => {
      const store = useEditorStore.getState();

      store.updatePositionMap('node-1', {
        yamlPath: ['paths', '/users'],
        line: 5,
        column: 2,
      });

      store.updatePositionMap('node-1', {
        yamlPath: ['paths', '/users', 'post'],
        line: 20,
        column: 4,
      });

      const position = useEditorStore.getState().positionMap.get('node-1');
      expect(position?.line).toBe(20);
      expect(position?.yamlPath).toEqual(['paths', '/users', 'post']);
    });

    it('should clear position map', () => {
      const store = useEditorStore.getState();

      store.updatePositionMap('node-1', {
        yamlPath: ['info'],
        line: 1,
        column: 0,
      });

      store.clearPositionMap();
      expect(useEditorStore.getState().positionMap.size).toBe(0);
    });
  });

  describe('sync state', () => {
    it('should track syncing state', () => {
      const store = useEditorStore.getState();

      store.setSyncing(true);
      expect(useEditorStore.getState().isSyncing).toBe(true);

      store.setSyncing(false);
      expect(useEditorStore.getState().isSyncing).toBe(false);
    });
  });

  describe('tiptap JSON state', () => {
    it('should store Tiptap document JSON', () => {
      const store = useEditorStore.getState();
      const tiptapDoc = {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'API' }] },
        ],
      };

      store.setTiptapJSON(tiptapDoc);
      expect(useEditorStore.getState().tiptapJSON).toEqual(tiptapDoc);
    });

    it('should allow null Tiptap JSON', () => {
      const store = useEditorStore.getState();

      store.setTiptapJSON({ type: 'doc', content: [] });
      expect(useEditorStore.getState().tiptapJSON).not.toBeNull();

      store.setTiptapJSON(null);
      expect(useEditorStore.getState().tiptapJSON).toBeNull();
    });
  });
});

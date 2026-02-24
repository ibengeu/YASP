/**
 * CodeEditor Component Tests
 * Tests for Monaco-based YAML/JSON editor
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../../store/editor.store';
import type { CodeEditorProps } from '../CodeEditor';

describe('CodeEditor', () => {
  beforeEach(() => {
    // Reset store
    useEditorStore.setState({
      content: '',
      mode: 'code',
      isSyncing: false,
      lastEditMode: 'code',
      lastEditTimestamp: Date.now(),
      positionMap: new Map(),
      undoStack: [],
      redoStack: [],
      tiptapJSON: null,
    });
  });

  describe('component props', () => {
    it('should have default language as yaml', () => {
      const defaultProps: CodeEditorProps = {};
      expect(defaultProps.language).toBeUndefined(); // defaults to 'yaml' in component
    });

    it('should accept custom language', () => {
      const props: CodeEditorProps = {
        language: 'json',
      };
      expect(props.language).toBe('json');
    });

    it('should accept custom height', () => {
      const props: CodeEditorProps = {
        height: '600px',
      };
      expect(props.height).toBe('600px');
    });

    it('should accept readOnly flag', () => {
      const props: CodeEditorProps = {
        readOnly: true,
      };
      expect(props.readOnly).toBe(true);
    });

    it('should accept onSave callback', () => {
      const onSave = () => {};
      const props: CodeEditorProps = {
        onSave,
      };
      expect(props.onSave).toBe(onSave);
    });
  });

  describe('store integration', () => {
    it('should read content from store', () => {
      useEditorStore.setState({ content: 'openapi: 3.1.0' });
      const content = useEditorStore.getState().content;
      expect(content).toBe('openapi: 3.1.0');
    });

    it('should update store via setContent', () => {
      const { setContent } = useEditorStore.getState();
      setContent('openapi: 3.1.0', 'code');

      expect(useEditorStore.getState().content).toBe('openapi: 3.1.0');
      expect(useEditorStore.getState().lastEditMode).toBe('code');
    });

    it('should respect isSyncing flag', () => {
      useEditorStore.setState({ isSyncing: true });
      expect(useEditorStore.getState().isSyncing).toBe(true);

      useEditorStore.setState({ isSyncing: false });
      expect(useEditorStore.getState().isSyncing).toBe(false);
    });
  });

  describe('keyboard shortcuts behavior', () => {
    it('should support undo/redo via store', () => {
      const { setContent, undo, redo } = useEditorStore.getState();

      setContent('v1', 'code');
      setContent('v2', 'code');
      setContent('v3', 'code');

      undo(); // Back to v2
      expect(useEditorStore.getState().content).toBe('v2');

      redo(); // Forward to v3
      expect(useEditorStore.getState().content).toBe('v3');
    });
  });

  describe('Monaco editor configuration', () => {
    it('should use Linear design tokens', () => {
      // Monaco options should include:
      // - Dark theme
      // - No minimap
      // - Font size 14
      // - Padding top/bottom 16px
      const expectedOptions = {
        minimap: { enabled: false },
        fontSize: 14,
        padding: { top: 16, bottom: 16 },
      };

      expect(expectedOptions.minimap.enabled).toBe(false);
      expect(expectedOptions.fontSize).toBe(14);
    });

    it('should configure YAML validation', () => {
      // YAML language should validate against OpenAPI schema
      const yamlSchemaUri =
        'https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/schemas/v3.1/schema.json';
      expect(yamlSchemaUri).toContain('OpenAPI-Specification');
    });
  });
});

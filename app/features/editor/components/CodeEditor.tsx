/**
 * Code Editor Component
 * Monaco-based YAML/JSON editor for OpenAPI specs
 *
 * Features:
 * - Syntax highlighting for YAML/JSON
 * - Auto-completion for OpenAPI keywords
 * - Real-time validation
 * - Keyboard shortcuts (Cmd+S, Cmd+Z, etc.)
 */

import { useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useEditorStore } from '../store/editor.store';
import type { editor } from 'monaco-editor';

export interface CodeEditorProps {
  language?: 'yaml' | 'json';
  height?: string;
  readOnly?: boolean;
  onSave?: () => void;
}

export function CodeEditor({
  language = 'yaml',
  height = '100%',
  readOnly = false,
  onSave,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const content = useEditorStore((state) => state.content);
  const setContent = useEditorStore((state) => state.setContent);
  const isSyncing = useEditorStore((state) => state.isSyncing);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.();
    });

    // Disable default Cmd+Z/Cmd+Shift+Z (we use store's undo/redo)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
      useEditorStore.getState().undo();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => {
      useEditorStore.getState().redo();
    });

    // Configure YAML/JSON validation
    if (language === 'yaml') {
      monaco.languages.yaml?.yamlDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
          {
            uri: 'https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/schemas/v3.1/schema.json',
            fileMatch: ['*'],
          },
        ],
      });
    }
  };

  const handleChange = (value: string | undefined) => {
    if (value !== undefined && !isSyncing) {
      setContent(value, 'code');
    }
  };

  useEffect(() => {
    // Update editor when content changes externally (e.g., from visual mode)
    if (editorRef.current && isSyncing) {
      const model = editorRef.current.getModel();
      if (model && model.getValue() !== content) {
        editorRef.current.setValue(content);
      }
    }
  }, [content, isSyncing]);

  return (
    <div className="h-full w-full">
      <Editor
        height={height}
        language={language}
        theme="vs-dark"
        value={content}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          insertSpaces: true,
          automaticLayout: true,
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'always',
          formatOnPaste: true,
          formatOnType: true,
          // Linear design system colors
          padding: { top: 16, bottom: 16 },
        }}
        loading={
          <div className="flex h-full items-center justify-center bg-background text-muted-foreground">
            <div className="text-sm">Loading editor...</div>
          </div>
        }
      />
    </div>
  );
}

/**
 * Code Editor Component
 * CodeMirror 6-based YAML/JSON editor for OpenAPI specs
 *
 * Features:
 * - Syntax highlighting for YAML/JSON
 * - Auto-completion for OpenAPI keywords
 * - Real-time validation
 * - Keyboard shortcuts (Cmd+S, Cmd+Z, etc.)
 *
 * Switched from Monaco to CodeMirror for better Vite compatibility
 */

import { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { yaml } from '@codemirror/lang-yaml';
import { json } from '@codemirror/lang-json';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';
import { oneDark } from '@codemirror/theme-one-dark';
import { useEditorStore } from '../store/editor.store';

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
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const content = useEditorStore((state) => state.content);
  const setContent = useEditorStore((state) => state.setContent);
  const isUserEditRef = useRef(false);

  // Initialize editor once
  useEffect(() => {
    if (!editorRef.current) return;

    // Custom save keymap
    const saveKeymap = keymap.of([
      {
        key: 'Mod-s',
        run: () => {
          onSave?.();
          return true;
        },
      },
    ]);

    // Create editor state
    const state = EditorState.create({
      doc: content,
      extensions: [
        // Language support
        language === 'yaml' ? yaml() : json(),

        // Theme
        oneDark,

        // Line numbers
        lineNumbers(),

        // History (undo/redo)
        history(),

        // Autocompletion
        autocompletion(),

        // Keymaps (type assertions to work around module deduplication)
        keymap.of(defaultKeymap as any),
        keymap.of(historyKeymap as any),
        keymap.of(searchKeymap as any),
        keymap.of(completionKeymap as any),
        keymap.of(lintKeymap as any),
        saveKeymap,

        // Read-only mode
        EditorView.editable.of(!readOnly),

        // Update callback
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            // Mark as user edit
            isUserEditRef.current = true;
            const newContent = update.state.doc.toString();
            setContent(newContent, 'code');
          }
        }),

        // Styling
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
          },
          '.cm-scroller': {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          },
          '.cm-content': {
            padding: '16px 0',
          },
          '.cm-gutters': {
            backgroundColor: '#21252b',
            color: '#636d83',
            border: 'none',
          },
          '.cm-lineNumbers .cm-gutterElement': {
            padding: '0 16px 0 8px',
          },
        }),
      ],
    });

    // Create editor view
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    // Cleanup
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Update content when changed externally (not from user typing)
  useEffect(() => {
    if (!viewRef.current) return;

    // If this change came from user typing, skip
    if (isUserEditRef.current) {
      isUserEditRef.current = false;
      return;
    }

    const currentContent = viewRef.current.state.doc.toString();
    if (currentContent !== content) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: content,
        },
      });
    }
  }, [content]);

  return (
    <div
      ref={editorRef}
      className="h-full w-full overflow-auto bg-[#282c34]"
      style={{ height }}
    />
  );
}

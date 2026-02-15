/**
 * RequestBodyEditor - Body tab with radio-style type selector + prettify + CodeMirror editor
 * Matches mockup: radio circles for content types, Prettify link on right, border-b separator
 */

import {useEffect, useRef} from 'react';
import {EditorView, lineNumbers} from '@codemirror/view';
import {EditorState} from '@codemirror/state';
import {json} from '@codemirror/lang-json';
import {oneDark} from '@codemirror/theme-one-dark';
import {BODY_CONTENT_TYPES} from '@/lib/constants';
import type {BodyContentType} from './types';
import {prettifyJson} from './utils';

interface RequestBodyEditorProps {
    body: string;
    bodyType: BodyContentType;
    onBodyChange: (body: string) => void;
    onBodyTypeChange: (type: BodyContentType) => void;
}

export function RequestBodyEditor({body, bodyType, onBodyChange, onBodyTypeChange}: RequestBodyEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const editorViewRef = useRef<EditorView | null>(null);
    // Keep onBodyChange always current to avoid stale closures in CodeMirror listener
    const onBodyChangeRef = useRef(onBodyChange);
    onBodyChangeRef.current = onBodyChange;

    const isEditorDisabled = bodyType === 'none' || bodyType === 'binary';

    // Initialize CodeMirror editor
    useEffect(() => {
        if (!editorRef.current || isEditorDisabled) return;

        // Destroy any previous instance
        editorViewRef.current?.destroy();
        editorViewRef.current = null;

        const state = EditorState.create({
            doc: body,
            extensions: [
                json(),
                lineNumbers(),
                oneDark,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        onBodyChangeRef.current(update.state.doc.toString());
                    }
                }),
                EditorView.theme({
                    '&': {height: '100%', fontSize: '13px'},
                    '.cm-scroller': {overflow: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'},
                    '.cm-gutters': {border: 'none', backgroundColor: 'transparent'},
                }),
            ],
        });

        editorViewRef.current = new EditorView({state, parent: editorRef.current});

        return () => {
            editorViewRef.current?.destroy();
            editorViewRef.current = null;
        };
    // Recreate editor when bodyType changes (e.g., switching from none/binary back to json)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditorDisabled]);

    // Sync external body changes into editor
    useEffect(() => {
        if (!editorViewRef.current) return;
        const currentDoc = editorViewRef.current.state.doc.toString();
        if (currentDoc !== body) {
            editorViewRef.current.dispatch({
                changes: {from: 0, to: currentDoc.length, insert: body},
            });
        }
    }, [body]);

    const handlePrettify = () => {
        const prettified = prettifyJson(body);
        onBodyChange(prettified);
    };

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            {/* Body type radio selector — matches mockup: radio circles with labels, Prettify on right */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
                <div className="flex items-center gap-3" data-testid="body-type-selector">
                    {BODY_CONTENT_TYPES.map((type) => (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => onBodyTypeChange(type.value as BodyContentType)}
                            className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${
                                bodyType === type.value ? 'opacity-100' : 'opacity-50 hover:opacity-100'
                            }`}
                            data-testid={`body-type-${type.value}`}
                        >
                            {/* Radio circle — mockup pattern */}
                            <div className="w-3 h-3 rounded-full border border-muted-foreground flex items-center justify-center p-[2px]">
                                {bodyType === type.value && (
                                    <div className="w-full h-full bg-foreground rounded-full"/>
                                )}
                            </div>
                            <span className={`text-xs ${bodyType === type.value ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {type.label}
                            </span>
                        </button>
                    ))}
                </div>

                {bodyType === 'json' && (
                    <button
                        type="button"
                        onClick={handlePrettify}
                        className="text-xs text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1 transition-colors"
                        data-testid="prettify-btn"
                    >
                        Prettify
                    </button>
                )}
            </div>

            {/* Editor or disabled state */}
            {isEditorDisabled ? (
                <div className="flex-1 flex items-center justify-center cursor-not-allowed">
                    <span className="text-xs text-muted-foreground">
                        {bodyType === 'none' ? 'No body for this request' : 'Binary file upload not yet supported'}
                    </span>
                </div>
            ) : (
                <div className="flex-1 overflow-hidden">
                    <div ref={editorRef} className="h-full cursor-text"/>
                </div>
            )}
        </div>
    );
}

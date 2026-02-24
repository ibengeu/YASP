/**
 * RequestBodyEditor - Body tab with radio-style type selector + prettify + CodeMirror editor
 * Matches mockup: radio circles for content types, Prettify link on right, border-b separator
 */

import {useEffect, useRef} from 'react';
import {EditorView, lineNumbers} from '@codemirror/view';
import {EditorState} from '@codemirror/state';
import {json} from '@codemirror/lang-json';
import {oneDark} from '@codemirror/theme-one-dark';
import {RefreshCw} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import {BODY_CONTENT_TYPES} from '@/lib/constants';
import type {BodyContentType, FormField} from './types';
import {prettifyJson} from './utils';

interface RequestBodyEditorProps {
    body: string;
    bodyFields?: FormField[];
    bodyType: BodyContentType;
    onBodyChange: (body: string) => void;
    onBodyFieldsChange?: (fields: FormField[]) => void;
    onBodyTypeChange: (type: BodyContentType) => void;
}

/**
 * Render typed input for a single form field
 * Handles: text, file, checkbox, email, number, tel, url
 */
function renderFieldInput(
    field: FormField,
    onChange: (value: string) => void
) {
    const baseInputProps = {
        className: 'h-9 text-sm bg-muted/30 border-border focus-visible:ring-primary/20',
    };

    switch (field.type) {
        case 'checkbox':
            return (
                <Checkbox
                    checked={field.value === 'true'}
                    onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
                    title={field.description}
                />
            );

        case 'file':
            return (
                <Input
                    type="file"
                    onChange={(e) => {
                        const filename = e.target.files?.[0]?.name || '';
                        onChange(filename);
                    }}
                    {...baseInputProps}
                    title={field.description}
                />
            );

        case 'number':
            return (
                <Input
                    type="number"
                    value={field.value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="0"
                    {...baseInputProps}
                    title={field.description}
                />
            );

        case 'email':
            return (
                <Input
                    type="email"
                    value={field.value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="user@example.com"
                    {...baseInputProps}
                    title={field.description}
                />
            );

        case 'tel':
            return (
                <Input
                    type="tel"
                    value={field.value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    {...baseInputProps}
                    title={field.description}
                />
            );

        case 'url':
            return (
                <Input
                    type="url"
                    value={field.value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://example.com"
                    {...baseInputProps}
                    title={field.description}
                />
            );

        case 'text':
        default:
            return (
                <Input
                    type="text"
                    value={field.value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Enter value"
                    {...baseInputProps}
                    title={field.description}
                />
            );
    }
}

function FormBodyEditor({ fields, onChange }: { fields: FormField[], onChange: (fields: FormField[]) => void }) {
    const handleFieldChange = (idx: number, newVal: string) => {
        const updated = [...fields];
        updated[idx].value = newVal;
        onChange(updated);
    };

    return (
        <div className="p-4 overflow-y-auto max-h-full custom-scroll">
            <div className="space-y-4">
                {fields.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground">
                        No fields defined for this content type
                    </div>
                ) : (
                    fields.map((field, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                            {/* Field label / name (read-only) */}
                            <div className="min-w-[120px] max-w-[180px] shrink-0">
                                <span
                                    className="text-xs font-mono font-bold text-foreground bg-muted/50 px-2 py-1.5 rounded block truncate"
                                    title={field.description || field.key}
                                >
                                    {field.key}
                                    {field.required && <span className="text-destructive ml-1">*</span>}
                                </span>
                            </div>

                            {/* Typed input */}
                            <div className="flex-1">
                                {renderFieldInput(field, (val) => handleFieldChange(idx, val))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export function RequestBodyEditor({body, bodyFields, bodyType, onBodyChange, onBodyFieldsChange, onBodyTypeChange}: RequestBodyEditorProps) {
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
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => onBodyChange('')}
                            className="text-xs text-muted-foreground hover:text-foreground font-bold uppercase tracking-tight cursor-pointer flex items-center gap-1.5 transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={handlePrettify}
                            className="text-xs text-primary hover:text-primary/80 font-bold uppercase tracking-tight cursor-pointer flex items-center gap-1 transition-colors"
                            data-testid="prettify-btn"
                        >
                            Prettify
                        </button>
                    </div>
                )}

                {(bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded') && (
                    <button
                        type="button"
                        onClick={() => onBodyChange('')}
                        className="text-xs text-muted-foreground hover:text-foreground font-bold uppercase tracking-tight cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Clear
                    </button>
                )}
            </div>

            {/* Editor or Form or disabled state */}
            {bodyType === 'none' || bodyType === 'binary' ? (
                <div className="flex-1 flex items-center justify-center cursor-not-allowed">
                    <span className="text-sm text-muted-foreground font-medium italic">
                        {bodyType === 'none' ? 'No body for this request' : 'Binary file upload not yet supported'}
                    </span>
                </div>
            ) : bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded' ? (
                <FormBodyEditor
                    fields={bodyFields || []}
                    onChange={onBodyFieldsChange || (() => {})}
                />
            ) : (
                <div className="flex-1 overflow-hidden">
                    <div ref={editorRef} className="h-full cursor-text"/>
                </div>
            )}
        </div>
    );
}

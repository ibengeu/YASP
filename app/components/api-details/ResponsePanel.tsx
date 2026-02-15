/**
 * ResponsePanel - Right column response viewer matching mockup layout
 *
 * Structure (top to floor):
 *  1. Status header (h-12): "Response" label + status dot + code + time + size
 *  2. Response tabs: Body | Headers (underline style, py-2.5, gap-4)
 *  3. Toolbar row: search/wrap icons left, Save Example right
 *  4. Response body: CodeMirror read-only with syntax highlighting
 *  5. (Optional) Validation info bar at bottom
 */

import {useEffect, useRef, useState} from 'react';
import {Copy, WrapText, Send} from 'lucide-react';
import {EditorView, lineNumbers} from '@codemirror/view';
import {EditorState} from '@codemirror/state';
import {json} from '@codemirror/lang-json';
import {oneDark} from '@codemirror/theme-one-dark';
import {toast} from 'sonner';
import type {TestResponse} from './types';

interface ResponsePanelProps {
    response: TestResponse | null;
    isLoading: boolean;
}

function getStatusColor(status: number): string {
    if (status >= 200 && status < 300) return 'text-emerald-400';
    if (status >= 400) return 'text-destructive';
    return 'text-amber-400';
}

function getStatusDotColor(status: number): string {
    if (status >= 200 && status < 300) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
    if (status >= 400) return 'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.4)]';
    return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
}

export function ResponsePanel({response, isLoading}: ResponsePanelProps) {
    const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body');
    const [wordWrap, setWordWrap] = useState(true);
    const editorRef = useRef<HTMLDivElement>(null);
    const editorViewRef = useRef<EditorView | null>(null);

    const responseBody = response ? JSON.stringify(response.body, null, 2) : '';

    // Initialize and update CodeMirror read-only editor
    useEffect(() => {
        if (!editorRef.current || !response) return;

        // Destroy previous instance
        editorViewRef.current?.destroy();
        editorViewRef.current = null;

        const extensions = [
            json(),
            lineNumbers(),
            oneDark,
            EditorState.readOnly.of(true),
            EditorView.editable.of(false),
            EditorView.theme({
                '&': {height: '100%', fontSize: '13px'},
                '.cm-scroller': {overflow: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'},
                '.cm-gutters': {border: 'none', backgroundColor: 'transparent'},
            }),
        ];

        if (wordWrap) {
            extensions.push(EditorView.lineWrapping);
        }

        const state = EditorState.create({
            doc: responseBody,
            extensions,
        });

        editorViewRef.current = new EditorView({state, parent: editorRef.current});

        return () => {
            editorViewRef.current?.destroy();
            editorViewRef.current = null;
        };
    }, [response, wordWrap]);

    const handleCopyBody = () => {
        if (response) {
            navigator.clipboard.writeText(responseBody);
            toast.success('Response copied to clipboard');
        }
    };

    const handleCopyHeaders = () => {
        if (response) {
            const headersText = Object.entries(response.headers)
                .map(([k, v]) => `${k}: ${v}`)
                .join('\n');
            navigator.clipboard.writeText(headersText);
            toast.success('Headers copied to clipboard');
        }
    };

    const headerEntries = response ? Object.entries(response.headers) : [];

    // Empty state — matches mockup aesthetic
    if (!response && !isLoading) {
        return (
            <div className="flex flex-col h-full bg-muted/30">
                {/* Status header — always present */}
                <div className="h-12 border-b border-border flex items-center px-4 shrink-0">
                    <span className="font-medium text-xs text-muted-foreground">Response</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 p-8 cursor-default">
                    <Send className="w-8 h-8 opacity-20"/>
                    <span className="text-xs">Send a request to see the response</span>
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-muted/30">
                <div className="h-12 border-b border-border flex items-center px-4 shrink-0">
                    <span className="font-medium text-xs text-muted-foreground">Response</span>
                </div>
                <div className="flex-1 flex items-center justify-center cursor-wait">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"/>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-muted/30">
            {/* 1. Status header — h-12, matching mockup */}
            <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
                <span className="font-medium text-xs text-muted-foreground">Response</span>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs">
                        <span className={`w-2 h-2 rounded-full ${getStatusDotColor(response!.status)}`}/>
                        <span className={`font-semibold ${getStatusColor(response!.status)}`}>
                            {response!.status} {response!.statusText}
                        </span>
                    </div>
                    <div className="h-3 w-px bg-border"/>
                    <span className="text-xs text-muted-foreground">{response!.time}ms</span>
                    <div className="h-3 w-px bg-border"/>
                    <span className="text-xs text-muted-foreground">{response!.size}KB</span>
                </div>
            </div>

            {/* 2. Response tabs — underline style matching mockup (py-2.5, gap-4, border-b-2) */}
            <div className="flex items-center px-4 border-b border-border gap-4 shrink-0">
                <button
                    type="button"
                    onClick={() => setActiveTab('body')}
                    className={`py-2.5 text-xs font-medium cursor-pointer border-b-2 transition-colors ${
                        activeTab === 'body'
                            ? 'text-foreground border-foreground'
                            : 'text-muted-foreground hover:text-foreground border-transparent'
                    }`}
                    data-testid="response-tab-body"
                >
                    Body
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('headers')}
                    className={`py-2.5 text-xs font-medium cursor-pointer border-b-2 transition-colors ${
                        activeTab === 'headers'
                            ? 'text-foreground border-foreground'
                            : 'text-muted-foreground hover:text-foreground border-transparent'
                    }`}
                    data-testid="response-tab-headers"
                >
                    Headers
                    {headerEntries.length > 0 && (
                        <span className="ml-1 text-[10px] bg-muted px-1 rounded text-muted-foreground">
                            {headerEntries.length}
                        </span>
                    )}
                </button>
            </div>

            {/* 3. Toolbar row — matching mockup: icons left, action right */}
            {activeTab === 'body' && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                            title="Wrap Text"
                            onClick={() => setWordWrap(!wordWrap)}
                            data-testid="word-wrap-toggle"
                        >
                            <WrapText className="w-3 h-3"/>
                        </button>
                        <button
                            type="button"
                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                            title="Copy Response"
                            onClick={handleCopyBody}
                            data-testid="copy-response-btn"
                        >
                            <Copy className="w-3 h-3"/>
                        </button>
                    </div>
                </div>
            )}

            {/* 4. Tab content — full height */}
            {activeTab === 'body' ? (
                <div className="flex-1 overflow-hidden min-h-[300px] md:min-h-0" data-testid="response-body-content">
                    <div ref={editorRef} className="h-full"/>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-4 min-h-[300px] md:min-h-0" data-testid="response-headers-content">
                    {headerEntries.length > 0 ? (
                        <div className="space-y-3">
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleCopyHeaders}
                                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1 transition-colors"
                                >
                                    <Copy className="w-3 h-3"/>
                                    Copy
                                </button>
                            </div>
                            <div className="border border-border rounded-md overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted">
                                    <tr>
                                        <th className="p-2 text-left font-medium text-foreground w-1/3">Header</th>
                                        <th className="p-2 text-left font-medium text-foreground">Value</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {headerEntries.map(([key, value]) => (
                                        <tr key={key} className="border-t border-border">
                                            <td className="p-2 font-mono text-foreground">{key}</td>
                                            <td className="p-2 font-mono text-muted-foreground break-all">{value}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-muted-foreground">No response headers</div>
                    )}
                </div>
            )}
        </div>
    );
}

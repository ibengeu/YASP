/**
 * Spec Editor Route - Redesigned to match reference platform
 * Features: Editor/Docs tabs, Endpoint sidebar (both tabs), Maximize mode
 */

import {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate} from 'react-router';
import {toast} from 'sonner';
import {animate} from 'animejs';
import {CodeEditor, type CodeEditorRef} from '@/features/editor/components/CodeEditor';
import {useEditorStore} from '@/features/editor/store/editor.store';
import {useDirtyState} from '@/features/editor/hooks/useDirtyState';
import {FloatingActionBar} from '@/components/editor/FloatingActionBar';
import {ApiDocumentation} from '@/components/api-details/ApiDocumentation';
import {EndpointSidebar} from '@/components/api-details/EndpointSidebar';
import {idbStorage} from '@/core/storage/idb-storage';
import type {PathItemObject, OperationObject, ServerObject} from '@/types/openapi-spec';
import {EndpointSidebarSkeleton, DocumentationSkeleton} from '@/components/ui/skeleton';
import {NEW_SPEC_TEMPLATE, NEW_SPEC_DEFAULT_TITLE} from '@/lib/templates';

// Parsed OpenAPI spec structure
interface ParsedOpenAPISpec {
    openapi: string;
    info: {
        title: string;
        version: string;
        description?: string;
    };
    servers?: ServerObject[];
    paths?: Record<string, PathItemObject>;
    components?: any;
}

export default function SpecEditor() {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const content = useEditorStore((state) => state.content);
    const setEditorContent = useEditorStore((state) => state.setContent);
    const editorRef = useRef<CodeEditorRef>(null);

    // Dirty-state tracking (replaces title/originalTitle/originalContent/hasChanges)
    const dirtyState = useDirtyState({title: '', content: ''});
    const {title, hasChanges} = dirtyState;
    const syncDirtyState = dirtyState.sync;

    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'docs'>('docs');
    const [parsedSpec, setParsedSpec] = useState<ParsedOpenAPISpec | null>(null);
    const [selectedEndpoint, setSelectedEndpoint] = useState<{
        path: string;
        method: string;
        operation: OperationObject;
    } | null>(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Refs for anime.js
    const contentRef = useRef<HTMLDivElement>(null);

    // Auto-detect language based on content
    const detectedLanguage = (() => {
        if (!content || content.trim().length === 0) return 'yaml';
        const trimmed = content.trim();
        // Check if it starts with { or [ (JSON)
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
        // Default to YAML
        return 'yaml';
    })();

    // Load spec from storage
    useEffect(() => {
        const loadSpec = async () => {
            setIsLoading(true);
            if (id === 'new') {
                setEditorContent(NEW_SPEC_TEMPLATE, 'code');
                syncDirtyState({title: NEW_SPEC_DEFAULT_TITLE, content: NEW_SPEC_TEMPLATE});
            } else {
                const spec = await idbStorage.getSpec(id!);
                if (spec) {
                    const specContent = spec.content || '';
                    const specTitle = spec.title || 'Untitled';
                    setEditorContent(specContent, 'code');
                    syncDirtyState({title: specTitle, content: specContent});
                }
            }
            setIsLoading(false);
        };

        loadSpec();
    }, [id]);

    // Auto-validate on content change and parse spec
    useEffect(() => {
        if (!content) return;

        const validateAndParse = async () => {
            try {
                // Parse YAML to extract endpoints
                const yaml = await import('yaml');
                const parsed = yaml.parse(content) as ParsedOpenAPISpec;
                setParsedSpec(parsed);

                // Auto-select first endpoint if none selected
                if (!selectedEndpoint && parsed.paths) {
                    const firstPath = Object.keys(parsed.paths)[0];
                    if (firstPath) {
                        const pathItem = parsed.paths[firstPath] as PathItemObject;
                        const firstMethod = ['get', 'post', 'put', 'delete', 'patch'].find(
                            (m) => pathItem[m as keyof PathItemObject]
                        );
                        if (firstMethod) {
                            setSelectedEndpoint({
                                path: firstPath,
                                method: firstMethod,
                                operation: pathItem[firstMethod as keyof PathItemObject] as OperationObject,
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Validation/parse error:', error);
                setParsedSpec(null);
            }
        };

        validateAndParse();
    }, [content]);

    // Animate tab content when switching
    useEffect(() => {
        if (contentRef.current && !isLoading) {
            animate(contentRef.current, {
                opacity: [0, 1],
                translateY: [10, 0],
                duration: 300,
                easing: 'cubicBezier(0.4, 0.0, 0.2, 1)',
            });
        }
    }, [activeTab, isLoading]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (id === 'new') {
                // Parse spec to get info
                const yaml = await import('yaml');
                const parsed = yaml.parse(content);

                // Calculate a basic quality score (0-100)
                const score = 0; // Will be calculated by validation later

                // Create new spec
                const newSpec = await idbStorage.createSpec({
                    type: 'openapi',
                    content,
                    title,
                    version: parsed.info?.version || '1.0.0',
                    description: parsed.info?.description,
                    metadata: {
                        score,
                        tags: [],
                        workspaceType: 'personal',
                        syncStatus: 'offline',
                        isDiscoverable: false,
                    },
                });
                navigate(`/editor/${newSpec.id}`);
                toast.success('Specification created');
            } else {
                // Parse spec to get info
                const yaml = await import('yaml');
                const parsed = yaml.parse(content);

                // Get existing spec to preserve metadata
                const existing = await idbStorage.getSpec(id!);
                if (!existing) throw new Error('Spec not found');

                // Preserve existing score or set to 0
                const score = existing.metadata.score || 0;

                // Update existing spec
                await idbStorage.updateSpec(id!, {
                    content,
                    title,
                    version: parsed.info?.version || '1.0.0',
                    description: parsed.info?.description,
                    metadata: {
                        ...existing.metadata,
                        score,
                    },
                });

                // Reset dirty baseline after successful save
                syncDirtyState({title, content});

                toast.success('Specification saved');
            }
        } catch (error) {
            toast.error('Failed to save specification');
            console.error('Save error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const scrollToEndpoint = (path: string, method: string) => {
        const elementId = `endpoint-${method}-${path.replace(/\//g, '-')}`;
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    };

    const scrollToYamlLine = (path: string, method: string) => {
        if (!content || !editorRef.current) return;

        const lines = content.split('\n');
        const isJSON = detectedLanguage === 'json';

        if (isJSON) {
            // For JSON: Look for "path": { "method": {
            // Find the line with the path as a JSON key
            const pathPattern = `"${path}"`;
            const pathLineIndex = lines.findIndex(line => line.includes(pathPattern) && line.includes(':'));

            if (pathLineIndex >= 0) {
                // Find the method line after the path
                const methodPattern = `"${method}"`;
                const methodLineIndex = lines.findIndex((line, idx) =>
                    idx > pathLineIndex && line.includes(methodPattern) && line.includes(':')
                );

                if (methodLineIndex >= 0) {
                    editorRef.current.scrollToLine(methodLineIndex + 1);
                    return;
                }
            }
        } else {
            // For YAML: Look for path: and method:
            const searchPattern = `${path}:`;
            const pathLineIndex = lines.findIndex(line => {
                const trimmed = line.trim();
                return trimmed === searchPattern || trimmed.startsWith(searchPattern + ' ');
            });

            if (pathLineIndex >= 0) {
                // Find the method line after the path
                const methodLineIndex = lines.findIndex((line, idx) => {
                    if (idx <= pathLineIndex) return false;
                    const trimmed = line.trim();
                    return trimmed.startsWith(`${method}:`) || trimmed === `${method}:`;
                });

                if (methodLineIndex >= 0) {
                    editorRef.current.scrollToLine(methodLineIndex + 1);
                    return;
                }
            }
        }

        // Fallback: just focus the editor
        console.log('Could not find endpoint in content:', path, method);
    };

    // Update breadcrumb in header
    useEffect(() => {
        const breadcrumbEl = document.getElementById('editor-breadcrumb-title');
        if (breadcrumbEl && title) {
            breadcrumbEl.textContent = title;
        }
    }, [title]);

    return (
        <div
            className={`flex flex-col ${isMaximized ? 'fixed inset-0 z-50 h-screen' : 'h-[calc(100vh-4rem)]'} overflow-hidden bg-background text-foreground transition-all duration-300 ease-out`}>

            {/* Main Content Area with Sidebar - This should be flex-1 and contain sidebar + content */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Endpoint List Sidebar - Show skeleton while loading, then show endpoints or hide if none */}
                {isLoading ? (
                    <div className="hidden md:block"><EndpointSidebarSkeleton/></div>
                ) : parsedSpec?.paths && Object.keys(parsedSpec.paths).length > 0 ? (
                    <div className="hidden md:flex w-72 border-r border-border bg-card flex-col shrink-0">
                        <EndpointSidebar
                            spec={parsedSpec}
                            selectedEndpoint={selectedEndpoint}
                            onSelectEndpoint={(endpoint) => {
                                setSelectedEndpoint(endpoint);
                                if (activeTab === 'docs') {
                                    scrollToEndpoint(endpoint.path, endpoint.method);
                                } else {
                                    scrollToYamlLine(endpoint.path, endpoint.method);
                                }
                            }}
                            variant="editor"
                            className="w-full h-full"
                        />
                    </div>
                ) : null}

                {/* Content Area - This contains tabs content, NOT diagnostics */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    {/* Loading State - Show skeleton loaders instead of spinner */}
                    {isLoading ? (
                        activeTab === 'docs' ? (
                            <DocumentationSkeleton/>
                        ) : (
                            <div className="flex-1 flex items-center justify-center bg-background">
                                <div className="text-center space-y-4">
                                    <div
                                        className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                                    <p className="text-sm text-muted-foreground">Loading API specification...</p>
                                </div>
                            </div>
                        )
                    ) : (
                        <>
                            {/* Editor Tab */}
                            {activeTab === 'editor' && (
                                <div ref={contentRef} className="flex-1 flex flex-col overflow-hidden min-h-0"
                                     style={{opacity: 0}}>
                                    <CodeEditor ref={editorRef} language={detectedLanguage}/>
                                </div>
                            )}

                            {/* Documentation Tab */}
                            {activeTab === 'docs' && (
                                <div ref={contentRef} className="flex-1 overflow-auto bg-background p-8 md:p-12 min-h-0"
                                     style={{opacity: 0}}>
                                    {parsedSpec ? (
                                        <ApiDocumentation spec={parsedSpec} />
                                    ) : (
                                        <div className="text-center py-12">
                                            <p className="text-muted-foreground">No API documentation available. Add
                                                paths to your OpenAPI specification.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>


            {/* Floating Action Bar - Mobile-first design, visible on all screen sizes */}
            <FloatingActionBar
                activeTab={activeTab}
                isMaximized={isMaximized}
                isSaving={isSaving}
                hasChanges={hasChanges}
                onTabChange={(tab) => setActiveTab(tab)}
                onToggleMaximize={() => setIsMaximized(!isMaximized)}
                onSave={handleSave}
            />

        </div>
    );
}

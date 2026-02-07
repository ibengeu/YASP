/**
 * Spec Editor Route - Redesigned to match reference platform
 * Features: Editor/Docs tabs, Endpoint sidebar (both tabs), Maximize mode
 */

import {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate} from 'react-router';
import {toast} from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {animate} from 'animejs';
import {CodeEditor, type CodeEditorRef} from '@/features/editor/components/CodeEditor';
import {useEditorStore} from '@/features/editor/store/editor.store';
import {TryItOutDrawer} from '@/components/api-details/TryItOutDrawer';
import {FloatingActionBar} from '@/components/editor/FloatingActionBar';
import {idbStorage} from '@/core/storage/idb-storage';
import type {PathItemObject, OperationObject, ServerObject} from '@/types/openapi-spec';
import {EndpointSidebarSkeleton, DocumentationSkeleton} from '@/components/ui/skeleton';

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
    const [title, setTitle] = useState('');
    const [originalTitle, setOriginalTitle] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'docs'>('docs');
    const [parsedSpec, setParsedSpec] = useState<ParsedOpenAPISpec | null>(null);
    const [selectedEndpoint, setSelectedEndpoint] = useState<{
        path: string;
        method: string;
        operation: OperationObject;
    } | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Track if there are unsaved changes
    const hasChanges = content !== originalContent || title !== originalTitle;

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
                // New spec template
                const template = `openapi: 3.1.0
info:
  title: My API
  version: 1.0.0
  description: API description
servers:
  - url: https://api.example.com/v1
paths:
  /example:
    get:
      summary: Example endpoint
      operationId: getExample
      tags: [Examples]
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
`;
                setEditorContent(template, 'code');
                setOriginalContent(template);
                setTitle('Untitled Spec');
                setOriginalTitle('Untitled Spec');
            } else {
                const spec = await idbStorage.getSpec(id!);
                if (spec) {
                    const specContent = spec.content || '';
                    const specTitle = spec.title || 'Untitled';
                    setEditorContent(specContent, 'code');
                    setOriginalContent(specContent);
                    setTitle(specTitle);
                    setOriginalTitle(specTitle);
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

                // Update original values after successful save
                setOriginalContent(content);
                setOriginalTitle(title);

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

    // Method color mapping
    const getMethodColor = (method: string) => {
        const colors: Record<string, { bg: string; text: string; border: string }> = {
            get: {bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30'},
            post: {bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30'},
            put: {bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30'},
            patch: {bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30'},
            delete: {bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30'},
        };
        return colors[method.toLowerCase()] || colors.get;
    };

    // Update breadcrumb in CommandDeck
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
                    <EndpointSidebarSkeleton/>
                ) : parsedSpec?.paths && Object.keys(parsedSpec.paths).length > 0 ? (
                    <div className="w-72 border-r border-border bg-card flex flex-col shrink-0">
                        <div className="p-4 border-b border-border">
                            <h3 className="text-sm font-semibold text-card-foreground mb-1">Endpoints</h3>
                            <p className="text-xs text-muted-foreground">
                                {Object.values(parsedSpec.paths).reduce((count, pathItem) => {
                                    return count + Object.keys(pathItem as PathItemObject).filter(k =>
                                        ['get', 'post', 'put', 'patch', 'delete'].includes(k)
                                    ).length;
                                }, 0)} operations
                            </p>
                        </div>
                        <div className="flex-1 overflow-auto">
                            {Object.entries(parsedSpec.paths).map(([path, pathItem]) => {
                                return Object.entries(pathItem as PathItemObject)
                                    .filter(([method]) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
                                    .map(([method, operation]: [string, any]) => {
                                        const op = operation as OperationObject;
                                        const colors = getMethodColor(method);
                                        const isSelected = selectedEndpoint?.path === path && selectedEndpoint?.method === method;

                                        return (
                                            <button
                                                key={`${method}-${path}`}
                                                onClick={() => {
                                                    // Update selected endpoint
                                                    setSelectedEndpoint({path, method, operation: op});

                                                    if (activeTab === 'docs') {
                                                        // In docs tab: scroll to endpoint documentation
                                                        scrollToEndpoint(path, method);
                                                    } else {
                                                        // In editor tab: scroll YAML to this endpoint
                                                        scrollToYamlLine(path, method);
                                                    }
                                                }}
                                                className={`w-full text-left px-4 py-3 border-b border-border transition-colors group cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-accent border-l-4 border-l-primary'
                                                        : 'hover:bg-muted border-l-4 border-l-transparent'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                          <span
                              className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${colors.bg} ${colors.text} border ${colors.border}`}>
                            {method}
                          </span>
                                                </div>
                                                <div className={`text-xs font-mono mb-1 transition-colors ${
                                                    isSelected ? 'text-foreground font-semibold' : 'text-muted-foreground group-hover:text-foreground'
                                                }`}>
                                                    {path}
                                                </div>
                                                <div className={`text-xs transition-colors line-clamp-1 ${
                                                    isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                                                }`}>
                                                    {op.summary || 'No summary'}
                                                </div>
                                            </button>
                                        );
                                    });
                            })}
                        </div>
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
                                    <div className="max-w-4xl mx-auto">
                                        {parsedSpec && parsedSpec.paths && Object.keys(parsedSpec.paths).length > 0 ? (
                                            <>
                                                {/* API Info Header */}
                                                <div className="mb-12">
                                                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-foreground">
                                                        {parsedSpec.info.title}
                                                    </h1>
                                                    <div
                                                        className="text-base leading-relaxed text-muted-foreground prose prose-sm prose-invert max-w-none [&_table]:border-collapse [&_table]:w-full [&_th]:border [&_th]:border-border [&_th]:px-4 [&_th]:py-2 [&_th]:bg-muted [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-4 [&_td]:py-2 [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto">
                                                        {parsedSpec.info.description ? (
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {parsedSpec.info.description}
                                                            </ReactMarkdown>
                                                        ) : (
                                                            'No description provided'
                                                        )}
                                                    </div>
                                                    <div
                                                        className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                                                        <span>Version {parsedSpec.info.version}</span>
                                                        {parsedSpec.servers?.[0] && (
                                                            <>
                                                                <span>•</span>
                                                                <code
                                                                    className="px-2 py-1 rounded bg-muted border border-border text-foreground font-mono text-xs">
                                                                    {parsedSpec.servers[0].url}
                                                                </code>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Endpoints */}
                                                {Object.entries(parsedSpec.paths).map(([path, pathItem]) => {
                                                    return Object.entries(pathItem as PathItemObject)
                                                        .filter(([method]) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
                                                        .map(([method, operation]: [string, any]) => {
                                                            const op = operation as OperationObject;
                                                            const colors = getMethodColor(method);

                                                            return (
                                                                <div
                                                                    key={`${method}-${path}`}
                                                                    id={`endpoint-${method}-${path.replace(/\//g, '-')}`}
                                                                    className="mb-16 scroll-mt-16"
                                                                >
                                                                    {/* Accent Strip */}
                                                                    <div
                                                                        className="h-1 w-16 bg-gradient-to-r from-purple-500 to-pink-500 mb-4 rounded-full"/>

                                                                    {/* Operation Summary */}
                                                                    <h2 className="text-xl md:text-2xl uppercase font-bold tracking-tight mb-3 text-foreground">
                                                                        {op.summary || `${method.toUpperCase()} ${path}`}
                                                                    </h2>
                                                                    <div
                                                                        className="text-sm md:text-base leading-relaxed mb-6 text-muted-foreground prose prose-sm prose-invert max-w-none [&_table]:border-collapse [&_table]:w-full [&_th]:border [&_th]:border-border [&_th]:px-4 [&_th]:py-2 [&_th]:bg-muted [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-4 [&_td]:py-2 [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto">
                                                                        {op.description ? (
                                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                                {op.description}
                                                                            </ReactMarkdown>
                                                                        ) : (
                                                                            'No detailed description provided in the specification.'
                                                                        )}
                                                                    </div>

                                                                    {/* Endpoint Badge */}
                                                                    <div
                                                                        className="flex items-center gap-3 mb-6 p-3 bg-card border border-border rounded-lg">
                                <span
                                    className={`px-3 py-1.5 rounded-md font-bold text-xs uppercase ${colors.bg} ${colors.text} border ${colors.border}`}>
                                  {method.toUpperCase()}
                                </span>
                                                                        <code
                                                                            className="text-sm font-mono text-foreground">{path}</code>
                                                                    </div>

                                                                    {/* Parameters */}
                                                                    {op.parameters && op.parameters.length > 0 && (
                                                                        <div className="mb-6">
                                                                            <h3 className="text-sm font-semibold text-foreground mb-3">
                                                                                Parameters
                                                                            </h3>
                                                                            <div className="overflow-x-auto">
                                                                                <table
                                                                                    className="w-full border border-border rounded-lg overflow-hidden">
                                                                                    <thead className="bg-muted">
                                                                                    <tr>
                                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">In</th>
                                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Required</th>
                                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                                                                                    </tr>
                                                                                    </thead>
                                                                                    <tbody
                                                                                        className="divide-y divide-border">
                                                                                    {op.parameters.map((param: any, idx: number) => (
                                                                                        <tr key={idx}
                                                                                            className="hover:bg-muted transition-colors">
                                                                                            <td className="px-4 py-3 text-sm font-mono text-foreground">{param.name}</td>
                                                                                            <td className="px-4 py-3 text-sm">
                                              <span
                                                  className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs border border-blue-500/30">
                                                {param.in}
                                              </span>
                                                                                            </td>
                                                                                            <td className="px-4 py-3 text-sm text-muted-foreground">{param.schema?.type || 'any'}</td>
                                                                                            <td className="px-4 py-3 text-sm">
                                                                                                {param.required ? (
                                                                                                    <span
                                                                                                        className="text-destructive">✓</span>
                                                                                                ) : (
                                                                                                    <span
                                                                                                        className="text-muted-foreground">—</span>
                                                                                                )}
                                                                                            </td>
                                                                                            <td className="px-4 py-3 text-sm text-muted-foreground">{param.description || '—'}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Request Body */}
                                                                    {op.requestBody && (
                                                                        <div className="mb-6">
                                                                            <h3 className="text-sm font-semibold text-foreground mb-3">
                                                                                Request Body
                                                                            </h3>
                                                                            <div
                                                                                className="p-4 bg-card border border-border rounded-lg">
                                                                                <p className="text-sm text-muted-foreground mb-2">
                                                                                    {(op.requestBody as any).description || 'Request body'}
                                                                                </p>
                                                                                {(op.requestBody as any).required && (
                                                                                    <span
                                                                                        className="text-xs text-destructive">Required</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Responses */}
                                                                    <div className="mb-6">
                                                                        <h3 className="text-sm font-semibold text-foreground mb-3">
                                                                            Responses
                                                                        </h3>
                                                                        <div className="overflow-x-auto">
                                                                            <table
                                                                                className="w-full border border-border rounded-lg overflow-hidden">
                                                                                <thead className="bg-muted">
                                                                                <tr>
                                                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                                                                                </tr>
                                                                                </thead>
                                                                                <tbody
                                                                                    className="divide-y divide-border">
                                                                                {op.responses && Object.entries(op.responses).map(([code, response]: [string, any]) => (
                                                                                    <tr key={code}
                                                                                        className="hover:bg-muted transition-colors">
                                                                                        <td className="px-4 py-3">
                                            <span className={`px-3 py-1 rounded font-mono text-xs ${
                                                code.startsWith('2') ? 'bg-success/10 text-success border border-success/30' :
                                                    code.startsWith('4') ? 'bg-warning/10 text-warning border border-warning/30' :
                                                        code.startsWith('5') ? 'bg-destructive/10 text-destructive border border-destructive/30' :
                                                            'bg-info/10 text-info border border-info/30'
                                            }`}>
                                              {code}
                                            </span>
                                                                                        </td>
                                                                                        <td className="px-4 py-3 text-sm text-muted-foreground">{response.description || 'No description'}</td>
                                                                                    </tr>
                                                                                ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                })}
                                            </>
                                        ) : (
                                            <div className="text-center py-12">
                                                <p className="text-muted-foreground">No API documentation available. Add
                                                    paths to your OpenAPI specification.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>


            {/* Try It Out Drawer */}
            {selectedEndpoint && (
                <TryItOutDrawer
                    open={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    operation={selectedEndpoint.operation}
                    path={selectedEndpoint.path}
                    method={selectedEndpoint.method}
                    baseUrl={parsedSpec?.servers?.[0]?.url || 'https://api.example.com'}
                    spec={parsedSpec}
                />
            )}

            {/* Floating Action Bar - Mobile-first design, visible on all screen sizes */}
            <FloatingActionBar
                activeTab={activeTab}
                isMaximized={isMaximized}
                isSaving={isSaving}
                hasChanges={hasChanges}
                onTabChange={(tab) => setActiveTab(tab)}
                onToggleMaximize={() => setIsMaximized(!isMaximized)}
                onSave={handleSave}
                onTryItOut={() => setIsDrawerOpen(true)}
            />

        </div>
    );
}

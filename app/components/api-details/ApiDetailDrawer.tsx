/**
 * ApiDetailDrawer - Full-height bottom drawer with Documentation + Try It Out tabs
 * Self-contained: loads spec from IndexedDB by specId
 * Uses shadcn Drawer (vaul) for drawer shell with body scroll lock
 */

import {useState, useEffect, useRef} from 'react';
import {useFetcher, useNavigate} from 'react-router';
import {
    X, Play, ChevronLeft, ChevronRight,
    AlertTriangle, Copy, FileEdit, BookOpen,
} from 'lucide-react';
import {toast} from 'sonner';
import {EditorView, lineNumbers} from '@codemirror/view';
import {EditorState} from '@codemirror/state';
import {json} from '@codemirror/lang-json';
import {oneDark} from '@codemirror/theme-one-dark';
import {ResizablePanelGroup, ResizablePanel, ResizableHandle} from '@/components/ui/resizable';
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {ApiDocumentation} from './ApiDocumentation';
import {EndpointSidebar} from './EndpointSidebar';
import {idbStorage} from '@/core/storage/idb-storage';
import type {OperationObject, PathItemObject, ServerObject} from '@/types/openapi-spec';
import {STORAGE_KEYS, DEFAULT_HEADERS, DEFAULT_FALLBACK_URL} from '@/lib/constants';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

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
    security?: any[];
}

interface ParamRow {
    enabled: boolean;
    key: string;
    value: string;
    description?: string;
    paramIn?: 'query' | 'path' | 'header' | 'cookie';
}

interface HeaderRow {
    enabled: boolean;
    key: string;
    value: string;
}

interface TestRequest {
    method: HTTPMethod;
    url: string;
    params: ParamRow[];
    headers: HeaderRow[];
    auth: {
        type: 'none' | 'api-key' | 'bearer' | 'basic';
        apiKey?: string;
        token?: string;
        username?: string;
        password?: string;
    };
    body: string;
}

interface TestResponse {
    status: number;
    statusText: string;
    time: number;
    size: number;
    headers: Record<string, string>;
    body: any;
}

/**
 * Resolve a $ref pointer within the spec
 * Handles local references like '#/components/schemas/Pet'
 */
function resolveRef(ref: string, spec: any): any {
    if (!ref || !ref.startsWith('#/')) return null;
    const parts = ref.slice(2).split('/');
    let current = spec;
    for (const part of parts) {
        if (!current || typeof current !== 'object') return null;
        current = current[part];
    }
    return current || null;
}

/**
 * Generate example JSON from OpenAPI schema
 * Mitigation for OWASP A04:2025 - Insecure Design: Provides valid example data structure
 */
function generateExampleFromSchema(schema: any, depth = 0, spec?: any): string {
    if (depth > 5) return '{}';

    // Resolve $ref if present
    if (schema.$ref && spec) {
        const resolved = resolveRef(schema.$ref, spec);
        if (resolved) return generateExampleFromSchema(resolved, depth, spec);
    }

    if (schema.example !== undefined) return JSON.stringify(schema.example, null, 2);
    if (schema.type === 'object' && schema.properties) {
        const obj: any = {};
        for (const [key, propSchema] of Object.entries(schema.properties)) {
            const prop = propSchema as any;
            // Resolve nested $ref
            const resolved = prop.$ref && spec ? resolveRef(prop.$ref, spec) : prop;
            if (!resolved) { obj[key] = null; continue; }
            if (resolved.example !== undefined) obj[key] = resolved.example;
            else if (resolved.type === 'string') obj[key] = resolved.enum?.[0] || resolved.default || 'string';
            else if (resolved.type === 'number' || resolved.type === 'integer') obj[key] = resolved.default ?? 0;
            else if (resolved.type === 'boolean') obj[key] = resolved.default ?? true;
            else if (resolved.type === 'array') {
                if (resolved.items) {
                    const itemExample = generateExampleFromSchema(resolved.items, depth + 1, spec);
                    try { obj[key] = [JSON.parse(itemExample)]; } catch { obj[key] = []; }
                } else { obj[key] = []; }
            }
            else if (resolved.type === 'object') {
                try { obj[key] = JSON.parse(generateExampleFromSchema(resolved, depth + 1, spec)); }
                catch { obj[key] = {}; }
            }
            else obj[key] = null;
        }
        return JSON.stringify(obj, null, 2);
    }
    if (schema.type === 'array' && schema.items) {
        const itemExample = generateExampleFromSchema(schema.items, depth + 1, spec);
        try { return JSON.stringify([JSON.parse(itemExample)], null, 2); }
        catch { return '[]'; }
    }
    return '{\n  \n}';
}

function detectAuthFromSpec(spec: any): { type: 'none' | 'api-key' | 'bearer' | 'basic' } {
    const securitySchemes = spec?.components?.securitySchemes;
    const globalSecurity = spec?.security;
    if (!securitySchemes || !globalSecurity || globalSecurity.length === 0) return {type: 'none'};
    const firstName = Object.keys(globalSecurity[0])[0];
    const scheme = securitySchemes[firstName];
    if (!scheme) return {type: 'none'};
    if (scheme.type === 'http' && scheme.scheme === 'bearer') return {type: 'bearer'};
    if (scheme.type === 'http' && scheme.scheme === 'basic') return {type: 'basic'};
    if (scheme.type === 'apiKey') return {type: 'api-key'};
    return {type: 'none'};
}

function isDummyFallbackUrl(url: string, spec: any): boolean {
    return url === DEFAULT_FALLBACK_URL && (!spec?.servers || spec.servers.length === 0);
}

interface ApiDetailDrawerProps {
    open: boolean;
    onClose: () => void;
    specId: string;
}

export function ApiDetailDrawer({open, onClose, specId}: ApiDetailDrawerProps) {
    const navigate = useNavigate();
    const fetcher = useFetcher();

    // Loading state
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [parsedSpec, setParsedSpec] = useState<ParsedOpenAPISpec | null>(null);

    // View state — defaults to Try It Out
    const [activeView, setActiveView] = useState<'docs' | 'tryitout'>('tryitout');

    // Sidebar state
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Endpoint state
    const [selectedEndpoint, setSelectedEndpoint] = useState<{
        path: string;
        method: string;
        operation: OperationObject;
    } | null>(null);

    // Try It Out state
    const [activeTab, setActiveTab] = useState<'params' | 'auth' | 'headers' | 'body'>('params');
    const [response, setResponse] = useState<TestResponse | null>(null);
    const bodyEditorRef = useRef<HTMLDivElement>(null);
    const bodyEditorViewRef = useRef<EditorView | null>(null);

    // Server state
    const baseUrl = parsedSpec?.servers?.[0]?.url || DEFAULT_FALLBACK_URL;
    const servers = parsedSpec?.servers || [];
    const [selectedServer, setSelectedServer] = useState<string>(baseUrl);

    // Auth state
    const detectedAuth = detectAuthFromSpec(parsedSpec);
    const authWasAutoDetected = detectedAuth.type !== 'none';

    const [request, setRequest] = useState<TestRequest>({
        method: 'GET',
        url: '',
        params: [],
        headers: [...DEFAULT_HEADERS.map((h) => ({...h})), {enabled: false, key: '', value: ''}],
        auth: {type: 'none'},
        body: '{\n  \n}',
    });

    // Load spec from IndexedDB
    useEffect(() => {
        if (!open || !specId) return;

        let cancelled = false;
        setIsLoading(true);
        setLoadError(null);

        const loadSpec = async () => {
            try {
                const spec = await idbStorage.getSpec(specId);
                if (cancelled) return;

                if (!spec) {
                    setLoadError('Specification not found');
                    setParsedSpec(null);
                    setIsLoading(false);
                    return;
                }

                const yaml = await import('yaml');
                const parsed = yaml.parse(spec.content) as ParsedOpenAPISpec;
                setParsedSpec(parsed);

                // Set initial server
                const serverUrl = parsed.servers?.[0]?.url || DEFAULT_FALLBACK_URL;
                setSelectedServer(serverUrl);

                // Set initial auth from spec
                const auth = detectAuthFromSpec(parsed);
                setRequest((prev) => ({...prev, auth}));

                // Auto-select first endpoint
                if (parsed.paths) {
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
                if (!cancelled) {
                    setLoadError('Failed to parse specification');
                    console.error('Failed to load spec:', error);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        loadSpec();
        return () => {
            cancelled = true;
        };
    }, [open, specId]);

    // Reset state when drawer closes
    useEffect(() => {
        if (!open) {
            setActiveView('tryitout');
            setResponse(null);
            setSelectedEndpoint(null);
            setParsedSpec(null);
            setIsLoading(true);
            setLoadError(null);
        }
    }, [open]);

    // Load sidebar state
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.sidebarCollapsed);
        if (saved === 'true') setIsSidebarCollapsed(true);
    }, []);

    // Save sidebar state
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, isSidebarCollapsed.toString());
    }, [isSidebarCollapsed]);

    // Update request when endpoint or server changes
    useEffect(() => {
        if (!selectedEndpoint || !parsedSpec) return;

        const fullUrl = `${selectedServer}${selectedEndpoint.path}`;

        const pathLevelParams = (parsedSpec?.paths?.[selectedEndpoint.path]?.parameters || []) as any[];
        const operationParams = (selectedEndpoint.operation?.parameters || []) as any[];

        const paramMap = new Map<string, any>();
        for (const param of pathLevelParams) paramMap.set(`${param.name}:${param.in}`, param);
        for (const param of operationParams) paramMap.set(`${param.name}:${param.in}`, param);
        const allParameters = Array.from(paramMap.values());

        const paramRows: ParamRow[] = [];
        const headerParamsFromSpec: HeaderRow[] = [];

        for (const param of allParameters) {
            const location = param.in as string;
            if (location === 'header') {
                headerParamsFromSpec.push({
                    enabled: param.required || true,
                    key: param.name,
                    value: param.schema?.default || '',
                });
            } else if (location === 'query' || location === 'path' || location === 'cookie') {
                paramRows.push({
                    enabled: location === 'path' ? true : (param.required || false),
                    key: param.name,
                    value: param.schema?.default?.toString() || '',
                    description: param.description,
                    paramIn: location as ParamRow['paramIn'],
                });
            }
        }
        paramRows.push({enabled: false, key: '', value: '', description: undefined});

        let exampleBody = '{\n  \n}';
        if (selectedEndpoint.operation?.requestBody) {
            const requestBody = selectedEndpoint.operation.requestBody as any;
            const content = requestBody.content || {};
            const jsonContent = content['application/json'];
            const formContent = content['application/x-www-form-urlencoded'];
            const textContent = content['text/plain'];
            const firstContentType = Object.keys(content)[0];

            if (jsonContent) {
                if (jsonContent.schema) exampleBody = generateExampleFromSchema(jsonContent.schema, 0, parsedSpec);
                else if (jsonContent.example) exampleBody = JSON.stringify(jsonContent.example, null, 2);
            } else if (formContent) {
                if (formContent.schema?.properties) {
                    const params = Object.keys(formContent.schema.properties).map((key) => `${key}=value`).join('&');
                    exampleBody = params || 'key=value';
                } else exampleBody = 'key=value&key2=value2';
            } else if (textContent) {
                exampleBody = textContent.example || 'Plain text content';
            } else if (firstContentType && content[firstContentType]) {
                const firstContent = content[firstContentType];
                if (firstContent.example) {
                    exampleBody = typeof firstContent.example === 'string'
                        ? firstContent.example
                        : JSON.stringify(firstContent.example, null, 2);
                }
            }
        }

        const mergedHeaders = [
            ...DEFAULT_HEADERS.map((h) => ({...h})),
            ...headerParamsFromSpec,
            {enabled: false, key: '', value: ''},
        ];

        setRequest((prev) => ({
            ...prev,
            method: selectedEndpoint.method.toUpperCase() as HTTPMethod,
            url: fullUrl,
            params: paramRows,
            headers: mergedHeaders,
            body: exampleBody,
        }));

        if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method.toUpperCase())) {
            setActiveTab('body');
        } else {
            setActiveTab('params');
        }
    }, [selectedEndpoint, selectedServer]);

    // Initialize CodeMirror for body editor
    // Depends on activeView and activeTab because the editor container is only
    // mounted when both are 'tryitout' / 'body' respectively
    useEffect(() => {
        if (activeView !== 'tryitout' || activeTab !== 'body' || !bodyEditorRef.current || bodyEditorViewRef.current) return;

        const state = EditorState.create({
            doc: request.body,
            extensions: [
                json(),
                lineNumbers(),
                oneDark,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        const newBody = update.state.doc.toString();
                        setRequest((prev) => ({...prev, body: newBody}));
                    }
                }),
                EditorView.theme({
                    '&': {height: '100%', fontSize: '13px'},
                    '.cm-scroller': {overflow: 'auto', fontFamily: 'ui-monospace, monospace'},
                }),
            ],
        });

        bodyEditorViewRef.current = new EditorView({state, parent: bodyEditorRef.current});

        return () => {
            bodyEditorViewRef.current?.destroy();
            bodyEditorViewRef.current = null;
        };
    }, [activeView, activeTab]);

    // Update editor content when request body changes externally (endpoint change or body prefill)
    useEffect(() => {
        if (!bodyEditorViewRef.current) return;
        const currentDoc = bodyEditorViewRef.current.state.doc.toString();
        if (currentDoc !== request.body) {
            bodyEditorViewRef.current.dispatch({
                changes: {from: 0, to: currentDoc.length, insert: request.body},
            });
        }
    }, [selectedEndpoint, request.body]);

    // Mitigation for OWASP A07:2025 (Injection): encodeURIComponent prevents URL injection
    const handleSendRequest = () => {
        const headers: Record<string, string> = {};
        request.headers
            .filter((h) => h.enabled && h.key && h.value)
            .forEach((h) => {
                headers[h.key] = h.value;
            });

        let url = request.url;
        const pathParams = request.params.filter((p) => p.paramIn === 'path' && p.key && p.value);
        for (const param of pathParams) {
            url = url.replace(`{${param.key}}`, encodeURIComponent(param.value));
        }

        const queryParams = request.params.filter(
            (p) => p.enabled && p.key && p.value && p.paramIn !== 'path' && p.paramIn !== 'header' && p.paramIn !== 'cookie'
        );
        if (queryParams.length > 0) {
            const queryString = queryParams
                .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
                .join('&');
            url = `${url}?${queryString}`;
        }

        const requestData = JSON.stringify({
            method: request.method,
            url,
            headers,
            body: ['POST', 'PUT', 'PATCH'].includes(request.method) ? request.body : undefined,
            auth: request.auth,
        });

        fetcher.submit(requestData, {
            method: 'POST',
            action: '/api/execute-request',
            encType: 'application/json',
        });
    };

    // Handle fetcher response
    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data) {
            if (fetcher.data.success) {
                setResponse(fetcher.data.data);
                toast.success(`Request completed in ${fetcher.data.data.time}ms`);
            } else {
                const errorMessage = fetcher.data.error || 'Request failed';
                toast.error(errorMessage);
                setResponse({
                    status: 0, statusText: 'Error', time: 0, size: 0,
                    headers: {}, body: {error: errorMessage},
                });
            }
        }
    }, [fetcher.state, fetcher.data]);

    const handleCopyResponse = () => {
        if (response) {
            navigator.clipboard.writeText(JSON.stringify(response.body, null, 2));
            toast.success('Response copied to clipboard');
        }
    };

    const getMethodColor = (method: HTTPMethod) => {
        switch (method) {
            case 'GET':
                return 'text-blue-600 dark:text-blue-400';
            case 'POST':
                return 'text-emerald-600 dark:text-emerald-400';
            case 'PUT':
                return 'text-amber-600 dark:text-amber-400';
            case 'PATCH':
                return 'text-secondary';
            case 'DELETE':
                return 'text-destructive';
        }
    };

    // Scroll to endpoint in docs view
    const scrollToEndpoint = (path: string, method: string) => {
        const elementId = `endpoint-${method}-${path.replace(/\//g, '-')}`;
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    };

    const handleEndpointSelect = (endpoint: { path: string; method: string; operation: OperationObject }) => {
        setSelectedEndpoint(endpoint);

        if (activeView === 'docs') {
            scrollToEndpoint(endpoint.path, endpoint.method);
        }
    };

    return (
        <Drawer open={open} onOpenChange={(isOpen) => {
            if (!isOpen) onClose();
        }} direction="bottom" handleOnly>
            <DrawerContent className="h-[100vh] max-h-[100vh] rounded-none">
                {/* Visually hidden title and description for accessibility (vaul requirement) */}
                <DrawerTitle className="sr-only">API Details</DrawerTitle>
                <DrawerDescription className="sr-only">View API documentation and test endpoints</DrawerDescription>

                {/* Header */}
                <div
                    className="h-12 border-b border-border flex items-center justify-between px-4 bg-background shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Sidebar toggle */}
                        {parsedSpec?.paths && Object.keys(parsedSpec.paths).length > 0 && (
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            >
                                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4"/> :
                                    <ChevronLeft className="w-4 h-4"/>}
                            </Button>
                        )}

                        {/* View Tabs */}
                        <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setActiveView('tryitout')}
                                className={`text-xs ${
                                    activeView === 'tryitout'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Play className="w-3.5 h-3.5"/>
                                Try It Out
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setActiveView('docs')}
                                className={`text-xs ${
                                    activeView === 'docs'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <BookOpen className="w-3.5 h-3.5"/>
                                Documentation
                            </Button>
                        </div>

                        {/* Current endpoint info */}
                        {activeView === 'tryitout' && selectedEndpoint && (
                            <>
                                <div className="h-4 w-px bg-border"/>
                                <span
                                    className={`text-xs font-bold ${getMethodColor(selectedEndpoint.method.toUpperCase() as HTTPMethod)}`}>
                  {selectedEndpoint.method.toUpperCase()}
                </span>
                                <code className="text-xs text-muted-foreground font-mono">{selectedEndpoint.path}</code>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Multi-server selector */}
                        {servers.length > 1 && (
                            <Select
                                value={selectedServer}
                                onValueChange={(value) => {
                                    setSelectedServer(value);
                                    setRequest((prev) => ({
                                        ...prev,
                                        url: prev.url.replace(/^https?:\/\/[^/]+/, '')
                                            ? `${value}${prev.url.replace(/^https?:\/\/[^/]*/, '')}`
                                            : `${value}${selectedEndpoint?.path || ''}`,
                                    }));
                                }}
                            >
                                <SelectTrigger size="sm" className="text-xs" data-testid="server-selector">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {servers.map((server: any, idx: number) => (
                                        <SelectItem key={idx} value={server.url}>
                                            {server.description || server.url}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {/* Edit button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/editor/${specId}`)}
                            className="text-xs"
                        >
                            <FileEdit className="w-3.5 h-3.5"/>
                            Edit
                        </Button>

                        {/* Close button */}
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={onClose}
                        >
                            <X className="w-4 h-4"/>
                        </Button>
                    </div>
                </div>

                {/* Fallback URL warning */}
                {parsedSpec && isDummyFallbackUrl(baseUrl, parsedSpec) && (
                    <div
                        className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2 shrink-0">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0"/>
                        <span className="text-xs text-amber-600 dark:text-amber-400">
              No server URL configured. Edit the URL in the request bar or add servers to your spec.
            </span>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Loading / Error states */}
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center space-y-3">
                                <div
                                    className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"/>
                                <p className="text-sm text-muted-foreground">Loading specification...</p>
                            </div>
                        </div>
                    ) : loadError ? (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">{loadError}</p>
                        </div>
                    ) : parsedSpec ? (
                        <>
                            {/* Endpoint Sidebar */}
                            {!isSidebarCollapsed && parsedSpec.paths && Object.keys(parsedSpec.paths).length > 0 && (
                                <div className="hidden md:flex w-72 border-r border-border shrink-0">
                                    <EndpointSidebar
                                        spec={parsedSpec}
                                        selectedEndpoint={selectedEndpoint}
                                        onSelectEndpoint={handleEndpointSelect}
                                        variant="detail"
                                        className="w-full"
                                    />
                                </div>
                            )}

                            {/* Content Area */}
                            {activeView === 'docs' ? (
                                /* Documentation Tab */
                                <div className="flex-1 overflow-auto bg-background p-8 md:p-12 min-h-0">
                                    <ApiDocumentation spec={parsedSpec}/>
                                </div>
                            ) : (
                                /* Try It Out Tab */
                                <div className="flex-1 flex flex-col bg-background min-w-0">
                                    {/* Request Bar */}
                                    <div
                                        className="p-4 border-b border-border flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
                                        <div className="flex-1 flex rounded-md shadow-sm">
                                            <Select
                                                value={request.method}
                                                onValueChange={(value) => setRequest({
                                                    ...request,
                                                    method: value as HTTPMethod
                                                })}
                                            >
                                                <SelectTrigger className={`w-[100px] rounded-r-none text-xs font-bold ${getMethodColor(request.method)}`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="GET">GET</SelectItem>
                                                    <SelectItem value="POST">POST</SelectItem>
                                                    <SelectItem value="PUT">PUT</SelectItem>
                                                    <SelectItem value="PATCH">PATCH</SelectItem>
                                                    <SelectItem value="DELETE">DELETE</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                value={request.url}
                                                onChange={(e) => setRequest({...request, url: e.target.value})}
                                                className="flex-1 rounded-l-none font-mono"
                                                placeholder="Enter request URL"
                                            />
                                        </div>
                                        <Button
                                            onClick={handleSendRequest}
                                            disabled={fetcher.state !== 'idle'}
                                            size="lg"
                                            className="w-full sm:w-auto min-w-[100px]"
                                        >
                                            <span>{fetcher.state !== 'idle' ? 'Sending...' : 'Send'}</span>
                                            <Play className="w-3.5 h-3.5 fill-current"/>
                                        </Button>
                                    </div>

                                    {/* Request/Response Split */}
                                    <ResizablePanelGroup orientation="horizontal"
                                                         className="flex-1 min-h-0 overflow-hidden">
                                        <ResizablePanel defaultSize={60} minSize={30} className="flex flex-col">
                                            {/* Tabs */}
                                            <div
                                                className="flex items-center gap-6 px-4 border-b border-border h-10 shrink-0">
                                                {(['params', 'auth', 'headers', 'body'] as const).map((tab) => (
                                                    <Button
                                                        key={tab}
                                                        variant="ghost"
                                                        size="sm"
                                                        data-testid={`tab-${tab}`}
                                                        onClick={() => setActiveTab(tab)}
                                                        className={`h-full rounded-none text-xs font-medium px-1 capitalize ${
                                                            activeTab === tab
                                                                ? 'text-foreground border-b-2 border-primary'
                                                                : 'text-muted-foreground hover:text-foreground'
                                                        }`}
                                                    >
                                                        {tab === 'auth' ? 'Authorization' : tab}
                                                    </Button>
                                                ))}
                                            </div>

                                            {/* Tab Content */}
                                            <div className="flex-1 overflow-y-auto p-4">
                                                {activeTab === 'params' && (
                                                    <div className="space-y-3">
                                                        <div className="text-xs text-muted-foreground mb-2">
                                                            Query and path parameters for this endpoint
                                                        </div>
                                                        <div
                                                            className="border border-border rounded-md overflow-x-auto">
                                                            <table className="w-full text-xs min-w-[400px]">
                                                                <thead className="bg-muted">
                                                                <tr>
                                                                    <th className="w-10 p-2 text-left font-medium"></th>
                                                                    <th className="p-2 text-left font-medium">Key</th>
                                                                    <th className="p-2 text-left font-medium">Value</th>
                                                                    <th className="p-2 text-left font-medium">Description</th>
                                                                </tr>
                                                                </thead>
                                                                <tbody>
                                                                {request.params.map((param, index) => (
                                                                    <tr key={index}
                                                                        className="border-t border-border hover:bg-muted/50">
                                                                        <td className="p-2">
                                                                            <Checkbox
                                                                                checked={param.enabled}
                                                                                onCheckedChange={(checked) => {
                                                                                    const newParams = [...request.params];
                                                                                    newParams[index].enabled = !!checked;
                                                                                    setRequest({
                                                                                        ...request,
                                                                                        params: newParams
                                                                                    });
                                                                                }}
                                                                            />
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <Input
                                                                                value={param.key}
                                                                                onChange={(e) => {
                                                                                    const newParams = [...request.params];
                                                                                    newParams[index].key = e.target.value;
                                                                                    if (index === request.params.length - 1 && e.target.value) {
                                                                                        newParams.push({
                                                                                            enabled: false,
                                                                                            key: '',
                                                                                            value: '',
                                                                                            description: undefined
                                                                                        });
                                                                                    }
                                                                                    setRequest({
                                                                                        ...request,
                                                                                        params: newParams
                                                                                    });
                                                                                }}
                                                                                placeholder="Parameter name"
                                                                                className="h-7 text-xs"
                                                                            />
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <Input
                                                                                value={param.value}
                                                                                onChange={(e) => {
                                                                                    const newParams = [...request.params];
                                                                                    newParams[index] = {
                                                                                        ...newParams[index],
                                                                                        value: e.target.value,
                                                                                        enabled: e.target.value ? true : newParams[index].enabled,
                                                                                    };
                                                                                    setRequest({
                                                                                        ...request,
                                                                                        params: newParams
                                                                                    });
                                                                                }}
                                                                                placeholder="Value"
                                                                                className="h-7 text-xs"
                                                                            />
                                                                        </td>
                                                                        <td className="p-2">
                                        <span className="text-muted-foreground text-xs truncate block">
                                          {param.description || '-'}
                                        </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {activeTab === 'auth' && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label className="text-xs mb-2">Auth Type</Label>
                                                            <Select
                                                                value={request.auth.type}
                                                                onValueChange={(value) => setRequest({
                                                                    ...request,
                                                                    auth: {
                                                                        ...request.auth,
                                                                        type: value as any
                                                                    },
                                                                })}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">No Auth</SelectItem>
                                                                    <SelectItem value="api-key">API Key</SelectItem>
                                                                    <SelectItem value="bearer">Bearer Token</SelectItem>
                                                                    <SelectItem value="basic">Basic Auth</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            {authWasAutoDetected && request.auth.type === detectedAuth.type && (
                                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                                                    Pre-selected from API specification
                                                                </p>
                                                            )}
                                                        </div>
                                                        {request.auth.type === 'api-key' && (
                                                            <div>
                                                                <Label className="text-xs mb-2">API Key</Label>
                                                                <Input
                                                                    value={request.auth.apiKey || ''}
                                                                    onChange={(e) => setRequest({
                                                                        ...request,
                                                                        auth: {...request.auth, apiKey: e.target.value},
                                                                    })}
                                                                    placeholder="Enter your API key"
                                                                />
                                                                <p className="text-xs text-muted-foreground mt-1">Will
                                                                    be sent as X-API-Key header</p>
                                                            </div>
                                                        )}
                                                        {request.auth.type === 'bearer' && (
                                                            <div>
                                                                <Label className="text-xs mb-2">Token</Label>
                                                                <Input
                                                                    value={request.auth.token || ''}
                                                                    onChange={(e) => setRequest({
                                                                        ...request,
                                                                        auth: {...request.auth, token: e.target.value},
                                                                    })}
                                                                    placeholder="Enter bearer token"
                                                                />
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    Will be sent as Authorization: Bearer {'{token}'}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {request.auth.type === 'basic' && (
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <Label className="text-xs mb-2">Username</Label>
                                                                    <Input
                                                                        value={request.auth.username || ''}
                                                                        onChange={(e) => setRequest({
                                                                            ...request,
                                                                            auth: {
                                                                                ...request.auth,
                                                                                username: e.target.value
                                                                            },
                                                                        })}
                                                                        placeholder="Enter username"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs mb-2">Password</Label>
                                                                    <Input
                                                                        type="password"
                                                                        value={request.auth.password || ''}
                                                                        onChange={(e) => setRequest({
                                                                            ...request,
                                                                            auth: {
                                                                                ...request.auth,
                                                                                password: e.target.value
                                                                            },
                                                                        })}
                                                                        placeholder="Enter password"
                                                                    />
                                                                </div>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Will be sent as Authorization:
                                                                    Basic {'{base64(username:password)}'}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {request.auth.type === 'none' && (
                                                            <div className="text-sm text-muted-foreground">
                                                                No authentication will be used for this request.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {activeTab === 'headers' && (
                                                    <div className="space-y-3">
                                                        <div className="text-xs text-muted-foreground mb-2">
                                                            HTTP headers to include with the request
                                                        </div>
                                                        <div
                                                            className="border border-border rounded-md overflow-x-auto">
                                                            <table className="w-full text-xs min-w-[350px]">
                                                                <thead className="bg-muted">
                                                                <tr>
                                                                    <th className="w-10 p-2 text-left font-medium"></th>
                                                                    <th className="p-2 text-left font-medium">Header</th>
                                                                    <th className="p-2 text-left font-medium">Value</th>
                                                                </tr>
                                                                </thead>
                                                                <tbody>
                                                                {request.headers.map((header, index) => (
                                                                    <tr key={index}
                                                                        className="border-t border-border hover:bg-muted/50">
                                                                        <td className="p-2">
                                                                            <Checkbox
                                                                                checked={header.enabled}
                                                                                onCheckedChange={(checked) => {
                                                                                    const newHeaders = [...request.headers];
                                                                                    newHeaders[index].enabled = !!checked;
                                                                                    setRequest({
                                                                                        ...request,
                                                                                        headers: newHeaders
                                                                                    });
                                                                                }}
                                                                            />
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <Input
                                                                                value={header.key}
                                                                                onChange={(e) => {
                                                                                    const newHeaders = [...request.headers];
                                                                                    newHeaders[index].key = e.target.value;
                                                                                    if (index === request.headers.length - 1 && e.target.value) {
                                                                                        newHeaders.push({
                                                                                            enabled: false,
                                                                                            key: '',
                                                                                            value: ''
                                                                                        });
                                                                                    }
                                                                                    setRequest({
                                                                                        ...request,
                                                                                        headers: newHeaders
                                                                                    });
                                                                                }}
                                                                                placeholder="Header name"
                                                                                className="h-7 text-xs"
                                                                            />
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <Input
                                                                                value={header.value}
                                                                                onChange={(e) => {
                                                                                    const newHeaders = [...request.headers];
                                                                                    newHeaders[index].value = e.target.value;
                                                                                    setRequest({
                                                                                        ...request,
                                                                                        headers: newHeaders
                                                                                    });
                                                                                }}
                                                                                placeholder="Header value"
                                                                                className="h-7 text-xs"
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {activeTab === 'body' && (
                                                    <div
                                                        className="h-full min-h-[200px] border border-border rounded-md overflow-hidden">
                                                        <div ref={bodyEditorRef} className="h-full"/>
                                                    </div>
                                                )}
                                            </div>
                                        </ResizablePanel>

                                        <ResizableHandle withHandle className="hover:bg-primary transition-colors"/>

                                        <ResizablePanel defaultSize={40} minSize={20} className="flex flex-col">
                                            <div
                                                className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
                                                <span className="text-xs font-medium text-foreground">Response</span>
                                                {response && (
                                                    <div
                                                        className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span>Status: <span
                                                            className="text-emerald-600 dark:text-emerald-400 font-medium">{response.status}</span></span>
                                                        <span>Time: {response.time}ms</span>
                                                        <span>Size: {response.size} KB</span>
                                                        <Button variant="ghost" size="icon-xs" onClick={handleCopyResponse}>
                                                            <Copy className="w-4 h-4"/>
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-4">
                                                {response ? (
                                                    <pre className="text-xs font-mono text-foreground">
                            {JSON.stringify(response.body, null, 2)}
                          </pre>
                                                ) : (
                                                    <div className="text-sm text-muted-foreground">
                                                        Response will appear here after sending a request
                                                    </div>
                                                )}
                                            </div>
                                        </ResizablePanel>
                                    </ResizablePanelGroup>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            </DrawerContent>
        </Drawer>
    );
}

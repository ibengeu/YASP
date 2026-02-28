/**
 * ApiDetailDrawer - Full-height bottom drawer with 3-column layout
 * Matches mockup: LEFT sidebar | CENTER request builder | RIGHT response panel
 * Mobile: stacked vertically (flex-col). Desktop: side-by-side (flex-row).
 * Uses shadcn Drawer (vaul) for the drawer shell with body scroll lock.
 */

import {useState, useEffect} from 'react';
import {useFetcher, useNavigate} from 'react-router';
import {
    X, Play, ChevronLeft, ChevronRight,
    AlertTriangle, BookOpen, Maximize2, Send,
} from 'lucide-react';
import {toast} from 'sonner';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';
import {Button} from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {incrementAction} from '@/lib/action-tracker';
import {ApiDocumentation} from './ApiDocumentation';
import {EndpointSidebar} from './EndpointSidebar';
import {RequestParamsTable} from './RequestParamsTable';
import {RequestHeadersTable} from './RequestHeadersTable';
import {RequestAuthPanel} from './RequestAuthPanel';
import {RequestBodyEditor} from './RequestBodyEditor';
import {ResponsePanel} from './ResponsePanel';
import {executeApiRequest} from '@/actions/execute-api-request';
import {getMethodColor as getMethodColorFromConstants} from '@/lib/constants';
import {STORAGE_KEYS, DEFAULT_FALLBACK_URL} from '@/lib/constants';
import {pressAnimation} from '@/lib/animations';
import {
    generateExampleFromSchema,
    resolveRef,
    detectAuthFromSpec,
    isDummyFallbackUrl,
} from './utils';
import {useSpecLoader} from '@/features/api-explorer/hooks/useSpecLoader';
import {useRequestBuilder} from '@/features/api-explorer/hooks/useRequestBuilder';
import type {OperationObject, PathItemObject, ParameterObject, ReferenceObject, RequestBodyObject, ServerObject} from '@/types/openapi-spec';
import type {
    TestResponse,
} from './types';

interface ApiDetailDrawerProps {
    open: boolean;
    onClose: () => void;
    specId: string;
}

export function ApiDetailDrawer({open, onClose, specId}: ApiDetailDrawerProps) {
    const navigate = useNavigate();
    const fetcher = useFetcher();

    // ── Spec loading (replaces 3 useState + useEffect) ───────────────────
    const specState = useSpecLoader(open ? specId : undefined);
    const parsedSpec = specState.status === 'ready' ? specState.spec : null;

    // ── View state ───────────────────────────────────────────────────────
    const [activeView, setActiveView] = useState<'docs' | 'tryitout'>('tryitout');

    // ── Sidebar state ────────────────────────────────────────────────────
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // ── Endpoint state ───────────────────────────────────────────────────
    const [selectedEndpoint, setSelectedEndpoint] = useState<{
        path: string;
        method: string;
        operation: OperationObject;
    } | null>(null);

    // ── Response state ───────────────────────────────────────────────────
    const [response, setResponse] = useState<TestResponse | null>(null);

    // ── Server state ─────────────────────────────────────────────────────
    const baseUrl = parsedSpec?.servers?.[0]?.url || DEFAULT_FALLBACK_URL;
    const servers = parsedSpec?.servers || [];
    const [selectedServer, setSelectedServer] = useState<string>(baseUrl);

    // Auth state
    const detectedAuth = detectAuthFromSpec(parsedSpec);

    // ── Request building (replaces 2 useState + 80-line useEffect) ───────
    const {
        request, setRequest, activeTab, setActiveTab, handleBodyTypeChange,
    } = useRequestBuilder(selectedEndpoint, selectedServer, parsedSpec);

    // ── Auto-select first endpoint + server when spec loads ──────────────
    useEffect(() => {
        if (specState.status !== 'ready') return;
        const spec = specState.spec;

        const serverUrl = spec.servers?.[0]?.url || DEFAULT_FALLBACK_URL;
        setSelectedServer(serverUrl);

        const auth = detectAuthFromSpec(spec);
        setRequest((prev) => ({...prev, auth}));

        if (spec.paths) {
            const firstPath = Object.keys(spec.paths)[0];
            if (firstPath) {
                const pathItem = spec.paths[firstPath] as PathItemObject;
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
    }, [specState.status]);

    // Reset state when drawer closes
    useEffect(() => {
        if (!open) {
            setActiveView('tryitout');
            setResponse(null);
            setSelectedEndpoint(null);
        }
    }, [open]);

    // Sidebar persistence
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.sidebarCollapsed);
        if (saved === 'true') setIsSidebarCollapsed(true);
    }, []);
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, isSidebarCollapsed.toString());
    }, [isSidebarCollapsed]);

    // ── Send request ──────────────────────────────────────────────────────
    // Mitigation for OWASP A07:2025 (Injection): encodeURIComponent prevents URL injection

    const [isExecuting, setIsExecuting] = useState(false);

    const handleSendRequest = async () => {
        setIsExecuting(true);
        setResponse(null);

        const headers: Record<string, string> = {};
        request.headers
            .filter((h) => h.enabled && h.key && h.value)
            .forEach((h) => { headers[h.key] = h.value; });

        let url = request.url;
        const queryParams = request.params.filter(
            (p) => p.enabled && p.key && p.value && p.paramIn !== 'path' && p.paramIn !== 'header' && p.paramIn !== 'cookie'
        );
        if (queryParams.length > 0) {
            const queryString = queryParams
                .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
                .join('&');
            url = `${url}?${queryString}`;
        }

        let requestBody: string | FormData | undefined = undefined;
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
            if (request.bodyType === 'form-data') {
                const formData = new FormData();
                request.bodyFields?.forEach((f) => {
                    formData.append(f.key, f.value);
                });
                requestBody = formData;
            } else if (request.bodyType === 'x-www-form-urlencoded') {
                const params = new URLSearchParams();
                request.bodyFields?.forEach((f) => {
                    params.append(f.key, f.value);
                });
                requestBody = params.toString();
            } else {
                requestBody = request.body;
            }
        }

        try {
            const data = await executeApiRequest({
                method: request.method,
                url,
                headers,
                body: requestBody,
                auth: request.auth,
            });
            setResponse(data);
            toast.success(`Request completed in ${data.time}ms`);
        } catch (error: unknown) {
            const errorMessage = (error as Error).message || 'Request failed';
            toast.error(errorMessage);
            setResponse({
                status: 0, statusText: 'Error', time: 0, size: 0,
                headers: {}, body: {error: errorMessage},
            });
        } finally {
            setIsExecuting(false);
        }
    };

    // ── Handle fetcher response ───────────────────────────────────────────

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

    // ── Helpers ───────────────────────────────────────────────────────────

    const handlePress = (e: React.MouseEvent<HTMLButtonElement>) => {
        pressAnimation(e.currentTarget);
    };

    const scrollToEndpoint = (path: string, method: string) => {
        const elementId = `endpoint-${method}-${path.replace(/\//g, '-')}`;
        const element = document.getElementById(elementId);
        if (element) element.scrollIntoView({behavior: 'smooth', block: 'start'});
    };

    const handleEndpointSelect = (endpoint: { path: string; method: string; operation: OperationObject }) => {
        setSelectedEndpoint(endpoint);
        if (activeView === 'docs') scrollToEndpoint(endpoint.path, endpoint.method);
    };

    // Count badges for tabs
    const enabledParamsCount = request.params.filter((p) => p.enabled && p.key).length;
    const enabledHeadersCount = request.headers.filter((h) => h.enabled && h.key).length;
    const methodColors = getMethodColorFromConstants(request.method);

    // Request tab items — matching mockup: py-3, gap-6, border-b-2 underline
    const requestTabs = [
        {id: 'params', label: 'Params', badge: enabledParamsCount > 0 ? enabledParamsCount : null},
        {id: 'auth', label: 'Auth', badge: null},
        {id: 'headers', label: 'Headers', badge: enabledHeadersCount > 0 ? enabledHeadersCount : null},
        {id: 'body', label: 'Body', badge: null},
    ];

    const isLoading = specState.status === 'loading';
    const loadError = specState.status === 'error' ? specState.message : null;

    return (
        <Drawer open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }} direction="bottom" handleOnly>
            <DrawerContent className="h-[100vh] max-h-[100vh] rounded-none">
                <DrawerTitle className="sr-only">API Details</DrawerTitle>
                <DrawerDescription className="sr-only">View API documentation and test endpoints</DrawerDescription>

                {/* ── Drawer header ─────────────────────────────────────── */}
                <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card/80 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Sidebar toggle */}
                        {parsedSpec?.paths && Object.keys(parsedSpec.paths).length > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                onMouseDown={handlePress}
                                className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                            >
                                {isSidebarCollapsed
                                    ? <ChevronRight className="w-4 h-4"/>
                                    : <ChevronLeft className="w-4 h-4"/>
                                }
                            </button>
                        )}

                        {/* View toggle — matching mockup: segmented control in bg-muted */}
                        <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveView('tryitout');
                                    incrementAction();
                                }}
                                onMouseDown={handlePress}
                                className={`flex items-center gap-1.5 px-2.5 py-1 text-sm font-bold rounded-sm cursor-pointer transition-colors ${
                                    activeView === 'tryitout'
                                        ? 'bg-background text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Play className="w-3.5 h-3.5"/>
                                Try It Out
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveView('docs')}
                                onMouseDown={handlePress}
                                className={`flex items-center gap-1.5 px-2.5 py-1 text-sm font-bold rounded-sm cursor-pointer transition-colors ${
                                    activeView === 'docs'
                                        ? 'bg-background text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <BookOpen className="w-3.5 h-3.5"/>
                                Documentation
                            </button>
                        </div>

                        {/* Breadcrumb — spec title · endpoint summary */}
                        <div className="h-4 w-px bg-border/60"/>
                        {parsedSpec?.info?.title && (
                            <span className="text-sm font-bold text-foreground/80 cursor-default truncate max-w-[160px]">
                                {parsedSpec.info.title}
                            </span>
                        )}
                        {activeView === 'tryitout' && selectedEndpoint && (
                            <>
                                <span className="text-sm text-muted-foreground/60 cursor-default">·</span>
                                {selectedEndpoint.operation?.tags?.[0] && (
                                    <span className="text-sm text-muted-foreground font-medium cursor-default">
                                        {selectedEndpoint.operation.tags[0]}
                                    </span>
                                )}
                                <span className="text-sm text-foreground font-bold cursor-default">
                                    {selectedEndpoint.operation?.summary || selectedEndpoint.path}
                                </span>
                                <span className="px-1.5 py-0.5 rounded border border-border bg-muted/60 text-xs font-bold text-muted-foreground cursor-default uppercase tracking-tight">
                                    OpenAPI {parsedSpec?.openapi}
                                </span>
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
                                <SelectTrigger size="sm" className="text-sm font-medium cursor-pointer" data-testid="server-selector">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    {servers.map((server: ServerObject, idx: number) => (
                                        <SelectItem key={idx} value={server.url} className="cursor-pointer text-sm">
                                            {server.description || server.url}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/editor/${specId}`)}
                            className="text-sm font-bold cursor-pointer"
                        >
                            <Maximize2 className="w-3.5 h-3.5"/>
                            Full Screen
                        </Button>

                        <DrawerClose
                            asChild
                        >
                            <button
                                type="button"
                                onMouseDown={handlePress}
                                className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1 rounded-sm"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4"/>
                            </button>
                        </DrawerClose>
                    </div>
                </div>

                {/* ── Fallback URL warning ──────────────────────────────── */}
                {parsedSpec && isDummyFallbackUrl(baseUrl, parsedSpec) && (
                    <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2 shrink-0">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0"/>
                        <span className="text-xs text-amber-600">
                            No server URL configured. Edit the URL in the request bar or add servers to your spec.
                        </span>
                    </div>
                )}

                {/* ── Main 3-column body ───────────────────────────────── */}
                <div className="flex-1 flex flex-col md:flex-row overflow-auto md:overflow-hidden">
                    {/* Loading / Error states */}
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center cursor-wait">
                            <div className="text-center space-y-3">
                                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"/>
                                <p className="text-sm text-muted-foreground">Loading specification...</p>
                            </div>
                        </div>
                    ) : loadError ? (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">{loadError}</p>
                        </div>
                    ) : parsedSpec ? (
                        <>
                            {/* ── LEFT: Endpoint Sidebar ─────────────────── */}
                            {!isSidebarCollapsed && parsedSpec.paths && Object.keys(parsedSpec.paths).length > 0 && (
                                <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border flex-shrink-0 hidden md:flex">
                                    <EndpointSidebar
                                        spec={parsedSpec}
                                        selectedEndpoint={selectedEndpoint}
                                        onSelectEndpoint={handleEndpointSelect}
                                        variant="detail"
                                        className="w-full"
                                    />
                                </aside>
                            )}

                            {/* ── CENTER + RIGHT: Content area ───────────── */}
                            {activeView === 'docs' ? (
                                <div className="flex-1 overflow-auto bg-background p-8 md:p-12 min-h-0">
                                    <ApiDocumentation spec={parsedSpec}/>
                                </div>
                            ) : (
                                <>
                                    {/* ── CENTER: Request Builder ──────────── */}
                                    <main className="flex-1 flex flex-col min-w-0 min-h-[60vh] md:min-h-0">
                                        {/* URL bar — unified input group */}
                                        <div className="p-4 border-b border-border shrink-0">
                                            <div className="flex items-stretch h-10 rounded-lg border border-border bg-muted/30 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20 transition-all">
                                                <div className="flex items-center px-3 border-r border-border rounded-l-lg cursor-default">
                                                    <span className={`text-sm font-bold ${methodColors.text}`}>
                                                        {request.method}
                                                    </span>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={request.url}
                                                    onChange={(e) => setRequest((prev) => ({...prev, url: e.target.value}))}
                                                    className="flex-1 bg-transparent px-3 text-base text-foreground font-mono placeholder:text-muted-foreground focus:outline-none cursor-text"
                                                    placeholder="Enter request URL"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleSendRequest}
                                                    onMouseDown={handlePress}
                                                    disabled={isExecuting}
                                                    className="px-4 bg-foreground text-background text-xs font-bold rounded-r-lg hover:bg-foreground/90 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isExecuting ? 'Sending...' : 'Send'}
                                                    <Send className="w-3 h-3"/>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Request tabs — underline style */}
                                        <div className="flex items-center px-4 border-b border-border gap-4 shrink-0">
                                            {requestTabs.map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    type="button"
                                                    onClick={() => setActiveTab(tab.id)}
                                                    onMouseDown={handlePress}
                                                    className={`py-2.5 text-sm font-bold cursor-pointer border-b-2 transition-colors ${
                                                        activeTab === tab.id
                                                            ? 'text-foreground border-foreground'
                                                            : 'text-muted-foreground hover:text-foreground border-transparent'
                                                    }`}
                                                    data-testid={`tab-${tab.id}`}
                                                >
                                                    {tab.label}
                                                    {tab.badge !== null && (
                                                        <span className="ml-1 text-xs bg-muted px-1 rounded text-muted-foreground font-bold">
                                                            {tab.badge}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Tab content — flex-1 overflow */}
                                        <div className="flex-1 flex flex-col overflow-hidden">
                                            {activeTab === 'params' && (
                                                <div className="flex-1 overflow-y-auto p-4">
                                                    <RequestParamsTable
                                                        params={request.params}
                                                        onParamsChange={(params) => setRequest((prev) => ({...prev, params}))}
                                                    />
                                                </div>
                                            )}

                                            {activeTab === 'auth' && (
                                                <div className="flex-1 overflow-y-auto p-4">
                                                    <RequestAuthPanel
                                                        auth={request.auth}
                                                        onAuthChange={(auth) => setRequest((prev) => ({...prev, auth}))}
                                                        detectedAuth={detectedAuth}
                                                    />
                                                </div>
                                            )}

                                            {activeTab === 'headers' && (
                                                <div className="flex-1 overflow-y-auto p-4">
                                                    <RequestHeadersTable
                                                        headers={request.headers}
                                                        onHeadersChange={(headers) => setRequest((prev) => ({...prev, headers}))}
                                                    />
                                                </div>
                                            )}

                                            {activeTab === 'body' && (
                                                <RequestBodyEditor
                                                    key={selectedEndpoint ? `${selectedEndpoint.method}-${selectedEndpoint.path}` : 'default'}
                                                    body={request.body}
                                                    bodyFields={request.bodyFields}
                                                    bodyType={request.bodyType}
                                                    onBodyChange={(body) => {
                                                        if (body === '' && selectedEndpoint) {
                                                            let exampleBody = '{\n  \n}';
                                                            if (selectedEndpoint.operation?.requestBody) {
                                                                let requestBody = selectedEndpoint.operation.requestBody;
                                                                if ((requestBody as ReferenceObject).$ref && parsedSpec) requestBody = (resolveRef((requestBody as ReferenceObject).$ref, parsedSpec) as RequestBodyObject) ?? requestBody;
                                                                const rb = requestBody as RequestBodyObject;
                                                                const content = rb.content || {};
                                                                const jsonContent = content['application/json'];
                                                                if (jsonContent?.schema) {
                                                                    exampleBody = generateExampleFromSchema(jsonContent.schema, 0, parsedSpec);
                                                                }
                                                            } else if (selectedEndpoint.operation?.parameters) {
                                                                const bodyParam = (selectedEndpoint.operation.parameters as (ParameterObject | ReferenceObject)[]).find((p) => (p as ParameterObject).in === ('body' as unknown)) as ParameterObject;
                                                                if (bodyParam?.schema) {
                                                                    exampleBody = generateExampleFromSchema(bodyParam.schema, 0, parsedSpec);
                                                                }
                                                            }
                                                            setRequest((prev) => ({...prev, body: exampleBody}));
                                                        } else {
                                                            setRequest((prev) => ({...prev, body}));
                                                        }
                                                    }}
                                                    onBodyFieldsChange={(fields) => setRequest((prev) => ({...prev, bodyFields: fields}))}
                                                    onBodyTypeChange={handleBodyTypeChange}
                                                />
                                            )}
                                        </div>
                                    </main>

                                    {/* ── RIGHT: Response Panel ─────────────── */}
                                    <aside className="w-full md:w-96 border-t md:border-t-0 md:border-l border-border flex-shrink-0 flex flex-col">
                                        <ResponsePanel
                                            response={response}
                                            isLoading={isExecuting}
                                        />
                                    </aside>
                                </>
                            )}
                        </>
                    ) : null}
                </div>
            </DrawerContent>
        </Drawer>
    );
}

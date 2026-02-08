/**
 * TryItOutDrawer - Complete API testing console with endpoint explorer
 * Matching reference platform functionality
 */

import { useState, useEffect, useRef } from 'react';
import { useFetcher } from 'react-router';
import {
  X, Play, ChevronLeft, ChevronRight, Search,
  ChevronDown, Folder, FolderOpen, Copy, GripHorizontal,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { EditorView, lineNumbers } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import type { OperationObject } from '@/types/openapi-spec';
import { STORAGE_KEYS, DEFAULT_HEADERS, DRAWER_LAYOUT, DEFAULT_FALLBACK_URL } from '@/lib/constants';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Generate example JSON from OpenAPI schema
 * Mitigation for OWASP A04:2025 - Insecure Design: Provides valid example data structure
 */
function generateExampleFromSchema(schema: any, depth = 0): string {
  if (depth > 5) return '{}'; // Prevent infinite recursion

  if (schema.example !== undefined) {
    return JSON.stringify(schema.example, null, 2);
  }

  if (schema.type === 'object' && schema.properties) {
    const obj: any = {};
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const prop = propSchema as any;
      if (prop.example !== undefined) {
        obj[key] = prop.example;
      } else if (prop.type === 'string') {
        obj[key] = prop.enum?.[0] || prop.default || 'string';
      } else if (prop.type === 'number' || prop.type === 'integer') {
        obj[key] = prop.default ?? 0;
      } else if (prop.type === 'boolean') {
        obj[key] = prop.default ?? true;
      } else if (prop.type === 'array') {
        obj[key] = [];
      } else if (prop.type === 'object') {
        obj[key] = JSON.parse(generateExampleFromSchema(prop, depth + 1));
      } else {
        obj[key] = null;
      }
    }
    return JSON.stringify(obj, null, 2);
  }

  if (schema.type === 'array' && schema.items) {
    return '[]';
  }

  return '{\n  \n}';
}

interface ParamRow {
  enabled: boolean;
  key: string;
  value: string;
  description?: string;
  /** OpenAPI parameter location: query, path, header, cookie */
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

interface ParsedEndpoint {
  path: string;
  method: HTTPMethod;
  operation: OperationObject;
  summary?: string;
  tags?: string[];
}

interface EndpointGroup {
  tag: string;
  endpoints: ParsedEndpoint[];
}

/** Detect auth type from OpenAPI securitySchemes (Gap 1 fix) */
function detectAuthFromSpec(spec: any): { type: 'none' | 'api-key' | 'bearer' | 'basic' } {
  const securitySchemes = spec?.components?.securitySchemes;
  const globalSecurity = spec?.security;

  if (!securitySchemes || !globalSecurity || globalSecurity.length === 0) {
    return { type: 'none' };
  }

  const firstName = Object.keys(globalSecurity[0])[0];
  const scheme = securitySchemes[firstName];
  if (!scheme) return { type: 'none' };

  if (scheme.type === 'http' && scheme.scheme === 'bearer') return { type: 'bearer' };
  if (scheme.type === 'http' && scheme.scheme === 'basic') return { type: 'basic' };
  if (scheme.type === 'apiKey') return { type: 'api-key' };

  return { type: 'none' };
}

/** Check if baseUrl is a dummy fallback (Gap 4 fix) */
function isDummyFallbackUrl(url: string, spec: any): boolean {
  return url === DEFAULT_FALLBACK_URL && (!spec?.servers || spec.servers.length === 0);
}

interface TryItOutDrawerProps {
  open: boolean;
  onClose: () => void;
  operation: OperationObject;
  path: string;
  method: string;
  baseUrl: string;
  // For full spec parsing
  spec?: any;
}

export function TryItOutDrawer({
  open,
  onClose,
  operation: _initialOperation,
  path: initialPath,
  method: initialMethod,
  baseUrl,
  spec,
}: TryItOutDrawerProps) {
  const fetcher = useFetcher();
  const [activeTab, setActiveTab] = useState<'params' | 'auth' | 'headers' | 'body'>('params');
  const [response, setResponse] = useState<TestResponse | null>(null);
  const [drawerHeight, setDrawerHeight] = useState<number>(DRAWER_LAYOUT.defaultHeight);
  const [isResizing, setIsResizing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const bodyEditorRef = useRef<HTMLDivElement>(null);
  const bodyEditorViewRef = useRef<EditorView | null>(null);

  // Endpoint management
  const [endpointGroups, setEndpointGroups] = useState<EndpointGroup[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ParsedEndpoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Gap 1: Derive initial auth type from spec securitySchemes
  const detectedAuth = detectAuthFromSpec(spec);
  const authWasAutoDetected = detectedAuth.type !== 'none';

  // Gap 3: Multi-server support
  const servers = spec?.servers || [];
  const [selectedServer, setSelectedServer] = useState<string>(baseUrl);

  const [request, setRequest] = useState<TestRequest>({
    method: (initialMethod?.toUpperCase() as HTTPMethod) || 'GET',
    url: `${baseUrl}${initialPath}`,
    params: [],
    headers: [
      ...DEFAULT_HEADERS.map(h => ({ ...h })),
      { enabled: false, key: '', value: '' },
    ],
    auth: detectedAuth,
    body: '{\n  \n}',
  });

  // Load drawer height from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.drawerHeight);
    if (saved) {
      const height = parseInt(saved, 10);
      if (!isNaN(height)) setDrawerHeight(height);
    }
  }, []);

  // Save drawer height
  useEffect(() => {
    if (!isResizing) {
      localStorage.setItem(STORAGE_KEYS.drawerHeight, drawerHeight.toString());
    }
  }, [drawerHeight, isResizing]);

  // Load sidebar state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.sidebarCollapsed);
    if (saved === 'true') setIsSidebarCollapsed(true);
  }, []);

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  // Parse endpoints from spec
  useEffect(() => {
    if (!spec?.paths) {
      setEndpointGroups([]);
      return;
    }

    const endpoints: ParsedEndpoint[] = [];
    Object.entries(spec.paths).forEach(([path, pathItem]: [string, any]) => {
      ['get', 'post', 'put', 'delete', 'patch'].forEach((method) => {
        if (pathItem[method]) {
          endpoints.push({
            path,
            method: method.toUpperCase() as HTTPMethod,
            operation: pathItem[method],
            summary: pathItem[method].summary,
            tags: pathItem[method].tags || ['default'],
          });
        }
      });
    });

    // Group by tags
    const grouped = new Map<string, ParsedEndpoint[]>();
    endpoints.forEach((endpoint) => {
      const tag = endpoint.tags?.[0] || 'default';
      if (!grouped.has(tag)) grouped.set(tag, []);
      grouped.get(tag)!.push(endpoint);
    });

    const groups = Array.from(grouped.entries()).map(([tag, endpoints]) => ({
      tag,
      endpoints,
    }));

    setEndpointGroups(groups);
    setExpandedGroups(new Set(groups.map(g => g.tag)));

    // Set initial endpoint
    if (!selectedEndpoint && endpoints.length > 0) {
      const initial = endpoints.find(
        e => e.path === initialPath && e.method === initialMethod.toUpperCase()
      ) || endpoints[0];
      setSelectedEndpoint(initial);
    }
  }, [spec]);

  // Initialize CodeMirror for body editor
  useEffect(() => {
    if (!bodyEditorRef.current || bodyEditorViewRef.current) return;

    const state = EditorState.create({
      doc: request.body,
      extensions: [
        json(),
        lineNumbers(),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newBody = update.state.doc.toString();
            setRequest(prev => ({ ...prev, body: newBody }));
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '13px',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: 'ui-monospace, monospace',
          },
        }),
      ],
    });

    bodyEditorViewRef.current = new EditorView({
      state,
      parent: bodyEditorRef.current,
    });

    return () => {
      bodyEditorViewRef.current?.destroy();
      bodyEditorViewRef.current = null;
    };
  }, []);

  // Update editor content when request body changes externally
  useEffect(() => {
    if (!bodyEditorViewRef.current) return;

    const currentDoc = bodyEditorViewRef.current.state.doc.toString();
    if (currentDoc !== request.body) {
      bodyEditorViewRef.current.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: request.body,
        },
      });
    }
  }, [selectedEndpoint]); // Only update when endpoint changes

  // Update request when endpoint or server changes
  useEffect(() => {
    if (!selectedEndpoint) return;

    const fullUrl = `${selectedServer}${selectedEndpoint.path}`;

    // Merge path-level and operation-level parameters per OpenAPI spec.
    // Operation-level params override path-level params with same name+in.
    const pathLevelParams = (spec?.paths?.[selectedEndpoint.path]?.parameters || []) as any[];
    const operationParams = (selectedEndpoint.operation?.parameters || []) as any[];

    // Deduplicate: operation params take precedence over path-level params
    const paramMap = new Map<string, any>();
    for (const param of pathLevelParams) {
      paramMap.set(`${param.name}:${param.in}`, param);
    }
    for (const param of operationParams) {
      paramMap.set(`${param.name}:${param.in}`, param);
    }
    const allParameters = Array.from(paramMap.values());

    // Separate parameters by location
    const paramRows: ParamRow[] = [];
    const headerParamsFromSpec: HeaderRow[] = [];

    for (const param of allParameters) {
      const location = param.in as string;
      if (location === 'header') {
        // Header params go to the headers array
        headerParamsFromSpec.push({
          enabled: param.required || true,
          key: param.name,
          value: param.schema?.default || '',
        });
      } else if (location === 'query' || location === 'path' || location === 'cookie') {
        paramRows.push({
          // Path params are always required per OpenAPI spec
          enabled: location === 'path' ? true : (param.required || false),
          key: param.name,
          value: param.schema?.default?.toString() || '',
          description: param.description,
          paramIn: location as ParamRow['paramIn'],
        });
      }
    }

    // Add empty row for manual input
    paramRows.push({ enabled: false, key: '', value: '', description: undefined });

    // Generate example body from requestBody schema
    // Support multiple content types: application/json, text/plain, application/x-www-form-urlencoded, etc.
    let exampleBody = '{\n  \n}';
    if (selectedEndpoint.operation?.requestBody) {
      const requestBody = selectedEndpoint.operation.requestBody as any;
      const content = requestBody.content || {};

      // Priority: JSON > Form URL Encoded > Text > First available
      const jsonContent = content['application/json'];
      const formContent = content['application/x-www-form-urlencoded'];
      const textContent = content['text/plain'];
      const firstContentType = Object.keys(content)[0];

      if (jsonContent) {
        if (jsonContent.schema) {
          exampleBody = generateExampleFromSchema(jsonContent.schema);
        } else if (jsonContent.example) {
          exampleBody = JSON.stringify(jsonContent.example, null, 2);
        }
      } else if (formContent) {
        // Generate URL-encoded format
        if (formContent.schema?.properties) {
          const params = Object.keys(formContent.schema.properties)
            .map(key => `${key}=value`)
            .join('&');
          exampleBody = params || 'key=value';
        } else {
          exampleBody = 'key=value&key2=value2';
        }
      } else if (textContent) {
        exampleBody = textContent.example || 'Plain text content';
      } else if (firstContentType && content[firstContentType]) {
        // Fallback to first available content type
        const firstContent = content[firstContentType];
        if (firstContent.example) {
          exampleBody = typeof firstContent.example === 'string'
            ? firstContent.example
            : JSON.stringify(firstContent.example, null, 2);
        }
      }
    }

    // Merge spec header params with default headers
    const mergedHeaders = [
      ...DEFAULT_HEADERS.map(h => ({ ...h })),
      ...headerParamsFromSpec,
      { enabled: false, key: '', value: '' }, // empty row for manual input
    ];

    setRequest(prev => ({
      ...prev,
      method: selectedEndpoint.method,
      url: fullUrl,
      params: paramRows,
      headers: mergedHeaders,
      body: exampleBody,
    }));

    // Switch tab based on method
    if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method)) {
      setActiveTab('body');
    } else {
      setActiveTab('params');
    }
  }, [selectedEndpoint, selectedServer]);

  const handleSendRequest = () => {
    // Build headers from enabled rows
    const headers: Record<string, string> = {};
    request.headers
      .filter(h => h.enabled && h.key && h.value)
      .forEach(h => {
        headers[h.key] = h.value;
      });

    // Substitute path parameters into the URL
    // Mitigation for OWASP A07:2025 (Injection): encodeURIComponent prevents URL injection
    let url = request.url;
    const pathParams = request.params.filter(p => p.paramIn === 'path' && p.key && p.value);
    for (const param of pathParams) {
      url = url.replace(`{${param.key}}`, encodeURIComponent(param.value));
    }
    // Build query string from query params only (paramIn === 'query' or undefined for user-added)
    const queryParams = request.params.filter(
      p => p.enabled && p.key && p.value && p.paramIn !== 'path' && p.paramIn !== 'header' && p.paramIn !== 'cookie'
    );
    if (queryParams.length > 0) {
      const queryString = queryParams
        .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        .join('&');
      url = `${url}?${queryString}`;
    }

    // Submit to React Router action
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
          status: 0,
          statusText: 'Error',
          time: 0,
          size: 0,
          headers: {},
          body: { error: errorMessage },
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
      case 'GET': return 'text-blue-500';
      case 'POST': return 'text-green-500';
      case 'PUT': return 'text-amber-500';
      case 'PATCH': return 'text-purple-500';
      case 'DELETE': return 'text-red-500';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isResizing) return;

    let startY = 0;
    let startHeight = drawerHeight;

    const handleMouseMove = (e: MouseEvent) => {
      if (startY === 0) startY = e.clientY;
      const deltaY = startY - e.clientY;
      const newHeight = startHeight + deltaY;
      const minHeight = DRAWER_LAYOUT.minHeight;
      const maxHeight = window.innerHeight * DRAWER_LAYOUT.maxHeightRatio;
      setDrawerHeight(Math.max(minHeight, Math.min(maxHeight, newHeight)));
    };

    const handleMouseUp = () => setIsResizing(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, drawerHeight]);

  const filteredGroups = endpointGroups.map(group => ({
    ...group,
    endpoints: group.endpoints.filter(e =>
      e.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.summary?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(g => g.endpoints.length > 0);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed inset-x-0 bottom-0 bg-background border-t border-border z-50 flex flex-col animate-slideUp shadow-2xl"
        style={{ height: `${drawerHeight}px` }}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`h-1 bg-muted hover:bg-primary transition-colors cursor-row-resize flex items-center justify-center group relative ${
            isResizing ? 'bg-primary' : ''
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-3 flex items-center justify-center">
            <GripHorizontal className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>

        {/* Header */}
        <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-background shrink-0">
          <div className="flex items-center gap-3">
            {endpointGroups.length > 0 && (
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
            <h2 className="text-sm font-semibold text-card-foreground">API Testing Console</h2>
            {selectedEndpoint && (
              <>
                <div className="h-4 w-px bg-border" />
                <span className={`text-xs font-bold ${getMethodColor(selectedEndpoint.method)}`}>
                  {selectedEndpoint.method}
                </span>
                <code className="text-xs text-muted-foreground font-mono">{selectedEndpoint.path}</code>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Gap 3: Multi-server selector */}
            {servers.length > 1 && (
              <select
                data-testid="server-selector"
                value={selectedServer}
                onChange={(e) => {
                  setSelectedServer(e.target.value);
                  // Update current request URL with new server
                  setRequest(prev => ({
                    ...prev,
                    url: prev.url.replace(/^https?:\/\/[^/]+/, '') // strip old host
                      ? `${e.target.value}${prev.url.replace(/^https?:\/\/[^/]*/, '')}`
                      : `${e.target.value}${initialPath}`,
                  }));
                }}
                className="h-8 bg-muted border border-border rounded px-2 text-xs focus:outline-none focus:border-primary"
              >
                {servers.map((server: any, idx: number) => (
                  <option key={idx} value={server.url}>
                    {server.description || server.url}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Gap 4: Fallback URL warning */}
        {isDummyFallbackUrl(baseUrl, spec) && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs text-amber-700 dark:text-amber-400">
              No server URL configured. Edit the URL in the request bar or add servers to your spec.
            </span>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Endpoints Sidebar */}
          {endpointGroups.length > 0 && !isSidebarCollapsed && (
            <div className="hidden md:flex w-72 border-r border-border flex-col bg-muted/30 shrink-0">
              {/* Search */}
              <div className="p-3 border-b border-border shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search endpoints..."
                    className="w-full bg-background border border-border text-foreground text-xs rounded pl-8 pr-3 h-8 focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Endpoint Groups */}
              <div className="flex-1 overflow-y-auto py-2">
                {filteredGroups.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                    No endpoints found
                  </div>
                ) : (
                  filteredGroups.map((group) => (
                    <div key={group.tag} className="mb-2">
                      <button
                        onClick={() => {
                          setExpandedGroups(prev => {
                            const next = new Set(prev);
                            if (next.has(group.tag)) {
                              next.delete(group.tag);
                            } else {
                              next.add(group.tag);
                            }
                            return next;
                          });
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 text-xs font-medium text-foreground"
                      >
                        {expandedGroups.has(group.tag) ? (
                          <FolderOpen className="w-4 h-4" />
                        ) : (
                          <Folder className="w-4 h-4" />
                        )}
                        <span>{group.tag}</span>
                        <span className="text-muted-foreground ml-auto">{group.endpoints.length}</span>
                      </button>
                      {expandedGroups.has(group.tag) && (
                        <div className="ml-2">
                          {group.endpoints.map((endpoint) => (
                            <button
                              key={`${endpoint.method}-${endpoint.path}`}
                              onClick={() => setSelectedEndpoint(endpoint)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50 transition-colors ${
                                selectedEndpoint === endpoint ? 'bg-muted' : ''
                              }`}
                            >
                              <span className={`font-bold w-12 ${getMethodColor(endpoint.method)}`}>
                                {endpoint.method}
                              </span>
                              <code className="text-muted-foreground font-mono flex-1 text-left truncate">
                                {endpoint.path}
                              </code>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-border text-xs text-muted-foreground shrink-0">
                <div className="flex items-center justify-between">
                  <span>{endpointGroups.reduce((sum, g) => sum + g.endpoints.length, 0)} endpoints</span>
                  <span>{endpointGroups.length} groups</span>
                </div>
              </div>
            </div>
          )}

          {/* Testing Panel */}
          <div className="flex-1 flex flex-col bg-background min-w-0">
            {/* Request Bar */}
            <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
              <div className="flex-1 flex rounded-md shadow-sm">
                {/* Method */}
                <div className="relative">
                  <select
                    value={request.method}
                    onChange={(e) => setRequest({ ...request, method: e.target.value as HTTPMethod })}
                    className={`appearance-none h-10 pl-3 pr-8 bg-muted border border-border rounded-l-md text-xs font-bold ${getMethodColor(request.method)} focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer`}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-3 text-muted-foreground pointer-events-none w-4 h-4" />
                </div>
                {/* URL Input */}
                <input
                  type="text"
                  value={request.url}
                  onChange={(e) => setRequest({ ...request, url: e.target.value })}
                  className="flex-1 bg-muted border-y border-r border-border text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary font-mono placeholder:text-muted-foreground"
                  placeholder="Enter request URL"
                />
              </div>
              {/* Send Button */}
              <button
                onClick={handleSendRequest}
                disabled={fetcher.state !== 'idle'}
                className="h-10 px-6 bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 w-full sm:w-auto min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{fetcher.state !== 'idle' ? 'Sending...' : 'Send'}</span>
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>

            {/* Request/Response Split */}
            <ResizablePanelGroup
              orientation="horizontal"
              className="flex-1 min-h-0 overflow-hidden"
            >
              {/* Request Config */}
              <ResizablePanel
                defaultSize={60}
                minSize={30}
                className="flex flex-col"
              >
                {/* Tabs */}
                <div className="flex items-center gap-6 px-4 border-b border-border h-10 shrink-0">
                  {['params', 'auth', 'headers', 'body'].map((tab) => (
                    <button
                      key={tab}
                      data-testid={`tab-${tab}`}
                      onClick={() => setActiveTab(tab as any)}
                      className={`h-full text-xs font-medium px-1 transition-colors capitalize ${
                        activeTab === tab
                          ? 'text-foreground border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab === 'auth' ? 'Authorization' : tab}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {activeTab === 'params' && (
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground mb-2">
                        Query and path parameters for this endpoint
                      </div>
                      <div className="border border-border rounded-md overflow-x-auto">
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
                              <tr key={index} className="border-t border-border hover:bg-muted/50">
                                <td className="p-2">
                                  <input
                                    type="checkbox"
                                    checked={param.enabled}
                                    onChange={(e) => {
                                      const newParams = [...request.params];
                                      newParams[index].enabled = e.target.checked;
                                      setRequest({ ...request, params: newParams });
                                    }}
                                    className="w-4 h-4 rounded border-border cursor-pointer"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={param.key}
                                    onChange={(e) => {
                                      const newParams = [...request.params];
                                      newParams[index].key = e.target.value;
                                      // Add new empty row if this was the last row and now has content
                                      if (index === request.params.length - 1 && e.target.value) {
                                        newParams.push({ enabled: false, key: '', value: '', description: undefined });
                                      }
                                      setRequest({ ...request, params: newParams });
                                    }}
                                    placeholder="Parameter name"
                                    className="w-full bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={param.value}
                                    onChange={(e) => {
                                      const newParams = [...request.params];
                                      newParams[index] = {
                                        ...newParams[index],
                                        value: e.target.value,
                                        // Auto-enable param when user types a value
                                        enabled: e.target.value ? true : newParams[index].enabled,
                                      };
                                      setRequest({ ...request, params: newParams });
                                    }}
                                    placeholder="Value"
                                    className="w-full bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
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
                        <label className="text-xs font-medium text-foreground mb-2 block">Auth Type</label>
                        <select
                          value={request.auth.type}
                          onChange={(e) => setRequest({
                            ...request,
                            auth: { ...request.auth, type: e.target.value as any }
                          })}
                          className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        >
                          <option value="none">No Auth</option>
                          <option value="api-key">API Key</option>
                          <option value="bearer">Bearer Token</option>
                          <option value="basic">Basic Auth</option>
                        </select>
                        {/* Gap 1: Show hint when auth was pre-selected from spec */}
                        {authWasAutoDetected && request.auth.type === detectedAuth.type && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Pre-selected from API specification
                          </p>
                        )}
                      </div>

                      {request.auth.type === 'api-key' && (
                        <div>
                          <label className="text-xs font-medium text-foreground mb-2 block">API Key</label>
                          <input
                            type="text"
                            value={request.auth.apiKey || ''}
                            onChange={(e) => setRequest({
                              ...request,
                              auth: { ...request.auth, apiKey: e.target.value }
                            })}
                            placeholder="Enter your API key"
                            className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Will be sent as X-API-Key header
                          </p>
                        </div>
                      )}

                      {request.auth.type === 'bearer' && (
                        <div>
                          <label className="text-xs font-medium text-foreground mb-2 block">Token</label>
                          <input
                            type="text"
                            value={request.auth.token || ''}
                            onChange={(e) => setRequest({
                              ...request,
                              auth: { ...request.auth, token: e.target.value }
                            })}
                            placeholder="Enter bearer token"
                            className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Will be sent as Authorization: Bearer {'{token}'}
                          </p>
                        </div>
                      )}

                      {request.auth.type === 'basic' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-foreground mb-2 block">Username</label>
                            <input
                              type="text"
                              value={request.auth.username || ''}
                              onChange={(e) => setRequest({
                                ...request,
                                auth: { ...request.auth, username: e.target.value }
                              })}
                              placeholder="Enter username"
                              className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-foreground mb-2 block">Password</label>
                            <input
                              type="password"
                              value={request.auth.password || ''}
                              onChange={(e) => setRequest({
                                ...request,
                                auth: { ...request.auth, password: e.target.value }
                              })}
                              placeholder="Enter password"
                              className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Will be sent as Authorization: Basic {'{base64(username:password)}'}
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
                      <div className="border border-border rounded-md overflow-x-auto">
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
                              <tr key={index} className="border-t border-border hover:bg-muted/50">
                                <td className="p-2">
                                  <input
                                    type="checkbox"
                                    checked={header.enabled}
                                    onChange={(e) => {
                                      const newHeaders = [...request.headers];
                                      newHeaders[index].enabled = e.target.checked;
                                      setRequest({ ...request, headers: newHeaders });
                                    }}
                                    className="w-4 h-4 rounded border-border cursor-pointer"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={header.key}
                                    onChange={(e) => {
                                      const newHeaders = [...request.headers];
                                      newHeaders[index].key = e.target.value;
                                      // Add new empty row if this was the last row and now has content
                                      if (index === request.headers.length - 1 && e.target.value) {
                                        newHeaders.push({ enabled: false, key: '', value: '' });
                                      }
                                      setRequest({ ...request, headers: newHeaders });
                                    }}
                                    placeholder="Header name"
                                    className="w-full bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={header.value}
                                    onChange={(e) => {
                                      const newHeaders = [...request.headers];
                                      newHeaders[index].value = e.target.value;
                                      setRequest({ ...request, headers: newHeaders });
                                    }}
                                    placeholder="Header value"
                                    className="w-full bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
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
                    <div className="h-full min-h-[200px] border border-border rounded-md overflow-hidden">
                      <div ref={bodyEditorRef} className="h-full" />
                    </div>
                  )}
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="hover:bg-primary transition-colors" />

              {/* Response */}
              <ResizablePanel
                defaultSize={40}
                minSize={20}
                className="flex flex-col"
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
                  <span className="text-xs font-medium text-foreground">Response</span>
                  {response && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Status: <span className="text-green-500 font-medium">{response.status}</span></span>
                      <span>Time: {response.time}ms</span>
                      <span>Size: {response.size} KB</span>
                      <button onClick={handleCopyResponse} className="p-1 hover:text-foreground">
                        <Copy className="w-4 h-4" />
                      </button>
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
        </div>
      </div>
    </>
  );
}

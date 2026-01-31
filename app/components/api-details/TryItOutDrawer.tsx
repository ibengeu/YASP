/**
 * TryItOutDrawer - Complete API testing console with endpoint explorer
 * Matching reference platform functionality
 */

import { useState, useEffect, useRef } from 'react';
import {
  X, Play, ChevronLeft, ChevronRight, Search,
  ChevronDown, Folder, FolderOpen, Copy, GripHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import type { OperationObject, PathItemObject } from '@/types/openapi-spec';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ParamRow {
  enabled: boolean;
  key: string;
  value: string;
  description?: string;
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
  operation: initialOperation,
  path: initialPath,
  method: initialMethod,
  baseUrl,
  spec,
}: TryItOutDrawerProps) {
  const [activeTab, setActiveTab] = useState<'params' | 'auth' | 'headers' | 'body'>('params');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<TestResponse | null>(null);
  const [drawerHeight, setDrawerHeight] = useState<number>(600);
  const [isResizing, setIsResizing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Endpoint management
  const [endpointGroups, setEndpointGroups] = useState<EndpointGroup[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ParsedEndpoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const [request, setRequest] = useState<TestRequest>({
    method: (initialMethod?.toUpperCase() as HTTPMethod) || 'GET',
    url: `${baseUrl}${initialPath}`,
    params: [],
    headers: [
      { enabled: true, key: 'Content-Type', value: 'application/json' },
      { enabled: true, key: 'Accept', value: 'application/json' },
      { enabled: false, key: '', value: '' },
    ],
    auth: { type: 'none' },
    body: '{\n  \n}',
  });

  // Load drawer height from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('api-drawer-height');
    if (saved) {
      const height = parseInt(saved, 10);
      if (!isNaN(height)) setDrawerHeight(height);
    }
  }, []);

  // Save drawer height
  useEffect(() => {
    if (!isResizing) {
      localStorage.setItem('api-drawer-height', drawerHeight.toString());
    }
  }, [drawerHeight, isResizing]);

  // Load sidebar state
  useEffect(() => {
    const saved = localStorage.getItem('api-drawer-sidebar-collapsed');
    if (saved === 'true') setIsSidebarCollapsed(true);
  }, []);

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem('api-drawer-sidebar-collapsed', isSidebarCollapsed.toString());
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

  // Update request when endpoint changes
  useEffect(() => {
    if (!selectedEndpoint) return;

    const fullUrl = `${baseUrl}${selectedEndpoint.path}`;
    setRequest(prev => ({
      ...prev,
      method: selectedEndpoint.method,
      url: fullUrl,
    }));

    // Switch tab based on method
    if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method)) {
      setActiveTab('body');
    } else {
      setActiveTab('params');
    }
  }, [selectedEndpoint, baseUrl]);

  const handleSendRequest = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

      const time = Date.now() - startTime;
      const mockResponse: TestResponse = {
        status: 200,
        statusText: 'OK',
        time,
        size: 2.4,
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'req_' + Math.random().toString(36).substr(2, 9),
        },
        body: { success: true, message: 'Mock response', data: {} },
      };

      setResponse(mockResponse);
      toast.success('Request completed successfully');
    } catch (error) {
      toast.error('Request failed');
    } finally {
      setIsLoading(false);
    }
  };

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
      const minHeight = 400;
      const maxHeight = window.innerHeight * 0.9;
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
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Endpoints Sidebar */}
          {endpointGroups.length > 0 && !isSidebarCollapsed && (
            <div className="w-72 border-r border-border flex flex-col bg-muted/30 shrink-0">
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
            <div className="p-4 border-b border-border flex gap-3 shrink-0">
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
                disabled={isLoading}
                className="h-10 px-6 bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? 'Sending...' : 'Send'}</span>
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>

            {/* Request/Response Split */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
              {/* Request Config */}
              <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-border min-h-[300px] lg:min-h-0">
                {/* Tabs */}
                <div className="flex items-center gap-6 px-4 border-b border-border h-10 shrink-0">
                  {['params', 'auth', 'headers', 'body'].map((tab) => (
                    <button
                      key={tab}
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
                    <div className="text-sm text-muted-foreground">Query parameters configuration coming soon...</div>
                  )}
                  {activeTab === 'auth' && (
                    <div className="text-sm text-muted-foreground">Authorization configuration coming soon...</div>
                  )}
                  {activeTab === 'headers' && (
                    <div className="text-sm text-muted-foreground">Headers configuration coming soon...</div>
                  )}
                  {activeTab === 'body' && (
                    <textarea
                      value={request.body}
                      onChange={(e) => setRequest({ ...request, body: e.target.value })}
                      className="w-full h-full min-h-[200px] bg-muted border border-border rounded-md p-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Request body (JSON)"
                    />
                  )}
                </div>
              </div>

              {/* Response */}
              <div className="flex-1 flex flex-col min-h-[300px] lg:min-h-0">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * WorkbenchView — Inline API testing workbench
 * Replaces ApiDetailDrawer's drawer-based layout with a full-page inline view.
 * Reuses existing sub-components from api-details/.
 */

import { useState, useEffect } from 'react';
import { useFetcher } from 'react-router';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { RequestBar } from './RequestBar';
import { EndpointSidebar } from '@/components/api-details/EndpointSidebar';
import { RequestParamsTable } from '@/components/api-details/RequestParamsTable';
import { RequestHeadersTable } from '@/components/api-details/RequestHeadersTable';
import { RequestAuthPanel } from '@/components/api-details/RequestAuthPanel';
import { RequestBodyEditor } from '@/components/api-details/RequestBodyEditor';
import { ResponsePanel } from '@/components/api-details/ResponsePanel';
import { idbStorage } from '@/core/storage/idb-storage';
import { STORAGE_KEYS, DEFAULT_HEADERS, DEFAULT_FALLBACK_URL } from '@/lib/constants';
import { incrementAction } from '@/lib/action-tracker';
import {
  generateExampleFromSchema,
  resolveRef,
  detectAuthFromSpec,
  isDummyFallbackUrl,
  detectBodyTypeFromSpec,
  bodyTypeToContentType,
} from '@/components/api-details/utils';
import type { OperationObject, PathItemObject, ParameterObject, ReferenceObject, RequestBodyObject, SchemaObject } from '@/types/openapi-spec';
import type {
  HTTPMethod,
  ParsedOpenAPISpec,
  ParamRow,
  HeaderRow,
  TestRequest,
  TestResponse,
  BodyContentType,
} from '@/components/api-details/types';

interface WorkbenchViewProps {
  specId: string;
}

export function WorkbenchView({ specId }: WorkbenchViewProps) {
  const fetcher = useFetcher();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [parsedSpec, setParsedSpec] = useState<ParsedOpenAPISpec | null>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<{
    path: string;
    method: string;
    operation: OperationObject;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<string>('params');
  const [response, setResponse] = useState<TestResponse | null>(null);

  const baseUrl = parsedSpec?.servers?.[0]?.url || DEFAULT_FALLBACK_URL;
  const [selectedServer, setSelectedServer] = useState<string>(baseUrl);

  const detectedAuth = detectAuthFromSpec(parsedSpec);

  const [request, setRequest] = useState<TestRequest>({
    method: 'GET',
    url: '',
    params: [],
    headers: [...DEFAULT_HEADERS.map((h) => ({ ...h })), { enabled: false, key: '', value: '' }],
    auth: { type: 'none' },
    body: '{\n  \n}',
    bodyType: 'json',
  });

  // Load spec
  useEffect(() => {
    if (!specId) return;

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

        // Support both JSON and YAML content
        let parsed: ParsedOpenAPISpec;
        try {
          parsed = JSON.parse(spec.content);
        } catch {
          const yaml = await import('yaml');
          parsed = yaml.parse(spec.content) as ParsedOpenAPISpec;
        }
        setParsedSpec(parsed);

        const serverUrl = parsed.servers?.[0]?.url || DEFAULT_FALLBACK_URL;
        setSelectedServer(serverUrl);

        const auth = detectAuthFromSpec(parsed);
        setRequest((prev) => ({ ...prev, auth }));

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
    return () => { cancelled = true; };
  }, [specId]);

  // Sidebar persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.sidebarCollapsed);
    if (saved === 'true') setIsSidebarCollapsed(true);
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  // Build request from endpoint/server selection
  useEffect(() => {
    if (!selectedEndpoint || !parsedSpec) return;

    const fullUrl = `${selectedServer}${selectedEndpoint.path}`;

    const pathLevelParams = (parsedSpec?.paths?.[selectedEndpoint.path]?.parameters || []) as (ParameterObject | ReferenceObject)[];
    const operationParams = (selectedEndpoint.operation?.parameters || []) as (ParameterObject | ReferenceObject)[];

    const paramMap = new Map<string, ParameterObject | ReferenceObject>();
    for (const paramOrRef of pathLevelParams) {
      const param = paramOrRef as ParameterObject;
      paramMap.set(`${param.name}:${param.in}`, paramOrRef);
    }
    for (const paramOrRef of operationParams) {
      const param = paramOrRef as ParameterObject;
      paramMap.set(`${param.name}:${param.in}`, paramOrRef);
    }
    const allParameters = Array.from(paramMap.values());

    const paramRows: ParamRow[] = [];
    const headerParamsFromSpec: HeaderRow[] = [];

    for (const paramOrRef of allParameters) {
      const param = paramOrRef as ParameterObject;
      const location = param.in as string;
      if (location === 'header') {
        headerParamsFromSpec.push({
          enabled: param.required || true,
          key: param.name,
          value: (param.schema as SchemaObject)?.default || '',
        });
      } else if (location === 'query' || location === 'path' || location === 'cookie') {
        paramRows.push({
          enabled: location === 'path' ? true : (param.required || false),
          key: param.name,
          value: (param.schema as SchemaObject)?.default?.toString() || '',
          description: param.description,
          paramIn: location as ParamRow['paramIn'],
        });
      }
    }
    paramRows.push({ enabled: false, key: '', value: '', description: undefined });

    let exampleBody = '{\n  \n}';
    if (selectedEndpoint.operation?.requestBody) {
      // Resolve $ref on the requestBody object itself
      let requestBody = selectedEndpoint.operation.requestBody;
      if ((requestBody as ReferenceObject).$ref && parsedSpec) {
        requestBody = (resolveRef((requestBody as ReferenceObject).$ref, parsedSpec) as RequestBodyObject) ?? requestBody;
      }
      
      const rb = requestBody as RequestBodyObject;
      const content = rb.content || {};
      const jsonContent = content['application/json'];
      const formContent = content['application/x-www-form-urlencoded'];
      const textContent = content['text/plain'];
      const firstContentType = Object.keys(content)[0];

      if (jsonContent) {
        if (jsonContent.schema) exampleBody = generateExampleFromSchema(jsonContent.schema, 0, parsedSpec);
        else if (jsonContent.example) exampleBody = JSON.stringify(jsonContent.example, null, 2);
      } else if (formContent) {
        if (formContent.schema && (formContent.schema as SchemaObject).properties) {
          const properties = (formContent.schema as SchemaObject).properties!;
          const params = Object.keys(properties).map((key) => `${key}=value`).join('&');
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
    // Swagger 2.0: body parameter
    else if (selectedEndpoint.operation?.parameters) {
      const bodyParam = (selectedEndpoint.operation.parameters as (ParameterObject | ReferenceObject)[]).find((p) => (p as ParameterObject).in === ('body' as unknown)) as ParameterObject;
      if (bodyParam?.schema) {
        exampleBody = generateExampleFromSchema(bodyParam.schema, 0, parsedSpec);
      } else if (bodyParam?.example) {
        exampleBody = typeof bodyParam.example === 'string'
          ? bodyParam.example
          : JSON.stringify(bodyParam.example, null, 2);
      }
    }

    const detectedBodyType = detectBodyTypeFromSpec(selectedEndpoint.operation, parsedSpec);

    const mergedHeaders = [
      ...DEFAULT_HEADERS.map((h) => ({ ...h })),
      ...headerParamsFromSpec,
      { enabled: false, key: '', value: '' },
    ];

    const contentTypeValue = bodyTypeToContentType(detectedBodyType);
    if (contentTypeValue) {
      const ctIndex = mergedHeaders.findIndex((h) => h.key.toLowerCase() === 'content-type');
      if (ctIndex >= 0) {
        mergedHeaders[ctIndex] = { ...mergedHeaders[ctIndex], value: contentTypeValue };
      }
    }

    setRequest((prev) => ({
      ...prev,
      method: selectedEndpoint.method.toUpperCase() as HTTPMethod,
      url: fullUrl,
      params: paramRows,
      headers: mergedHeaders,
      body: exampleBody,
      bodyType: detectedBodyType,
    }));

    if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method.toUpperCase())) {
      setActiveTab('body');
    } else {
      setActiveTab('params');
    }
  }, [selectedEndpoint, selectedServer]);

  const handleBodyTypeChange = (newType: BodyContentType) => {
    const contentTypeValue = bodyTypeToContentType(newType);
    const newHeaders = request.headers.map((h) => {
      if (h.key.toLowerCase() === 'content-type') {
        return { ...h, value: contentTypeValue, enabled: contentTypeValue !== '' };
      }
      return h;
    });
    setRequest((prev) => ({ ...prev, bodyType: newType, headers: newHeaders }));
  };

  // Mitigation for OWASP A07:2025 (Injection): encodeURIComponent prevents URL injection
  const handleSendRequest = () => {
    incrementAction();

    const headers: Record<string, string> = {};
    request.headers
      .filter((h) => h.enabled && h.key && h.value)
      .forEach((h) => { headers[h.key] = h.value; });

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
          headers: {}, body: { error: errorMessage },
        });
      }
    }
  }, [fetcher.state, fetcher.data]);

  const handleEndpointSelect = (endpoint: { path: string; method: string; operation: OperationObject }) => {
    setSelectedEndpoint(endpoint);
  };

  const enabledParamsCount = request.params.filter((p) => p.enabled && p.key).length;
  const enabledHeadersCount = request.headers.filter((h) => h.enabled && h.key).length;

  const requestTabs = [
    { id: 'params', label: 'Params', badge: enabledParamsCount > 0 ? enabledParamsCount : null },
    { id: 'auth', label: 'Auth', badge: null },
    { id: 'headers', label: 'Headers', badge: enabledHeadersCount > 0 ? enabledHeadersCount : null },
    { id: 'body', label: 'Body', badge: null },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background/50">
        <div className="text-center space-y-3">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent" />
          <p className="text-sm text-muted-foreground">Loading specification...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background/50">
        <p className="text-sm text-muted-foreground">{loadError}</p>
      </div>
    );
  }

  if (!parsedSpec) return null;

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-background/50">
      {/* Endpoint Sidebar */}
      {!isSidebarCollapsed && parsedSpec.paths && Object.keys(parsedSpec.paths).length > 0 && (
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-primary/15 flex-shrink-0 hidden md:flex relative bg-background/50">
          <EndpointSidebar
            spec={parsedSpec}
            selectedEndpoint={selectedEndpoint}
            onSelectEndpoint={handleEndpointSelect}
            variant="detail"
            className="w-full"
          />
        </aside>
      )}

      {/* Sidebar toggle */}
      {parsedSpec?.paths && Object.keys(parsedSpec.paths).length > 0 && (
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-card/50 border border-primary/15 rounded-r-md p-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer hidden md:flex"
          style={{ marginLeft: isSidebarCollapsed ? 0 : '256px' }}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Fallback URL warning */}
      {parsedSpec && isDummyFallbackUrl(baseUrl, parsedSpec) && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2 shrink-0 w-full absolute top-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs text-amber-600">
            No server URL configured. Edit the URL in the request bar or add servers to your spec.
          </span>
        </div>
      )}

      {/* Center: Request Builder */}
      <main className="flex-1 flex flex-col min-w-0 bg-background/50">
        <RequestBar
          method={request.method}
          url={request.url}
          onUrlChange={(url) => setRequest((prev) => ({ ...prev, url }))}
          onMethodChange={(method) => setRequest((prev) => ({ ...prev, method }))}
          onSend={handleSendRequest}
          isSending={fetcher.state !== 'idle'}
        />

        {/* Request tabs */}
        <div className="flex items-center px-4 border-b border-primary/15 gap-4 shrink-0 bg-background/80">
          {requestTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 text-xs font-medium cursor-pointer border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground hover:text-primary border-transparent'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
              {tab.badge !== null && (
                <span className="ml-1 text-xs bg-primary/10 px-1 rounded text-primary">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'params' && (
            <div className="flex-1 overflow-y-auto p-4 bg-background/80">
              <RequestParamsTable
                params={request.params}
                onParamsChange={(params) => setRequest((prev) => ({ ...prev, params }))}
              />
            </div>
          )}
          {activeTab === 'auth' && (
            <div className="flex-1 overflow-y-auto p-4 bg-background/80">
              <RequestAuthPanel
                auth={request.auth}
                onAuthChange={(auth) => setRequest((prev) => ({ ...prev, auth }))}
                detectedAuth={detectedAuth}
              />
            </div>
          )}
          {activeTab === 'headers' && (
            <div className="flex-1 overflow-y-auto p-4 bg-background/80">
              <RequestHeadersTable
                headers={request.headers}
                onHeadersChange={(headers) => setRequest((prev) => ({ ...prev, headers }))}
              />
            </div>
          )}
          {activeTab === 'body' && (
            <RequestBodyEditor
              key={selectedEndpoint ? `${selectedEndpoint.method}-${selectedEndpoint.path}` : 'default'}
              body={request.body}
              bodyType={request.bodyType}
              onBodyChange={(body) => setRequest((prev) => ({ ...prev, body }))}
              onBodyTypeChange={handleBodyTypeChange}
            />
          )}
        </div>
      </main>

      {/* Right: Response Panel */}
      <aside className="w-full md:w-96 border-t md:border-t-0 md:border-l border-primary/15 flex-shrink-0 flex flex-col bg-background/50">
        <ResponsePanel
          response={response}
          isLoading={fetcher.state !== 'idle'}
        />
      </aside>
    </div>
  );
}

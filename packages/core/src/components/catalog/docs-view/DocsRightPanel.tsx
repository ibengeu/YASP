/**
 * DocsRightPanel - Right panel for documentation page
 * Interactive console for testing API endpoints
 */

import { Play, Maximize2, Minimize2, ChevronRight, RefreshCw, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {executeApiRequest} from '@/actions/execute-api-request';
import {
  generateExampleFromSchema,
  resolveRef,
  extractFormFields,
  detectBodyTypeFromSpec,
  bodyTypeToContentType,
  detectAuthFromSpec,
} from '@/components/api-details/utils';
import { cn } from '@/lib/utils';
import type { FormField, ParsedOpenAPISpec as ApiDetailsParsedSpec } from '@/components/api-details/types';
import type { ParsedEndpoint, ParsedOpenAPISpec } from './types';
import type { RequestBodyObject, ReferenceObject, ParameterObject, MediaTypeObject, SchemaObject, ExampleObject } from '@/types/openapi-spec';

interface DocsRightPanelProps {
  endpoint: ParsedEndpoint | null;
  baseUrl: string;
  spec?: ParsedOpenAPISpec;
  className?: string;
}

export function DocsRightPanel({ endpoint, baseUrl, spec, className }: DocsRightPanelProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');
  const [bodyContentType, setBodyContentType] = useState<string>('application/json');
  const [bodyFields, setBodyFields] = useState<FormField[]>([]);
  const [queryParams, setQueryParams] = useState<Array<{ key: string; value: string; enabled: boolean }>>([]);
  const [pathParams, setPathParams] = useState<Array<{ key: string; value: string; required: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<{ status: number; statusText: string; body: unknown } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper: Extract form fields from endpoint schema with type info
  const getBodyFields = (ep: ParsedEndpoint): FormField[] => {
    return extractFormFields(ep, spec as unknown as ApiDetailsParsedSpec);
  };

  // Helper: Get default body based on schema
  // Mitigation for OWASP A06:2025 – Auth Failures: Auth input adapts to spec security scheme type
  const authInfo = detectAuthFromSpec((spec ?? null) as unknown as ApiDetailsParsedSpec | null);

  // Helper: Get default body based on schema
  const getDefaultBody = (ep: ParsedEndpoint): string => {
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method) ||
      (ep.method === 'DELETE' && ep.operation?.requestBody);
    if (!hasBody) return '';

    // 1. OpenAPI 3.x: requestBody
    if (ep.operation?.requestBody) {
      // Resolve $ref on the requestBody object itself (common in real-world specs)
      let requestBody = ep.operation.requestBody;
      if ((requestBody as ReferenceObject).$ref && spec) {
        requestBody = (resolveRef((requestBody as ReferenceObject).$ref, spec as unknown as ApiDetailsParsedSpec) ?? requestBody) as typeof requestBody;
      }

      const rb = requestBody as RequestBodyObject;
      const content = rb.content || {};
      const jsonContent = content['application/json'];

      if (jsonContent) {
        if (jsonContent.schema) {
          return generateExampleFromSchema(jsonContent.schema, 0, spec as unknown as ApiDetailsParsedSpec);
        }
        if (jsonContent.example !== undefined) {
          return typeof jsonContent.example === 'string'
            ? jsonContent.example
            : JSON.stringify(jsonContent.example, null, 2);
        }
        if (jsonContent.examples) {
          const first = Object.values(jsonContent.examples)[0];
          const val = (first as ExampleObject)?.value;
          if (val !== undefined) {
            return typeof val === 'string' ? val : JSON.stringify(val, null, 2);
          }
        }
        // Has application/json key but no schema/example — emit empty object
        return '{}';
      }

      // Fallback: use the first non-form content type that has a schema or example
      const formTypes = new Set(['application/x-www-form-urlencoded', 'multipart/form-data']);
      for (const [contentType, mediaObj] of Object.entries(content) as [string, MediaTypeObject][]) {
        if (formTypes.has(contentType)) continue;
        if (mediaObj?.schema) {
          return generateExampleFromSchema(mediaObj.schema, 0, spec as unknown as ApiDetailsParsedSpec);
        }
        if (mediaObj?.example !== undefined) {
          return typeof mediaObj.example === 'string'
            ? mediaObj.example
            : JSON.stringify(mediaObj.example, null, 2);
        }
      }
    }

    // 2. Swagger 2.0: body parameter
    if (ep.operation?.parameters) {
      const params = ep.operation.parameters as (ParameterObject | ReferenceObject)[];
      const bodyParam = params.find(p => (p as ParameterObject).in === ('body' as unknown)) as ParameterObject;
      if (bodyParam?.schema) {
        return generateExampleFromSchema(bodyParam.schema, 0, spec as unknown as ApiDetailsParsedSpec);
      }
    }

    return '';
  };

  // Initialize body with example schema when endpoint changes
  useEffect(() => {
    if (!endpoint) {
      setUrl('');
      setBody('');
      setBodyFields([]);
      setBodyContentType('application/json');
      setQueryParams([]);
      setPathParams([]);
      setResponse(null);
      setError(null);
      return;
    }

    // Reset response when endpoint changes
    setResponse(null);
    setError(null);

    // Extract path and query parameters from endpoint definition
    const queryParameters: Array<{ key: string; value: string; enabled: boolean }> = [];
    const pathParameters: Array<{ key: string; value: string; required: boolean }> = [];
    if (endpoint.operation?.parameters) {
      (endpoint.operation.parameters as (ParameterObject | ReferenceObject)[]).forEach((paramOrRef) => {
        const param = paramOrRef as ParameterObject;
        if (param.in === 'query') {
          queryParameters.push({
            key: param.name || '',
            value: param.example || (param.schema as SchemaObject)?.default || '',
            enabled: param.required === true,
          });
        } else if (param.in === 'path') {
          pathParameters.push({
            key: param.name || '',
            value: param.example || (param.schema as SchemaObject)?.default || '',
            required: param.required !== false, // path params are required by default per OpenAPI spec
          });
        }
      });
    }
    setQueryParams(queryParameters);
    setPathParams(pathParameters);

    // Set URL (base path)
    setUrl(`${baseUrl}${endpoint.path}`);

    const showBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method) ||
      (endpoint.method === 'DELETE' && endpoint.operation?.requestBody);
    if (!showBody) {
      setBody('');
      setBodyFields([]);
      setBodyContentType('application/json');
      return;
    }

    const detectedBodyType = detectBodyTypeFromSpec(endpoint.operation, spec as unknown as ApiDetailsParsedSpec);
    const contentType = bodyTypeToContentType(detectedBodyType) || 'application/json';

    setBody(getDefaultBody(endpoint));
    setBodyFields(getBodyFields(endpoint));
    setBodyContentType(contentType);
  }, [endpoint, spec, baseUrl]);

  if (!endpoint) return <div className={cn("lg:w-[480px] hidden lg:block bg-muted/10 border-l border-border", className)} />;

  const handleExecute = async () => {
    setIsLoading(true);
    setResponse(null);
    setError(null);

    const headers: Record<string, string> = {
      'Content-Type': bodyContentType,
    };

    if (authToken.trim()) {
      headers['Authorization'] = authToken.trim();
    }

    // Substitute path parameters into URL (e.g. {petId} → actual value)
    let finalUrl = url;
    for (const param of pathParams) {
      if (param.key) {
        finalUrl = finalUrl.replace(`{${param.key}}`, encodeURIComponent(param.value));
      }
    }

    // Build URL with query parameters
    const enabledParams = queryParams.filter(p => p.enabled && p.key);
    if (enabledParams.length > 0) {
      const queryString = enabledParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
      finalUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}${queryString}`;
    }

    try {
      // Build request body — includes DELETE when it has a requestBody defined in spec
      let requestBody: string | FormData | undefined;
      const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method) ||
        (endpoint.method === 'DELETE' && endpoint.operation?.requestBody);
      if (hasBody) {
        if (bodyContentType === 'multipart/form-data') {
          const formData = new FormData();
          bodyFields.forEach(f => {
            formData.append(f.key, f.value);
          });
          requestBody = formData;
        } else if (bodyContentType === 'application/x-www-form-urlencoded') {
          const params = new URLSearchParams();
          bodyFields.forEach(f => {
            params.append(f.key, f.value);
          });
          requestBody = params.toString();
        } else if (body) {
          requestBody = body;
        }
      }

      const result = await executeApiRequest({
        method: endpoint.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
        url: finalUrl,
        headers,
        body: requestBody,
      });
      setResponse({ status: result.status, statusText: result.statusText, body: result.body });
    } catch (err: unknown) {
      setError((err as Error).message || 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (!endpoint) return;
    
    setAuthToken('');
    setBody(getDefaultBody(endpoint));
    setBodyFields(getBodyFields(endpoint));
    
    // Reset path and query params to spec defaults
    const queryParameters: Array<{ key: string; value: string; enabled: boolean }> = [];
    const pathParameters: Array<{ key: string; value: string; required: boolean }> = [];
    if (endpoint.operation?.parameters) {
      (endpoint.operation.parameters as (ParameterObject | ReferenceObject)[]).forEach((paramOrRef) => {
        const param = paramOrRef as ParameterObject;
        if (param.in === 'query') {
          queryParameters.push({
            key: param.name || '',
            value: param.example || (param.schema as SchemaObject)?.default || '',
            enabled: param.required === true,
          });
        } else if (param.in === 'path') {
          pathParameters.push({
            key: param.name || '',
            value: param.example || (param.schema as SchemaObject)?.default || '',
            required: param.required !== false,
          });
        }
      });
    }
    setQueryParams(queryParameters);
    setPathParams(pathParameters);
    
    setResponse(null);
    setError(null);
  };


  return (
    <div className={cn(
      "border-t lg:border-t-0 lg:border-l border-border bg-background/50 backdrop-blur-md flex flex-col shrink-0 transition-all h-full",
      isMaximized
        ? "fixed inset-0 z-50 w-full h-full"
        : "relative lg:w-[480px] z-10 overflow-hidden",
      className
    )}>
      {/* Header - Fixed at top */}
      <div className="h-14 px-4 border-b border-border flex items-center justify-between bg-background shrink-0 z-20">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Play className="w-3 h-3 fill-current text-primary" />
          Try it
        </h3>
        <button
          className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1 hover:bg-muted rounded-md"
          title={isMaximized ? "Minimize view" : "Expand view"}
          onClick={() => setIsMaximized(!isMaximized)}
        >
          {isMaximized ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
        </button>
      </div>

      {/* Content - Scrollable area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scroll min-h-0 bg-transparent">
        <div className="space-y-6 pb-6">
          <InteractiveConsole
            endpoint={endpoint}
            url={url}
            pathParams={pathParams}
            onPathParamsChange={setPathParams}
            queryParams={queryParams}
            onQueryParamsChange={setQueryParams}
            authToken={authToken}
            onAuthTokenChange={setAuthToken}
            authType={authInfo.type}
            body={body}
            bodyContentType={bodyContentType}
            onBodyChange={(val) => {
              if (val === '' && endpoint) {
                setBody(getDefaultBody(endpoint));
              } else {
                setBody(val);
              }
            }}
            bodyFields={bodyFields}
            onBodyFieldsChange={setBodyFields}
            response={response}
            error={error}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="bg-background border-t border-border p-4 z-20 shrink-0 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-sm font-bold text-muted-foreground hover:text-foreground px-3 transition-colors cursor-pointer"
        >
          Clear
        </Button>
        <Button
          onClick={handleExecute}
          disabled={isLoading}
          className="flex-1 bg-foreground text-background hover:bg-foreground/90 text-xs md:text-sm font-bold h-9 rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
        >
          <Play className="w-3 h-3 fill-current" />
          {isLoading ? 'Executing...' : 'Execute Request'}
        </Button>
      </div>
    </div>
  );
}

interface FormBodyEditorProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
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
    className: 'h-10 text-sm bg-muted/30 border-border focus-visible:ring-primary/20',
  };

  switch (field.type) {
    case 'checkbox':
      return (
        <Checkbox
          checked={field.value === 'true'}
          onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
          title={field.description}
          className="size-5"
        />
      );

    case 'file':
      return (
        <Input
          type="file"
          onChange={(e) => {
            // For file inputs, store the filename; actual file handling done on submit
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

function FormBodyEditor({ fields, onChange }: FormBodyEditorProps) {
  const handleFieldChange = (idx: number, newVal: string) => {
    const updated = [...fields];
    updated[idx].value = newVal;
    onChange(updated);
  };

  return (
    <div className="p-4">
      <div className="space-y-4">
        {fields.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg text-xs text-muted-foreground">
            No fields defined for this content type in the specification.
          </div>
        ) : (
          fields.map((field, idx) => (
            <div key={idx} className="flex items-center gap-4">
              {/* Field label / name (read-only) */}
              <div className="min-w-[100px] max-w-[150px] shrink-0">
                <span
                  className="text-xs font-mono font-bold text-foreground bg-muted/50 px-2 py-1.5 rounded block truncate"
                  title={field.description || field.key}
                >
                  {field.key}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </span>
              </div>

                          {/* Typed input */}
                          <div className="flex-1 flex items-center min-h-[40px]">
                            {renderFieldInput(field, (val) => handleFieldChange(idx, val))}
                          </div>
              
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface InteractiveConsoleProps {
  endpoint: ParsedEndpoint;
  url: string;
  pathParams: Array<{ key: string; value: string; required: boolean }>;
  onPathParamsChange: (params: Array<{ key: string; value: string; required: boolean }>) => void;
  queryParams: Array<{ key: string; value: string; enabled: boolean }>;
  onQueryParamsChange: (params: Array<{ key: string; value: string; enabled: boolean }>) => void;
  authToken: string;
  onAuthTokenChange: (v: string) => void;
  authType?: 'none' | 'api-key' | 'bearer' | 'basic';
  body: string;
  bodyContentType: string;
  onBodyChange: (v: string) => void;
  bodyFields: FormField[];
  onBodyFieldsChange: (fields: FormField[]) => void;
  response: { status: number; statusText: string; body: unknown } | null;
  error: string | null;
  isLoading: boolean;
}

function InteractiveConsole({
  endpoint,
  url,
  pathParams,
  onPathParamsChange,
  queryParams,
  onQueryParamsChange,
  authToken,
  onAuthTokenChange,
  authType = 'none',
  body,
  bodyContentType,
  onBodyChange,
  bodyFields,
  onBodyFieldsChange,
  response,
  error,
  isLoading,
}: InteractiveConsoleProps) {
  // Mitigation for OWASP A06:2025 – Auth Failures: derive placeholder from spec-detected auth type
  const authPlaceholder =
    authType === 'bearer' ? 'Bearer <token>' :
    authType === 'basic' ? 'Basic <base64credentials>' :
    authType === 'api-key' ? '<api-key>' :
    'Bearer sk_test_...';
  const hasResponse = response !== null;
  const isSuccess = response && response.status >= 200 && response.status < 300;

  return (
    <div className="space-y-6">
      {/* Request URL */}
      <div>
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1 opacity-70">
          Request URL
        </h4>
        <div className="flex gap-2 mb-3 items-start">
          <span className="font-bold text-primary uppercase text-xs bg-muted border border-border px-2.5 py-2 rounded-md flex items-center h-10">{endpoint.method}</span>
          <div className="flex-1 bg-muted/50 border border-border rounded-md px-3 py-2.5 font-mono text-sm text-muted-foreground overflow-hidden">
            <div className="truncate">{url}</div>
            {queryParams.filter((p) => p.enabled && p.key).length > 0 && (
              <div className="text-xs text-muted-foreground/70 mt-1">
                + {queryParams.filter((p) => p.enabled && p.key).length} params
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Path Parameters */}
      {pathParams.length > 0 && (
        <details open className="group">
          <summary className="flex items-center justify-between mb-3 ml-1 cursor-pointer select-none list-none outline-none">
            <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
              <h4 className="text-xs font-bold uppercase tracking-wider opacity-70">Path Parameters</h4>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-bold">{pathParams.length}</span>
          </summary>
          <div className="space-y-3 bg-background p-4 rounded-lg border border-border ml-1">
            {pathParams.map((param, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-foreground bg-muted/50 px-2 py-1.5 rounded min-w-fit">
                    {param.key}
                    {param.required && <span className="text-destructive ml-1">*</span>}
                  </span>
                  <Input
                    type="text"
                    placeholder="Enter value"
                    value={param.value}
                    onChange={(e) => {
                      const updated = [...pathParams];
                      updated[idx].value = e.target.value;
                      onPathParamsChange(updated);
                    }}
                    className="flex-1 h-9 text-xs bg-muted/30 border-border"
                  />
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Query Parameters */}
      {['GET', 'DELETE'].includes(endpoint.method) || queryParams.length > 0 ? (
        <details open className="group">
          <summary className="flex items-center justify-between mb-3 ml-1 cursor-pointer select-none list-none outline-none">
            <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
              <h4 className="text-xs font-bold uppercase tracking-wider opacity-70">Query Parameters</h4>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-bold">{queryParams.filter((p) => p.enabled && p.key).length}</span>
          </summary>
          <div className="space-y-3 bg-background p-4 rounded-lg border border-border ml-1">
            {queryParams.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No query parameters defined for this endpoint</p>
            ) : (
              queryParams.map((param, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Checkbox
                    checked={param.enabled}
                    onCheckedChange={(checked) => {
                      const updated = [...queryParams];
                      updated[idx].enabled = checked === true;
                      onQueryParamsChange(updated);
                    }}
                    className="mt-1 flex-shrink-0"
                    title="Optional parameter"
                  />
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-foreground bg-muted/50 px-2 py-1.5 rounded min-w-fit">
                      {param.key}
                    </span>
                    <Input
                      type="text"
                      placeholder="Enter value"
                      value={param.value}
                      onChange={(e) => {
                        const updated = [...queryParams];
                        updated[idx].value = e.target.value;
                        onQueryParamsChange(updated);
                      }}
                      className="flex-1 h-9 text-xs bg-muted/30 border-border"
                    />
                  </div>
                </div>
              ))
            )}
            {queryParams.length > 0 && (
              <button
                onClick={() => onQueryParamsChange([...queryParams, { key: '', value: '', enabled: true }])}
                className="text-xs text-primary hover:text-primary/80 font-bold uppercase tracking-tight cursor-pointer mt-2 w-full text-left py-2 hover:bg-muted/30 px-2 rounded transition-colors"
              >
                + Add Custom Parameter
              </button>
            )}
          </div>
        </details>
      ) : null}

      {/* Headers */}
      <details open className="group">
        <summary className="flex items-center justify-between mb-3 ml-1 cursor-pointer select-none list-none outline-none">
          <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
            <h4 className="text-xs font-bold uppercase tracking-wider opacity-70">Headers</h4>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-bold">1</span>
        </summary>
        <div className="space-y-4 bg-background p-4 rounded-lg border border-border ml-1">
          <div>
            <label className="flex items-center justify-between text-sm font-bold text-foreground mb-2 uppercase tracking-wide">
              <span>Authorization</span>
              <span className="text-xs text-muted-foreground font-mono font-bold uppercase">string</span>
            </label>
            <div className="relative">
               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
               <Input
                type="password"
                placeholder={authPlaceholder}
                value={authToken}
                onChange={(e) => onAuthTokenChange(e.target.value)}
                className="w-full text-sm pl-10 pr-8 bg-muted/30 focus-visible:ring-primary/20 h-10 font-mono font-medium"
              />
            </div>
          </div>
        </div>
      </details>

      {/* Body */}
      {(['POST', 'PUT', 'PATCH'].includes(endpoint.method) ||
        (endpoint.method === 'DELETE' && endpoint.operation?.requestBody)) && (
         <details open className="group">
            <summary className="flex items-center justify-between mb-3 ml-1 cursor-pointer select-none list-none outline-none">
              <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                <h4 className="text-xs font-bold uppercase tracking-wider opacity-70">Body</h4>
              </div>
              <span className="text-xs text-muted-foreground font-mono font-bold uppercase">{bodyContentType}</span>
            </summary>
            <div className="bg-background rounded-lg border border-border ml-1 overflow-hidden">
               <div className="bg-muted/30 border-b border-border px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <span className="text-xs font-bold text-foreground bg-background border border-border px-2.5 py-1 rounded uppercase tracking-tight">
                     {bodyContentType === 'application/json' ? 'JSON' : bodyContentType === 'application/x-www-form-urlencoded' ? 'Form' : bodyContentType === 'multipart/form-data' ? 'Form-Data' : 'Raw'}
                   </span>
                   {bodyContentType !== 'application/json' && (
                    <span className="text-xs text-muted-foreground font-mono">{bodyContentType}</span>
                   )}
                </div>
                <button
                  onClick={() => onBodyChange('')}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer font-bold uppercase tracking-tight"
                >
                   <RefreshCw className="w-3 h-3" />
                   Reset
                </button>
              </div>

              {bodyContentType === 'application/json' ? (
                <div className="p-4">
                  <textarea
                    value={body}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        onBodyChange(''); // This will trigger the reset logic in the parent
                      } else {
                        onBodyChange(val);
                      }
                    }}
                    placeholder="{\n  \n}"
                    rows={6}
                    className="w-full font-mono text-sm bg-transparent text-foreground resize-none outline-none placeholder:text-muted-foreground/50"
                  />
                </div>
              ) : bodyContentType === 'application/x-www-form-urlencoded' || bodyContentType === 'multipart/form-data' ? (
                <FormBodyEditor
                  fields={bodyFields}
                  onChange={onBodyFieldsChange}
                />
              ) : (
                <div className="p-4 space-y-3">
                  <div className="text-xs text-muted-foreground bg-muted/30 border border-border px-3 py-2 rounded">
                    Enter raw body content
                  </div>
                  <Input
                    value={body}
                    onChange={(e) => onBodyChange(e.target.value)}
                    placeholder="Enter content..."
                    className="w-full h-24 font-mono text-sm bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/50 p-3"
                  />
                </div>
              )}
            </div>
         </details>
      )}

      {/* Response Area */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3 ml-1">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-70">Response</h4>
          {hasResponse && (
            <span
              className={`text-xs font-mono font-bold uppercase tracking-tight ${isSuccess ? 'text-green-500' : 'text-destructive'}`}
            >
              {response!.status} {response!.statusText}
            </span>
          )}
          {!hasResponse && !error && !isLoading && (
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-tight">Not executed yet</span>
          )}
          {isLoading && (
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-tight">Loading...</span>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive font-mono font-medium">
            {error}
          </div>
        )}

        {hasResponse && !error && (
          <pre className="bg-muted border border-border rounded-lg p-4 font-mono text-sm leading-relaxed overflow-x-auto text-foreground font-medium">
            <code>{typeof response!.body === 'string' ? response!.body : JSON.stringify(response!.body, null, 2)}</code>
          </pre>
        )}

        {!hasResponse && !error && !isLoading && (
          <div className="bg-muted/30 border border-border border-dashed rounded-lg h-32 flex items-center justify-center text-sm text-muted-foreground italic font-medium opacity-50 text-center px-4">
            Click 'Execute Request' to view response
          </div>
        )}
      </div>
    </div>
  );
}

import {useCallback, useEffect, useMemo, useState} from 'react';
import {
    AlertTriangle,
    Check,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    Copy,
    Eye,
    EyeOff,
    Globe,
    Play,
    Plus,
    X,
    XCircle
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Badge} from '@/components/ui/badge';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Checkbox} from '@/components/ui/checkbox';
import {Textarea} from '@/components/ui/textarea';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {JsonEditor} from './JsonEditor';
import {ApiResponse, EndpointInfo, Parameter, Schema} from './types';

interface EnhancedParameter extends Parameter {
    value?: any;
    enabled?: boolean;
    validation?: { isValid: boolean; errors: string[] };
}

interface Server {
    url: string;
    description?: string;
    variables?: Record<string, { enum?: string[]; default: string; description?: string }>;
}

interface RequestState {
    loading: boolean;
    response: ApiResponse | null;
    error: string | null;
    requestTime?: number;
}

interface TryItOutCleanProps {
    endpoint: EndpointInfo | null;
    servers: Server[];
    apiSpec?: any;
    specId?: string;
}

// Helper function to resolve $ref references
function resolveSchemaRef(schema: Schema, apiSpec: any): Schema {
    if (!schema.$ref || !apiSpec) return schema;

    const refPath = schema.$ref.replace('#/', '').split('/');
    let resolvedSchema = apiSpec;
    for (const path of refPath) {
        resolvedSchema = resolvedSchema?.[path];
    }

    return resolvedSchema || schema;
}

// Simple validation and example generation
function validateParameter(value: any, parameter: Parameter) {
    const errors: string[] = [];
    if (parameter.required && (value === undefined || value === null || value === '')) {
        errors.push(`${parameter.name} is required`);
    }
    return {isValid: errors.length === 0, errors};
}

function generateExample(schema: Schema, apiSpec?: any): any {
    if (!schema) return '';

    // Resolve $ref if present
    const resolvedSchema = resolveSchemaRef(schema, apiSpec);

    if (resolvedSchema.example !== undefined) return resolvedSchema.example;
    if (resolvedSchema.default !== undefined) return resolvedSchema.default;

    switch (resolvedSchema.type) {
        case 'string':
            if (resolvedSchema.format === 'email') return 'user@example.com';
            if (resolvedSchema.format === 'date') return new Date().toISOString().split('T')[0];
            if (resolvedSchema.format === 'date-time') return new Date().toISOString();
            if (resolvedSchema.format === 'uuid') return '123e4567-e89b-12d3-a456-426614174000';
            if (resolvedSchema.format === 'uri') return 'https://example.com';
            if (resolvedSchema.enum) return resolvedSchema.enum[0];
            return 'string';
        case 'number':
            return resolvedSchema.enum ? resolvedSchema.enum[0] : 42.5;
        case 'integer':
            return resolvedSchema.enum ? resolvedSchema.enum[0] : 42;
        case 'boolean':
            return true;
        case 'object':
            if (resolvedSchema.properties) {
                const obj: any = {};
                Object.entries(resolvedSchema.properties).forEach(([key, propSchema]: [string, any]) => {
                    obj[key] = generateExample(propSchema, apiSpec);
                });
                return obj;
            }
            return {};
        case 'array':
            if (resolvedSchema.items) {
                return [generateExample(resolvedSchema.items, apiSpec)];
            }
            return [];
        default:
            return '';
    }
}

export function TryItOutSimplified({
                                       endpoint,
                                       servers = [],
                                       apiSpec,
                                       specId
                                   }: TryItOutCleanProps) {
    // Core request state
    const [pathParams, setPathParams] = useState<EnhancedParameter[]>([]);
    const [queryParams, setQueryParams] = useState<EnhancedParameter[]>([]);
    const [headerParams, setHeaderParams] = useState<EnhancedParameter[]>([]);
    const [requestBody, setRequestBody] = useState<string>('');
    const [selectedContentType, setSelectedContentType] = useState<string>('');
    const [requestState, setRequestState] = useState<RequestState>({
        loading: false,
        response: null,
        error: null
    });

    // Secondary options state
    const [authConfig, setAuthConfig] = useState<{ type: string; [key: string]: any }>({type: 'none'});
    const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string; enabled: boolean }>>([]);
    const [selectedServer, setSelectedServer] = useState<Server | null>(null);
    const [customBaseUrl, setCustomBaseUrl] = useState<string>('');
    const [copiedCurl, setCopiedCurl] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState('query');

    // Available content types
    const availableContentTypes = useMemo(() => {
        if (!endpoint?.operation.requestBody) return [];
        return Object.keys(endpoint.operation.requestBody.content || {});
    }, [endpoint]);

    // Check if this endpoint needs a request body (prominent display)
    const hasRequestBody = useMemo(() => {
        return endpoint && ['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase());
    }, [endpoint]);

    // Initialize server selection and load custom base URL from sessionStorage
    useEffect(() => {
        if (servers.length > 0 && !selectedServer) {
            setSelectedServer(servers[0]);
        }

        // Load custom base URL from sessionStorage
        if (specId) {
            const storageKey = `yasp-base-url-override-${specId}`;
            const savedBaseUrl = sessionStorage.getItem(storageKey);
            if (savedBaseUrl) {
                setCustomBaseUrl(savedBaseUrl);
            }
        }
    }, [servers, selectedServer, specId]);

    // Save custom base URL to sessionStorage when it changes
    useEffect(() => {
        if (specId && customBaseUrl) {
            const storageKey = `yasp-base-url-override-${specId}`;
            sessionStorage.setItem(storageKey, customBaseUrl);
        }
    }, [customBaseUrl, specId]);

    // Initialize parameters from endpoint
    useEffect(() => {
        if (!endpoint) return;

        const parameters = endpoint.operation.parameters || [];

        // Initialize parameters
        const pathParameters = parameters.filter(p => p.in === 'path').map(p => ({
            ...p,
            value: generateExample(p.schema || {}, apiSpec),
            enabled: true,
            validation: validateParameter(p.example, p)
        }));
        setPathParams(pathParameters);

        const queryParameters = parameters.filter(p => p.in === 'query').map(p => ({
            ...p,
            value: p.required ? generateExample(p.schema || {}, apiSpec) : '',
            enabled: p.required || false,
            validation: validateParameter(p.example, p)
        }));
        setQueryParams(queryParameters);

        const headerParameters = parameters.filter(p => p.in === 'header').map(p => ({
            ...p,
            value: generateExample(p.schema || {}, apiSpec),
            enabled: p.required || false,
            validation: validateParameter(p.example, p)
        }));
        setHeaderParams(headerParameters);

        // Initialize content type and request body
        if (availableContentTypes.length > 0) {
            const defaultContentType = availableContentTypes[0];
            setSelectedContentType(defaultContentType);

            if (hasRequestBody) {
                const content = endpoint.operation.requestBody?.content?.[defaultContentType];
                if (content?.schema) {
                    const example = generateExample(content.schema, apiSpec);
                    setRequestBody(JSON.stringify(example, null, 2));
                }
            }
        }

        // Initialize default headers
        const defaultHeaders = [];
        if (hasRequestBody) {
            defaultHeaders.push({
                key: 'Content-Type',
                value: selectedContentType || 'application/json',
                enabled: true
            });
        }
        defaultHeaders.push({
            key: 'Accept',
            value: 'application/json',
            enabled: true
        });
        setCustomHeaders(defaultHeaders);

    }, [endpoint, availableContentTypes, hasRequestBody]);

    // Update parameter
    const updateParameter = useCallback((
        _params: EnhancedParameter[],
        setParams: React.Dispatch<React.SetStateAction<EnhancedParameter[]>>,
        name: string,
        value: any
    ) => {
        setParams(prev => prev.map(param =>
            param.name === name
                ? {
                    ...param,
                    value,
                    validation: validateParameter(value, param)
                }
                : param
        ));
    }, []);

    // Build request URL
    const buildRequestUrl = useCallback((): string => {
        if (!endpoint) return '';

        // Use custom base URL if provided, otherwise use selected server
        let baseUrl = customBaseUrl.trim() || selectedServer?.url || '';

        // Remove trailing slash from base URL
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }

        // Add path with parameters
        let path = endpoint.path;
        pathParams.forEach(param => {
            if (param.value !== undefined) {
                path = path.replace(`{${param.name}}`, encodeURIComponent(String(param.value)));
            }
        });

        let url = baseUrl + path;

        // Add query parameters
        const enabledQueryParams = queryParams.filter(p => p.enabled && p.value !== undefined && p.value !== '');
        if (enabledQueryParams.length > 0) {
            const queryString = enabledQueryParams
                .map(param => `${encodeURIComponent(param.name)}=${encodeURIComponent(String(param.value))}`)
                .join('&');
            url += `?${queryString}`;
        }

        return url;
    }, [endpoint, selectedServer, pathParams, queryParams, customBaseUrl]);

    // Generate cURL command
    const generateCurlCommand = useCallback((): string => {
        if (!endpoint) return '';

        const url = buildRequestUrl();
        const method = endpoint.method.toUpperCase();
        let curl = `curl -X ${method} "${url}"`;

        // Add headers
        customHeaders.filter(h => h.enabled && h.key && h.value).forEach(header => {
            curl += ` \\\n  -H "${header.key}: ${header.value}"`;
        });

        // Add auth
        if (authConfig.type === 'bearer' && authConfig.token) {
            curl += ` \\\n  -H "Authorization: Bearer ${authConfig.token}"`;
        } else if (authConfig.type === 'basic' && authConfig.username && authConfig.password) {
            const credentials = btoa(`${authConfig.username}:${authConfig.password}`);
            curl += ` \\\n  -H "Authorization: Basic ${credentials}"`;
        } else if (authConfig.type === 'apikey' && authConfig.key && authConfig.value) {
            curl += ` \\\n  -H "${authConfig.key}: ${authConfig.value}"`;
        }

        // Add body
        if (hasRequestBody && requestBody.trim()) {
            curl += ` \\\n  -d '${requestBody}'`;
        }

        return curl;
    }, [endpoint, buildRequestUrl, customHeaders, authConfig, requestBody, hasRequestBody]);

    // Execute request
    const executeRequest = useCallback(async () => {
        if (!endpoint) return;

        setRequestState({loading: true, response: null, error: null});
        const startTime = Date.now();

        try {
            const url = buildRequestUrl();
            const headers: Record<string, string> = {};

            // Add custom headers
            customHeaders.filter(h => h.enabled && h.key && h.value).forEach(header => {
                headers[header.key] = header.value;
            });

            // Add header parameters
            headerParams.filter(p => p.enabled && p.value !== undefined && p.value !== '').forEach(param => {
                headers[param.name] = String(param.value);
            });

            // Add auth headers
            if (authConfig.type === 'bearer' && authConfig.token) {
                headers['Authorization'] = `Bearer ${authConfig.token}`;
            } else if (authConfig.type === 'basic' && authConfig.username && authConfig.password) {
                const credentials = btoa(`${authConfig.username}:${authConfig.password}`);
                headers['Authorization'] = `Basic ${credentials}`;
            } else if (authConfig.type === 'apikey' && authConfig.key && authConfig.value) {
                headers[authConfig.key] = authConfig.value;
            }

            const fetchOptions: RequestInit = {
                method: endpoint.method.toUpperCase(),
                headers,
                mode: 'cors'
            };

            // Add body
            if (hasRequestBody && requestBody.trim()) {
                fetchOptions.body = requestBody;
            }

            const response = await fetch(url, fetchOptions);
            const responseTime = Date.now() - startTime;

            // Parse response
            let responseBody;
            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('application/json')) {
                try {
                    responseBody = await response.json();
                } catch {
                    responseBody = await response.text();
                }
            } else {
                responseBody = await response.text();
            }

            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            setRequestState({
                loading: false,
                response: {
                    status: response.status,
                    statusText: response.statusText,
                    headers: responseHeaders,
                    body: responseBody,
                    responseTime
                },
                error: null,
                requestTime: responseTime
            });

        } catch (error) {
            const responseTime = Date.now() - startTime;
            setRequestState({
                loading: false,
                response: null,
                error: error instanceof Error ? error.message : 'Request failed',
                requestTime: responseTime
            });
        }
    }, [endpoint, buildRequestUrl, customHeaders, headerParams, authConfig, requestBody, hasRequestBody]);

    // Copy cURL to clipboard
    const copyCurlToClipboard = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(generateCurlCommand());
            setCopiedCurl(true);
            setTimeout(() => setCopiedCurl(false), 2000);
        } catch (err) {
            console.error('Failed to copy cURL command:', err);
        }
    }, [generateCurlCommand]);

    // Validation check
    const hasValidationErrors = useMemo(() => {
        return pathParams.some(param => param.validation && !param.validation.isValid);
    }, [pathParams]);

    // Count of configured options per tab
    const tabBadgeCounts = useMemo(() => ({
        query: queryParams.filter(p => p.enabled).length,
        auth: authConfig.type !== 'none' ? 1 : 0,
        headers: headerParams.filter(p => p.enabled).length + customHeaders.filter(h => h.enabled && h.key && h.value).length,
    }), [authConfig, queryParams, headerParams, customHeaders]);

    if (!endpoint) {
        return (
            <div className="h-full flex items-center justify-center" style={{padding: 'var(--spacing-06)'}}>
                <div className="text-center space-y-3">
                    <div
                        className="w-12 h-12 rounded bg-muted flex items-center justify-center mx-auto"
                        style={{backgroundColor: 'var(--muted)'}}
                    >
                        <Play className="w-5 h-5 text-muted-foreground"/>
                    </div>
                    <div>
                        <h3 className="font-medium text-sm">Select an endpoint</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Choose an endpoint from the list to test it
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            {/* Fixed Header */}
            <div className="border-b border-border flex-shrink-0">
                <div className="p-4 space-y-3">
                    <div>
                        <h3 className="font-medium text-sm text-foreground">Try it out</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Test your API endpoint with live requests
                        </p>
                    </div>
                </div>

                {/* Endpoint Display Section */}
                <div className="px-4 pb-4">
                    <div className="flex items-center gap-3">
                        <Badge
                            variant="outline"
                            className={`font-mono text-xs font-medium px-2 py-1 ${
                                endpoint.method.toUpperCase() === 'GET' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' :
                                    endpoint.method.toUpperCase() === 'POST' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800' :
                                        endpoint.method.toUpperCase() === 'PUT' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800' :
                                            endpoint.method.toUpperCase() === 'DELETE' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800' :
                                                'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800'
                            }`}
                        >
                            {endpoint.method.toUpperCase()}
                        </Badge>
                        <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm text-foreground truncate">{buildRequestUrl()}</div>
                            {endpoint.summary && (
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                    {endpoint.summary}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Fixed Tabs */}
                <TabsList className="w-full justify-start bg-muted/30 rounded-none border-t border-border">
                    <TabsTrigger value="query" className="text-xs cursor-pointer">
                        Query
                        {tabBadgeCounts.query > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                                {tabBadgeCounts.query}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="auth" className="text-xs cursor-pointer">
                        Auth
                        {tabBadgeCounts.auth > 0 && (
                            <div className="w-2 h-2 bg-primary rounded-full ml-1"/>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="headers" className="text-xs cursor-pointer">
                        Headers
                        {tabBadgeCounts.headers > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                                {tabBadgeCounts.headers}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="text-xs cursor-pointer">
                        Advanced
                    </TabsTrigger>
                </TabsList>
            </div>

            {/* Scrollable Content Area */}
            <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 space-y-6">

                    {/* Path Parameters - Always visible if present */}
                    {pathParams.length > 0 && (
                        <div className="space-y-4">
                            <div>
                                <Label className="font-medium text-sm">Path Parameters</Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Required parameters in the URL path
                                </p>
                            </div>
                            <div className="grid gap-4 grid-cols-1">
                                {pathParams.map((param) => (
                                    <div key={param.name} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-mono">{param.name}</Label>
                                            <Badge variant="outline"
                                                   className="text-xs">{param.schema?.type || 'string'}</Badge>
                                        </div>
                                        <Input
                                            value={param.value || ''}
                                            onChange={(e) => updateParameter(pathParams, setPathParams, param.name, e.target.value)}
                                            placeholder={param.example || `Enter ${param.name}`}
                                            className="h-8 text-xs font-mono"
                                        />
                                        {param.description && (
                                            <p className="text-xs text-muted-foreground">{param.description}</p>
                                        )}
                                        {param.validation && !param.validation.isValid && (
                                            <p className="text-xs text-destructive">{param.validation.errors[0]}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab Content Panels */}
                    <TabsContent value="query" className="mt-0 space-y-0">
                                    <div className="max-h-80 overflow-y-auto">
                                        {queryParams.length > 0 ? (
                                            <div className="space-y-4">
                                                {queryParams.map((param) => (
                                                    <div key={param.name} className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Checkbox
                                                                    checked={param.enabled}
                                                                    onCheckedChange={() => {
                                                                        setQueryParams(prev => prev.map(p =>
                                                                            p.name === param.name ? {
                                                                                ...p,
                                                                                enabled: !p.enabled
                                                                            } : p
                                                                        ));
                                                                    }}
                                                                />
                                                                <Label
                                                                    className="text-xs font-mono">{param.name}</Label>
                                                                {param.required && (
                                                                    <Badge variant="destructive"
                                                                           className="text-xs ml-2">
                                                                        Required
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <Badge variant="outline"
                                                                   className="text-xs">{param.schema?.type || 'string'}</Badge>
                                                        </div>
                                                        {param.enabled && (
                                                            <div className="ml-6">
                                                                <Input
                                                                    value={param.value || ''}
                                                                    onChange={(e) => updateParameter(queryParams, setQueryParams, param.name, e.target.value)}
                                                                    placeholder={param.example || `Enter ${param.name}`}
                                                                    className="h-8 text-xs font-mono"
                                                                />
                                                                {param.description && (
                                                                    <p className="text-xs text-muted-foreground mt-2">
                                                                        {param.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center text-muted-foreground p-8">
                                                <Globe className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                                                <p className="text-xs">No query parameters</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                    {/* Authentication Tab */}
                    <TabsContent value="auth" className="mt-0">
                                    <div className="max-h-80 overflow-y-auto">
                                        <div className="space-y-5">
                                            <RadioGroup value={authConfig.type}
                                                        onValueChange={(value) => setAuthConfig({type: value})}>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="none" id="none"/>
                                                    <Label htmlFor="none" className="text-xs">No Authentication</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="bearer" id="bearer"/>
                                                    <Label htmlFor="bearer" className="text-xs">Bearer Token</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="basic" id="basic"/>
                                                    <Label htmlFor="basic" className="text-xs">Basic Auth</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="apikey" id="apikey"/>
                                                    <Label htmlFor="apikey" className="text-xs">API Key</Label>
                                                </div>
                                            </RadioGroup>

                                            {authConfig.type === 'bearer' && (
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Bearer Token</Label>
                                                    <Input
                                                        type="password"
                                                        value={authConfig.token || ''}
                                                        onChange={(e) => setAuthConfig({
                                                            ...authConfig,
                                                            token: e.target.value
                                                        })}
                                                        placeholder="Enter bearer token"
                                                        className="h-8 text-xs font-mono"
                                                    />
                                                </div>
                                            )}

                                            {authConfig.type === 'basic' && (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Username</Label>
                                                        <Input
                                                            value={authConfig.username || ''}
                                                            onChange={(e) => setAuthConfig({
                                                                ...authConfig,
                                                                username: e.target.value
                                                            })}
                                                            placeholder="Enter username"
                                                            className="h-8 text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Password</Label>
                                                        <Input
                                                            type="password"
                                                            value={authConfig.password || ''}
                                                            onChange={(e) => setAuthConfig({
                                                                ...authConfig,
                                                                password: e.target.value
                                                            })}
                                                            placeholder="Enter password"
                                                            className="h-8 text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {authConfig.type === 'apikey' && (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Header Name</Label>
                                                        <Input
                                                            value={authConfig.key || ''}
                                                            onChange={(e) => setAuthConfig({
                                                                ...authConfig,
                                                                key: e.target.value
                                                            })}
                                                            placeholder="e.g., X-API-Key"
                                                            className="h-8 text-xs font-mono"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">API Key Value</Label>
                                                        <Input
                                                            type="password"
                                                            value={authConfig.value || ''}
                                                            onChange={(e) => setAuthConfig({
                                                                ...authConfig,
                                                                value: e.target.value
                                                            })}
                                                            placeholder="Enter API key"
                                                            className="h-8 text-xs font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                    {/* Headers Tab */}
                    <TabsContent value="headers" className="mt-0">
                                    <div className="max-h-80 overflow-y-auto">
                                        <div className="space-y-5">
                                            {/* Header Parameters */}
                                            {headerParams.length > 0 && (
                                                <div className="space-y-4">
                                                    <Label className="text-sm font-medium">Header Parameters</Label>
                                                    {headerParams.map((param) => (
                                                        <div key={param.name} className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Checkbox
                                                                        checked={param.enabled}
                                                                        onCheckedChange={() => {
                                                                            setHeaderParams(prev => prev.map(p =>
                                                                                p.name === param.name ? {
                                                                                    ...p,
                                                                                    enabled: !p.enabled
                                                                                } : p
                                                                            ));
                                                                        }}
                                                                    />
                                                                    <Label
                                                                        className="text-xs font-mono">{param.name}</Label>
                                                                    {param.required && (
                                                                        <Badge variant="destructive"
                                                                               className="text-xs ml-2">
                                                                            Required
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <Badge variant="outline"
                                                                       className="text-xs">{param.schema?.type || 'string'}</Badge>
                                                            </div>
                                                            {param.enabled && (
                                                                <div className="ml-6">
                                                                    <Input
                                                                        value={param.value || ''}
                                                                        onChange={(e) => updateParameter(headerParams, setHeaderParams, param.name, e.target.value)}
                                                                        placeholder={param.example || `Enter ${param.name}`}
                                                                        className="h-8 text-xs font-mono"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Custom Headers */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium">Custom Headers</Label>
                                                    <Button
                                                        onClick={() => setCustomHeaders(prev => [...prev, {
                                                            key: '',
                                                            value: '',
                                                            enabled: true
                                                        }])}
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 px-2 text-xs"
                                                    >
                                                        <Plus className="w-3 h-3 mr-1"/>
                                                        Add Header
                                                    </Button>
                                                </div>
                                                <div className="space-y-3">
                                                    {customHeaders.map((header, index) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            <Input
                                                                placeholder="Header name"
                                                                value={header.key}
                                                                onChange={(e) => setCustomHeaders(prev => prev.map((h, i) =>
                                                                    i === index ? {...h, key: e.target.value} : h
                                                                ))}
                                                                className="flex-1 h-8 text-xs font-mono"
                                                            />
                                                            <Input
                                                                placeholder="Value"
                                                                value={header.value}
                                                                onChange={(e) => setCustomHeaders(prev => prev.map((h, i) =>
                                                                    i === index ? {...h, value: e.target.value} : h
                                                                ))}
                                                                className="flex-1 h-8 text-xs"
                                                            />
                                                            <Button
                                                                onClick={() => setCustomHeaders(prev => prev.map((h, i) =>
                                                                    i === index ? {...h, enabled: !h.enabled} : h
                                                                ))}
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                {header.enabled ? <Eye className="w-3 h-3"/> :
                                                                    <EyeOff className="w-3 h-3 text-muted-foreground"/>}
                                                            </Button>
                                                            <Button
                                                                onClick={() => setCustomHeaders(prev => prev.filter((_, i) => i !== index))}
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                            >
                                                                <X className="w-3 h-3"/>
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                    {/* Advanced Tab */}
                    <TabsContent value="advanced" className="mt-0">
                                    <div className="max-h-80 overflow-y-auto">
                                        <div className="space-y-5">
                                            {/* Custom Base URL */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium">Base URL Override</Label>
                                                    {customBaseUrl && (
                                                        <Button
                                                            onClick={() => {
                                                                setCustomBaseUrl('');
                                                                if (specId) {
                                                                    const storageKey = `yasp-base-url-override-${specId}`;
                                                                    sessionStorage.removeItem(storageKey);
                                                                }
                                                            }}
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                                                        >
                                                            <X className="w-3 h-3 mr-1"/>
                                                            Clear
                                                        </Button>
                                                    )}
                                                </div>
                                                <Input
                                                    value={customBaseUrl}
                                                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                                                    placeholder={selectedServer?.url || "https://api.example.com"}
                                                    className="h-8 text-xs font-mono"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Override the default server URL for testing. Leave empty to use the selected server below.
                                                </p>
                                            </div>

                                            {/* Server Selection */}
                                            {servers.length > 1 && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Server</Label>
                                                    <Select
                                                        value={selectedServer?.url || ''}
                                                        onValueChange={(url) => setSelectedServer(servers.find(s => s.url === url) || null)}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs cursor-pointer">
                                                            <SelectValue/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {servers.map((server) => (
                                                                <SelectItem key={server.url} value={server.url}
                                                                            className="text-xs py-4">
                                                                    <div className="flex flex-col items-start">
                                                                        <div className="font-mono">{server.url}</div>
                                                                        {server.description && (
                                                                            <div className="text-muted-foreground">{server.description}</div>
                                                                        )}
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            {/* cURL Command */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium text-foreground">cURL
                                                        Command</Label>
                                                    <Button
                                                        onClick={copyCurlToClipboard}
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 px-2 text-xs"
                                                    >
                                                        {copiedCurl ? <Check className="w-3 h-3 mr-1"/> :
                                                            <Copy className="w-3 h-3 mr-1"/>}
                                                        {copiedCurl ? 'Copied' : 'Copy'}
                                                    </Button>
                                                </div>
                                                <div className="bg-muted/30 rounded border p-3">
                          <pre
                              className="text-xs font-mono whitespace-pre-wrap break-all max-h-32 overflow-auto text-foreground">
                            {generateCurlCommand()}
                          </pre>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                    </TabsContent>

                    {/* Request Body - Prominent for POST/PUT/PATCH */}
                    {hasRequestBody && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="font-medium text-sm">Request Body</Label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        The data that will be sent with your request
                                    </p>
                                </div>
                                {availableContentTypes.length > 1 && (
                                    <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                                        <SelectTrigger className="w-48 h-8 text-xs">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableContentTypes.map((type) => (
                                                <SelectItem key={type} value={type}
                                                            className="text-xs font-mono">{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            <div className="border border-border rounded-md">
                                {selectedContentType === 'application/json' ? (
                                    <JsonEditor
                                        value={requestBody}
                                        onChange={setRequestBody}
                                        placeholder="Enter JSON request body..."
                                        className="min-h-48 border-0 rounded text-sm"
                                    />
                                ) : (
                                    <Textarea
                                        value={requestBody}
                                        onChange={(e) => setRequestBody(e.target.value)}
                                        placeholder="Enter request body..."
                                        className="min-h-48 border-0 rounded text-sm font-mono resize-none"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Response Section - Included in scrollable area */}
                    {(requestState.response || requestState.error) && (
                        <div className="border-t border-border bg-card/50 p-4 rounded-lg">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="font-medium text-sm">Response</Label>
                                    <Button
                                        onClick={() => setRequestState(prev => ({
                                            ...prev,
                                            response: null,
                                            error: null
                                        }))}
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-xs"
                                    >
                                        Clear
                                    </Button>
                                </div>

                                {requestState.response ? (
                                    <div className="space-y-4">
                                        {/* Status */}
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant={requestState.response.status < 400 ? "default" : "destructive"}
                                                className="font-mono"
                                            >
                                                {requestState.response.status} {requestState.response.statusText}
                                            </Badge>
                                            {requestState.requestTime && (
                                                <div className="flex items-center text-xs text-muted-foreground gap-1">
                                                    <Clock className="w-3 h-3"/>
                                                    {requestState.requestTime}ms
                                                </div>
                                            )}
                                            {requestState.response.status < 400 ? (
                                                <CheckCircle className="w-4 h-4 text-success"/>
                                            ) : (
                                                <XCircle className="w-4 h-4 text-destructive"/>
                                            )}
                                        </div>

                                        {/* Response Body */}
                                        <div className="space-y-2">
                                            <Label className="text-xs">Response Body</Label>
                                            <div className="bg-muted/30 rounded border max-h-96 overflow-auto p-3">
                        <pre className="text-xs font-mono whitespace-pre-wrap text-foreground">
                          {typeof requestState.response.body === 'string'
                              ? requestState.response.body
                              : JSON.stringify(requestState.response.body, null, 2)}
                        </pre>
                                            </div>
                                        </div>
                                    </div>
                                ) : requestState.error && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="w-4 h-4"/>
                                        <AlertDescription className="text-xs ">
                                            {requestState.error}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Send Request Button - Always Prominent */}
            <div className="border-t border-border p-4 shrink-0">
                <Button
                    onClick={executeRequest}
                    disabled={requestState.loading || hasValidationErrors}
                    className="w-full font-medium h-10"
                >
                    {requestState.loading ? (
                        <>
                            <div
                                className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                            Sending Request...
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4 mr-2"/>
                            Send Request
                        </>
                    )}
                </Button>

                {hasValidationErrors && (
                    <p className="text-xs text-destructive text-center mt-2">
                        Please fix validation errors before sending the request
                    </p>
                )}
            </div>
            </Tabs>
        </div>
    );
}
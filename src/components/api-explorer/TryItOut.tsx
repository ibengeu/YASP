import React, { useState, useEffect } from 'react';
import { Play, Copy, RotateCcw, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { JsonEditor } from './JsonEditor';
import { CodeSamples } from './CodeSamples';
import { AuthManager, AuthConfig } from './AuthManager';
import { EndpointInfo, ApiRequest, ApiResponse, TryItOutState } from './types';
import { mockResponses } from './demo-data';

interface TryItOutProps {
  endpoint: EndpointInfo | null;
  serverUrl: string;
  apiSpec?: any;
}

export function TryItOut({ endpoint, serverUrl, apiSpec }: TryItOutProps) {
  const [state, setState] = useState<TryItOutState>({
    loading: false,
    request: {
      url: '',
      method: 'GET',
      headers: {},
      queryParams: {},
      pathParams: {},
      body: ''
    },
    response: null,
    error: null
  });
  const [authConfig, setAuthConfig] = useState<AuthConfig>({ type: 'none' });
  const [showAuth, setShowAuth] = useState(false);
  const [showCodeSamples, setShowCodeSamples] = useState(false);

  useEffect(() => {
    if (endpoint) {
      resetRequest();
    }
  }, [endpoint, serverUrl]);

  const resetRequest = () => {
    if (!endpoint) return;

    const operation = endpoint.operation;
    const parameters = operation.parameters || [];
    
    // Initialize path parameters
    const pathParams: Record<string, string> = {};
    const queryParams: Record<string, string> = {};
    const headers: Record<string, string> = {};

    parameters.forEach(param => {
      const example = param.schema?.example || '';
      if (param.in === 'path') {
        pathParams[param.name] = String(example);
      } else if (param.in === 'query') {
        queryParams[param.name] = String(example);
      } else if (param.in === 'header') {
        headers[param.name] = String(example);
      }
    });

    // Set default headers
    if (operation.requestBody?.content?.['application/json']) {
      headers['Content-Type'] = 'application/json';
    }
    headers['Accept'] = 'application/json';

    // Apply authentication headers
    applyAuthHeaders(headers);

    // Get request body example
    let body = '';
    if (operation.requestBody?.content?.['application/json']?.example) {
      body = JSON.stringify(operation.requestBody.content['application/json'].example, null, 2);
    }

    setState(prev => ({
      ...prev,
      request: {
        url: buildUrl(),
        method: endpoint.method.toUpperCase(),
        headers,
        queryParams,
        pathParams,
        body
      },
      response: null,
      error: null
    }));
  };

  const buildUrl = () => {
    if (!endpoint) return '';
    
    let path = endpoint.path;
    
    // Replace path parameters
    Object.entries(state.request.pathParams).forEach(([key, value]) => {
      path = path.replace(`{${key}}`, encodeURIComponent(value));
    });

    // Add query parameters
    const queryString = Object.entries(state.request.queryParams)
      .filter(([_, value]) => value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    const baseUrl = serverUrl.replace(/\/$/, '');
    const fullPath = `${baseUrl}${path}`;
    
    return queryString ? `${fullPath}?${queryString}` : fullPath;
  };

  const applyAuthHeaders = (headers: Record<string, string>) => {
    switch (authConfig.type) {
      case 'apiKey':
        if (authConfig.apiKeyLocation === 'header' && authConfig.apiKeyName && authConfig.apiKey) {
          headers[authConfig.apiKeyName] = authConfig.apiKey;
        }
        break;
      case 'bearer':
        if (authConfig.bearerToken) {
          headers['Authorization'] = `Bearer ${authConfig.bearerToken}`;
        }
        break;
      case 'basic':
        if (authConfig.basicUsername && authConfig.basicPassword) {
          const credentials = btoa(`${authConfig.basicUsername}:${authConfig.basicPassword}`);
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
      case 'oauth2':
        if (authConfig.oauth2Token) {
          headers['Authorization'] = `Bearer ${authConfig.oauth2Token}`;
        }
        break;
    }
  };

  const applyAuthToRequest = (request: ApiRequest): ApiRequest => {
    const updatedRequest = { ...request };
    
    // Apply auth to headers
    applyAuthHeaders(updatedRequest.headers);
    
    // Apply API key to query params if needed
    if (authConfig.type === 'apiKey' && 
        authConfig.apiKeyLocation === 'query' && 
        authConfig.apiKeyName && 
        authConfig.apiKey) {
      updatedRequest.queryParams[authConfig.apiKeyName] = authConfig.apiKey;
    }
    
    return updatedRequest;
  };

  const executeRequest = async () => {
    if (!endpoint) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Apply authentication to the request
      const authenticatedRequest = applyAuthToRequest(state.request);
      
      // Simulate API call with mock responses
      const mockKey = `${endpoint.method.toUpperCase()} ${endpoint.path}`;
      const mockResponse = mockResponses[mockKey as keyof typeof mockResponses];

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

      if (mockResponse) {
        const response: ApiResponse = {
          status: mockResponse.status,
          statusText: mockResponse.statusText,
          headers: mockResponse.headers,
          body: mockResponse.body,
          responseTime: 200 + Math.random() * 300
        };

        setState(prev => ({
          ...prev,
          loading: false,
          response,
          request: authenticatedRequest
        }));
      } else {
        // Default response for unmocked endpoints
        const response: ApiResponse = {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          body: { 
            message: 'Mock response - endpoint implementation pending',
            auth_applied: authConfig.type !== 'none'
          },
          responseTime: 150
        };

        setState(prev => ({
          ...prev,
          loading: false,
          response,
          request: authenticatedRequest
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Request failed'
      }));
    }
  };

  const copyAsCurl = () => {
    if (!endpoint) return;

    const url = buildUrl();
    let curl = `curl -X ${state.request.method} "${url}"`;

    // Add headers
    Object.entries(state.request.headers).forEach(([key, value]) => {
      if (value) {
        curl += ` \\\n  -H "${key}: ${value}"`;
      }
    });

    // Add body
    if (state.request.body && state.request.method !== 'GET') {
      curl += ` \\\n  -d '${state.request.body}'`;
    }

    navigator.clipboard.writeText(curl);
  };

  if (!endpoint) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Select an endpoint to try it out</p>
        </div>
      </div>
    );
  }

  const operation = endpoint.operation;
  const parameters = operation.parameters || [];
  const pathParams = parameters.filter(p => p.in === 'path');
  const queryParams = parameters.filter(p => p.in === 'query');
  const headerParams = parameters.filter(p => p.in === 'header');

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2>Try It Out</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAuth(!showAuth)}
              className={authConfig.type !== 'none' ? 'border-primary' : ''}
            >
              <Settings className="h-4 w-4 mr-1" />
              Auth
              {authConfig.type !== 'none' && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {authConfig.type}
                </Badge>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={copyAsCurl}>
              <Copy className="h-4 w-4 mr-1" />
              Copy as cURL
            </Button>
            <Button variant="outline" size="sm" onClick={resetRequest}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground break-all font-mono bg-muted/30 px-2 py-1 rounded">
          {buildUrl()}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Authentication */}
          {showAuth && apiSpec && (
            <Collapsible open={showAuth} onOpenChange={setShowAuth}>
              <CollapsibleContent>
                <AuthManager
                  apiSpec={apiSpec}
                  onAuthChange={setAuthConfig}
                />
              </CollapsibleContent>
            </Collapsible>
          )}
          {/* Parameters */}
          {pathParams.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Path Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pathParams.map((param) => (
                  <div key={param.name}>
                    <Label htmlFor={`path-${param.name}`} className="flex items-center gap-2">
                      {param.name}
                      {param.required && <Badge variant="destructive" className="text-xs">required</Badge>}
                    </Label>
                    <Input
                      id={`path-${param.name}`}
                      value={state.request.pathParams[param.name] || ''}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        request: {
                          ...prev.request,
                          pathParams: { ...prev.request.pathParams, [param.name]: e.target.value }
                        }
                      }))}
                      placeholder={param.description || param.name}
                      className="mt-1"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {queryParams.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Query Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {queryParams.map((param) => (
                  <div key={param.name}>
                    <Label htmlFor={`query-${param.name}`} className="flex items-center gap-2">
                      {param.name}
                      {param.required && <Badge variant="destructive" className="text-xs">required</Badge>}
                    </Label>
                    <Input
                      id={`query-${param.name}`}
                      value={state.request.queryParams[param.name] || ''}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        request: {
                          ...prev.request,
                          queryParams: { ...prev.request.queryParams, [param.name]: e.target.value }
                        }
                      }))}
                      placeholder={param.description || param.name}
                      className="mt-1"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Headers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Headers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {headerParams.map((param) => (
                <div key={param.name}>
                  <Label htmlFor={`header-${param.name}`} className="flex items-center gap-2">
                    {param.name}
                    {param.required && <Badge variant="destructive" className="text-xs">required</Badge>}
                  </Label>
                  <Input
                    id={`header-${param.name}`}
                    value={state.request.headers[param.name] || ''}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      request: {
                        ...prev.request,
                        headers: { ...prev.request.headers, [param.name]: e.target.value }
                      }
                    }))}
                    placeholder={param.description || param.name}
                    className="mt-1"
                  />
                </div>
              ))}
              
              {/* Common headers */}
              <div>
                <Label htmlFor="content-type">Content-Type</Label>
                <Input
                  id="content-type"
                  value={state.request.headers['Content-Type'] || ''}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    request: {
                      ...prev.request,
                      headers: { ...prev.request.headers, 'Content-Type': e.target.value }
                    }
                  }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="accept">Accept</Label>
                <Input
                  id="accept"
                  value={state.request.headers['Accept'] || ''}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    request: {
                      ...prev.request,
                      headers: { ...prev.request.headers, 'Accept': e.target.value }
                    }
                  }))}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Request Body */}
          {operation.requestBody && state.request.method !== 'GET' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Request Body</CardTitle>
              </CardHeader>
              <CardContent>
                <JsonEditor
                  value={state.request.body}
                  onChange={(value) => setState(prev => ({
                    ...prev,
                    request: { ...prev.request, body: value }
                  }))}
                  placeholder="Enter request body..."
                />
              </CardContent>
            </Card>
          )}

          {/* Execute Button */}
          <Button 
            onClick={executeRequest} 
            disabled={state.loading}
            className="w-full"
            size="lg"
          >
            <Play className="h-4 w-4 mr-2" />
            {state.loading ? 'Executing...' : 'Execute'}
          </Button>

          {/* Error */}
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Code Samples */}
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCodeSamples(!showCodeSamples)}
              className="mb-4"
            >
              {showCodeSamples ? 'Hide' : 'Show'} Code Samples
            </Button>
            
            {showCodeSamples && (
              <CodeSamples
                endpoint={endpoint}
                request={applyAuthToRequest(state.request)}
                serverUrl={serverUrl}
              />
            )}
          </div>

          {/* Response */}
          {state.response && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  Response
                  <Badge variant={state.response.status < 300 ? "default" : "destructive"}>
                    {state.response.status} {state.response.statusText}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(state.response.responseTime)}ms
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="body" className="w-full">
                  <TabsList className="rounded-lg bg-secondary/30">
                    <TabsTrigger value="body" className="rounded-lg">Body</TabsTrigger>
                    <TabsTrigger value="headers" className="rounded-lg">Headers</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="body" className="mt-4">
                    {state.response.body !== null ? (
                      <JsonEditor
                        value={typeof state.response.body === 'string' 
                          ? state.response.body 
                          : JSON.stringify(state.response.body, null, 2)
                        }
                        onChange={() => {}}
                        readOnly
                        className="border-border/50"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground italic p-4 bg-muted/30 rounded-lg border border-border/50">
                        No response body
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="headers" className="mt-4">
                    <div className="space-y-2 bg-muted/30 p-4 rounded-lg border border-border/50">
                      {Object.entries(state.response.headers).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <code className="text-muted-foreground font-mono">{key}:</code>
                          <code className="font-mono">{value}</code>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Play, Settings, Plus, X, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AuthManager, AuthConfig } from './AuthManager';
import { JsonEditor } from './JsonEditor';
import { EndpointInfo, Schema } from './types';

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface TryItOutSimplifiedProps {
  endpoint: EndpointInfo | null;
  serverUrl: string;
  apiSpec?: any;
}

// Generate example value from schema
function generateExampleFromSchema(schema: Schema, apiSpec?: any): any {
  if (!schema) return '';
  
  // Handle $ref references
  if (schema.$ref && apiSpec) {
    const refPath = schema.$ref.replace('#/', '').split('/');
    let resolvedSchema = apiSpec;
    for (const path of refPath) {
      resolvedSchema = resolvedSchema?.[path];
    }
    if (resolvedSchema) {
      return generateExampleFromSchema(resolvedSchema, apiSpec);
    }
  }
  
  if (schema.example !== undefined) {
    return schema.example;
  }
  
  switch (schema.type) {
    case 'string':
      if (schema.format === 'email') return 'user@example.com';
      if (schema.format === 'date-time') return new Date().toISOString();
      if (schema.format === 'date') return new Date().toISOString().split('T')[0];
      if (schema.enum) return schema.enum[0];
      return 'string';
    case 'number':
    case 'integer':
      return schema.enum ? schema.enum[0] : 0;
    case 'boolean':
      return false;
    case 'array':
      if (schema.items) {
        return [generateExampleFromSchema(schema.items, apiSpec)];
      }
      return [];
    case 'object':
      if (schema.properties) {
        const obj: any = {};
        Object.entries(schema.properties).forEach(([key, prop]) => {
          obj[key] = generateExampleFromSchema(prop as Schema, apiSpec);
        });
        return obj;
      }
      return {};
    default:
      return '';
  }
}

export function TryItOutSimplified({ endpoint, serverUrl, apiSpec }: TryItOutSimplifiedProps) {
  const [headers, setHeaders] = useState<Header[]>([]);
  const [authConfig, setAuthConfig] = useState<AuthConfig>({ type: 'none' });
  const [requestBody, setRequestBody] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('body');
  const [curlCommand, setCurlCommand] = useState('');
  const [copied, setCopied] = useState(false);

  // Initialize headers and body from endpoint
  useEffect(() => {
    if (endpoint) {
      // Set active tab based on endpoint method - prefer body for POST/PUT/PATCH, otherwise auth
      const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase());
      setActiveTab(hasBody ? 'body' : 'auth');
      const requiredHeaders: Header[] = [];
      
      // Add content-type header for requests with body
      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase())) {
        requiredHeaders.push({
          key: 'Content-Type',
          value: 'application/json',
          enabled: true
        });
      }

      // Add accept header
      requiredHeaders.push({
        key: 'Accept',
        value: 'application/json',
        enabled: true
      });

      // Add any required headers from the spec
      if (endpoint.operation.parameters) {
        endpoint.operation.parameters
          .filter(param => param.in === 'header' && param.required)
          .forEach(param => {
            requiredHeaders.push({
              key: param.name,
              value: param.example || '',
              enabled: true
            });
          });
      }

      setHeaders(requiredHeaders);

      // Generate request body for methods that support it
      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase()) && endpoint.operation.requestBody) {
        const requestBodyContent = endpoint.operation.requestBody.content;
        const jsonContent = requestBodyContent['application/json'];
        
        if (jsonContent && jsonContent.schema) {
          const exampleBody = generateExampleFromSchema(jsonContent.schema, apiSpec);
          setRequestBody(JSON.stringify(exampleBody, null, 2));
        } else {
          setRequestBody('{}');
        }
      } else {
        setRequestBody('');
      }
    }
  }, [endpoint]);

  // Generate cURL command
  useEffect(() => {
    if (!endpoint || !serverUrl) {
      setCurlCommand('');
      return;
    }

    const url = `${serverUrl}${endpoint.path}`;
    const method = endpoint.method.toUpperCase();
    
    let curl = `curl -X ${method} "${url}"`;
    
    // Add headers
    headers.filter(h => h.enabled && h.key && h.value).forEach(header => {
      curl += ` \\\n  -H "${header.key}: ${header.value}"`;
    });

    // Add auth header if configured
    if (authConfig.type === 'bearer' && authConfig.token) {
      curl += ` \\\n  -H "Authorization: Bearer ${authConfig.token}"`;
    } else if (authConfig.type === 'basic' && authConfig.username && authConfig.password) {
      const credentials = btoa(`${authConfig.username}:${authConfig.password}`);
      curl += ` \\\n  -H "Authorization: Basic ${credentials}"`;
    } else if (authConfig.type === 'apiKey' && authConfig.keyName && authConfig.keyValue) {
      if (authConfig.keyLocation === 'header') {
        curl += ` \\\n  -H "${authConfig.keyName}: ${authConfig.keyValue}"`;
      } else if (authConfig.keyLocation === 'query') {
        const separator = url.includes('?') ? '&' : '?';
        curl = curl.replace(`"${url}"`, `"${url}${separator}${authConfig.keyName}=${authConfig.keyValue}"`);
      }
    }

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody.trim()) {
      curl += ` \\\n  -d '${requestBody}'`;
    }

    setCurlCommand(curl);
  }, [endpoint, serverUrl, headers, authConfig, requestBody]);

  const addHeader = () => {
    setHeaders(prev => [...prev, { key: '', value: '', enabled: true }]);
  };

  const updateHeader = (index: number, field: keyof Header, value: string | boolean) => {
    setHeaders(prev => prev.map((header, i) => 
      i === index ? { ...header, [field]: value } : header
    ));
  };

  const removeHeader = (index: number) => {
    setHeaders(prev => prev.filter((_, i) => i !== index));
  };

  const handleTryRequest = async () => {
    if (!endpoint) return;
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!endpoint) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Play className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-sm">Select an endpoint</h3>
          <p className="text-xs text-muted-foreground">
            Choose an endpoint from the list to test it
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header - Title on its own line */}
      <div className="border-b border-border/50 p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm">Try it out</h3>
          <p className="text-xs text-muted-foreground">
            Configure and test your API endpoint
          </p>
        </div>
        
        {/* Endpoint Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`font-mono text-xs px-2 py-1 ${
                endpoint.method.toUpperCase() === 'GET' ? 'bg-green-50 text-green-700 border-green-200' :
                endpoint.method.toUpperCase() === 'POST' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                endpoint.method.toUpperCase() === 'PUT' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                endpoint.method.toUpperCase() === 'DELETE' ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              {endpoint.method.toUpperCase()}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">{endpoint.path}</span>
          </div>
          {endpoint.summary && (
            <p className="text-xs text-muted-foreground">{endpoint.summary}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b border-border/50 px-4">
            <TabsList className={`grid w-full ${['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase()) ? 'grid-cols-4' : 'grid-cols-3'} bg-transparent h-auto p-0`}>
              {['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase()) && (
                <TabsTrigger
                  value="body"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-3"
                >
                  Body
                </TabsTrigger>
              )}
              <TabsTrigger
                value="auth"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-3"
              >
                Auth
              </TabsTrigger>
              <TabsTrigger
                value="headers"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-3"
              >
                Headers
              </TabsTrigger>
              <TabsTrigger
                value="curl"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-3"
              >
                cURL
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4">
              {/* Body Tab - Now first */}
              {['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase()) && (
                <TabsContent value="body" className="space-y-4 mt-0">
                  <div>
                    <Label className="font-medium text-sm">Request Body</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      JSON payload for the request
                    </p>
                  </div>
                  <JsonEditor
                    value={requestBody}
                    onChange={setRequestBody}
                    placeholder="Enter JSON request body..."
                    className="min-h-[200px]"
                  />
                </TabsContent>
              )}

              {/* Auth Tab */}
              <TabsContent value="auth" className="space-y-4 mt-0">
                <AuthManager
                  apiSpec={apiSpec || {
                    openapi: '3.0.0',
                    info: { title: 'API', version: '1.0.0' },
                    paths: {},
                    components: { securitySchemes: {} }
                  }}
                  onAuthChange={setAuthConfig}
                />
              </TabsContent>

              {/* Headers Tab */}
              <TabsContent value="headers" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-sm">Headers</Label>
                  <Button
                    onClick={addHeader}
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {headers.map((header, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Header name"
                        value={header.key}
                        onChange={(e) => updateHeader(index, 'key', e.target.value)}
                        className="flex-1 h-8 text-xs"
                      />
                      <Input
                        placeholder="Value"
                        value={header.value}
                        onChange={(e) => updateHeader(index, 'value', e.target.value)}
                        className="flex-1 h-8 text-xs"
                      />
                      <Button
                        onClick={() => updateHeader(index, 'enabled', !header.enabled)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        {header.enabled ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        onClick={() => removeHeader(index)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  {headers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-xs">No headers added</p>
                      <p className="text-xs mt-1">Click "Add" to add custom headers</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* cURL Tab */}
              <TabsContent value="curl" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-sm">cURL Command</Label>
                  <Button
                    onClick={copyToClipboard}
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                    {curlCommand || 'Configure your request to generate cURL command'}
                  </pre>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Send Request Button - At Bottom */}
      <div className="border-t border-border/50 p-4">
        <Button
          onClick={handleTryRequest}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 h-9 text-sm"
        >
          <Play className="h-4 w-4 mr-2" />
          {loading ? 'Sending...' : 'Send Request'}
        </Button>
      </div>
    </div>
  );
}
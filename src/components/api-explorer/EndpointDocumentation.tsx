import React from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { JsonEditor } from './JsonEditor';
import { LazySection } from './LazySection';
import { EndpointInfo, Schema } from './types';

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

interface EndpointDocumentationProps {
  endpoint: EndpointInfo | null;
  apiSpec: any;
}

const methodColors = {
  get: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  post: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  put: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  patch: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  head: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  options: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  trace: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
};

function SchemaPropertiesDisplay({ schema, apiSpec }: { schema: Schema; apiSpec: any }) {
  const resolvedSchema = resolveSchemaRef(schema, apiSpec);
  
  if (!resolvedSchema.properties) {
    return (
      <div className="text-sm text-muted-foreground p-3 bg-muted/20 rounded-sm">
        No properties defined for this schema.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Object.entries(resolvedSchema.properties).map(([key, property]: [string, any]) => (
        <div key={key} className="border border-border/50 rounded-sm p-3 bg-muted/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <code className="font-mono text-sm font-medium">{key}</code>
                {resolvedSchema.required?.includes(key) && (
                  <Badge variant="destructive" className="text-xs px-1 py-0">
                    required
                  </Badge>
                )}
              </div>
              {property.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {property.description}
                </p>
              )}
            </div>
            <Badge variant="outline" className="text-xs font-mono shrink-0">
              {property.type || 'string'}
              {property.format && ` (${property.format})`}
            </Badge>
          </div>
          {property.enum && (
            <div className="mt-2 pt-2 border-t border-border/30">
              <span className="text-xs text-muted-foreground">Allowed values: </span>
              <code className="text-xs font-mono">{property.enum.join(', ')}</code>
            </div>
          )}
          {property.example !== undefined && (
            <div className="mt-2 pt-2 border-t border-border/30">
              <span className="text-xs text-muted-foreground">Example: </span>
              <code className="text-xs font-mono">
                {typeof property.example === 'string' ? property.example : JSON.stringify(property.example)}
              </code>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function EndpointDocumentation({ endpoint, apiSpec }: EndpointDocumentationProps) {
  if (!endpoint) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <div className="h-6 w-6 bg-muted-foreground/20 rounded"></div>
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-sm">Select an endpoint</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Choose an endpoint from the sidebar to view its documentation, parameters, and response details
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { operation } = endpoint;
  const parameters = operation.parameters || [];
  
  // Group parameters by type for better organization
  const pathParams = parameters.filter(p => p.in === 'path');
  const queryParams = parameters.filter(p => p.in === 'query');
  const headerParams = parameters.filter(p => p.in === 'header');

  const renderParameterGroup = (title: string, params: any[]) => {
    if (params.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">{title} Parameters</h4>
        {params.map((param) => (
          <div key={param.name} className="border rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <code className="text-sm font-mono">{param.name}</code>
              <Badge variant={param.required ? "destructive" : "secondary"} className="text-xs">
                {param.required ? 'required' : 'optional'}
              </Badge>
              {param.schema?.type && (
                <Badge variant="outline" className="text-xs">
                  {param.schema.type}
                  {param.schema.format && ` (${param.schema.format})`}
                </Badge>
              )}
            </div>
            {param.description && (
              <p className="text-sm text-muted-foreground mb-2">{param.description}</p>
            )}
            {param.schema?.example && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Example:</p>
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  {String(param.schema.example)}
                </code>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderRequestBody = () => {
    if (!operation.requestBody) return null;

    const firstMediaType = Object.keys(operation.requestBody.content)[0];
    const content = operation.requestBody.content[firstMediaType];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Request Body</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {operation.requestBody.description && (
            <p className="text-sm text-muted-foreground">{operation.requestBody.description}</p>
          )}
          
          {Object.entries(operation.requestBody.content).map(([mediaType, content]) => (
            <div key={mediaType} className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{mediaType}</Badge>
              </div>
              
              {content.schema && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Properties</h4>
                  <SchemaPropertiesDisplay schema={content.schema} apiSpec={apiSpec} />
                </div>
              )}
              
              {content.example && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Example Request</h4>
                  <JsonEditor
                    value={JSON.stringify(content.example, null, 2)}
                    onChange={() => {}}
                    readOnly
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  const renderResponses = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Responses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(operation.responses).map(([statusCode, response]) => (
            <div key={statusCode} className="space-y-4">
              <div>
                <Badge variant={statusCode.startsWith('2') ? "default" : "destructive"} className="mb-2">
                  {statusCode}
                </Badge>
                <p className="text-sm text-muted-foreground">{response.description}</p>
              </div>
              
              {response.content && Object.entries(response.content).map(([mediaType, content]) => (
                <div key={mediaType} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{mediaType}</Badge>
                  </div>
                  
                  {content.schema && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Properties</h4>
                      <SchemaPropertiesDisplay schema={content.schema} apiSpec={apiSpec} />
                    </div>
                  )}
                  
                  {content.example && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Example Response</h4>
                      <JsonEditor
                        value={JSON.stringify(content.example, null, 2)}
                        onChange={() => {}}
                        readOnly
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <Badge 
            className={`text-xs font-mono uppercase ${methodColors[endpoint.method as keyof typeof methodColors] || methodColors.get}`}
            variant="secondary"
          >
            {endpoint.method}
          </Badge>
          <code className="bg-muted px-2 py-1 rounded text-sm">{endpoint.path}</code>
          {operation.deprecated && (
            <Badge variant="destructive" className="text-xs">Deprecated</Badge>
          )}
        </div>
        {operation.summary && (
          <h3 className="mb-2">{operation.summary}</h3>
        )}
        {operation.description && (
          <p className="text-sm text-muted-foreground">{operation.description}</p>
        )}
      </div>

      <ScrollArea className="flex-1 h-full">
        <div className="px-6 py-4 space-y-6">
          {/* Parameters grouped by type */}
          {parameters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderParameterGroup('Path', pathParams)}
                {renderParameterGroup('Query', queryParams)}
                {renderParameterGroup('Header', headerParams)}
              </CardContent>
            </Card>
          )}

          {/* Request Body */}
          {renderRequestBody()}

          {/* Responses */}
          {renderResponses()}
        </div>
      </ScrollArea>
    </div>
  );
}
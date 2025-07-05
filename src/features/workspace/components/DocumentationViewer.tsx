import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import {AlertCircle, Play, FileText} from "lucide-react";
import {ApiSpec} from "@/features/workspace/WorkspacePage.tsx";
import {useEffect, useState} from "react";
import {Textarea} from "@/core/components/ui/textarea.tsx";
import * as yaml from 'yaml';


interface DocumentationViewerProps {
  spec: ApiSpec;
}

interface ParsedSpec {
  openapi?: string;
  info?: {
    title?: string;
    description?: string;
    version?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths?: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
  };
}

const DocumentationViewer: React.FC<DocumentationViewerProps> = ({ spec }) => {
  const [parsedSpec, setParsedSpec] = useState<ParsedSpec | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testEndpoint, setTestEndpoint] = useState<string>('');
  const [testResponse, setTestResponse] = useState<string>('');

  useEffect(() => {
    if (!spec || !spec.content) {
      setIsLoading(false);
      setParsedSpec(null);
      setParseError('No specification provided');
      return;
    }

    setIsLoading(true);
    
    try {
      if (spec.content.trim() === '') {
        setParsedSpec(null);
        setParseError('Empty specification content');
        return;
      }

      let parsed: ParsedSpec;
      if (spec.format === 'yaml') {
        parsed = yaml.parse(spec.content);
      } else {
        parsed = JSON.parse(spec.content);
      }
      
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid specification format');
      }
      
      setParsedSpec(parsed);
      setParseError(null);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Invalid format');
      setParsedSpec(null);
    } finally {
      setIsLoading(false);
    }
  }, [spec, spec?.content, spec?.format]);

  const handleTryItOut = async (path: string, method: string) => {
    setTestEndpoint(`${method.toUpperCase()} ${path}`);
    setTestResponse('');
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      get: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      post: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      put: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      delete: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      patch: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
    };
    return colors[method.toLowerCase()] || 'bg-muted text-muted-foreground';
  };

  if (parseError) {
    return (
        <div className="h-full flex flex-col bg-background">
          <div className="p-4 bg-card border-b border-border">
            <h2 className="text-lg font-semibold text-card-foreground">Documentation</h2>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center">
            <Card className="p-6 max-w-md">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  Parse Error
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Unable to parse the OpenAPI specification:
                </p>
                <code className="text-xs bg-destructive/10 text-destructive p-2 rounded block">
                  {parseError}
                </code>
              </div>
            </Card>
          </div>
        </div>
    );
  }

  if (isLoading) {
    return (
        <div className="h-full flex items-center justify-center bg-background">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading documentation...</p>
            <p className="text-xs text-muted-foreground mt-2">Format: {spec?.format}, Content length: {spec?.content?.length || 0}</p>
          </div>
        </div>
    );
  }

  if (!parsedSpec && !parseError) {
    return (
        <div className="h-full flex items-center justify-center bg-background">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No specification content available</p>
          </div>
        </div>
    );
  }

  return (
      <div className="h-full flex flex-col bg-background overflow-hidden">
        <div className="flex-shrink-0 p-4 bg-card border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">
                {parsedSpec.info?.title || 'API Documentation'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {parsedSpec.info?.description || 'OpenAPI Documentation'}
              </p>
            </div>
            <Badge variant="outline">
              v{parsedSpec.info?.version || '1.0.0'}
            </Badge>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* API Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">API Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Title</label>
                  <p className="text-sm text-foreground">{parsedSpec.info?.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Version</label>
                  <p className="text-sm text-foreground">{parsedSpec.info?.version}</p>
                </div>
                {parsedSpec.info?.description && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-foreground">Description</label>
                      <p className="text-sm text-foreground">{parsedSpec.info.description}</p>
                    </div>
                )}
              </div>
            </Card>

            {/* Servers */}
            {parsedSpec.servers && parsedSpec.servers.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Servers</h3>
                  <div className="space-y-2">
                    {parsedSpec.servers.map((server, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {server.url}
                          </code>
                          {server.description && (
                              <span className="text-sm text-muted-foreground">{server.description}</span>
                          )}
                        </div>
                    ))}
                  </div>
                </Card>
            )}

            {/* API Endpoints */}
            {parsedSpec.paths && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Endpoints</h3>
                  <div className="space-y-4">
                    {Object.entries(parsedSpec.paths).map(([path, pathItem]: [string, unknown]) => (
                        <div key={path} className="border border-border rounded-lg overflow-hidden">
                          <div className="bg-muted px-4 py-2 border-b border-border">
                            <code className="text-sm font-mono">{path}</code>
                          </div>
                          <div className="p-4 space-y-3">
                            {Object.entries(pathItem as Record<string, unknown>).map(([method, operation]: [string, unknown]) => {
                              if (typeof operation !== 'object' || operation === null || !('summary' in operation)) return null;
                              
                              const op = operation as { summary?: string; description?: string; parameters?: unknown[]; responses?: Record<string, unknown> };

                              return (
                                  <div key={method} className="border border-border rounded-lg">
                                    <div className="p-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-3">
                                          <Badge className={getMethodColor(method)}>
                                            {method.toUpperCase()}
                                          </Badge>
                                          <span className="font-medium">{op.summary}</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleTryItOut(path, method)}
                                        >
                                          <Play className="h-4 w-4 mr-1" />
                                          Try it out
                                        </Button>
                                      </div>

                                      {op.description && (
                                          <p className="text-sm text-muted-foreground mb-3">
                                            {op.description}
                                          </p>
                                      )}

                                      {op.parameters && Array.isArray(op.parameters) && op.parameters.length > 0 && (
                                          <div className="mb-3">
                                            <h5 className="text-sm font-medium text-foreground mb-2">Parameters</h5>
                                            <div className="space-y-2">
                                              {op.parameters.map((param: unknown, index: number) => {
                                                const p = param as { name?: string; in?: string; required?: boolean; description?: string };
                                                return (
                                                  <div key={index} className="bg-muted p-2 rounded text-sm">
                                                    <span className="font-medium">{p.name}</span>
                                                    <span className="text-muted-foreground ml-2">({p.in})</span>
                                                    {p.required && (
                                                        <Badge variant="destructive" className="ml-2 text-xs">
                                                          Required
                                                        </Badge>
                                                    )}
                                                    {p.description && (
                                                        <p className="text-muted-foreground mt-1">{p.description}</p>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                      )}

                                      {op.responses && (
                                          <div>
                                            <h5 className="text-sm font-medium text-foreground mb-2">Responses</h5>
                                            <div className="space-y-1">
                                              {Object.entries(op.responses).map(([code, response]: [string, unknown]) => {
                                                const r = response as { description?: string };
                                                return (
                                                  <div key={code} className="flex items-center space-x-2 text-sm">
                                                    <Badge variant={code.startsWith('2') ? 'default' : 'destructive'}>
                                                      {code}
                                                    </Badge>
                                                    <span className="text-muted-foreground">
                                          {r.description || 'No description'}
                                        </span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                      )}
                                    </div>
                                  </div>
                              );
                            })}
                          </div>
                        </div>
                    ))}
                  </div>
                </Card>
            )}

            {/* Test Response */}
            {testResponse && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Test Response</h3>
                  <div className="mb-3">
                    <Badge variant="outline">{testEndpoint}</Badge>
                  </div>
                  <Textarea
                      value={testResponse}
                      readOnly
                      className="font-mono text-sm"
                      rows={10}
                  />
                </Card>
            )}
          </div>
        </div>
      </div>
  );
};

export default DocumentationViewer;
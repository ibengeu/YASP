import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Upload, AlertCircle, ArrowLeft, Server, Command } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { EndpointsList } from './EndpointsList';
import { EndpointDocumentation } from './EndpointDocumentation';
import { TryItOutSimplified } from './TryItOutSimplified';
import { SchemasViewer } from './SchemasViewer';
import { OpenAPISpec, EndpointGroup, EndpointInfo } from './types';
import { demoApiSpec } from './demo-data';
import { motion } from 'motion/react';

interface ApiExplorerProps {
  apiSpec?: OpenAPISpec;
  onSpecLoad?: (spec: OpenAPISpec) => void;
  onBackToCatalog?: () => void;
}

export function ApiExplorer({ apiSpec, onSpecLoad, onBackToCatalog }: ApiExplorerProps) {
  const [spec, setSpec] = useState<OpenAPISpec | null>(apiSpec || demoApiSpec);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointInfo | null>(null);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [endpointGroups, setEndpointGroups] = useState<EndpointGroup[]>([]);


  // Initialize server selection
  useEffect(() => {
    if (spec?.servers?.[0]?.url && !selectedServer) {
      setSelectedServer(spec.servers[0].url);
    }
  }, [spec, selectedServer]);

  // Process API spec into endpoint groups
  const processedGroups = useMemo(() => {
    if (!spec) return [];

    const groups: Record<string, EndpointGroup> = {};
    
    // Initialize groups from tags
    spec.tags?.forEach(tag => {
      groups[tag.name] = {
        tag: tag.name,
        description: tag.description,
        endpoints: [],
        collapsed: false
      };
    });

    // Process paths and operations
    Object.entries(spec.paths).forEach(([path, pathItem]) => {
      Object.entries(pathItem).forEach(([method, operation]) => {
        if (typeof operation !== 'object' || !operation) return;

        const endpoint: EndpointInfo = {
          path,
          method: method.toLowerCase(),
          operation,
          summary: operation.summary,
          deprecated: operation.deprecated
        };

        // Assign to tags or create default group
        const tags = operation.tags || ['default'];
        tags.forEach(tag => {
          if (!groups[tag]) {
            groups[tag] = {
              tag,
              description: `${tag} operations`,
              endpoints: [],
              collapsed: false
            };
          }
          groups[tag].endpoints.push(endpoint);
        });
      });
    });

    return Object.values(groups).filter(group => group.endpoints.length > 0);
  }, [spec]);

  useEffect(() => {
    setEndpointGroups(processedGroups);
  }, [processedGroups]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      let parsedSpec: OpenAPISpec;

      if (file.name.endsWith('.json')) {
        parsedSpec = JSON.parse(text);
      } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        // For YAML support, you might want to add a YAML parser
        throw new Error('YAML support requires additional dependencies. Please use JSON format.');
      } else {
        throw new Error('Unsupported file format. Please use JSON or YAML.');
      }

      // Basic validation
      if (!parsedSpec.openapi || !parsedSpec.info || !parsedSpec.paths) {
        throw new Error('Invalid OpenAPI specification format.');
      }

      setSpec(parsedSpec);
      setSelectedEndpoint(null);
      onSpecLoad?.(parsedSpec);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API specification');
    } finally {
      setLoading(false);
    }
  }, [onSpecLoad]);

  const handleEndpointSelect = useCallback((endpoint: EndpointInfo) => {
    setSelectedEndpoint(endpoint);
  }, []);

  const handleGroupToggle = useCallback((tag: string) => {
    setEndpointGroups(prev => 
      prev.map(group => 
        group.tag === tag 
          ? { ...group, collapsed: !group.collapsed }
          : group
      )
    );
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      // Focus search input in endpoints list
      const searchInput = document.querySelector('input[placeholder="Search endpoints..."]') as HTMLInputElement;
      searchInput?.focus();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-medium tracking-tight">Loading API Specification</h3>
            <p className="text-sm text-muted-foreground">Please wait while we process your API...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="h-screen flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="border-border/50 card-shadow-lg bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center space-y-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Load API Specification</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Upload an OpenAPI 3.0 JSON file to explore your API, or use our demo API to get started.
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <input
                    type="file"
                    accept=".json,.yaml,.yml"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button asChild variant="outline" className="w-full border-border/50 hover:bg-secondary/50 rounded-lg">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload OpenAPI File
                    </label>
                  </Button>
                </div>
                <Button onClick={() => setSpec(demoApiSpec)} className="w-full bg-primary hover:bg-primary/90 rounded-lg">
                  Use Demo API
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border/50 bg-background/95 backdrop-blur-sm flex-shrink-0"
      >
        <div className="p-6">
          <div className="space-y-4">
            {onBackToCatalog && (
              <div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onBackToCatalog}
                  className="rounded-lg hover:bg-secondary/50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Catalog
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">{spec.info.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Version {spec.info.version}</span>
                  {spec.info.description && (
                    <>
                      <span>•</span>
                      <span>{spec.info.description}</span>
                    </>
                  )}
                </div>
              </div>
              {spec.servers && spec.servers.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Server className="h-4 w-4" />
                    <span>Server:</span>
                  </div>
                  <Select value={selectedServer} onValueChange={setSelectedServer}>
                    <SelectTrigger className="w-64 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 card-shadow">
                      {spec.servers.map((server, index) => (
                        <SelectItem key={index} value={server.url} className="rounded-lg">
                          <div className="flex flex-col items-start">
                            <span className="font-mono text-sm">{server.url}</span>
                            {server.description && (
                              <span className="text-xs text-muted-foreground">{server.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="m-6 flex-shrink-0"
        >
          <Alert variant="destructive" className="border-destructive/20 bg-destructive/5 rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Main content - three columns with individual scrolling */}
      <div className="flex-1 flex min-h-0 h-full">
        {/* Column 1: Endpoints List - Fixed width sidebar with scroll */}
        <div className="w-80 border-r border-border/50 flex flex-col min-w-0 bg-sidebar/30 h-full">
          <div className="h-full overflow-hidden">
            <EndpointsList
              endpointGroups={endpointGroups}
              selectedEndpoint={selectedEndpoint}
              onEndpointSelect={handleEndpointSelect}
              onGroupToggle={handleGroupToggle}
            />
          </div>
        </div>

        {/* Column 2: Documentation - Flexible center with scroll */}
        <div className="flex-1 border-r border-border/50 flex flex-col min-w-0 h-full">
          <div className="h-full overflow-hidden">
            <EndpointDocumentation
              endpoint={selectedEndpoint}
              apiSpec={spec}
            />
          </div>
        </div>

        {/* Column 3: Try It Out - Fixed width with scroll */}
        <div className="w-96 flex flex-col min-w-0 h-full">
          <div className="h-full overflow-hidden">
            <TryItOutSimplified
              endpoint={selectedEndpoint}
              serverUrl={selectedServer}
              apiSpec={spec}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
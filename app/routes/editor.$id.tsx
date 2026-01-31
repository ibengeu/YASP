/**
 * Spec Editor Route - Redesigned to match reference platform
 * Features: Editor/Docs tabs, Endpoint sidebar (both tabs), Diagnostics panel, Maximize mode
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Save, Code2, FileText, AlertCircle, Maximize2, Minimize2,
  TerminalSquare, ChevronDown, ChevronUp, Play
} from 'lucide-react';
import { toast } from 'sonner';
import { CodeEditor } from '@/features/editor/components/CodeEditor';
import { useEditorStore } from '@/features/editor/store/editor.store';
import { TryItOutDrawer } from '@/components/api-details/TryItOutDrawer';
import { idbStorage } from '@/core/storage/idb-storage';
import { SpectralService } from '@/features/governance/services/spectral.service';
import type { ISpectralDiagnostic } from '@/core/events/event-types';
import type { PathItemObject, OperationObject, ServerObject } from '@/types/openapi-spec';

// Parsed OpenAPI spec structure
interface ParsedOpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: ServerObject[];
  paths?: Record<string, PathItemObject>;
  components?: any;
}

const spectralService = new SpectralService();

export default function SpecEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const content = useEditorStore((state) => state.content);
  const setEditorContent = useEditorStore((state) => state.setContent);
  const [title, setTitle] = useState('');
  const [diagnostics, setDiagnostics] = useState<ISpectralDiagnostic[]>([]);
  const [score, setScore] = useState(100);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'docs'>('docs');
  const [parsedSpec, setParsedSpec] = useState<ParsedOpenAPISpec | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<{
    path: string;
    method: string;
    operation: OperationObject;
  } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDiagnosticsCollapsed, setIsDiagnosticsCollapsed] = useState(false);

  // Load spec from storage
  useEffect(() => {
    const loadSpec = async () => {
      if (id === 'new') {
        // New spec template
        const template = `openapi: 3.1.0
info:
  title: My API
  version: 1.0.0
  description: API description
servers:
  - url: https://api.example.com/v1
paths:
  /example:
    get:
      summary: Example endpoint
      operationId: getExample
      tags: [Examples]
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
`;
        setEditorContent(template, 'code');
        setTitle('Untitled Spec');
      } else {
        const spec = await idbStorage.getSpec(id!);
        if (spec) {
          setEditorContent(spec.content || '', 'code');
          setTitle(spec.title || 'Untitled');
        }
      }
    };

    loadSpec();
  }, [id]);

  // Auto-validate on content change and parse spec
  useEffect(() => {
    if (!content) return;

    const validateAndParse = async () => {
      try {
        // Validate with Spectral
        const result = await spectralService.lintSpec(content);
        setDiagnostics(result.diagnostics);
        setScore(result.score);

        // Parse YAML to extract endpoints
        const yaml = await import('yaml');
        const parsed = yaml.parse(content) as ParsedOpenAPISpec;
        setParsedSpec(parsed);

        // Auto-select first endpoint if none selected
        if (!selectedEndpoint && parsed.paths) {
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
        console.error('Validation/parse error:', error);
        setParsedSpec(null);
      }
    };

    validateAndParse();
  }, [content]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (id === 'new') {
        // Parse spec to get info
        const yaml = await import('yaml');
        const parsed = yaml.parse(content);

        // Create new spec
        const newSpec = await idbStorage.createSpec({
          type: 'openapi',
          content,
          title,
          version: parsed.info?.version || '1.0.0',
          description: parsed.info?.description,
          metadata: {
            score,
            tags: [],
            workspaceType: 'personal',
            syncStatus: 'offline',
            isDiscoverable: false,
          },
        });
        navigate(`/editor/${newSpec.id}`);
        toast.success('Specification created');
      } else {
        // Parse spec to get info
        const yaml = await import('yaml');
        const parsed = yaml.parse(content);

        // Get existing spec to preserve metadata
        const existing = await idbStorage.getSpec(id!);
        if (!existing) throw new Error('Spec not found');

        // Update existing spec
        await idbStorage.updateSpec(id!, {
          content,
          title,
          version: parsed.info?.version || '1.0.0',
          description: parsed.info?.description,
          metadata: {
            ...existing.metadata,
            score,
          },
        });
        toast.success('Specification saved');
      }
    } catch (error) {
      toast.error('Failed to save specification');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleJumpToIssue = (diagnostic: ISpectralDiagnostic) => {
    // Jump to line in editor
    setActiveTab('editor');
    // TODO: Scroll editor to line
    console.log('Jump to', diagnostic);
  };

  const scrollToEndpoint = (path: string, method: string) => {
    const elementId = `endpoint-${method}-${path.replace(/\//g, '-')}`;
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToYamlLine = (path: string, method: string) => {
    // Find the line number in YAML content where this endpoint is defined
    const lines = content.split('\n');
    const searchPattern = `  ${path}:`;
    const pathLineIndex = lines.findIndex(line => line.trim() === searchPattern.trim());

    if (pathLineIndex >= 0) {
      // Find the method line after the path
      const methodLineIndex = lines.findIndex((line, idx) =>
        idx > pathLineIndex && line.trim().startsWith(`${method}:`)
      );

      if (methodLineIndex >= 0) {
        // Scroll to that line in the editor
        // TODO: Implement scroll to line in CodeMirror
        console.log('Scroll to line:', methodLineIndex + 1);
      }
    }
  };

  const errorCount = diagnostics.filter(d => d.severity === 0).length;
  const warningCount = diagnostics.filter(d => d.severity === 1).length;
  const totalProblems = errorCount + warningCount;

  // Method color mapping
  const getMethodColor = (method: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      get: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
      post: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      put: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
      patch: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
      delete: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
    };
    return colors[method.toLowerCase()] || colors.get;
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden bg-background text-foreground ${isMaximized ? 'fixed inset-0 z-[100]' : ''}`}>
      {/* Header */}
      <div className="border-b border-border bg-card shrink-0">
        {/* Top Row: Breadcrumb and Actions */}
        <div className="flex h-14 items-center justify-between px-6 border-b border-border/60">
          {/* Left: Breadcrumb */}
          <div className="flex items-center gap-3">
            {!isMaximized && (
              <>
                <button
                  onClick={() => navigate('/catalog')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Catalog
                </button>
                <div className="h-4 w-px bg-border rotate-12" />
              </>
            )}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-none bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted-foreground"
                placeholder="Untitled Spec"
              />
              {parsedSpec?.info?.version && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  v{parsedSpec.info.version}
                </span>
              )}
            </div>
          </div>

          {/* Center: Tab Switcher */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex">
            <div className="flex p-1 bg-muted border border-border rounded-lg shadow-inner">
              <button
                onClick={() => setActiveTab('docs')}
                className={`px-4 py-1.5 rounded-md transition-all text-sm font-medium ${
                  activeTab === 'docs'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Documentation
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-4 py-1.5 rounded-md transition-all text-sm font-medium ${
                  activeTab === 'editor'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Editor
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Error/Warning Badge */}
            {totalProblems > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded-full text-destructive text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorCount > 0 ? `${errorCount} Error${errorCount > 1 ? 's' : ''}` : `${warningCount} Warning${warningCount > 1 ? 's' : ''}`}
              </div>
            )}

            {/* Maximize Button */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
              title={isMaximized ? 'Minimize' : 'Maximize'}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Try It Out Button (Documentation tab only) */}
            {activeTab === 'docs' && selectedEndpoint && (
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="px-3 py-2 text-sm font-medium text-white bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Try It Out
              </button>
            )}

            {/* Save Button (Editor tab only) */}
            {activeTab === 'editor' && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-all shadow-[0_0_15px_rgba(147,51,234,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Endpoint List Sidebar (Always visible when there are endpoints) */}
        {parsedSpec?.paths && Object.keys(parsedSpec.paths).length > 0 && (
          <div className="w-72 border-r border-border bg-card flex flex-col shrink-0">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-card-foreground mb-1">Endpoints</h3>
              <p className="text-xs text-muted-foreground">
                {Object.values(parsedSpec.paths).reduce((count, pathItem) => {
                  return count + Object.keys(pathItem as PathItemObject).filter(k =>
                    ['get', 'post', 'put', 'patch', 'delete'].includes(k)
                  ).length;
                }, 0)} operations
              </p>
            </div>
            <div className="flex-1 overflow-auto">
              {Object.entries(parsedSpec.paths).map(([path, pathItem]) => {
                return Object.entries(pathItem as PathItemObject)
                  .filter(([method]) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
                  .map(([method, operation]: [string, any]) => {
                    const op = operation as OperationObject;
                    const colors = getMethodColor(method);

                    return (
                      <button
                        key={`${method}-${path}`}
                        onClick={() => {
                          // Update selected endpoint
                          setSelectedEndpoint({ path, method, operation: op });

                          if (activeTab === 'docs') {
                            // In docs tab: scroll to endpoint documentation
                            scrollToEndpoint(path, method);
                          } else {
                            // In editor tab: scroll YAML to this endpoint
                            scrollToYamlLine(path, method);
                          }
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-muted border-b border-border transition-colors group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${colors.bg} ${colors.text} border ${colors.border}`}>
                            {method}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-muted-foreground mb-1 group-hover:text-foreground transition-colors">
                          {path}
                        </div>
                        <div className="text-xs text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">
                          {op.summary || 'No summary'}
                        </div>
                      </button>
                    );
                  });
              })}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Tab */}
          {activeTab === 'editor' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <CodeEditor language="yaml" />
            </div>
          )}

          {/* Documentation Tab */}
          {activeTab === 'docs' && (
            <div className="flex-1 overflow-auto bg-background p-8 md:p-12">
              <div className="max-w-4xl mx-auto">
                {parsedSpec && parsedSpec.paths ? (
                  <>
                    {/* API Info Header */}
                    <div className="mb-12">
                      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-foreground">
                        {parsedSpec.info.title}
                      </h1>
                      <p className="text-base leading-relaxed text-muted-foreground">
                        {parsedSpec.info.description || 'No description provided'}
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Version {parsedSpec.info.version}</span>
                        {parsedSpec.servers?.[0] && (
                          <>
                            <span>•</span>
                            <code className="px-2 py-1 rounded bg-muted border border-border text-foreground font-mono text-xs">
                              {parsedSpec.servers[0].url}
                            </code>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Endpoints */}
                    {Object.entries(parsedSpec.paths).map(([path, pathItem]) => {
                      return Object.entries(pathItem as PathItemObject)
                        .filter(([method]) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
                        .map(([method, operation]: [string, any]) => {
                          const op = operation as OperationObject;
                          const colors = getMethodColor(method);

                          return (
                            <div
                              key={`${method}-${path}`}
                              id={`endpoint-${method}-${path.replace(/\//g, '-')}`}
                              className="mb-16 scroll-mt-16"
                            >
                              {/* Accent Strip */}
                              <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-pink-500 mb-4 rounded-full" />

                              {/* Operation Summary */}
                              <h2 className="text-2xl md:text-3xl uppercase font-bold tracking-tight mb-3 text-foreground">
                                {op.summary || 'Unnamed Operation'}
                              </h2>
                              <p className="text-sm md:text-base leading-relaxed mb-6 text-muted-foreground">
                                {op.description || 'No detailed description provided in the specification.'}
                              </p>

                              {/* Endpoint Badge */}
                              <div className="flex items-center gap-3 mb-6 p-3 bg-card border border-border rounded-lg">
                                <span className={`px-3 py-1.5 rounded-md font-bold text-xs uppercase ${colors.bg} ${colors.text} border ${colors.border}`}>
                                  {method.toUpperCase()}
                                </span>
                                <code className="text-sm font-mono text-foreground">{path}</code>
                                <button
                                  onClick={() => {
                                    setSelectedEndpoint({ path, method, operation: op });
                                    setIsDrawerOpen(true);
                                  }}
                                  className="ml-auto px-3 py-1.5 text-xs font-medium text-white bg-purple-500/10 border border-purple-500/30 rounded hover:bg-purple-500/20 transition-colors flex items-center gap-2"
                                >
                                  <Play className="w-3 h-3" />
                                  Try It Out
                                </button>
                              </div>

                              {/* Parameters */}
                              {op.parameters && op.parameters.length > 0 && (
                                <div className="mb-6">
                                  <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <div className="h-px flex-1 bg-border" />
                                    <span>Parameters</span>
                                    <div className="h-px flex-1 bg-border" />
                                  </h3>
                                  <div className="overflow-x-auto">
                                    <table className="w-full border border-border rounded-lg overflow-hidden">
                                      <thead className="bg-muted">
                                        <tr>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">In</th>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Required</th>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-border">
                                        {op.parameters.map((param: any, idx: number) => (
                                          <tr key={idx} className="hover:bg-muted transition-colors">
                                            <td className="px-4 py-3 text-sm font-mono text-foreground">{param.name}</td>
                                            <td className="px-4 py-3 text-sm">
                                              <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs border border-blue-500/30">
                                                {param.in}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{param.schema?.type || 'any'}</td>
                                            <td className="px-4 py-3 text-sm">
                                              {param.required ? (
                                                <span className="text-destructive">✓</span>
                                              ) : (
                                                <span className="text-muted-foreground">—</span>
                                              )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{param.description || '—'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* Request Body */}
                              {op.requestBody && (
                                <div className="mb-6">
                                  <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <div className="h-px flex-1 bg-border" />
                                    <span>Request Body</span>
                                    <div className="h-px flex-1 bg-border" />
                                  </h3>
                                  <div className="p-4 bg-card border border-border rounded-lg">
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {(op.requestBody as any).description || 'Request body'}
                                    </p>
                                    {(op.requestBody as any).required && (
                                      <span className="text-xs text-destructive">Required</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Responses */}
                              <div className="mb-6">
                                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                                  <div className="h-px flex-1 bg-border" />
                                  <span>Responses</span>
                                  <div className="h-px flex-1 bg-border" />
                                </h3>
                                <div className="overflow-x-auto">
                                  <table className="w-full border border-border rounded-lg overflow-hidden">
                                    <thead className="bg-muted">
                                      <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                      {op.responses && Object.entries(op.responses).map(([code, response]: [string, any]) => (
                                        <tr key={code} className="hover:bg-muted transition-colors">
                                          <td className="px-4 py-3">
                                            <span className={`px-3 py-1 rounded font-mono text-xs ${
                                              code.startsWith('2') ? 'bg-success/10 text-success border border-success/30' :
                                              code.startsWith('4') ? 'bg-warning/10 text-warning border border-warning/30' :
                                              code.startsWith('5') ? 'bg-destructive/10 text-destructive border border-destructive/30' :
                                              'bg-info/10 text-info border border-info/30'
                                            }`}>
                                              {code}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 text-sm text-muted-foreground">{response.description || 'No description'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          );
                        });
                    })}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No API documentation available. Add paths to your OpenAPI specification.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Diagnostics Panel (collapsible) */}
          {diagnostics.length > 0 && (
            <div className={`border-t border-border bg-muted/30 backdrop-blur-sm flex flex-col shrink-0 ${isDiagnosticsCollapsed ? 'h-auto' : 'h-64'}`}>
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsDiagnosticsCollapsed(!isDiagnosticsCollapsed)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-foreground text-sm font-medium">
                    <TerminalSquare className="w-4 h-4 text-muted-foreground" />
                    Diagnostics
                  </div>
                  <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
                    {totalProblems} Problem{totalProblems > 1 ? 's' : ''}
                  </span>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  {isDiagnosticsCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Content */}
              {!isDiagnosticsCollapsed && (
                <div className="flex-1 overflow-auto px-4 py-3">
                  <div className="space-y-0 divide-y divide-border">
                    {diagnostics.map((diagnostic, idx) => (
                      <div
                        key={idx}
                        className={`py-3 -mx-4 px-4 transition-colors cursor-pointer group ${
                          diagnostic.severity === 0
                            ? 'hover:bg-destructive/5 bg-destructive/[0.02]'
                            : 'hover:bg-muted/30'
                        }`}
                        onClick={() => handleJumpToIssue(diagnostic)}
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${
                            diagnostic.severity === 0 ? 'text-destructive' : 'text-warning'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium uppercase ${
                                diagnostic.severity === 0
                                  ? 'bg-destructive/10 text-destructive border border-destructive/20'
                                  : 'bg-warning/10 text-warning border border-warning/20'
                              }`}>
                                {diagnostic.severity === 0 ? 'Error' : 'Warning'}
                              </span>
                              <span className="text-xs text-muted-foreground">{diagnostic.code}</span>
                            </div>
                            <p className="text-sm text-foreground mb-1.5">{diagnostic.message}</p>
                            <p className="text-xs text-muted-foreground mb-2">{diagnostic.path?.join('.') || 'Root'}</p>
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-0.5 rounded bg-card border border-border text-xs font-mono text-muted-foreground">
                                Line {diagnostic.range?.start.line ?? '?'}, Col {diagnostic.range?.start.character ?? '?'}
                              </span>
                              <button className="text-xs text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                                Quick Fix
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Try It Out Drawer */}
      {selectedEndpoint && (
        <TryItOutDrawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          operation={selectedEndpoint.operation}
          path={selectedEndpoint.path}
          method={selectedEndpoint.method}
          baseUrl={parsedSpec?.servers?.[0]?.url || 'https://api.example.com'}
          spec={parsedSpec}
        />
      )}
    </div>
  );
}

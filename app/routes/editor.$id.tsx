/**
 * Spec Editor Route
 * Integrates Visual Designer, Governance, and API Explorer
 *
 * Architecture: SRS_00 § 4.1 - Integration Layer
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Save, Play, Eye, Code, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { CodeEditor } from '@/features/editor/components/CodeEditor';
import { useEditorStore } from '@/features/editor/store/editor.store';
import { DiagnosticsPanel } from '@/features/governance/components/DiagnosticsPanel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { idbStorage } from '@/core/storage/idb-storage';
import { SpectralService } from '@/features/governance/services/spectral.service';
import type { ISpectralDiagnostic } from '@/core/events/event-types';

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
  const [activeTab, setActiveTab] = useState('editor');

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
paths:
  /example:
    get:
      summary: Example endpoint
      operationId: getExample
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

  // Auto-validate on content change
  useEffect(() => {
    if (!content) return;

    const validate = async () => {
      try {
        const result = await spectralService.lintSpec(content);
        setDiagnostics(result.diagnostics);
        setScore(result.score);
      } catch (error) {
        console.error('Validation error:', error);
      }
    };

    validate();
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
    // TODO: Implement jump to line in editor
    console.log('Jump to', diagnostic);
  };

  const errorCount = diagnostics.filter(d => d.severity === 0).length;
  const warningCount = diagnostics.filter(d => d.severity === 1).length;

  return (
    <AppLayout padding={false}>
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Library
            </button>
            <div className="h-4 w-px bg-border" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-none bg-transparent text-sm font-medium text-foreground outline-none"
              placeholder="Untitled Spec"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Quality Score Badge */}
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{score}%</span>
            </div>

            {/* Diagnostic Counts */}
            {(errorCount > 0 || warningCount > 0) && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
                {errorCount > 0 && (
                  <span className="text-sm font-medium text-destructive">
                    {errorCount} {errorCount === 1 ? 'error' : 'errors'}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="text-sm font-medium text-warning">
                    {warningCount} {warningCount === 1 ? 'warning' : 'warnings'}
                  </span>
                )}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('explorer')}
            >
              <Play className="h-4 w-4" />
              Test API
            </Button>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex h-[calc(100vh-56px)] overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full w-full flex-col">
          <TabsList className="h-10 w-full justify-start rounded-none border-b border-border bg-background px-6">
            <TabsTrigger value="editor" className="gap-2">
              <Code className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="explorer" className="gap-2">
              <Play className="h-4 w-4" />
              API Explorer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="m-0 flex-1 overflow-hidden">
            <div className="grid h-full grid-rows-[1fr,auto]">
              <CodeEditor language="yaml" />
              <DiagnosticsPanel
                diagnostics={diagnostics}
                onJumpToIssue={handleJumpToIssue}
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="m-0 flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-4xl">
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-lg font-semibold">API Documentation Preview</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  SwaggerUI preview coming soon...
                </p>
                <pre className="mt-4 overflow-auto rounded-md bg-muted p-4 text-xs">
                  {content}
                </pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="explorer" className="m-0 flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-4xl">
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-lg font-semibold">API Explorer</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try It Out functionality coming soon...
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

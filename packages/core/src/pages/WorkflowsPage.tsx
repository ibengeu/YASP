/**
 * Workflows Page - /workflows
 * Persistent sidebar + main canvas layout
 * Cross-collection: loads ALL specs from IDB
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { GitBranch, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { idbStorage } from '@/core/storage/idb-storage';
import { useWorkflowStore } from '@/features/workflows/store/workflow.store';
import { WorkflowBuilder } from '@/features/workflows/components/WorkflowBuilder';
import { WorkflowSidebar } from '@/features/workflows/components/WorkflowSidebar';
import type { WorkflowDocument, SpecEntry } from '@/features/workflows/types/workflow.types';

export default function WorkflowsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedWfId = searchParams.get('wf');

  const [isLoading, setIsLoading] = useState(true);
  const [specs, setSpecs] = useState<Map<string, SpecEntry>>(new Map());

  const {
    workflows,
    currentWorkflow,
    setWorkflows,
    setCurrentWorkflow,
    resetExecution,
  } = useWorkflowStore();

  // Load all specs and all workflows
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const [allSpecs, allWorkflows] = await Promise.all([
          idbStorage.getAllSpecs(),
          idbStorage.getAllWorkflows(),
        ]);

        if (cancelled) return;

        const yaml = await import('yaml');
        const specsMap = new Map<string, SpecEntry>();
        for (const spec of allSpecs) {
          try {
            const parsed = yaml.parse(spec.content);
            specsMap.set(spec.id, {
              id: spec.id,
              title: spec.title || parsed?.info?.title || 'Untitled',
              parsed,
            });
          } catch {
            // Skip specs that fail to parse
          }
        }

        setSpecs(specsMap);
        setWorkflows(allWorkflows);

        // If a workflow ID is in the URL, load it
        if (selectedWfId) {
          const wf = allWorkflows.find((w) => w.id === selectedWfId);
          if (wf) {
            setCurrentWorkflow(wf);
          } else {
            setSearchParams({}, { replace: true });
            setCurrentWorkflow(null);
          }
        } else {
          setCurrentWorkflow(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load workflows:', error);
          toast.error('Failed to load data');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [selectedWfId]);

  const handleCreateWorkflow = async () => {
    try {
      const newWf = await idbStorage.createWorkflow({
        name: 'New Workflow',
        steps: [],
        serverUrl: 'https://api.example.com',
      });

      setWorkflows([...workflows, newWf]);
      setCurrentWorkflow(newWf);
      resetExecution();
      setSearchParams({ wf: newWf.id }, { replace: true });
    } catch (error) {
      toast.error('Failed to create workflow');
    }
  };

  const handleSelectWorkflow = (wf: WorkflowDocument) => {
    setCurrentWorkflow(wf);
    resetExecution();
    setSearchParams({ wf: wf.id }, { replace: true });
  };

  const handleImportWorkflow = async (data: Omit<WorkflowDocument, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newWf = await idbStorage.createWorkflow(data);
      setWorkflows([...workflows, newWf]);
      setCurrentWorkflow(newWf);
      resetExecution();
      setSearchParams({ wf: newWf.id }, { replace: true });
    } catch (error) {
      toast.error('Failed to import workflow');
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      await idbStorage.deleteWorkflow(id);
      setWorkflows(workflows.filter((w) => w.id !== id));
      if (currentWorkflow?.id === id) {
        setCurrentWorkflow(null);
        resetExecution();
        setSearchParams({}, { replace: true });
      }
      toast.success('Workflow deleted');
    } catch (error) {
      toast.error('Failed to delete workflow');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-background">
        <div className="text-center space-y-3">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-background overflow-hidden">
      {/* Sidebar — always visible */}
      <WorkflowSidebar
        workflows={workflows}
        selectedId={currentWorkflow?.id ?? null}
        onSelect={handleSelectWorkflow}
        onCreate={handleCreateWorkflow}
        onDelete={handleDeleteWorkflow}
        onImport={handleImportWorkflow}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentWorkflow ? (
          <WorkflowBuilder specs={specs} />
        ) : (
          /* Empty canvas state */
          <div className="flex-1 flex items-center justify-center canvas-grid">
            <div className="text-center">
              <GitBranch className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <h2 className="text-sm font-medium text-foreground mb-1">No workflow selected</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Select a workflow from the sidebar or create a new one
              </p>
              <Button onClick={handleCreateWorkflow} size="sm">
                <Plus className="w-4 h-4" />
                Create Workflow
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

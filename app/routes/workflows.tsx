/**
 * Workflows Route - /workflows
 * Cross-collection: loads ALL specs from IDB, shows workflow list or builder
 * Query param ?wf=<id> selects a specific workflow
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { idbStorage } from '@/core/storage/idb-storage';
import { useWorkflowStore } from '@/features/workflows/store/workflow.store';
import { WorkflowBuilder } from '@/features/workflows/components/WorkflowBuilder';
import { WorkflowList } from '@/features/workflows/components/WorkflowList';
import type { WorkflowDocument } from '@/features/workflows/types/workflow.types';

export interface SpecEntry {
  id: string;
  title: string;
  parsed: any;
}

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
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-3">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show builder if a workflow is selected, otherwise show list
  if (currentWorkflow) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <WorkflowBuilder specs={specs} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <WorkflowList
        workflows={workflows}
        onSelect={handleSelectWorkflow}
        onCreate={handleCreateWorkflow}
        onDelete={handleDeleteWorkflow}
        onImport={handleImportWorkflow}
      />
    </div>
  );
}

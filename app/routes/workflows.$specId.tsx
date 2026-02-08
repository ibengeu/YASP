/**
 * Workflows Route - /workflows/:specId
 * Loads spec from IDB, shows workflow list or builder
 * Query param ?wf=<id> selects a specific workflow
 */

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { idbStorage } from '@/core/storage/idb-storage';
import { useWorkflowStore } from '@/features/workflows/store/workflow.store';
import { WorkflowBuilder } from '@/features/workflows/components/WorkflowBuilder';
import { WorkflowList } from '@/features/workflows/components/WorkflowList';
import type { WorkflowDocument } from '@/features/workflows/types/workflow.types';

export default function WorkflowsPage() {
  const { specId } = useParams<{ specId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedWfId = searchParams.get('wf');

  const [isLoading, setIsLoading] = useState(true);
  const [parsedSpec, setParsedSpec] = useState<any>(null);

  const {
    workflows,
    currentWorkflow,
    setWorkflows,
    setCurrentWorkflow,
    resetExecution,
  } = useWorkflowStore();

  // Load spec and workflows
  useEffect(() => {
    if (!specId) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const [spec, wfs] = await Promise.all([
          idbStorage.getSpec(specId),
          idbStorage.getWorkflowsBySpecId(specId),
        ]);

        if (cancelled) return;

        if (!spec) {
          toast.error('Specification not found');
          navigate('/catalog');
          return;
        }

        const yaml = await import('yaml');
        setParsedSpec(yaml.parse(spec.content));
        setWorkflows(wfs);

        // If a workflow ID is in the URL, load it
        if (selectedWfId) {
          const wf = wfs.find((w) => w.id === selectedWfId);
          if (wf) {
            setCurrentWorkflow(wf);
          } else {
            // Invalid wf ID, clear it
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
  }, [specId, selectedWfId]);

  const handleCreateWorkflow = async () => {
    if (!specId || !parsedSpec) return;

    try {
      const serverUrl = parsedSpec.servers?.[0]?.url || 'https://api.example.com';
      const newWf = await idbStorage.createWorkflow({
        specId,
        name: 'New Workflow',
        steps: [],
        serverUrl,
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

  if (!parsedSpec || !specId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-sm text-muted-foreground">Specification not found</p>
      </div>
    );
  }

  // Show builder if a workflow is selected, otherwise show list
  if (currentWorkflow) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <WorkflowBuilder spec={parsedSpec} />
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
      />
    </div>
  );
}

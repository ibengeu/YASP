/**
 * WorkflowBuilder - Main canvas for building and running workflow chains
 * Vertical step list with railway track, split with results/variables panel
 */

import { useState, useCallback, useRef } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { WorkflowToolbar } from './WorkflowToolbar';
import { WorkflowStepCard } from './WorkflowStepCard';
import { EndpointPicker } from './EndpointPicker';
import { VariableScopePanel } from './VariableScopePanel';
import { WorkflowResults } from './WorkflowResults';
import { useWorkflowStore } from '../store/workflow.store';
import { WorkflowEngine } from '../services/workflow-engine';
import { idbStorage } from '@/core/storage/idb-storage';
import type { WorkflowStep } from '../types/workflow.types';

interface WorkflowBuilderProps {
  spec: any;
}

export function WorkflowBuilder({ spec }: WorkflowBuilderProps) {
  const [showEndpointPicker, setShowEndpointPicker] = useState(false);
  const engineRef = useRef<WorkflowEngine | null>(null);

  const {
    currentWorkflow,
    execution,
    setCurrentWorkflow,
    addStep,
    updateStep,
    removeStep,
    reorderStep,
    addExtraction,
    removeExtraction,
    getAvailableVariables,
    setExecution,
    resetExecution,
  } = useWorkflowStore();

  if (!currentWorkflow) return null;

  const isRunning = execution.status === 'running';

  const handleRun = useCallback(async () => {
    if (!currentWorkflow) return;

    resetExecution();
    const engine = new WorkflowEngine();
    engineRef.current = engine;

    setExecution({
      workflowId: currentWorkflow.id,
      status: 'running',
      startedAt: new Date().toISOString(),
    });

    const result = await engine.execute(currentWorkflow, {
      onStepStart: (stepIndex) => {
        setExecution({ currentStepIndex: stepIndex });
      },
      onStepComplete: (_idx, stepResult) => {
        setExecution({
          results: [...useWorkflowStore.getState().execution.results, stepResult],
          variables: { ...useWorkflowStore.getState().execution.variables, ...stepResult.extractedVariables },
        });
      },
    });

    setExecution({
      status: result.status,
      results: result.results,
      variables: result.variables,
      completedAt: result.completedAt,
    });

    if (result.status === 'completed') {
      toast.success('Workflow completed successfully');
    } else if (result.status === 'failed') {
      toast.error('Workflow failed at step ' + (result.currentStepIndex + 1));
    } else if (result.status === 'aborted') {
      toast.info('Workflow aborted');
    }

    engineRef.current = null;
  }, [currentWorkflow, resetExecution, setExecution]);

  const handleStop = useCallback(() => {
    engineRef.current?.abort();
  }, []);

  const handleSave = useCallback(async () => {
    if (!currentWorkflow) return;
    try {
      await idbStorage.updateWorkflow(currentWorkflow.id, {
        name: currentWorkflow.name,
        steps: currentWorkflow.steps,
        serverUrl: currentWorkflow.serverUrl,
        sharedAuth: currentWorkflow.sharedAuth,
        description: currentWorkflow.description,
      });
      toast.success('Workflow saved');
    } catch (error) {
      toast.error('Failed to save workflow');
    }
  }, [currentWorkflow]);

  const handleAddStep = (step: WorkflowStep) => {
    addStep(step);
  };

  const handleDuplicate = (step: WorkflowStep) => {
    addStep({
      ...step,
      id: crypto.randomUUID(),
      name: `${step.name} (copy)`,
    });
  };

  // All variables defined by all steps (for the scope panel)
  const allAvailableVars = getAvailableVariables(currentWorkflow.steps.length);

  return (
    <div className="flex flex-col h-full">
      <WorkflowToolbar
        workflow={currentWorkflow}
        isRunning={isRunning}
        onNameChange={(name) => setCurrentWorkflow({ ...currentWorkflow, name })}
        onRun={handleRun}
        onStop={handleStop}
        onSave={handleSave}
        onSettingsChange={(updates) => {
          setCurrentWorkflow({
            ...currentWorkflow,
            serverUrl: updates.serverUrl || currentWorkflow.serverUrl,
            sharedAuth: updates.sharedAuth,
          });
        }}
      />

      <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0">
        {/* Builder Canvas */}
        <ResizablePanel defaultSize={60} minSize={35} className="flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {currentWorkflow.steps.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-muted-foreground mb-3">
                  Add your first step from the spec endpoints
                </p>
                <Button
                  onClick={() => setShowEndpointPicker(true)}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Step
                </Button>
              </div>
            ) : (
              <div>
                {currentWorkflow.steps.map((step, index) => {
                  const result = execution.results.find((r) => r.stepId === step.id);
                  return (
                    <WorkflowStepCard
                      key={step.id}
                      step={step}
                      index={index}
                      totalSteps={currentWorkflow.steps.length}
                      executionResult={result}
                      availableVariables={getAvailableVariables(index)}
                      onUpdate={(updates) => updateStep(step.id, updates)}
                      onRemove={() => removeStep(step.id)}
                      onReorder={(dir) => reorderStep(step.id, dir)}
                      onDuplicate={() => handleDuplicate(step)}
                      onAddExtraction={(ext) => addExtraction(step.id, ext)}
                      onRemoveExtraction={(extId) => removeExtraction(step.id, extId)}
                    />
                  );
                })}

                {/* Add Step button at bottom */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground/20 border-2 border-background" />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEndpointPicker(true)}
                    className="text-xs border-dashed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Step
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="hover:bg-primary transition-colors" />

        {/* Results + Variables Panel */}
        <ResizablePanel defaultSize={40} minSize={25} className="flex flex-col border-l border-border">
          <div className="flex-1 overflow-y-auto">
            <VariableScopePanel
              variables={execution.variables}
              availableVariables={allAvailableVars}
            />
            <div className="border-t border-border">
              <WorkflowResults
                steps={currentWorkflow.steps}
                results={execution.results}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Endpoint Picker Dialog */}
      <EndpointPicker
        open={showEndpointPicker}
        onClose={() => setShowEndpointPicker(false)}
        spec={spec}
        onSelect={handleAddStep}
      />
    </div>
  );
}

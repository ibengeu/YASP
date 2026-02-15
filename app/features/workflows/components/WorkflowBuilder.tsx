/**
 * WorkflowBuilder - Power Automate-style canvas for building and running workflows
 * Dot-grid background, trigger node, step connectors, floating variables, slide-up results
 */

import { useState, useCallback, useRef, Fragment } from 'react';
import { Plus, Settings, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WorkflowToolbar } from './WorkflowToolbar';
import { WorkflowStepCard } from './WorkflowStepCard';
import { TriggerNode } from './TriggerNode';
import { StepConnector } from './StepConnector';
import { ExecutionResultsPanel } from './ExecutionResultsPanel';
import { EndpointPicker } from './EndpointPicker';
import { useWorkflowStore } from '../store/workflow.store';
import { WorkflowEngine } from '../services/workflow-engine';
import { idbStorage } from '@/core/storage/idb-storage';
import type { WorkflowStep } from '../types/workflow.types';
import type { SpecEntry } from '@/routes/workflows';

interface WorkflowBuilderProps {
  specs: Map<string, SpecEntry>;
}

export function WorkflowBuilder({ specs }: WorkflowBuilderProps) {
  const [showEndpointPicker, setShowEndpointPicker] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [varsOpen, setVarsOpen] = useState(true);
  const engineRef = useRef<WorkflowEngine | null>(null);

  const {
    currentWorkflow,
    execution,
    setCurrentWorkflow,
    addStep,
    updateStep,
    removeStep,
    reorderSteps,
    addExtraction,
    removeExtraction,
    getAvailableVariables,
    setExecution,
    resetExecution,
  } = useWorkflowStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !currentWorkflow) return;
    const fromIndex = currentWorkflow.steps.findIndex((s) => s.id === active.id);
    const toIndex = currentWorkflow.steps.findIndex((s) => s.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      reorderSteps(fromIndex, toIndex);
    }
  }, [currentWorkflow, reorderSteps]);

  if (!currentWorkflow) return null;

  const isRunning = execution.status === 'running';

  const handleRun = useCallback(async () => {
    if (!currentWorkflow) return;

    resetExecution();
    setShowResults(true);
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
    if (insertIndex !== null) {
      // Insert at specific position by adding then reordering
      addStep(step);
      const newLength = currentWorkflow.steps.length + 1;
      // The new step was appended at the end, move it to insertIndex
      if (insertIndex < newLength - 1) {
        reorderSteps(newLength - 1, insertIndex);
      }
      setInsertIndex(null);
    } else {
      addStep(step);
    }
  };

  const handleConnectorAdd = (index: number) => {
    setInsertIndex(index);
    setShowEndpointPicker(true);
  };

  // All variables defined by all steps (for the floating panel)
  const allAvailableVars = getAvailableVariables(currentWorkflow.steps.length);

  const handleCopyVar = (name: string) => {
    navigator.clipboard.writeText(`{{${name}}}`);
    toast.success(`Copied {{${name}}} to clipboard`);
  };

  return (
    <div className="flex flex-col h-full relative">
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
        lastRunAt={execution.completedAt}
      />

      {/* Canvas with dot grid background */}
      <div className="flex-1 overflow-auto canvas-grid relative flex justify-center p-10">
        <div className="max-w-xl w-full flex flex-col items-center pb-20">
          {/* Trigger Node */}
          <TriggerNode />

          {/* Connector after trigger */}
          <StepConnector onAddClick={() => handleConnectorAdd(0)} />

          {/* Steps with DnD */}
          {currentWorkflow.steps.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={currentWorkflow.steps.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="w-full flex flex-col items-center">
                  {currentWorkflow.steps.map((step, index) => {
                    const result = execution.results.find((r) => r.stepId === step.id);
                    const specName = step.specEndpoint?.specId
                      ? specs.get(step.specEndpoint.specId)?.title
                      : undefined;
                    return (
                      <Fragment key={step.id}>
                        <WorkflowStepCard
                          step={step}
                          index={index}
                          executionResult={result}
                          availableVariables={getAvailableVariables(index)}
                          specName={specName}
                          onUpdate={(updates) => updateStep(step.id, updates)}
                          onRemove={() => removeStep(step.id)}
                          onAddExtraction={(ext) => addExtraction(step.id, ext)}
                          onRemoveExtraction={(extId) => removeExtraction(step.id, extId)}
                        />
                        <StepConnector onAddClick={() => handleConnectorAdd(index + 1)} />
                      </Fragment>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            /* Empty state — prompt to add first step */
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-2">Add your first step</p>
            </div>
          )}

          {/* Final add button (always visible) */}
          <button
            onClick={() => {
              setInsertIndex(null);
              setShowEndpointPicker(true);
            }}
            className="w-8 h-8 rounded-full bg-card border border-dashed border-border flex items-center justify-center
              text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Variables Panel — top-right, xl+ screens */}
      <div className="absolute right-6 top-16 w-72 z-10 hidden xl:block">
        <Collapsible open={varsOpen} onOpenChange={setVarsOpen}>
          <div className="glass-panel rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Flow Variables
                </span>
                <div className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  {varsOpen
                    ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                    : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-3 space-y-2">
                {allAvailableVars.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-3">
                    No variables yet. Add extractions to steps.
                  </p>
                ) : (
                  allAvailableVars.map((v) => {
                    const value = execution.variables[v.name];
                    const hasValue = value !== undefined;
                    const displayValue = hasValue
                      ? typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)
                      : undefined;

                    return (
                      <div
                        key={`${v.stepId}-${v.name}`}
                        className="bg-muted/30 rounded-md p-3 border border-border/30 group"
                      >
                        {/* Variable label */}
                        <div className="text-[10px] text-muted-foreground font-mono mb-1.5">
                          {v.stepName}
                        </div>

                        {/* Variable name + value */}
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            hasValue ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                          }`} />
                          <code className="text-xs text-foreground font-mono font-medium truncate flex-1">
                            {hasValue ? displayValue : v.name}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleCopyVar(v.name)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            title={`Copy {{${v.name}}}`}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Execution Results Panel — slide-up bottom */}
      <ExecutionResultsPanel
        steps={currentWorkflow.steps}
        results={execution.results}
        isOpen={showResults}
        onClose={() => setShowResults(false)}
        startedAt={execution.startedAt}
        completedAt={execution.completedAt}
        status={execution.status}
      />

      {/* Endpoint Picker Dialog */}
      <EndpointPicker
        open={showEndpointPicker}
        onClose={() => {
          setShowEndpointPicker(false);
          setInsertIndex(null);
        }}
        specs={specs}
        onSelect={handleAddStep}
      />
    </div>
  );
}

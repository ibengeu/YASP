/**
 * Workflow Zustand Store
 * State management for API chaining workflows
 */

import { create } from 'zustand';
import type {
  WorkflowDocument,
  WorkflowStep,
  WorkflowExecution,
  VariableExtraction,
} from '../types/workflow.types';

interface AvailableVariable {
  name: string;
  stepName: string;
  stepId: string;
}

interface WorkflowState {
  currentWorkflow: WorkflowDocument | null;
  workflows: WorkflowDocument[];
  execution: WorkflowExecution;

  // Workflow actions
  setCurrentWorkflow: (workflow: WorkflowDocument | null) => void;
  setWorkflows: (workflows: WorkflowDocument[]) => void;

  // Step CRUD
  addStep: (step: WorkflowStep) => void;
  updateStep: (stepId: string, updates: Partial<WorkflowStep>) => void;
  removeStep: (stepId: string) => void;
  reorderStep: (stepId: string, direction: 'up' | 'down') => void;
  reorderSteps: (fromIndex: number, toIndex: number) => void;

  // Extraction CRUD
  addExtraction: (stepId: string, extraction: VariableExtraction) => void;
  removeExtraction: (stepId: string, extractionId: string) => void;
  updateExtraction: (stepId: string, extractionId: string, updates: Partial<VariableExtraction>) => void;

  // Computed
  getAvailableVariables: (beforeStepIndex: number) => AvailableVariable[];

  // Execution state
  setExecution: (execution: Partial<WorkflowExecution>) => void;
  resetExecution: () => void;
}

const initialExecution: WorkflowExecution = {
  workflowId: '',
  status: 'idle',
  currentStepIndex: -1,
  results: [],
  variables: {},
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  currentWorkflow: null,
  workflows: [],
  execution: { ...initialExecution },

  setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),
  setWorkflows: (workflows) => set({ workflows }),

  addStep: (step) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const newStep = { ...step, order: currentWorkflow.steps.length };
    set({
      currentWorkflow: {
        ...currentWorkflow,
        steps: [...currentWorkflow.steps, newStep],
      },
    });
  },

  updateStep: (stepId, updates) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    set({
      currentWorkflow: {
        ...currentWorkflow,
        steps: currentWorkflow.steps.map((s) =>
          s.id === stepId ? { ...s, ...updates } : s
        ),
      },
    });
  },

  removeStep: (stepId) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const filtered = currentWorkflow.steps
      .filter((s) => s.id !== stepId)
      .map((s, i) => ({ ...s, order: i }));

    set({
      currentWorkflow: {
        ...currentWorkflow,
        steps: filtered,
      },
    });
  },

  reorderStep: (stepId, direction) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const steps = [...currentWorkflow.steps];
    const index = steps.findIndex((s) => s.id === stepId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;

    // Swap
    [steps[index], steps[targetIndex]] = [steps[targetIndex], steps[index]];
    // Reassign order
    const reordered = steps.map((s, i) => ({ ...s, order: i }));

    set({
      currentWorkflow: {
        ...currentWorkflow,
        steps: reordered,
      },
    });
  },

  reorderSteps: (fromIndex, toIndex) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const steps = [...currentWorkflow.steps];
    if (fromIndex < 0 || fromIndex >= steps.length) return;
    if (toIndex < 0 || toIndex >= steps.length) return;

    const [moved] = steps.splice(fromIndex, 1);
    steps.splice(toIndex, 0, moved);
    const reordered = steps.map((s, i) => ({ ...s, order: i }));

    set({
      currentWorkflow: {
        ...currentWorkflow,
        steps: reordered,
      },
    });
  },

  addExtraction: (stepId, extraction) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    set({
      currentWorkflow: {
        ...currentWorkflow,
        steps: currentWorkflow.steps.map((s) =>
          s.id === stepId
            ? { ...s, extractions: [...s.extractions, extraction] }
            : s
        ),
      },
    });
  },

  removeExtraction: (stepId, extractionId) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    set({
      currentWorkflow: {
        ...currentWorkflow,
        steps: currentWorkflow.steps.map((s) =>
          s.id === stepId
            ? { ...s, extractions: s.extractions.filter((e) => e.id !== extractionId) }
            : s
        ),
      },
    });
  },

  updateExtraction: (stepId, extractionId, updates) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    set({
      currentWorkflow: {
        ...currentWorkflow,
        steps: currentWorkflow.steps.map((s) =>
          s.id === stepId
            ? {
                ...s,
                extractions: s.extractions.map((e) =>
                  e.id === extractionId ? { ...e, ...updates } : e
                ),
              }
            : s
        ),
      },
    });
  },

  getAvailableVariables: (beforeStepIndex) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return [];

    const variables: AvailableVariable[] = [];
    for (let i = 0; i < beforeStepIndex && i < currentWorkflow.steps.length; i++) {
      const step = currentWorkflow.steps[i];
      for (const extraction of step.extractions) {
        variables.push({
          name: extraction.name,
          stepName: step.name,
          stepId: step.id,
        });
      }
    }
    return variables;
  },

  setExecution: (updates) => {
    set((state) => ({
      execution: { ...state.execution, ...updates },
    }));
  },

  resetExecution: () => {
    set({ execution: { ...initialExecution } });
  },
}));

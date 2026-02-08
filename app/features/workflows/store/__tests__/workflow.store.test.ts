import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkflowStore } from '../workflow.store';
import type { WorkflowDocument, WorkflowStep } from '../../types/workflow.types';

function createTestStep(overrides: Partial<WorkflowStep> = {}): WorkflowStep {
  return {
    id: crypto.randomUUID(),
    order: 0,
    name: 'Test Step',
    request: {
      method: 'GET',
      path: '/test',
      headers: {},
      queryParams: {},
    },
    extractions: [],
    ...overrides,
  };
}

function createTestWorkflow(overrides: Partial<WorkflowDocument> = {}): WorkflowDocument {
  return {
    id: 'wf-1',
    specId: 'spec-1',
    name: 'Test Workflow',
    steps: [],
    serverUrl: 'https://api.example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('useWorkflowStore', () => {
  beforeEach(() => {
    useWorkflowStore.setState({
      currentWorkflow: null,
      workflows: [],
      execution: {
        workflowId: '',
        status: 'idle',
        currentStepIndex: -1,
        results: [],
        variables: {},
      },
    });
  });

  describe('setCurrentWorkflow', () => {
    it('should set the current workflow', () => {
      const workflow = createTestWorkflow();
      useWorkflowStore.getState().setCurrentWorkflow(workflow);
      expect(useWorkflowStore.getState().currentWorkflow).toEqual(workflow);
    });

    it('should clear current workflow when set to null', () => {
      useWorkflowStore.getState().setCurrentWorkflow(createTestWorkflow());
      useWorkflowStore.getState().setCurrentWorkflow(null);
      expect(useWorkflowStore.getState().currentWorkflow).toBeNull();
    });
  });

  describe('addStep', () => {
    it('should add a step to the current workflow', () => {
      useWorkflowStore.getState().setCurrentWorkflow(createTestWorkflow());
      const step = createTestStep({ name: 'Auth Step' });
      useWorkflowStore.getState().addStep(step);
      const wf = useWorkflowStore.getState().currentWorkflow!;
      expect(wf.steps).toHaveLength(1);
      expect(wf.steps[0].name).toBe('Auth Step');
      expect(wf.steps[0].order).toBe(0);
    });

    it('should assign incremental order to new steps', () => {
      useWorkflowStore.getState().setCurrentWorkflow(createTestWorkflow());
      useWorkflowStore.getState().addStep(createTestStep({ name: 'Step 1' }));
      useWorkflowStore.getState().addStep(createTestStep({ name: 'Step 2' }));
      const steps = useWorkflowStore.getState().currentWorkflow!.steps;
      expect(steps[0].order).toBe(0);
      expect(steps[1].order).toBe(1);
    });

    it('should not add step if no current workflow', () => {
      useWorkflowStore.getState().addStep(createTestStep());
      expect(useWorkflowStore.getState().currentWorkflow).toBeNull();
    });
  });

  describe('updateStep', () => {
    it('should update a step by id', () => {
      const step = createTestStep({ id: 'step-1', name: 'Original' });
      useWorkflowStore.getState().setCurrentWorkflow(createTestWorkflow({ steps: [step] }));
      useWorkflowStore.getState().updateStep('step-1', { name: 'Updated' });
      expect(useWorkflowStore.getState().currentWorkflow!.steps[0].name).toBe('Updated');
    });
  });

  describe('removeStep', () => {
    it('should remove a step and reorder remaining steps', () => {
      const steps = [
        createTestStep({ id: 's1', order: 0, name: 'First' }),
        createTestStep({ id: 's2', order: 1, name: 'Second' }),
        createTestStep({ id: 's3', order: 2, name: 'Third' }),
      ];
      useWorkflowStore.getState().setCurrentWorkflow(createTestWorkflow({ steps }));
      useWorkflowStore.getState().removeStep('s2');
      const remaining = useWorkflowStore.getState().currentWorkflow!.steps;
      expect(remaining).toHaveLength(2);
      expect(remaining[0].id).toBe('s1');
      expect(remaining[0].order).toBe(0);
      expect(remaining[1].id).toBe('s3');
      expect(remaining[1].order).toBe(1);
    });
  });

  describe('reorderStep', () => {
    it('should move a step up', () => {
      const steps = [
        createTestStep({ id: 's1', order: 0, name: 'First' }),
        createTestStep({ id: 's2', order: 1, name: 'Second' }),
        createTestStep({ id: 's3', order: 2, name: 'Third' }),
      ];
      useWorkflowStore.getState().setCurrentWorkflow(createTestWorkflow({ steps }));
      useWorkflowStore.getState().reorderStep('s2', 'up');
      const result = useWorkflowStore.getState().currentWorkflow!.steps;
      expect(result[0].id).toBe('s2');
      expect(result[1].id).toBe('s1');
      expect(result[2].id).toBe('s3');
    });

    it('should move a step down', () => {
      const steps = [
        createTestStep({ id: 's1', order: 0 }),
        createTestStep({ id: 's2', order: 1 }),
        createTestStep({ id: 's3', order: 2 }),
      ];
      useWorkflowStore.getState().setCurrentWorkflow(createTestWorkflow({ steps }));
      useWorkflowStore.getState().reorderStep('s2', 'down');
      const result = useWorkflowStore.getState().currentWorkflow!.steps;
      expect(result[0].id).toBe('s1');
      expect(result[1].id).toBe('s3');
      expect(result[2].id).toBe('s2');
    });

    it('should not move first step up', () => {
      const steps = [
        createTestStep({ id: 's1', order: 0 }),
        createTestStep({ id: 's2', order: 1 }),
      ];
      useWorkflowStore.getState().setCurrentWorkflow(createTestWorkflow({ steps }));
      useWorkflowStore.getState().reorderStep('s1', 'up');
      expect(useWorkflowStore.getState().currentWorkflow!.steps[0].id).toBe('s1');
    });

    it('should not move last step down', () => {
      const steps = [
        createTestStep({ id: 's1', order: 0 }),
        createTestStep({ id: 's2', order: 1 }),
      ];
      useWorkflowStore.getState().setCurrentWorkflow(createTestWorkflow({ steps }));
      useWorkflowStore.getState().reorderStep('s2', 'down');
      expect(useWorkflowStore.getState().currentWorkflow!.steps[1].id).toBe('s2');
    });
  });

  describe('addExtraction', () => {
    it('should add an extraction to a step', () => {
      const step = createTestStep({ id: 'step-1' });
      useWorkflowStore.getState().setCurrentWorkflow(createTestWorkflow({ steps: [step] }));
      useWorkflowStore.getState().addExtraction('step-1', {
        id: 'ext-1',
        name: 'token',
        jsonPath: '$.access_token',
      });
      const extractions = useWorkflowStore.getState().currentWorkflow!.steps[0].extractions;
      expect(extractions).toHaveLength(1);
      expect(extractions[0].name).toBe('token');
    });
  });

  describe('removeExtraction', () => {
    it('should remove an extraction from a step', () => {
      const step = createTestStep({
        id: 'step-1',
        extractions: [
          { id: 'ext-1', name: 'token', jsonPath: '$.token' },
          { id: 'ext-2', name: 'userId', jsonPath: '$.userId' },
        ],
      });
      useWorkflowStore.getState().setCurrentWorkflow(createTestWorkflow({ steps: [step] }));
      useWorkflowStore.getState().removeExtraction('step-1', 'ext-1');
      const extractions = useWorkflowStore.getState().currentWorkflow!.steps[0].extractions;
      expect(extractions).toHaveLength(1);
      expect(extractions[0].id).toBe('ext-2');
    });
  });

  describe('getAvailableVariables', () => {
    it('should return extractions from all steps before the given index', () => {
      const steps = [
        createTestStep({
          id: 's1', order: 0, name: 'Auth',
          extractions: [
            { id: 'e1', name: 'token', jsonPath: '$.token' },
            { id: 'e2', name: 'userId', jsonPath: '$.userId' },
          ],
        }),
        createTestStep({
          id: 's2', order: 1, name: 'Get User',
          extractions: [
            { id: 'e3', name: 'email', jsonPath: '$.email' },
          ],
        }),
        createTestStep({ id: 's3', order: 2, name: 'Update User', extractions: [] }),
      ];
      useWorkflowStore.getState().setCurrentWorkflow(createTestWorkflow({ steps }));
      const vars = useWorkflowStore.getState().getAvailableVariables(2);
      expect(vars).toEqual([
        { name: 'token', stepName: 'Auth', stepId: 's1' },
        { name: 'userId', stepName: 'Auth', stepId: 's1' },
        { name: 'email', stepName: 'Get User', stepId: 's2' },
      ]);
    });

    it('should return empty array for first step', () => {
      const steps = [
        createTestStep({
          id: 's1', order: 0,
          extractions: [{ id: 'e1', name: 'token', jsonPath: '$.token' }],
        }),
      ];
      useWorkflowStore.getState().setCurrentWorkflow(createTestWorkflow({ steps }));
      expect(useWorkflowStore.getState().getAvailableVariables(0)).toEqual([]);
    });

    it('should return empty array with no workflow', () => {
      expect(useWorkflowStore.getState().getAvailableVariables(0)).toEqual([]);
    });
  });

  describe('resetExecution', () => {
    it('should reset execution state', () => {
      useWorkflowStore.setState({
        execution: {
          workflowId: 'wf-1',
          status: 'completed',
          currentStepIndex: 3,
          results: [{ stepId: 's1', status: 'success', extractedVariables: {}, startedAt: '', completedAt: '' }],
          variables: { token: 'abc' },
          startedAt: '2024-01-01',
          completedAt: '2024-01-01',
        },
      });
      useWorkflowStore.getState().resetExecution();
      const exec = useWorkflowStore.getState().execution;
      expect(exec.status).toBe('idle');
      expect(exec.results).toEqual([]);
      expect(exec.variables).toEqual({});
      expect(exec.currentStepIndex).toBe(-1);
    });
  });
});

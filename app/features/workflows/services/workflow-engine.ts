/**
 * Workflow Execution Engine
 * Runs linear sequential API chains, extracting variables between steps
 *
 * Security:
 * - OWASP A09:2025 (SSRF): All requests routed through /api/execute-request proxy
 *   which validates URLs via validateProxyUrl — never makes direct external fetch
 * - OWASP A07:2025 (Injection): Variable substitution uses context-aware encoding
 */

import type {
  WorkflowDocument,
  WorkflowExecution,
  StepExecutionResult,
} from '../types/workflow.types';
import { substituteVariables } from './variable-substitution';
import { extractVariables } from './variable-extraction';

interface ExecutionCallbacks {
  onStepStart?: (stepIndex: number) => void;
  onStepComplete?: (stepIndex: number, result: StepExecutionResult) => void;
  onComplete?: (execution: WorkflowExecution) => void;
  onError?: (stepIndex: number, error: string) => void;
}

export class WorkflowEngine {
  private aborted = false;

  /**
   * Execute a workflow sequentially.
   * Each step's extracted variables are merged into scope for subsequent steps.
   * All HTTP requests are proxied through /api/execute-request (SSRF-protected).
   */
  async execute(
    workflow: WorkflowDocument,
    callbacks: ExecutionCallbacks = {}
  ): Promise<WorkflowExecution> {
    this.aborted = false;

    const execution: WorkflowExecution = {
      workflowId: workflow.id,
      status: 'running',
      currentStepIndex: 0,
      results: [],
      variables: {},
      startedAt: new Date().toISOString(),
    };

    if (workflow.steps.length === 0) {
      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
      callbacks.onComplete?.(execution);
      return execution;
    }

    // Sort steps by order
    const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);

    for (let i = 0; i < sortedSteps.length; i++) {
      if (this.aborted) {
        // Mark remaining steps as skipped
        for (let j = i; j < sortedSteps.length; j++) {
          execution.results.push({
            stepId: sortedSteps[j].id,
            status: 'skipped',
            extractedVariables: {},
          });
        }
        execution.status = 'aborted';
        execution.completedAt = new Date().toISOString();
        callbacks.onComplete?.(execution);
        return execution;
      }

      const step = sortedSteps[i];
      execution.currentStepIndex = i;
      callbacks.onStepStart?.(i);

      const stepResult: StepExecutionResult = {
        stepId: step.id,
        status: 'running',
        extractedVariables: {},
        startedAt: new Date().toISOString(),
      };

      try {
        // Substitute variables in request fields
        const vars = execution.variables;
        const path = substituteVariables(step.request.path, vars, 'url');
        const url = `${workflow.serverUrl}${path}`;

        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(step.request.headers)) {
          headers[key] = substituteVariables(value, vars, 'header');
        }

        const queryParams: Record<string, string> = {};
        for (const [key, value] of Object.entries(step.request.queryParams)) {
          queryParams[key] = substituteVariables(value, vars, 'query');
        }

        // Build URL with query params
        let requestUrl = url;
        const queryEntries = Object.entries(queryParams).filter(([, v]) => v);
        if (queryEntries.length > 0) {
          const qs = queryEntries
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
          requestUrl = `${url}?${qs}`;
        }

        const body = step.request.body
          ? substituteVariables(step.request.body, vars, 'body')
          : undefined;

        // Determine auth: step-level overrides workflow-level shared auth
        const auth = step.request.auth || workflow.sharedAuth || { type: 'none' as const };

        // Route through SSRF-protected proxy
        // Mitigation for OWASP A09:2025 – SSRF: all requests go through validated proxy
        const proxyResponse = await fetch('/api/execute-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: step.request.method,
            url: requestUrl,
            headers,
            body: ['POST', 'PUT', 'PATCH'].includes(step.request.method) ? body : undefined,
            auth,
          }),
        });

        const proxyData = await proxyResponse.json();

        if (!proxyData.success) {
          throw new Error(proxyData.error || 'Request failed');
        }

        stepResult.response = proxyData.data;
        stepResult.status = 'success';

        // Extract variables from response
        if (step.extractions.length > 0 && proxyData.data?.body) {
          const { extracted, errors } = extractVariables(proxyData.data.body, step.extractions);
          stepResult.extractedVariables = extracted;
          // Merge extracted variables into execution scope
          Object.assign(execution.variables, extracted);

          if (errors.length > 0) {
            // Log extraction errors but don't fail the step
            console.warn(`[Workflow] Extraction warnings for step "${step.name}":`, errors);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        stepResult.status = 'failure';
        stepResult.error = message;
        callbacks.onError?.(i, message);

        stepResult.completedAt = new Date().toISOString();
        execution.results.push(stepResult);
        callbacks.onStepComplete?.(i, stepResult);

        // Mark remaining steps as skipped
        for (let j = i + 1; j < sortedSteps.length; j++) {
          execution.results.push({
            stepId: sortedSteps[j].id,
            status: 'skipped',
            extractedVariables: {},
          });
        }

        execution.status = 'failed';
        execution.completedAt = new Date().toISOString();
        callbacks.onComplete?.(execution);
        return execution;
      }

      stepResult.completedAt = new Date().toISOString();
      execution.results.push(stepResult);
      callbacks.onStepComplete?.(i, stepResult);
    }

    execution.status = 'completed';
    execution.completedAt = new Date().toISOString();
    callbacks.onComplete?.(execution);
    return execution;
  }

  /**
   * Signal the engine to abort execution after the current step completes.
   */
  abort(): void {
    this.aborted = true;
  }
}

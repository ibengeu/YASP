/**
 * Workflow Type Definitions
 * Data structures for API chaining workflows
 *
 * Architecture: Workflow feature - linear sequential API chains
 */

/**
 * Complete Workflow Document stored in IndexedDB
 */
export interface WorkflowDocument {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  serverUrl: string;
  sharedAuth?: WorkflowAuth;
  created_at: string;
  updated_at: string;
}

/**
 * Single step in a workflow chain
 */
export interface WorkflowStep {
  id: string;
  order: number;
  name: string;
  request: WorkflowRequest;
  extractions: VariableExtraction[];
  specEndpoint?: {
    specId: string;
    path: string;
    method: string;
    operationId?: string;
  };
}

/**
 * HTTP request configuration for a workflow step
 */
export interface WorkflowRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body?: string;
  auth?: WorkflowAuth;
  serverUrl?: string;
}

/**
 * Authentication configuration for workflow requests
 */
export interface WorkflowAuth {
  type: 'none' | 'api-key' | 'bearer' | 'basic';
  apiKey?: string;
  token?: string;
  username?: string;
  password?: string;
}

/**
 * Variable extraction rule — extracts a value from a step's response
 */
export interface VariableExtraction {
  id: string;
  name: string;
  jsonPath: string;
  description?: string;
}

/**
 * Result of executing a single workflow step
 */
export interface StepExecutionResult {
  stepId: string;
  status: 'pending' | 'running' | 'success' | 'failure' | 'skipped';
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    time: number;
    size: number;
  };
  extractedVariables: Record<string, any>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Overall workflow execution state
 */
export interface WorkflowExecution {
  workflowId: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'aborted';
  currentStepIndex: number;
  results: StepExecutionResult[];
  variables: Record<string, any>;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Workflow Export/Import Service
 * Serialization and validation for workflow documents
 *
 * Security:
 * - OWASP A07:2025 (Injection): Validates and strips unexpected fields on import
 */

import type { WorkflowDocument, WorkflowStep, WorkflowAuth, VariableExtraction } from '../types/workflow.types';

type ExportableWorkflow = Omit<WorkflowDocument, 'id' | 'created_at' | 'updated_at'>;

const VALID_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const VALID_AUTH_TYPES = new Set(['none', 'api-key', 'bearer', 'basic']);

/**
 * Export a workflow to a JSON string, stripping IDB-only fields (id, timestamps).
 */
export function exportWorkflow(workflow: WorkflowDocument): string {
  const exportable: ExportableWorkflow = {
    name: workflow.name,
    description: workflow.description,
    steps: workflow.steps,
    serverUrl: workflow.serverUrl,
    sharedAuth: workflow.sharedAuth,
  };
  return JSON.stringify(exportable, null, 2);
}

/**
 * Import a workflow from a JSON string.
 * Validates required fields and strips unexpected keys.
 * Returns a validated workflow object ready for createWorkflow().
 */
export function importWorkflow(json: string): ExportableWorkflow {
  let raw: any;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON: could not parse workflow data');
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('Invalid workflow: expected an object');
  }

  // Validate required fields
  if (typeof raw.name !== 'string' || raw.name.trim().length === 0) {
    throw new Error('Invalid workflow: missing or empty "name"');
  }
  if (!Array.isArray(raw.steps)) {
    throw new Error('Invalid workflow: "steps" must be an array');
  }
  if (typeof raw.serverUrl !== 'string' || raw.serverUrl.trim().length === 0) {
    throw new Error('Invalid workflow: missing or empty "serverUrl"');
  }

  // Strip unexpected top-level fields (OWASP A07 mitigation)
  const cleaned: ExportableWorkflow = {
    name: raw.name.trim(),
    serverUrl: raw.serverUrl.trim(),
    steps: raw.steps.map(validateStep),
  };

  if (typeof raw.description === 'string') {
    cleaned.description = raw.description;
  }

  if (raw.sharedAuth && typeof raw.sharedAuth === 'object') {
    cleaned.sharedAuth = validateAuth(raw.sharedAuth);
  }

  return cleaned;
}

function validateStep(raw: any, index: number): WorkflowStep {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`Invalid step at index ${index}: expected an object`);
  }

  const step: WorkflowStep = {
    id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
    order: typeof raw.order === 'number' ? raw.order : index,
    name: typeof raw.name === 'string' ? raw.name : `Step ${index + 1}`,
    request: validateRequest(raw.request, index),
    extractions: Array.isArray(raw.extractions)
      ? raw.extractions.filter(isValidExtraction)
      : [],
  };

  if (raw.specEndpoint && typeof raw.specEndpoint === 'object') {
    step.specEndpoint = {
      specId: String(raw.specEndpoint.specId || ''),
      path: String(raw.specEndpoint.path || ''),
      method: String(raw.specEndpoint.method || ''),
      ...(raw.specEndpoint.operationId ? { operationId: String(raw.specEndpoint.operationId) } : {}),
    };
  }

  return step;
}

function validateRequest(raw: any, stepIndex: number): WorkflowStep['request'] {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`Invalid request at step ${stepIndex}: expected an object`);
  }

  const method = String(raw.method || 'GET').toUpperCase();
  if (!VALID_METHODS.has(method)) {
    throw new Error(`Invalid method "${method}" at step ${stepIndex}`);
  }

  return {
    method: method as WorkflowStep['request']['method'],
    path: typeof raw.path === 'string' ? raw.path : '/',
    headers: isStringRecord(raw.headers) ? raw.headers : {},
    queryParams: isStringRecord(raw.queryParams) ? raw.queryParams : {},
    ...(typeof raw.body === 'string' ? { body: raw.body } : {}),
    ...(typeof raw.serverUrl === 'string' ? { serverUrl: raw.serverUrl } : {}),
    ...(raw.auth && typeof raw.auth === 'object' ? { auth: validateAuth(raw.auth) } : {}),
  };
}

function validateAuth(raw: any): WorkflowAuth {
  const type = VALID_AUTH_TYPES.has(raw.type) ? raw.type : 'none';
  const auth: WorkflowAuth = { type };
  if (typeof raw.token === 'string') auth.token = raw.token;
  if (typeof raw.apiKey === 'string') auth.apiKey = raw.apiKey;
  if (typeof raw.username === 'string') auth.username = raw.username;
  if (typeof raw.password === 'string') auth.password = raw.password;
  return auth;
}

function isValidExtraction(raw: any): raw is VariableExtraction {
  return (
    typeof raw === 'object' &&
    raw !== null &&
    typeof raw.id === 'string' &&
    typeof raw.name === 'string' &&
    typeof raw.jsonPath === 'string'
  );
}

function isStringRecord(val: any): val is Record<string, string> {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) return false;
  return Object.values(val).every((v) => typeof v === 'string');
}

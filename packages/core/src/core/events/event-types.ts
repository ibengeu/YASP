/**
 * Event System Type Definitions
 * Type-safe event contracts for cross-feature communication
 *
 * Architecture: SRS_00 § 5 - Event Contracts
 */

/**
 * Base Domain Event Structure
 */
export interface DomainEvent<T = any> {
  name: string; // Event identifier (e.g., 'spec:updated')
  payload: T; // Event data
  timestamp: string; // ISO timestamp
  source: string; // Originating feature/component
  correlationId: string; // For tracking event chains
}

/**
 * Event Handler Function Type
 */
export type EventHandler<T = any> = (event: DomainEvent<T>) => void | Promise<void>;

/**
 * Event Middleware Function Type
 * Transforms or logs events before handler execution
 */
export type EventMiddleware = (event: DomainEvent) => Promise<DomainEvent>;

/**
 * ============================================
 * Event Payload Definitions (Type-Safe)
 * ============================================
 */

/**
 * Spec Lifecycle Events
 * Emitted by: Library feature
 */
export interface SpecCreatedPayload {
  specId: string;
  title: string;
  version: string;
}

export interface SpecUpdatedPayload {
  specId: string;
  content: string; // YAML/JSON content
}

export interface SpecDeletedPayload {
  specId: string;
}

export interface SpecLoadedPayload {
  specId: string;
  content: string;
}

/**
 * Editor Events
 * Emitted by: Visual Designer feature
 */
export interface EditorModeSwitchPayload {
  mode: 'visual' | 'code';
}

/**
 * Spectral Diagnostic
 * Matches Spectral's diagnostic format
 */
export interface ISpectralDiagnostic {
  code: string; // Rule ID
  message: string; // Human-readable message
  severity: 0 | 1 | 2 | 3; // Error | Warning | Info | Hint
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  path: string[]; // JSON path to issue location
}

/**
 * Event Names Enum (for type safety)
 */
export const EventNames = {
  // Spec events
  SPEC_CREATED: 'spec:created',
  SPEC_UPDATED: 'spec:updated',
  SPEC_DELETED: 'spec:deleted',
  SPEC_LOADED: 'spec:loaded',

  // Editor events
  EDITOR_MODE_SWITCH: 'editor:mode-switch',

  // Workspace events
  WORKSPACE_CREATED: 'workspace:created',
  WORKSPACE_UPDATED: 'workspace:updated',
  WORKSPACE_DELETED: 'workspace:deleted',
  WORKSPACE_SWITCHED: 'workspace:switched',

  // Workflow events
  WORKFLOW_CREATED: 'workflow:created',
  WORKFLOW_UPDATED: 'workflow:updated',
  WORKFLOW_DELETED: 'workflow:deleted',
  WORKFLOW_EXECUTION_STARTED: 'workflow:execution-started',
  WORKFLOW_STEP_COMPLETED: 'workflow:step-completed',
  WORKFLOW_EXECUTION_COMPLETED: 'workflow:execution-completed',
} as const;

export type EventName = typeof EventNames[keyof typeof EventNames];

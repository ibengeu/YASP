/**
 * Governance Feature - Public API
 * Exports components, hooks, and services for governance functionality
 */

// Components
export { DiagnosticsPanel } from './components/DiagnosticsPanel';

// Hooks
export { useGovernance, useLintSpec } from './hooks/useGovernance';

// Store
export { useGovernanceStore } from './store/governance.store';

// Services
export { spectralService } from './services/spectral.service';
export type { LintResult } from './services/spectral.service';

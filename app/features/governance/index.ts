/**
 * Governance Feature - Public API
 * Exports hooks and services for governance functionality
 */

// Hooks
export { useGovernance, useLintSpec } from './hooks/useGovernance';

// Store
export { useGovernanceStore } from './store/governance.store';

// Services
export { spectralService } from './services/spectral.service';
export type { LintResult } from './services/spectral.service';

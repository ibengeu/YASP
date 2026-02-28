/**
 * Workbench Store
 * Shared state for IdeWorkbench + WorkbenchHeader (avoids prop drilling through PageLayout).
 *
 * Security: OWASP A04:2025 (Insecure Design) – no PII or secrets stored here.
 */

import { create } from 'zustand';
import type { ISpectralDiagnostic } from '@/core/events/event-types';

interface WorkbenchState {
  // Validation
  isValidating: boolean;
  diagnostics: ISpectralDiagnostic[];
  score: number;
  lastValidated: number | null;

  // Actions
  setValidating: (validating: boolean) => void;
  setDiagnostics: (diagnostics: ISpectralDiagnostic[], score: number) => void;
  clearDiagnostics: () => void;
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  isValidating: false,
  diagnostics: [],
  score: 100,
  lastValidated: null,

  setValidating: (validating) => set({ isValidating: validating }),

  setDiagnostics: (diagnostics, score) =>
    set({ diagnostics, score, isValidating: false, lastValidated: Date.now() }),

  clearDiagnostics: () =>
    set({ diagnostics: [], score: 100, isValidating: false, lastValidated: null }),
}));

/**
 * Governance Zustand Store
 * Manages governance state (diagnostics, score, linting status)
 *
 * Architecture: SRS_02 § 3.3 - State Management
 */

import { create } from 'zustand';
import type { ISpectralDiagnostic } from '@/core/events/event-types';

interface GovernanceState {
  // State
  diagnostics: ISpectralDiagnostic[];
  score: number;
  isLinting: boolean;
  lastLintedAt: Date | null;
  currentSpecId: string | null;

  // Actions
  setDiagnostics: (diagnostics: ISpectralDiagnostic[], score: number) => void;
  clearDiagnostics: () => void;
  setLinting: (isLinting: boolean) => void;
  setCurrentSpec: (specId: string | null) => void;

  // Derived state
  errorCount: () => number;
  warningCount: () => number;
  infoCount: () => number;
}

export const useGovernanceStore = create<GovernanceState>((set, get) => ({
  // Initial state
  diagnostics: [],
  score: 100,
  isLinting: false,
  lastLintedAt: null,
  currentSpecId: null,

  // Actions
  setDiagnostics: (diagnostics, score) => {
    set({
      diagnostics,
      score,
      lastLintedAt: new Date(),
      isLinting: false,
    });
  },

  clearDiagnostics: () => {
    set({
      diagnostics: [],
      score: 100,
      lastLintedAt: null,
    });
  },

  setLinting: (isLinting) => {
    set({ isLinting });
  },

  setCurrentSpec: (specId) => {
    set({ currentSpecId: specId });
  },

  // Derived state (selectors)
  errorCount: () => {
    return get().diagnostics.filter((d) => d.severity === 0).length;
  },

  warningCount: () => {
    return get().diagnostics.filter((d) => d.severity === 1).length;
  },

  infoCount: () => {
    return get().diagnostics.filter((d) => d.severity === 2).length;
  },
}));

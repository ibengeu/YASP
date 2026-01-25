/**
 * Governance Hook
 * Orchestrates linting and state updates
 *
 * Architecture: SRS_02 § 3.4 - Integration with Visual Editor
 */

import { useEffect } from 'react';
import { spectralService } from '../services/spectral.service';
import { useGovernanceStore } from '../store/governance.store';
import { eventDispatcher } from '@/core/events/event-dispatcher';
import { EventNames } from '@/core/events/event-types';
import type { SpecUpdatedPayload } from '@/core/events/event-types';

/**
 * Hook to enable governance linting for a spec
 * Subscribes to spec:updated events and triggers linting
 */
export function useGovernance(specId: string | null) {
  const { setDiagnostics, setLinting, setCurrentSpec } = useGovernanceStore();

  useEffect(() => {
    if (!specId) return;

    setCurrentSpec(specId);

    // Subscribe to spec updates
    const unsubscribe = eventDispatcher.on<SpecUpdatedPayload>(
      EventNames.SPEC_UPDATED,
      async (event) => {
        // Only lint if this is the current spec
        if (event.payload.specId !== specId) return;

        try {
          setLinting(true);

          // Lint the spec (debounced in service)
          const result = await spectralService.lintSpec(event.payload.content);

          // Update store
          setDiagnostics(result.diagnostics, result.score);

          // Emit completion event
          await eventDispatcher.emit(
            EventNames.GOVERNANCE_LINT_COMPLETE,
            {
              specId,
              score: result.score,
              diagnostics: result.diagnostics,
            },
            { source: 'governance' }
          );
        } catch (error) {
          setLinting(false);

          // Emit failure event
          await eventDispatcher.emit(
            EventNames.GOVERNANCE_LINT_FAILED,
            {
              specId,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            { source: 'governance' }
          );
        }
      }
    );

    // Cleanup
    return () => {
      unsubscribe();
      setCurrentSpec(null);
    };
  }, [specId, setDiagnostics, setLinting, setCurrentSpec]);

  return useGovernanceStore();
}

/**
 * Hook to manually trigger linting
 */
export function useLintSpec() {
  const { setDiagnostics, setLinting } = useGovernanceStore();

  return async (content: string, specId?: string) => {
    try {
      setLinting(true);

      const result = await spectralService.lintSpec(content);

      setDiagnostics(result.diagnostics, result.score);

      if (specId) {
        await eventDispatcher.emit(
          EventNames.GOVERNANCE_LINT_COMPLETE,
          {
            specId,
            score: result.score,
            diagnostics: result.diagnostics,
          },
          { source: 'governance' }
        );
      }

      return result;
    } catch (error) {
      setLinting(false);
      throw error;
    }
  };
}

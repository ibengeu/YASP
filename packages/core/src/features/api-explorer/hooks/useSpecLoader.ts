/**
 * useSpecLoader
 *
 * Loads and parses an OpenAPI spec from IDB storage.
 * Returns a discriminated union so callers never juggle three separate
 * isLoading / loadError / parsedSpec booleans.
 *
 * Security: OWASP A04:2025 – Insecure Design: cancellation flag prevents
 * stale async results from updating state after unmount / specId change.
 */

import { useState, useEffect } from 'react';
import { idbStorage } from '@/core/storage/idb-storage';
import type { ParsedOpenAPISpec } from '@/components/api-details/types';

export type SpecLoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; spec: ParsedOpenAPISpec };

export function useSpecLoader(specId: string | undefined): SpecLoadState {
  const [state, setState] = useState<SpecLoadState>(
    specId ? { status: 'loading' } : { status: 'idle' },
  );

  useEffect(() => {
    if (!specId) {
      setState({ status: 'idle' });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading' });

    (async () => {
      try {
        const record = await idbStorage.getSpec(specId);
        if (cancelled) return;

        if (!record) {
          setState({ status: 'error', message: 'Specification not found' });
          return;
        }

        let parsed: ParsedOpenAPISpec;
        try {
          parsed = JSON.parse(record.content) as ParsedOpenAPISpec;
        } catch {
          const yaml = await import('yaml');
          parsed = yaml.parse(record.content) as ParsedOpenAPISpec;
        }

        if (!cancelled) setState({ status: 'ready', spec: parsed });
      } catch {
        if (!cancelled) {
          setState({ status: 'error', message: 'Failed to parse specification' });
        }
      }
    })();

    return () => { cancelled = true; };
  }, [specId]);

  return state;
}

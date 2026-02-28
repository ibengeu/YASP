/**
 * useSpectralValidation
 * Provides imperative `validate(content)` backed by a Spectral Web Worker.
 * Auto-validation (debounced on content change) is handled separately via
 * `useAutoValidation` — mount it once in IdeWorkbench.
 *
 * Security: OWASP A04:2025 (Insecure Design) – validation runs off-main-thread
 * to prevent large/malicious specs from blocking the UI or causing ReDoS.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { ISpectralDiagnostic } from '@/core/events/event-types';
import { useWorkbenchStore } from '@/stores/workbench-store';
import { useEditorStore } from '@/features/editor/store/editor.store';

let workerInstance: Worker | null = null;

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(
      new URL('@/core/workers/spectral.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }
  return workerInstance;
}

/**
 * Returns an imperative `validate(content)` function.
 * Can be called from any component (e.g. WorkbenchHeader's Validate button).
 */
export function useSpectralValidation() {
  const requestIdRef = useRef<string | null>(null);
  const { setValidating, setDiagnostics } = useWorkbenchStore();

  const validate = useCallback(
    (specContent: string) => {
      if (!specContent.trim()) {
        setDiagnostics([], 100);
        return;
      }

      // Cancel previous in-flight request
      if (requestIdRef.current) {
        try {
          getWorker().postMessage({ type: 'CANCEL', requestId: requestIdRef.current });
        } catch { /* worker may not be ready */ }
      }

      const requestId = `lint-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      requestIdRef.current = requestId;
      setValidating(true);

      const worker = getWorker();

      const handleMessage = (event: MessageEvent) => {
        const { type, requestId: resId, diagnostics, score } = event.data;
        if (type === 'LINT_RESULT' && resId === requestId) {
          worker.removeEventListener('message', handleMessage);
          setDiagnostics(diagnostics as ISpectralDiagnostic[], score as number);
          requestIdRef.current = null;
        }
      };

      worker.addEventListener('message', handleMessage);
      worker.postMessage({ type: 'LINT', requestId, content: specContent });
    },
    [setValidating, setDiagnostics]
  );

  return { validate };
}

/**
 * Mount once (in IdeWorkbench) to auto-validate whenever editor content changes.
 * Debounced 800ms to avoid hammering the worker on every keystroke.
 */
export function useAutoValidation() {
  const content = useEditorStore((s) => s.content);
  const { validate } = useSpectralValidation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      validate(content);
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content, validate]);
}

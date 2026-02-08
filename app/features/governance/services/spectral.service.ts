/**
 * Spectral Linting Service
 * Manages worker communication and debouncing
 *
 * Architecture: SRS_02 § 3.2 - Debounce & Cancellation Logic
 */

import type { ISpectralDiagnostic } from '@/core/events/event-types';

export interface LintResult {
  diagnostics: ISpectralDiagnostic[];
  score: number;
}

export class SpectralService {
  private worker: Worker | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private currentRequestId: string | null = null;
  private readonly debounceMs = 500; // From SRS_02 § 2.1

  /**
   * Initialize worker
   */
  private initWorker(): Worker {
    if (!this.worker) {
      // Vite handles worker loading
      this.worker = new Worker(
        new URL('@/core/workers/spectral.worker.ts', import.meta.url),
        { type: 'module' }
      );
    }
    return this.worker;
  }

  /**
   * Lint OpenAPI specification
   * Debounced to prevent excessive linting
   */
  async lintSpec(content: string): Promise<LintResult> {
    // Cancel previous request if still pending
    if (this.currentRequestId) {
      this.cancelLint(this.currentRequestId);
    }

    // Clear previous debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce: wait 500ms before sending to worker
    return new Promise((resolve, reject) => {
      this.debounceTimer = setTimeout(async () => {
        try {
          const worker = this.initWorker();
          this.currentRequestId = crypto.randomUUID();

          // Set up one-time message listener
          const messageHandler = (event: MessageEvent) => {
            const response = event.data;

            if (response.requestId === this.currentRequestId) {
              worker.removeEventListener('message', messageHandler);
              this.currentRequestId = null;

              resolve({
                diagnostics: response.diagnostics,
                score: response.score,
              });
            }
          };

          worker.addEventListener('message', messageHandler);

          // Send lint request to worker
          worker.postMessage({
            type: 'LINT',
            requestId: this.currentRequestId,
            content,
            ruleset: 'spectral:oas',
          });
        } catch (error) {
          reject(error);
        }
      }, this.debounceMs);
    });
  }

  /**
   * Cancel pending lint request
   */
  private cancelLint(requestId: string): void {
    if (this.worker) {
      this.worker.postMessage({
        type: 'CANCEL',
        requestId,
      });
    }
  }

  /**
   * Terminate worker (cleanup)
   */
  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Singleton instance
export const spectralService = new SpectralService();

/**
 * Spectral Linting Web Worker
 * Offloads heavy linting computation to background thread
 *
 * Architecture: SRS_02 § 3.1 - Worker Architecture
 * Performance: Prevents UI blocking during validation
 */

import { Spectral, Document } from '@stoplight/spectral-core';
import { oas } from '@stoplight/spectral-rulesets';
import type { ISpectralDiagnostic } from '@/core/events/event-types';

// Initialize Spectral instance
const spectral = new Spectral();
spectral.setRuleset(oas);

/**
 * Message types for worker communication
 */
interface LintRequest {
  type: 'LINT';
  requestId: string;
  content: string; // YAML/JSON spec content
  ruleset?: string; // 'spectral:oas' or custom
}

interface LintResponse {
  type: 'LINT_RESULT';
  requestId: string;
  diagnostics: ISpectralDiagnostic[];
  score: number;
}

interface CancelRequest {
  type: 'CANCEL';
  requestId: string;
}

type WorkerMessage = LintRequest | CancelRequest;

// Track active requests for cancellation
const activeRequests = new Map<string, AbortController>();

/**
 * Calculate Governance Score from diagnostics
 * Formula: score = 100 × (1 - (totalPenalty / (totalPenalty + baselinePenalty)))
 *
 * Weights:
 * - Error (severity 0): 25 points
 * - Warning (severity 1): 5 points
 * - Info (severity 2): 1 point
 * - Hint (severity 3): 0 points (ignored)
 */
function calculateScore(diagnostics: ISpectralDiagnostic[]): number {
  const weights = { 0: 25, 1: 5, 2: 1, 3: 0 };
  const baselinePenalty = 50; // Threshold for acceptable quality

  const totalPenalty = diagnostics.reduce((sum, diag) => {
    return sum + (weights[diag.severity] || 0);
  }, 0);

  if (totalPenalty === 0) return 100;

  const score = 100 * (1 - totalPenalty / (totalPenalty + baselinePenalty));
  return Math.round(Math.max(0, score)); // Clamp to 0-100
}

/**
 * Perform linting
 */
async function lintSpec(request: LintRequest): Promise<LintResponse> {
  const { requestId, content } = request;

  try {
    // Create abort controller for this request
    const abortController = new AbortController();
    activeRequests.set(requestId, abortController);

    // Parse content as Document
    const document = new Document(content, undefined, 'spec.yaml');

    // Run Spectral validation
    const results = await spectral.run(document);

    // Check if request was cancelled
    if (abortController.signal.aborted) {
      throw new Error('Request cancelled');
    }

    // Convert Spectral diagnostics to our format
    const diagnostics: ISpectralDiagnostic[] = results.map((result) => ({
      code: result.code as string,
      message: result.message,
      severity: result.severity as 0 | 1 | 2 | 3,
      range: {
        start: {
          line: result.range.start.line,
          character: result.range.start.character,
        },
        end: {
          line: result.range.end.line,
          character: result.range.end.character,
        },
      },
      path: result.path as string[],
    }));

    // Calculate score
    const score = calculateScore(diagnostics);

    // Clean up
    activeRequests.delete(requestId);

    return {
      type: 'LINT_RESULT',
      requestId,
      diagnostics,
      score,
    };
  } catch (error) {
    activeRequests.delete(requestId);

    // Return error as diagnostic
    return {
      type: 'LINT_RESULT',
      requestId,
      diagnostics: [
        {
          code: 'lint-error',
          message: error instanceof Error ? error.message : 'Unknown linting error',
          severity: 0, // Error
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          path: [],
        },
      ],
      score: 0,
    };
  }
}

/**
 * Cancel active request
 */
function cancelRequest(requestId: string): void {
  const controller = activeRequests.get(requestId);
  if (controller) {
    controller.abort();
    activeRequests.delete(requestId);
  }
}

/**
 * Worker message handler
 */
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  switch (message.type) {
    case 'LINT': {
      const response = await lintSpec(message);
      self.postMessage(response);
      break;
    }

    case 'CANCEL': {
      cancelRequest(message.requestId);
      break;
    }

    default: {
      console.warn('[Spectral Worker] Unknown message type:', message);
    }
  }
};

// Export types for main thread
export type { LintRequest, LintResponse, CancelRequest };

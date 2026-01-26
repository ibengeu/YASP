/**
 * Circuit Breaker Service
 * Automatic failover pattern for AI provider reliability
 *
 * Pattern: Closed → Open → Half-Open → Closed
 * - Closed: Normal operation
 * - Open: Provider failed, reject immediately
 * - Half-Open: Testing recovery, allow 1 request
 */

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number; // milliseconds
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private resetTimer: NodeJS.Timeout | null = null;
  private options: CircuitBreakerOptions;

  constructor(options: CircuitBreakerOptions) {
    this.options = options;
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Reject immediately if circuit is open
    if (this.state === CircuitBreakerState.OPEN) {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await fn();

      // Success! Reset failure count and close circuit
      this.onSuccess();
      return result;
    } catch (error) {
      // Failure! Increment counter and potentially open circuit
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Recovery successful, close circuit
      this.state = CircuitBreakerState.CLOSED;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Failed during recovery, reopen circuit
      this.openCircuit();
    } else if (this.failureCount >= this.options.failureThreshold) {
      // Threshold reached, open circuit
      this.openCircuit();
    }
  }

  /**
   * Open circuit and schedule reset
   */
  private openCircuit(): void {
    this.state = CircuitBreakerState.OPEN;

    // Clear any existing timer
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    // Schedule transition to half-open
    this.resetTimer = setTimeout(() => {
      this.state = CircuitBreakerState.HALF_OPEN;
      this.resetTimer = null;
    }, this.options.resetTimeout);
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;

    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }
}
